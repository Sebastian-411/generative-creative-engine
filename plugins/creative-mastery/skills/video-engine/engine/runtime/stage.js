// Runtime de composición. Toda pieza lo carga con
//   <script src="/__engine/gsap.min.js"></script><script src="/__engine/stage.js"></script>
// El renderer controla el tiempo: nada en la pieza depende del reloj real.
(function () {
  const params = new URLSearchParams(location.search);
  const RENDER = params.has('render');

  function hashSeed(seed) {
    let h = 2166136261 >>> 0;
    const s = String(seed);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // mulberry32: PRNG determinista. Usa stage.rand() en vez de Math.random().
  function makeRand(seed) {
    let a = hashSeed(seed);
    const rand = function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    rand.range = (min, max) => min + rand() * (max - min);
    rand.int = (min, max) => Math.floor(rand.range(min, max + 1));
    rand.pick = (arr) => arr[Math.floor(rand() * arr.length)];
    rand.jitter = (amount) => (rand() * 2 - 1) * amount;
    rand.fork = (label) => makeRand(String(seed) + ':' + label);
    return rand;
  }

  // Ruido 1D suave y determinista: noise(seed, x) ∈ [-1, 1].
  function noise(seed, x) {
    const s = hashSeed(seed);
    const h = (i) => {
      let x = Math.imul(s ^ Math.imul(i, 0x27d4eb2d), 0x165667b1);
      x ^= x >>> 15; x = Math.imul(x, 0x85ebca6b); x ^= x >>> 13;
      return ((x >>> 0) / 4294967296) * 2 - 1;
    };
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return h(i) * (1 - u) + h(i + 1) * u;
  }

  function loadJSON(url) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send();
    if (xhr.status !== 200) throw new Error(`No pude cargar ${url} (${xhr.status}). ¿Corriste voice.mjs?`);
    return JSON.parse(xhr.responseText);
  }

  // Resorte cerrado (sin estado): 0 → 1 con sobrepaso según damping. ratio ≥ 0.72 = premium.
  function spring(t, { stiffness = 170, damping = 26, mass = 1 } = {}) {
    if (t <= 0) return 0;
    const w0 = Math.sqrt(stiffness / mass), zeta = damping / (2 * Math.sqrt(stiffness * mass));
    if (zeta < 1) {
      const wd = w0 * Math.sqrt(1 - zeta * zeta);
      return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
    }
    return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  }

  function create(opts) {
    const cfg = Object.assign({ width: 1080, height: 1920, fps: 30, duration: 10, seed: 'piece', background: '#000', tail: 0 }, opts);
    if (!window.gsap) throw new Error('stage.js necesita gsap cargado antes (/__engine/gsap.min.js)');

    const voice = cfg.voice ? loadJSON(cfg.voice) : null;
    if (cfg.duration === 'voice') {
      if (!voice) throw new Error('duration: "voice" necesita voice: "voice.json"');
      cfg.duration = +(voice.duration + cfg.tail).toFixed(3);
    }

    const root = document.getElementById('stage') || (() => {
      const el = document.createElement('div');
      el.id = 'stage';
      document.body.appendChild(el);
      return el;
    })();
    Object.assign(root.style, {
      position: 'relative', overflow: 'hidden', width: cfg.width + 'px', height: cfg.height + 'px',
      background: cfg.background, transformOrigin: '0 0',
    });
    document.documentElement.style.background = '#111';
    document.body.style.margin = '0';

    gsap.ticker.lagSmoothing(0);
    if (RENDER) gsap.ticker.sleep();
    const tl = gsap.timeline({ paused: true });
    const frameFns = [];
    const pending = [];
    const cues = [];
    const rand = makeRand(cfg.seed);
    const beatLen = cfg.bpm ? 60 / cfg.bpm : null;
    let lastT = 0;

    const lineById = (id) => {
      const l = voice && voice.lines.find((x) => x.id === id);
      if (!l) throw new Error(`No existe la línea de voz "${id}" en ${cfg.voice}`);
      return l;
    };
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]/gu, '');

    const stage = {
      ...cfg,
      root,
      tl,
      rand,
      noise,
      spring,
      voice,
      RENDER,
      // Callback por fotograma para Canvas/WebGL: fn(t, frameIndex). Función pura del tiempo.
      onFrame(fn) { frameFns.push(fn); return stage; },
      // Promesa que debe resolverse antes del primer fotograma (imágenes, datos).
      wait(promise) { pending.push(promise); return promise; },
      // Fuentes que solo usa un <canvas>: el navegador no las descarga solo; hay que pedirlas.
      font(spec) { return stage.wait(document.fonts.load(spec)); },
      loadImage(src) {
        return stage.wait(new Promise((res, rej) => {
          const img = new Image();
          img.onload = () => res(img);
          img.onerror = () => rej(new Error('No cargó la imagen ' + src));
          img.src = src;
        }));
      },
      // Stop-motion: cuantiza t a `fps` dibujos por segundo (12 = "en dos" a 24fps).
      step(t, fps = 12) { return Math.floor(t * fps + 1e-6) / fps; },
      // Tiempos de la narración.
      line(id) { return lineById(id); },
      at(id, offset = 0) { return lineById(id).start + offset; },
      end(id, offset = 0) { return lineById(id).end + offset; },
      // Inicio de una palabra dentro de una línea: por índice o por texto (sin tildes ni signos).
      word(id, which, offset = 0) {
        const l = lineById(id);
        const w = typeof which === 'number' ? l.words[which] : l.words.find((x) => norm(x.w) === norm(which)) || l.words.find((x) => norm(x.w).startsWith(norm(which)));
        if (!w) throw new Error(`No encontré la palabra "${which}" en la línea "${id}"`);
        return w.start + offset;
      },
      // Rejilla musical (si se declaró bpm).
      beat(n) { if (!beatLen) throw new Error('Declara bpm en Stage.create para usar beat()'); return n * beatLen; },
      bar(n) { return stage.beat(n * 4); },
      snap(t, div = 1) { if (!beatLen) return t; const g = beatLen / div; return Math.round(t / g) * g; },
      // Efecto de sonido en el instante t (nombres de sfx-lib o ruta a un .wav propio).
      sfx(name, t, db = -8) { cues.push({ name, t: +t.toFixed(3), db }); return stage; },
      seek(t) {
        lastT = Math.max(0, Math.min(t, cfg.duration));
        // Stop-motion global: `drawings: 12` sostiene cada dibujo 1/12 s (animar "en dos" a 24 fps).
        if (cfg.drawings) lastT = Math.floor(lastT * cfg.drawings + 1e-6) / cfg.drawings;
        // Siempre se reproduce desde 0 hasta t: el resultado no depende del fotograma anterior
        // (tweens ya terminados, varios tweens sobre la misma propiedad, onUpdate que escriben en el DOM).
        tl.totalTime(0, false);
        tl.totalTime(lastT, false);
        for (const a of document.getAnimations()) { a.pause(); a.currentTime = lastT * 1000; }
        const frame = Math.round(lastT * cfg.fps);
        for (const fn of frameFns) fn(lastT, frame);
        const videos = [...root.querySelectorAll('video')];
        return Promise.all(videos.map((v) => new Promise((res) => {
          v.pause();
          const target = Math.min(lastT - (parseFloat(v.dataset.start) || 0), v.duration || Infinity);
          if (target < 0 || Math.abs(v.currentTime - target) < 1e-3) return res();
          v.addEventListener('seeked', res, { once: true });
          v.currentTime = target;
        })));
      },
    };

    const ready = (async () => {
      await new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));
      if (document.fonts) await document.fonts.ready;
      await Promise.all(pending);
      await stage.seek(0);
    })();

    window.__composition = {
      width: cfg.width, height: cfg.height, fps: cfg.fps, duration: cfg.duration,
      ready,
      seek: (t) => stage.seek(t),
      timelineDuration: () => tl.duration(),
      // Lo lee mix.mjs: música, voz y efectos declarados por la pieza.
      audio: () => ({
        bpm: cfg.bpm || null,
        music: cfg.music || null,
        voice: voice ? { file: 'audio/voice.wav', db: cfg.voiceDb ?? 0, lines: voice.lines.map((l) => [l.start, l.end]) } : null,
        cues: cues.slice().sort((a, b) => a.t - b.t),
        ambience: cfg.ambience || [],
      }),
    };

    if (!RENDER) ready.then(() => preview(stage)).catch((e) => console.error(e));
    return stage;
  }

  // Subtítulos dinámicos desde voice.json: páginas de 1–maxWords palabras, palabra activa resaltada.
  //   Stage.captions(stage, { maxWords: 3, className: 'cap', pop: true })
  // El estilo vive en el CSS de la pieza: .cap (contenedor), .cap .cw (palabra), .cap .cw.on (activa).
  function captions(stage, opts = {}) {
    const o = Object.assign({ maxWords: 3, className: 'cap', pop: true, linger: 0.25, skip: [] }, opts);
    if (!stage.voice) throw new Error('captions necesita voice.json');
    const pages = [];
    // skip: ids de líneas sin subtítulo (p. ej. cuando el texto grande en pantalla ya dice lo mismo).
    for (const line of stage.voice.lines.filter((l) => !o.skip.includes(l.id))) {
      let cur = [];
      line.words.forEach((w, i) => {
        cur.push(w);
        const punct = /[.,;:!?…]$/.test(w.w);
        if (cur.length >= o.maxWords || punct || i === line.words.length - 1) { pages.push(cur); cur = []; }
      });
    }
    for (const p of pages) p.start = p[0].start;
    pages.forEach((p, i) => {
      const next = pages[i + 1];
      p.end = Math.min(p[p.length - 1].end + o.linger, next ? next.start : Infinity);
    });
    const el = document.createElement('div');
    el.className = o.className;
    el.setAttribute('aria-hidden', 'true');
    stage.root.appendChild(el);
    let shown = -1;
    stage.onFrame((t) => {
      const idx = pages.findIndex((p) => t >= p.start && t < p.end);
      if (idx !== shown) {
        shown = idx;
        el.innerHTML = idx < 0 ? '' : pages[idx].map((w) => `<span class="cw">${w.w.replace(/[<>&]/g, '')}</span>`).join(' ');
      }
      if (idx < 0) { el.style.opacity = 0; return; }
      el.style.opacity = 1;
      const p = pages[idx];
      el.querySelectorAll('.cw').forEach((s, k) => s.classList.toggle('on', t >= p[k].start));
      el.style.scale = o.pop ? String(0.86 + 0.14 * spring(t - p.start, { stiffness: 320, damping: 24 })) : '1';
    });
    return el;
  }

  // Vista previa en navegador: escala al viewport y reproduce en tiempo real (sin audio).
  // Espacio = pausa, ←/→ = ±1 fotograma, click en la barra = buscar. ?t=3.2 congela ahí.
  function preview(stage) {
    const fit = () => {
      const s = Math.min(innerWidth / stage.width, (innerHeight - 28) / stage.height);
      stage.root.style.transform = `scale(${s})`;
      document.body.style.height = '100vh';
    };
    fit();
    addEventListener('resize', fit);
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:28px;background:#000c;color:#ddd;font:12px monospace;display:flex;align-items:center;gap:10px;padding:0 10px;cursor:pointer;z-index:99999';
    const fill = document.createElement('div');
    fill.style.cssText = 'position:absolute;left:0;top:0;bottom:0;background:#4a90e2;opacity:.35;pointer-events:none';
    const label = document.createElement('span');
    label.style.position = 'relative';
    bar.append(fill, label);
    document.body.appendChild(bar);

    const frozen = params.get('t');
    let playing = frozen === null;
    let t = frozen ? parseFloat(frozen) : 0;
    let last = performance.now();
    const draw = () => {
      fill.style.width = (t / stage.duration) * 100 + '%';
      label.textContent = `${t.toFixed(2)}s / ${stage.duration}s · f${Math.round(t * stage.fps)} ${playing ? '▶' : '⏸'}`;
    };
    bar.addEventListener('click', (e) => { t = (e.clientX / innerWidth) * stage.duration; stage.seek(t); draw(); });
    addEventListener('keydown', (e) => {
      if (e.code === 'Space') { playing = !playing; e.preventDefault(); }
      if (e.code === 'ArrowRight') { playing = false; t = Math.min(stage.duration, t + 1 / stage.fps); stage.seek(t); }
      if (e.code === 'ArrowLeft') { playing = false; t = Math.max(0, t - 1 / stage.fps); stage.seek(t); }
      draw();
    });
    const loop = (now) => {
      if (playing) { t = (t + (now - last) / 1000) % stage.duration; stage.seek(t); }
      last = now;
      draw();
      requestAnimationFrame(loop);
    };
    stage.seek(t);
    requestAnimationFrame(loop);
  }

  window.Stage = { create, captions, makeRand, noise, spring };
})();
