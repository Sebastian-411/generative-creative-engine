# Oficio audiovisual — destilación de repos de skills de motion graphics

Fuentes analizadas: [heygen-com/skills](https://github.com/heygen-com/skills) · [vibe-motion/skills](https://github.com/vibe-motion/skills) · [iart-ai/motion-skills](https://github.com/iart-ai/motion-skills) (hub) + 19 packs en repos separadas · [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) (solo delta vs destilación anterior) · 3 páginas de Best Runs de [agentskillshub](https://agentskillshub.top/best-runs/video).

Objetivo: extraer el oficio (números, tablas, reglas, QA) que alimente nuestro motor generativo (HTML/GSAP/Canvas donde cada fotograma es una función pura de t, render vía Chrome headless + ffmpeg). Ramas verificadas: `main` (packs iart-ai, vibe, opuscar), `master` (heygen). Cada afirmación debe poder rastrearse al archivo enlazado; donde la cifra viene "del skill" sin fuente externa, se marca.

---

## Pregunta clave 1 — ¿Qué sube de manera medible la calidad visual por encima del motion graphics típico de IA?

**Takeaway:** el diferencial de estas repos frente al output genérico de IA no es la herramienta sino una colección de oficio en números: (1) mapeos palabra→parámetro; (2) proporciones fijas del timeline (20/50/30, arcos de fase asimétricos); (3) reglas de layout y cámara; (4) reglas de contención anti-genéricas (2 easings máx., un "wow" por pieza, nada inventado); (5) QA construido sobre fallos reales medidos (parada lineal de 4.3× con `var()` en Chromium, +11 dB de startle, congelón de 50 ms por line-cap). Ese package es portable como datos a nuestro motor.

### Licencias y estado de cada repositorio

| Repositorio | Licencia | Estado | Consecuencia |
|---|---|---|---|
| iart-ai/* (hub + 19 packs) | MIT, "Copyright (c) 2026 iart.ai" (verificado en LICENSE) | activo | Adoptar números, reglas y textos atribuidos |
| heygen-com/skills | MIT (verificado en LICENSE) | activo | Adoptar el catálogo de estilos como texto |
| lemomo-ai/lemo-opuscar | MIT código/docs + CC BY 4.0 para las films demos | activo | Adoptar solo el delta técnico |
| vibe-motion/skills | **SIN archivo LICENSE** (solo menciones de medios embebidos: Chladni CC BY-NC 4.0 por Lykno en [README.en.md L112](https://github.com/vibe-motion/skills/blob/main/README.en.md)) | abandonado, migrado a motionface.cc | Adoptar ideas y números, no textos ni código verbatim |

### 1.1 Mapeo palabra→parámetro

- **vibe · [motion-personality.md](https://github.com/vibe-motion/skills/blob/main/pixel2motion/references/motion-personality.md)** — tabla numérica sobre 2 ejes (energía baja/alta × tono serio/juguetón): squash 0–10 % vs 20–40 %; anticipación 50–100 ms vs 150–300 ms; timing por parte 400–800 ms vs 100–250 ms; exageración 0–15 % vs 25–50 %; 6 presets con tokens cubic-bezier literales; overshoot como escala multiplicativa 1.0–1.12 (nunca >1.15).
- **iart · [motion-art-direction](https://github.com/iart-ai/motion-design-skills/blob/main/skills/motion-art-direction/SKILL.md)** — "lenguaje de movimiento" antes de animar: una familia de easing (cubre ~90 % de los movimientos) + unidad base de timing (0.4 s: entra 0.4, elemento grande 0.8, micro 0.2); presupuesto de intensidad con números para rango calm-sharp: travel ≤24 px, scale 0.96–1.0, overshoot ≤2 %, hold ≥0.3 s tras cada acierto; matriz de tono 2×2: elegir una casilla y comprometerse; personalidades medidas: Playful 150–300 ms ease-out-back (10–20 %), Premium 350–600 ms cubic-bezier(0.4,0,0.2,1) sin overshoot, Corporate 200–400 ms cubic-bezier(0.2,0,0,1) (0–3 %), Energetic 100–250 ms ease-out-expo (15–30 %). Máximo 2 easings por pieza; un solo momento "wow" por pieza.
- **iart · [animation-principles](https://github.com/iart-ai/motion-design-skills/blob/main/skills/animation-principles/SKILL.md)** — 3 pilares: intención emocional + narrativa visual + oficio del movimiento; 3 capas de decisión. Duraciones por clase: micro 100–200 ms, deportes 200–400 ms, hero 400–800 ms, cámara 800–2000 ms. Distancia→duración escala con √distancia (afinada por 3 capas). Stagger: listas 40–80 ms, grids/jerárquicos 20–40 ms, tope 600–800 ms (más allá se percibe lento, espera slideshow). 1/3 Rule (anticipación/acción/settle bilateral) ([also shot-composition #5](https://github.com/iart-ai/motion-design-skills/blob/main/skills/shot-composition/SKILL.md): "recortes un 33 % más cortos se sienten tres veces más rápidos"). Spring presets {300,30,1}, {400,17,1}, {120,20,1}, {500,50,1}. Tabla de diagnósticos con número de causa: "flotante → dura un 30 % de más"; "rígido → todo es lineal/simétrico"; "barato → todo entra simultáneo"; "mecánico → sin anticipación ni settle".
- **heygen · [heygen-video](https://github.com/heygen-com/skills/blob/master/heygen-video/SKILL.md)** — 20 bloques de estilo nominados y atribuidos a diseñadores (Sagmeister, Eksell, Ray, Cassandre, Abedini, Müller-Brockmann, Tanaka, Vignelli, Crouwel, Brodovitch, Terrazas, Ghariokhu, Tomaszewski, Ahn Sang-soo, Lins, Hillmann, Brody, Scher, Anadol, Tartakover) + reglas de diseño interior de cada estilo; ranking de producción "salido de 40+ videos de concurso": Deconstructed (más fiable) y Swiss Pulse (mejor para datos).
- Nota: en heygen, "style block" significa cascada CSS-remota (tokens/param queue); innecesario para nosotros, útil como referencia textual.

### 1.2 Proporciones del timeline y ritmo

- **vibe · [pixel2motion/SKILL.md](https://github.com/vibe-motion/skills/blob/main/pixel2motion/SKILL.md)** — proporción dorada del tween externo **Anticipación:Acción:Follow-through = 20 %:50 %:30 %** (un tween de 1500 ms → 300/750/450 ms); los elementos escalonados se solapan 10–20 % (la parte 2 arranca antes de que la 1 termine); la jerarquía de arrastre va parte → grupo → timeline → scene → master (recibe el arrastre del padre).
- **vibe · [disney-animation-rule-skill](https://github.com/vibe-motion/skills/blob/main/disney-animation-rule-skill/SKILL.md)** — bloquear el gesto en fases semánticas ANTES de elegir el ease: rest → anticipation → commitment → passing → apex → contact → overshoot → settle; evaluar estado determinista (state = f(frameOrTime, inputs)); lista de 12 defaults a evitar; [estudio de caso del salto](https://github.com/vibe-motion/skills/blob/main/disney-animation-rule-skill/references/clawd-jump-case-study.md): fases asimétricas numeradas (hold 4 f, anticipación 6 f, hold 2 f, ascenso 10 f, hangtime 20 f, descenso 7 f, squash 3 f, recuperación 5 f) + Quintic Hermite para velocidades de extremo + remapeo por longitud de arco + squash por velocidad de entrada.
- **iart · [beat-sync-editing](https://github.com/iart-ai/motion-design-skills/blob/main/skills/beat-sync-editing/SKILL.md)** — `frames_per_beat = (60/BPM) × fps`; redondeo acumulativo de marcas (cumulative rounding); cortar en frases (2/4/8 beats, EN arco en tabla "Establish 8–16 beats, Build 4–8, Twist +2, Resolve largo, Sting 1"); acentos en la rejilla de corcheas no siempre 1/2/3; tabla de tipos de corte con offsets: J-cut entra 4–12 f antes, L-cut sale 12–24 f después, whip ~6–10 f con blend; rampa de velocidad 100→25→100 con el fotograma más lento aterrizando en el acento.

### 1.3 Layout, cámara y composición

- **iart · [shot-composition](https://github.com/iart-ai/motion-design-skills/blob/main/skills/shot-composition/SKILL.md)** — retícula de 12 columnas a 1920 px con margin 80–120 px y gutter 24–32 px (col ≈ 121 px); baseline de 8 px; jerarquía visual: tamaño > contraste > color > posición; el "punto de fuerza" (implied) de la regla de tercios (637,312) y (1283,768) recibe ~41 % más atención que el centro (cifra del skill); parallax: fondo 0.1–0.3×, medio 0.5–0.7×, primer plano 1.0–1.5× ("quick-ref": 0.2 / 0.6 / 1.2×); un movimiento de cámara por beat (800–2000 ms, ease-in-out); safe areas: 16:9 ~5 % borde; 9:16 top 12–14 %, bottom 18–20 %, lados 6 %; 1:1 6–8 %; 4:5 lados 6 %, top/bottom 8 %; jamás recortar el sujeto — re stapar (restack), no crop.
- **iart · [lower-thirds](https://github.com/iart-ai/lower-thirds-skills/blob/main/skills/lower-thirds/SKILL.md)** — la your name-strap "nace vacía y muere vacía" (LEAD/TAIL); la tira está quieta mientras se lee (máximo un sheen lento); nombre ~50–80 px de alto a 1080p; nunca cortar texto a mitad de palabra — adaptar tamño (fit()); gotcha: Cormorant/EB Garamond/Playfair escriben números elzevirianos (old-style) que caen por debajo de baseline y canvas no los puede alinear → elegir una fuente con lining numerals (Lora); verificación sobre checkerboard / fondo oscuro / fondo claro; entrega WebM (VP9 con alpha) + ProRes 4444 + MP4 verde para chroma.

### 1.4 Tipografía cinética y captions

- **iart · [kinetic-typography](https://github.com/iart-ai/kinetic-typography-skills/blob/main/skills/kinetic-typography/SKILL.md)** — primero el tipo estático (line-height 1.1–1.2 display; tracking −1 %…−3 %); desnivelar granularidad línea/palabra/carácter con stagger líneas 60–100 ms, palabras 40–70 ms, letras 20–40 ms, tope total ~800 ms; la técnica preferida de reveal es máscara `translateY(100 %→0)`; también blur-in 12px→0; clip-path wipe; animar `font-variation-settings`, NUNCA el peso (`font-weight`) si la fuente es variable; hacer el split de texto DESPUÉS de `document.fonts.ready`; accesibilidad `aria-label` sin fragmentar.
- **iart · [caption-animation](https://github.com/iart-ai/tiktok-video-skills/blob/main/skills/caption-animation/SKILL.md)** — tokens {texto, startMs, endMs}; 1–4 palabras por página (`combineTokensWithinMilliseconds` 200–500 ms para palabras, 1000–1500 ms para frases); pop por palabra: spring damping 12 / mass 0.6 / scale 0.6→1; bold sans 56–80 px (mínimo 45, ≈ 8 % del alto), stroke negro 2–6 px; banda centro 62–70 % abajo; banda inferior libre ≥15 % (≥280 px).
- **iart · [explainer-video](https://github.com/iart-ai/explainer-video-skills/blob/main/skills/explainer-video/SKILL.md)** — VO a ~2.3 palabras/s (140 wpm); duración de escena = palabras / 2.3 + 0.4 s; sin-VO mínimo 1.0 s; captions ≤2 líneas, ≤42 caracteres, ≥1.0 s.

### 1.5 Contadores / charts / infografía

- **iart · [chart-animation](https://github.com/iart-ai/data-animation-skills/blob/main/skills/chart-animation/SKILL.md)** — todo entra por fotograma (desactivar animaciones de D3/Chart.js); **easing al VALOR**, no solo al elemento (easeOutCubic o Quint; lineal únicamente para relojes); spring SIN overshoot para las carreras de ranking (rank chart); `tabular-nums` + `round()` antes de formatear + `Intl.NumberFormat`; presupuesto: intro 1–1.5 s, por fila 0.3–0.6 s, highlight +0.5–1 s, hold final 2–3 s; revelar series progresivamente; verificar el PRIMER dataset corte-a-fondo antes de batch de N.
- **iart · [animated-infographic](https://github.com/iart-ai/data-animation-skills/blob/main/skills/animated-infographic/SKILL.md)** — diseñar el fotograma estático primero; niveles de revelado título→icono→número→etiqueta→conector; stagger 6–10 fotogramas (>15 se siente lento); icono con pop spring (damping 10, stiffness 180, mass 0.5); entrada de ítem con spring (damping 14, mass 0.6, rise 24 px); nunca contar dos números a la vez; el conector dibuja cuando el objetivo aterriza; hold final 2–3 s.

### 1.6 Sonido (medible)

- **iart · [soundtrack](https://github.com/iart-ai/javascript-animation-skills/blob/main/skills/soundtrack/SKILL.md)** — marcar el corte con armonía, no con volumen (+7~10 dB burst = jump-scare; +3~5 dB con cambio de acorde = limpio); capas por compás ≤ 1–2 (entrar todas JUNTAS = +11 dB startle; escalonadas ~3.5 dB percibido); el "break" (silencio un compás antes del payoff) es el golpe más fuerte; NO poner acento extra en cada downbeat de downalong; instrumentos: synth/keys/pads aceptables, voces/orquesta no; mapear tempo de escena a compases enteros (cada corte en downbeat).
- **opuscar · [TECHNIQUE.md](https://github.com/lemomo-ai/lemo-opuscar/blob/main/TECHNIQUE.md)** — dos pasadas de loudnorm a −14 LUFS; voz ~10 dB sobre música después de compresión; low-end 20–120 Hz dentro de ±3 dB; saltar notas de pad por debajo de MIDI 48; `cuecheck.py` con objetivo de 0 ms de desfase visual/música.

### 1.7 Anti-genérico y honestidad

- **vibe · [brand-launch-video-star](https://github.com/vibe-motion/skills/blob/main/brand-launch-video-star/SKILL.md)** — lista de release-blockers: nunca inventar/redibujar/aproximar un logo; mostrar el producto; nada de HUD falsos, glass cards arbitrarias, muros de texto, métricas sin verificar, idéntico easing en todas partes; cadena causa-efecto visible en pantalla; manifiesto de assets + validador + SHA-256; tabla de recuperación (métrica olvidada → verificar el dato, nunca fingir).
- **iart · [javascript-animation](https://github.com/iart-ai/javascript-animation-skills/blob/main/skills/javascript-animation/SKILL.md)** — la gemela técnica de nuestro motor (página única, storyboard en datos, frames / fotogramas como función, headless render): reglas traspasables: "no reutilizar el look o el sonido de la pieza anterior por default"; LOOK.boil = 4 (semilla de wobble cada 4 f ≈ 7.5 cambios/s — se lee dibujado a mano); `claim()`/`placeFree` para colisiones de texto; auditar layout y claims; formas redondeadas + ángulo; dibujar de atrás hacia adelante; audit de assets con exit 1 si falta algo.
- **opuscar · arte primitivo de acento &》《.** — reglas de un solo acento rojo que SOLO apunta, spec completa en [visual-investigation/STYLE.md](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/visual-investigation/STYLE.md) con placeholders de color/tono/posición/suavización/sound-design/UX detallados por estilo; "no el demo de nuevo" (≥4 de 6 diferencias con la pieza de referencia, en [DIRECTOR.md](https://github.com/lemomo-ai/lemo-opuscar/blob/main/DIRECTOR.md)); título ≠ subtítulo repetido; diagrama PLACEHOLDER vacío = look de render fallido; acento de un solo color rojo que solo señala.

### 1.8 QA discriminante (números de referencia)

- **vibe · [pixel2motion QA](https://github.com/vibe-motion/skills/blob/main/pixel2motion/SKILL.md)** — dos fallos **medidos**: (1) Chromium degrada a LINEAR la interpolación cuando los `@keyframes` usan `var(--token)` — cliff de velocidad de 4.3× que hace la pieza rígida → usar cubic-bezier literales; (2) draw-on con `lineCap:round` genera una pausa de ~50 ms + pop de disco (porque el dash-offset arranca con el cap pegado) → usar cap butt / `pathLength`; easing probe con 2–3 timestamps para verificar la curva diseñada; Final-Frame Contract = último ms del timeline ≡ último fotograma renderizado (diff 0); seek `?t=<ms>` para QA.
- **vibe · [brand-launch QA loop](https://github.com/vibe-motion/skills/blob/main/brand-launch-video-star/SKILL.md)** — ≤ 10 iteraciones de QA; ranking de 7 puntos antes/después de cada fix; verificar SIEMPRE en el mismo pipeline que se entrega (¡no otro!).
- **vibe · pixel2motion** — "final-frame types" (última capa de black-list) mencionados; jump "primitivas cortas" de iart con blacklist "convert-x".
- **opuscar · TECHNIQUE** — `readcheck.mjs` con cajas TEXTS(t) para legibilidad a duración X; hojas de contacto + precisión 0.2 s en acciones clave; auditar `ebur128` / `blackdetect` / Whisper sobre la mezcla final; animate-on-twos (12 fps efectivos) para stop-motion/pixel/cel pero cámara + luz suaves cada fotograma.
- **agentskillshub · [score_video.py](https://github.com/zhuyansen/agent-skills-hub)** — 4 gates automáticos: reproducible H.264; conformance de spec; legibilidad 5/5; "picture moves" = % de pares de fotogramas quietos muestreados a 2 Hz. 3 runs: [vibe 7 % quiet](https://agentskillshub.top/best-runs/video/vibe-motion__skills.html) · [charlie947 28 %](https://agentskillshub.top/best-runs/video/charlie947__motion-graphics-skills.html) · [Barty-Bart 48 %](https://agentskillshub.top/best-runs/video/Barty-Bart__motion-graphics-skills.html) (elfactor slideshow).
- **iart · [logo-patterns](https://github.com/iart-ai/motion-design-skills/blob/main/skills/logo-animation/references/logo-patterns.md)** — timeline GSAP de logo: clearspace = cap-height (caja em); squash solo como micro-ajuste (>0.2 s); **nunca** escala no-uniforme sobre la marca final; settle 1.04→1.00 en 0.12/0.14 s; envelope total 0.8–2.5 s; hold ≥0.4 s antes del sign-off; "draw-then-fill" combo; MorphSVG con fallback a flubber manual.

### Inferencias y oportunidades (Q1)

1. El "oficio" es, en el fondo, una **tabla de constantes + tablas de fallo con número de causa**. Nuestro motor no necesita los frameworks de estas repos (Remotion/TS, heygen API, agentes de opuscar) para capturar el 90 % del valor: lo capta como data.
2. La métrica **"% de fotogramas quietos @2 Hz"** es un gate objetivo del fallo "slideshow" que hoy solo detectamos a ojo. El run de vibe (7 %) marca el nivel objetivo; 48 % (Barty-Bart) es el nivel de fallo.
3. Los claims de psicología (41 % de atención en tercios, 87 % de retención a 3 s con interrupts cada 2–4 s, 58 % vs 41 %) son **internos de las skills sin fuente externa** — tratar como heurística, citarlos como afirmación del skill y no como dato externo.
4. La secuencia "block semántico de fase ANTES del ease" (vibe/disney) es la capa que nos falta en `stage.t`: hoy elegimos curvas, no fases del gesto. Es una mejora directamente portable a `motion-craft`.
5. El "lenguaje de movimiento" (iart art-direction) exporta un cover-to-cover nº de técnica: **familia de ease + base timing + presupuesto de intensidad + matriz de tono - punch**; encaja con nuestro Contrato creativo como sección de movimiento.

---

## Pregunta clave 2 — ¿Qué encaja YA en nuestro motor HTML/GSAP/Canvas (fotogramas como función pura de t)?

**Takeaway:** los números y reglas (Q1) son agnósticos del framework: encajan en nuestras skills como data y como reglas de check. Los pipelines concretos (dependencies, specs de audio calc, TTS-cue, timeline-API remota) hay que recomputarlos con el stack nuestro; los gotchas de Chromium/CSS/Canvas son directos.

### Portado directo (data/recetas)

1. Timing/rítmoico (§1.1–1.2): tabla persona→parámetro, 20/50/30, never-same-start/end, spring presets, tipos de corte, rampa de velocidad, tabla de arco → `motion-craft` (ya tenemos tabla de curvas; agrega la de springs + los cortes).
2. Layout/cámara (§1.3): grid 12-col/8px, jerarquía orden, 1/3 de ambos sentidos, parallax 2→1.2, 1 move/beat, safe areas por aspect, restack-not-crop → `video-styles`.
3. Tipografía (§1.4): stagger 3 niveles + tope 800 ms, mask translateY, blur 12px→0, variable-font gotcha, split tras `document.fonts.ready` → `motion-craft` + `video-styles`.
4. Captions (§1.4): 1–4 palabras por page + banda 62–70 % + spring pop 12/0.6 + 56–80 px + stroke 2–6 px + clear-bottom ≥15 % → `video-styles` + `story-grammar`.
5. Counters/charts (§1.5): ease-the-VALUE + tabular-nums + round + Intl + nunca-2-counters + budget por niveles + hold final 2–3 s → `motion-craft` (dispositivos).
6. Sonido (§1.6): armonía-no-volumen, capas ≤2/compás, break-silencio, low-end ±3 dB / pad < MIDI 48, voz +10 dB, cuecheck 0 ms → `sound-design`.
7. QA (§1.8): % de quietos @2 Hz, readcheck TEXTS(t), easing-probe, Final-Frame 0-diff, audit de assets exit 1, starts/ends-empty layers, männerman first/last frames limpio, <3 flashes/s → `video-engine` (`check.mjs` + hojas de contacto).
8. Catálogo de estilos heygen (MIT) → contenido **solo textual** como fuente para `video-styles`.
9. Anti-genérico (§1.7): release-blockers de brand-launch + antipatrones javascript-animation + reglas opuscar (no-el-demo-de-nuevo, rojo-solo-apunta, subtítulo-≠-título) → PROHIBIDO de `creative-contract` + rúbrica de `video-review`/agente `critic`.

### Gotchas directos de nuestro stack (HTML + Chrome headless)

- `var(--token)` en `@keyframes` → degradación a LINEAR (cliff 4.3×) — [vibe pixel2motion]: nunca interpolar con variables CSS en keyframes; si el motor anima vía GSAP no aplica, pero YoUso de @keyframes en CSS sí se ve afectado. Verificar con probe.
- `lineCap: round` + `dashoffset` en Canvas → pauso de ~50 ms + pop de disco. Ya lo tenemos detectado como riesgo en strokes de заражение.
- Grain: renderizarlo en ffmpeg, no con CSS grain en página (en-archivo hace los fotogramas JPEG incomprimibles — [opuscar TECHNIQUE](https://github.com/lemomo-ai/lemo-opuscar/blob/main/TECHNIQUE.md)); nuestro motor captura fotograma por fotograma con JPEG.
- Split de texto SIEMPRE después de `document.fonts.ready` (ya usamos webfonts con fuentes de Google).
- [color-motion](https://github.com/iart-ai/motion-design-skills/blob/main/skills/color-motion/SKILL.md): QuickTime aplica gamma ~1.96 y "engaña" el look; nunca aprobar colores en el preview QT; checker de 50 % de gris numérico; ffprobe de tags.

### Inferencias y oportunidades (Q2)

- `check.mjs` ya valida esencia/duración/silencios; falta una métrica **objetiva de movimiento**: % de pares de frames quietos @2 Hz (metodología del checker de [agentskillshub](https://github.com/zhuyansen/agent-skills-hub)), exportada a `check.mjs` como gate con umbral ajustable.
- `motion-craft` puede adoptar la tabla de springs presets y la regla de tipos de corte (J/L/whip) sin conflicto con las curvas interpolaciones actuales.
- El "coeficiencia anti-slide-show" (% de quietos) se puede medir por corte y por sección para detectar si la pieza "se paró" en algún plano largo.
- bg de nuestra lib de terceros (HTML+GSAP) puede adoptar `claim`/`placeFree` (opuscus) aunque el estil de iart (javascript-animation) es de una página única — la idea (colisiones de texto) sirve igual.
- El catálogo heygen de "20 estilos de diseño" se adapta al `video-styles` como **texto (MIT) atribuido** y no como pipeline.

---

## Pregunta clave 3 — ¿Qué pide assets o capacidades que NO tenemos o que no conviene?

**Takeaway:** tres familias: (A) tooling nueva (raster→SVG, validación de clipping, pipeline de estilos persistentes); (B) skills que dependen de frameworks/stack distinto (Remotion/TS, manim, heygen-API cloud) — sus recetas sí se transplantan, sus dependencias no; (C) estilos que dependen de footage/licencias reales (opuscar "evidence" y pack de archivo) hasta tener flujo de licensing.

### (A) Tooling nueva (posible, no urgente)

- **pixel2motion raster→SVG** ([pixel2motion/SKILL.md](https://github.com/vibe-motion/skills/blob/main/pixel2motion/SKILL.md)) — pipeline de 4 fases (extract asset → vectorizar → montar → QA-spec) con escala de complejidad 1–5 (silueta simple / formas simples / capas / multi-layer con máscara / recorte máscara+telemetría de alpha); tools: Playwright + Python. Para nosotros sería tooling nueva (hoy el motor "dibuja" cada fotograma, no rasteriza assets existentes); las reglas de estilo y QA sí aplican cuando una pieza necesiteSarah un raster.
- **opuscar MY-STYLES** ([MY-STYLES.md](https://github.com/lemomo-ai/lemo-opuscar/blob/main/MY-STYLES.md)) — persistencia de estilos con style.json saneado + CHANGES.md + styleframe-vs-base.jpg A/B + ≤5 cambios/ronda + tabla de cómo traducir deseos vagos ("más premium" → menos colores, más contraste luz/sombra, más vacío) — valioso como concepto para el sistema de lecciones en `creative-contract`, no como tooling.

### (B) Depende de stack distinto (recetas sí, dependencias no)

- **vibe** — Remotion + TypeScript (`npm i&&render` server); el 90 % del oficio ya se transplantó en Q1/Q2; las dependencias no encajan con nuestro HTML+GSAP+Canvas.
- **heygen-video** — pipeline cloud-API (avatar video, TTS cloud, créditos); rechazar como integración; el catálogo de estilos (MIT) sí se adopta como texto.
- **manim** ([manim-skills](https://github.com/iart-ai/manim-skills)) — animación matemática tipo 3Blue1Brown con Python/cairo; directamente OFF nuestro stack; los conceptos de artes/pacing ya están cubiertos por `chart-animation`.
- **webgl-animation webgl/es shaders** — de de WebGL/three.js; nuestro motor es Canvas 2D; las recetas de loop de noise SÍ funcionan en Canvas 2D (Q2 §7), pero el pipeline de shaders no cabe sin motor nuevo.

### (C) Footage/licencias reales (flujo nuevo)

- **opuscar estilos de archivo (visual-investigation, newsreel, kino-montage)** — dependen de footage real licenciado con disciplina de provenance (NARA/PD para <1950, Hearst/Pathé NO es PD, "no known restrictions" ≠ licencia — [TECHNIQUE](https://github.com/lemomo-ai/lemo-opuscar/blob/main/TECHNIQUE.md)). Nuestro engine podría copiar la estética sin footage real, PERO el estilo está diseñado sobre archivo real: aplazar hasta tener flujo de licencias. Es el caso más "mercado-futuro".
- **opuscar voces Kokoro-82M offline** — el motor de opuscar ha adoptado Kokoro como TTS offline de alta calidad; nosotros ya tenemos edge-tts + Piper + Chatterbox Express (dicción local). No es urgente aunque sería un tipo de voz más natural en inglés.
- **opuscar sample-library de instrumentos** (VSCO 2 CE, VCSL, FreePats, Karoryfer, Salamander; descargas 70–400 MB por instrumento) — notre música procedural cubre la mayoría; solo si una pieza pide sonido orquestal real.

### Recomendaciones finales (adoptar / aplazar / rechazar)

**ADOPTAR YA** (números/reglas como data, sin tooling nueva)

| # | Ítem | Fuente | Destino en el plugin |
|---|---|---|---|
| 1 | Tabla personalidad→parámetro (energía/tono → squash %, anticipación ms, stagger, overshoot 1.0–1.12; 6 presets con cubic-bezier) | vibe motion-personality | `motion-craft` (vocabulario adjetivo→parámetro) |
| 2 | Presupuesto de intensidad calm-sharp (travel ≤24 px, overshoot ≤2 %, hold ≥0.3 s) + base timing 0.4 s + una familia de easing (~90 %) + matriz de tono 2×2 + 2 easings máx. + 1 wow/pieza | iart motion-art-direction | `motion-craft` + `creative-contract` |
| 3 | Duraciones por clase (micro/UI/hero/cámara 100–200/200–400/400–800/800–2000 ms) + tabla de springs + tabla de diagnósticos (flotante=+30 % duración, rígido=lineal, barato=simultáneo) | iart animation-principles | `motion-craft` |
| 4 | Proporción 20/50/30 + stagger solapado 10–20 % + "nunca-todos-el-mismo-frame" + jerarquía de arrastre | vibe pixel2motion | `motion-craft` |
| 5 | Bloqueo semántico de fases (rest→…→settle) con estados deterministas + caso de salto con tabla de 8 fases | vibe disney | `motion-craft` (fase antes que curva) |
| 6 | Grid 12-col/8px + jerarquía orden + 1/3 de ambos sentidos + parallax 0.2/0.6/1.2 + 1 move/beat + safe areas por aspect + restack-not-crop | iart shot-composition | `video-styles` |
| 7 | Tipografía: stagger 60–100/40–70/20–40 ms cap 800 ms + mask translateY + blur 12px→0 + var-font gotcha + split-after-fonts.ready + aria-label | iart kinetic-typography | `motion-craft` + `video-styles` |
| 8 | Captions: tokens 1–4 palabras/página + banda 62–70 % + clear-bottom ≥15 % + pop spring damp 12/0.6 + 56–80 px + stroke 2–6 px + SRT/VTT sidecar | iart caption-animation | `story-grammar` + `video-styles` |
| 9 | Counters/charts: ease-the-VALUE + tabular-nums+round+Intl + nunca 2 counters a la vez + intro 1–1.5 s / fila 0.3–0.6 s / highlight +0.5–1 s / final 2–3 s + reveal progressive + icon spring (10,180,0.5) + item spring (14,0.6, 24 px) | iart chart/infographic | `motion-craft` dispositivos |
| 10 | Beat-sync: frames_per_beat + redondeo acumulativo + corte por frases (2/4/8) + acentos en corchea + J 4–12 f + L 12–24 f + whip 6–10 f + rampa land-on-beat + arco de pacing (8–16 / 4–8 / +2 / largo / 1) | iart beat-sync-editing | `sound-design` + `story-grammar` |
| 11 | Sonido: marca con armonía no volumen (+3–5 dB ok / +7–10 dB = startle) + capas ≤2/compás (juntas = +11 dB) + break-silencio + low-end ±3 dB + pads < MIDI 48 + voz +10 dB + cuecheck 0 ms | iart soundtrack + opuscar TECHNIQUE | `sound-design` |
| 12 | QA: % de cuadros quietos @2 Hz + readcheck TEXTS(t) + easing-probe + Final-Frame 0-diff + assets-audit exit 1 + primera/última vacíos para overlays + <3 flashes/s + QA en el pipeline de entrega + ≤10 iteraciones | agentskillshub + opuscar + vibe + freelance QC | `video-engine` (`check.mjs` + hojas) |
| 13 | Gotchas de stack: var() en @keyframes = LINEAR (4.3×) + lineCap round draw-on bug + grano en ffmpeg (no CSS) + split-post-fonts.ready + QT-nunca-aprobar | vibe pixel2motion + opuscar + color-motion | `video-engine` lecciones |
| 14 | Loops/fondos: noise por camino cerrado (cos/sin) + scroll alineado a celdas enteras + constelación hash espacial + mesh-blobs + OKLCH interpolación | iart background-recipes + color-motion | `video-styles` recetas de fondo |
| 15 | Lower-thirds: LEAD/TAIL vacíos + hold quieto + fit() sin cortar + gotcha de numerales lining + checks sobre checkerboard/oscuro/claro | iart lower-thirds | `motion-craft` dispositivos |
| 16 | Release-blockers (logo auténtico, mostrar producto, nada fake HUD/glass/wall/métrica-sin-verificar, asset manifest + SHA-256) + tabla de recuperación | vibe brand-launch | `creative-contract` PROHIBIDO |
| 17 | No-el-demo-de-nuevo (≥4 de 6 diferencias con la pieza de referencia) + acento único red-solo-apunta + placeholder vacío = render roto + título ≠ subtítulo | opuscar DIRECTOR + visual-investigation STYLE | `video-review` / agente `critic` |
| 18 | Catálogo de 20 bloques de estilo (nombres + reglas, atribución a diseñadores) | heygen (MIT) | `video-styles` (texto, no pipeline) |

**APLAZAR** (posible con esfuerzo nuevo; no urgente)

- Raster→SVG de pixel2motion (pipeline 4 fases + Playwright + Python) — cuando una pieza necesite animar a partir de assets de marca reales.
- MY-STYLES como tooling de persistencia (adoptar solo el concepto de lecciones).
- WebGL/three.js/shader-styles (aurora, HDRI, 2.5D/3D de opuscar) — motor nuevo o extension del motor.
- manim (Python/cairo).
- Sample-library de instrumentos (VSCO/FreePats…).
- Kokoro-82M TTS offline (tenemos edge-tts/Piper/Chatterbox).

**RECHAZAR**

- Integración heygen-video (API cloud con avatares y créditos; conflictúa con motor local).
- Dependencias Remotion/TypeScript de vibe (motor incompatível; las recetas ya quedaron).
- vibe-motion/skills como código o texto verbatim (sin LICENSE, abandonado) — ideas y números, con attribution.
- Estilos de archivo/footage real (newsreel, visual-investigation, kino-montage) como entregable tal-cual, hasta tener flujo de licencias; la disciplina de provenance (FACTS.md, fuente-y-cita por shot) se adopta como regla.

### Reservas y advertencias (honestidad del archivo)

- Claims psicológicos internos (41 % de atención, 87 % de retención, 58 % vs 41 %, 73/78/65 % de retención por plataforma) son afirmaciones **de los skills** sin fuentes externas — no las amplifiquemos sin marcarlas.
- "98 estilos de film en la [página OPUSCAR 98](https://github.com/lemomo-ai/lemo-opuscar/blob/main/README.md) (`Lx` del README) vs 59 estilos en el árbol del repo (`styles/`, sin contar `_template`)" — discrepancia por verificar; hasta entonces citar el árbol.
- Dos fuentes de safe-area no coinciden: `tiktok-video-skills` (top 120 px / bottom 320 px / right 120 px) y `freelance-motion-skills` (top ~250 px / bottom 250–400 px) para 9:16. Usar el range conservador (el par corto).
- Las páginas de Best Runs miden con un chequeo independiente ([score_video.py](https://github.com/zhuyansen/agent-skills-hub), `ops/video-runs`): útil como método para nuestra QA (4 gates + % de quietos), pero el ganador del run depende del modelo de generación, no solo del skill.

---

## Índice de fuentes primarias

### vibe-motion/skills (`main`, sin LICENSE, abandonado → motionface.cc)
- [disney-animation-rule-skill/SKILL.md](https://github.com/vibe-motion/skills/blob/main/disney-animation-rule-skill/SKILL.md) · [references/twelve-principles.md](https://github.com/vibe-motion/skills/blob/main/disney-animation-rule-skill/references/twelve-principles.md) · [references/implementation-patterns.md](https://github.com/vibe-motion/skills/blob/main/disney-animation-rule-skill/references/implementation-patterns.md) · [references/clawd-jump-case-study.md](https://github.com/vibe-motion/skills/blob/main/disney-animation-rule-skill/references/clawd-jump-case-study.md)
- [pixel2motion/SKILL.md](https://github.com/vibe-motion/skills/blob/main/pixel2motion/SKILL.md) · [references/motion-personality.md](https://github.com/vibe-motion/skills/blob/main/pixel2motion/references/motion-personality.md)
- [brand-launch-video-star/SKILL.md](https://github.com/vibe-motion/skills/blob/main/brand-launch-video-star/SKILL.md)
- [README.en.md](https://github.com/vibe-motion/skills/blob/main/README.en.md) (L112: licencia CC BY-NC 4.0 de los medios Chladni por Lykno)

### iart-ai (MIT, © 2026 iart.ai; hub en [motion-skills](https://github.com/iart-ai/motion-skills))
- [motion-design-skills/skills/animation-principles/SKILL.md](https://github.com/iart-ai/motion-design-skills/blob/main/skills/animation-principles/SKILL.md) · [easing-curves.md](https://github.com/iart-ai/motion-design-skills/blob/main/skills/animation-principles/references/easing-curves.md) · [beat-sync-editing/SKILL.md](https://github.com/iart-ai/motion-design-skills/blob/main/skills/beat-sync-editing/SKILL.md) · [shot-composition/SKILL.md](https://github.com/iart-ai/motion-design-skills/blob/main/skills/shot-composition/SKILL.md) · [motion-art-direction/SKILL.md](https://github.com/iart-ai/motion-design-skills/blob/main/skills/motion-art-direction/SKILL.md) · [color-motion/SKILL.md](https://github.com/iart-ai/motion-design-skills/blob/main/skills/color-motion/SKILL.md)
- [logo-animation/references/logo-patterns.md](https://github.com/iart-ai/motion-design-skills/blob/main/skills/logo-animation/references/logo-patterns.md)
- [motion-background/SKILL.md](https://github.com/iart-ai/motion-design-skills/blob/main/skills/motion-background/SKILL.md) · [references/background-recipes.md](https://github.com/iart-ai/motion-design-skills/blob/main/skills/motion-background/references/background-recipes.md)
- [kinetic-typography-skills/skills/kinetic-typography/SKILL.md](https://github.com/iart-ai/kinetic-typography-skills/blob/main/skills/kinetic-typography/SKILL.md)
- [javascript-animation-skills/skills/javascript-animation/SKILL.md](https://github.com/iart-ai/javascript-animation-skills/blob/main/skills/javascript-animation/SKILL.md) · [soundtrack/SKILL.md](https://github.com/iart-ai/javascript-animation-skills/blob/main/skills/soundtrack/SKILL.md)
- [data-animation-skills/skills/chart-animation/SKILL.md](https://github.com/iart-ai/data-animation-skills/blob/main/skills/chart-animation/SKILL.md) · [animated-infographic](https://github.com/iart-ai/data-animation-skills/blob/main/skills/animated-infographic/SKILL.md)
- [explainer-video-skills/skills/explainer-video/SKILL.md](https://github.com/iart-ai/explainer-video-skills/blob/main/skills/explainer-video/SKILL.md)
- [tiktok-video-skills/skills/short-form-video/SKILL.md](https://github.com/iart-ai/tiktok-video-skills/blob/main/skills/short-form-video/SKILL.md) · [caption-animation](https://github.com/iart-ai/tiktok-video-skills/blob/main/skills/caption-animation/SKILL.md)
- [freelance-motion-skills/skills/video-delivery-specs/SKILL.md](https://github.com/iart-ai/freelance-motion-skills/blob/main/skills/video-delivery-specs/SKILL.md) · [brand-motion-guidelines](https://github.com/iart-ai/freelance-motion-skills/blob/main/skills/brand-motion-guidelines/SKILL.md)
- [lower-thirds-skills/skills/lower-thirds/SKILL.md](https://github.com/iart-ai/lower-thirds-skills/blob/main/skills/lower-thirds/SKILL.md)
- [manim-skills](https://github.com/iart-ai/manim-skills) (solo referencia de stack)

### lemomo-ai/lemo-opuscar (`main`, MIT + CC BY 4.0 films)
- [TECHNIQUE.md](https://github.com/lemomo-ai/lemo-opuscar/blob/main/TECHNIQUE.md) · [DIRECTOR.md](https://github.com/lemomo-ai/lemo-opuscar/blob/main/DIRECTOR.md) · [MY-STYLES.md](https://github.com/lemomo-ai/lemo-opuscar/blob/main/MY-STYLES.md) · [README.md](https://github.com/lemomo-ai/lemo-opuscar/blob/main/README.md)
- [styles/visual-investigation/STYLE.md](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/visual-investigation/STYLE.md)

### heygen-com/skills (`master`, MIT)
- [heygen-video/SKILL.md](https://github.com/heygen-com/skills/blob/master/heygen-video/SKILL.md) · LICENSE (MIT)

### Validación externa (método, no autoridad)

- [agentskillshub · Best runs "video"](https://agentskillshub.top/best-runs/video) · checker: [score_video.py en zhuyansen/agent-skills-hub](https://github.com/zhuyansen/agent-skills-hub) · misma brief para todos los runs (15 s promo, 5 líneas de copy, 1920×1080@30): [vibe-motion__skills](https://agentskillshub.top/best-runs/video/vibe-motion__skills.html) · [charlie947__motion-graphics-skills](https://agentskillshub.top/best-runs/video/charlie947__motion-graphics-skills.html) · [Barty-Bart__motion-graphics](https://agentskillshub.top/best-runs/video/Barty-Bart__motion-graphics-skills.html)
