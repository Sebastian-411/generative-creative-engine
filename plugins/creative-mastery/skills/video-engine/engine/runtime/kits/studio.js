// Kit `studio`: un set 3D con luz de verdad, renderizado por WebGL dentro de la misma página de la pieza.
//
// El problema que resuelve: un cuadro armado con rectángulos y círculos planos no tiene luz, ni
// contacto, ni profundidad — se lee como póster. Acá cada objeto es una forma con volumen, recibe una
// luz principal con sombra suave, una de relleno, un rebote de piso, oclusión ambiental, niebla,
// grano, viñeta y dithering (sin dithering, un degradado se convierte en bandas al comprimir a H.264).
//
// Sigue el contrato del motor: el kit NO decide tiempo. En `?render` el motor busca el timeline y llama
// a `stage.onFrame`; vos llamás `set.draw(t)` ahí dentro y el set es función pura de t + su estado.
// Ni `Math.random` ni relojes: las semillas son fijas.
//
//   <canvas id="set" width="1080" height="1920"></canvas>   <!-- o lo crea el kit -->
//   const set = Studio.create(stage, { canvas: 'set' });
//   set.scene({
//     background: ['#0d1524', '#1b2a44'],       // gradiente del fondo (arriba → abajo)
//     fog: 0.055,                               // densidad de niebla (profundidad)
//     floor: { color: '#12161f', rough: 0.72, y: 0 },
//     light: {
//       key:  { dir: [-0.55, 0.85, 0.4], color: '#fff2e2', power: 1.35 },
//       fill: { color: '#8fb6ff', power: 0.35 },
//       rim:  { color: '#ffd9a8', power: 0.5 },
//     },
//     objects: [
//       // kind: slab | box | sphere | cylinder | card | stack | phone
//       { kind: 'slab',  pos: [0, 0.18, 0], size: [1.7, 0.26, 1.1], radius: 0.09, color: '#efe9df', rough: 0.42, yaw: 0.2 },
//       { kind: 'phone', pos: [0.55, 0.55, 0.15], size: [0.5, 1.0, 0.07], radius: 0.06, color: '#11151c', rough: 0.3, yaw: -0.35, pitch: -0.08,
//         screen: { color: '#2f7dff', glow: 1.6 } },
//     ],
//     post: { grain: 0.05, vignette: 0.35, exposure: 1.0, dither: true },
//   });
//   set.camera({ pos: [0, 0.95, 3.1], target: [0, 0.45, 0], fov: 34, roll: 0 });
//   stage.onFrame((t) => set.draw(t));
//
// Todo lo animable se puede mover por fotograma: `set.camera({...})` y `set.object(i, {...})` aceptan
// llamarse dentro de `onFrame` (se reescriben uniformes, no se recompila nada).
(function () {
  const MAX_OBJ = 32;

  const VERT = `#version 300 es
  in vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

  // El shader completo: raymarch de primitivas con materiales, luego post (tono, grano, viñeta, dither).
  const FRAG = `#version 300 es
  precision highp float;
  out vec4 outColor;

  uniform vec2  uRes;
  uniform float uT;
  uniform vec3  uCamPos, uCamTgt, uCamUp;
  uniform float uFov, uRoll;

  uniform vec3  uBgTop, uBgBot, uFogCol, uFloorCol;
  uniform float uFog, uFloorRough, uFloorY, uFloorOn;
  uniform vec4  uHole;      // xyz centro del hueco, w = 1 si hay cavidad
  uniform vec4  uHoleSize;  // xyz tamaño del hueco, w = radio de la esquina
  uniform vec3  uHoleLight; // color de la lámpara dentro de la cavidad
  uniform vec3  uLampPos;   // luz puntual (lámpara de un cuarto, farol, pantalla que ilumina)
  uniform vec3  uLampCol;   // color × potencia de esa luz
  uniform vec3  uKeyDir, uKeyCol, uFillCol, uRimCol;
  uniform float uKeyPow, uFillPow, uRimPow;

  uniform int   uCount;
  uniform vec4  uPos[${MAX_OBJ}];    // xyz posición, w = radio de redondeo
  uniform vec4  uSize[${MAX_OBJ}];   // xyz tamaño, w = kind
  uniform vec4  uMat[${MAX_OBJ}];    // rgb albedo, w = rough
  uniform vec4  uMat2[${MAX_OBJ}];   // x metal, y glow, z yaw, w pitch
  uniform vec4  uScreen[${MAX_OBJ}]; // x = 1 si tiene pantalla emisiva, y = glow, z = ancho relativo, w = alto relativo
  uniform vec4  uExtra[${MAX_OBJ}];  // x = textura (0-6), y = escala de textura, z = bump de silueta, w = emisión

  uniform float uGrain, uVignette, uExposure, uSeed, uDither, uSat, uContrast;
  uniform vec3  uScreenCol;

  const float PI = 3.14159265;

  // ---------- ruido determinista ----------
  float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
  float hash21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }

  // ---------- primitivas ----------
  float sdRoundBox(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
  }
  float sdSphere(vec3 p, float r) { return length(p) - r; }
  float sdCylinder(vec3 p, float r, float h) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
  }
  mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
  mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }

  // Ruido de valor 3D: base de las texturas procedurales (tierra, roca, arena, concreto, madera).
  float hash31(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vnoise(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash31(i + vec3(0, 0, 0)), hash31(i + vec3(1, 0, 0)), f.x),
                   mix(hash31(i + vec3(0, 1, 0)), hash31(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash31(i + vec3(0, 0, 1)), hash31(i + vec3(1, 0, 1)), f.x),
                   mix(hash31(i + vec3(0, 1, 1)), hash31(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { return 0.55 * vnoise(p) + 0.3 * vnoise(p * 2.1) + 0.15 * vnoise(p * 4.3); }

  // Texturas por material: modulan el albedo, no la forma (la forma la da el bump del SDF).
  // 0 ninguna · 1 tierra · 2 roca · 3 arena · 4 concreto · 5 madera · 6 metal
  vec3 textureAlbedo(int kind, vec3 p, vec3 base, float scale) {
    if (kind == 0) return base;
    float n = fbm(p * scale);
    if (kind == 1) {                    // tierra: manchas oscuras y piedritas
      float spots = smoothstep(0.55, 0.66, vnoise(p * scale * 3.1 + 11.0));
      float grit = smoothstep(0.62, 0.72, vnoise(p * scale * 9.0 + 3.0));
      return base * (0.78 + 0.34 * n) * (1.0 - 0.5 * spots) * (1.0 - 0.18 * grit);
    }
    if (kind == 2) {                    // roca: piedras redondas de borde duro
      float cell = vnoise(p * scale * 0.9);
      float stones = smoothstep(0.48, 0.56, cell);
      float rid = 1.0 - abs(vnoise(p * scale * 2.2) * 2.0 - 1.0);
      return base * (0.62 + 0.5 * stones + 0.22 * rid) * (0.92 + 0.16 * n);
    }
    if (kind == 3) return base * (0.9 + 0.16 * n) * (0.97 + 0.06 * vnoise(p * scale * 7.0)); // arena: grano fino
    if (kind == 4) return base * (0.95 + 0.09 * n);                       // concreto: manchas suaves
    if (kind == 5) {                    // madera: vetas en una dirección
      float grain = sin(p.x * scale * 6.0 + fbm(p * scale) * 4.0) * 0.5 + 0.5;
      return base * (0.8 + 0.32 * grain);
    }
    if (kind == 6) return base * (0.9 + 0.2 * smoothstep(0.4, 0.6, n));   // metal: moteado
    return base;
  }

  // Cavidad: se resta del campo entero, así el corte de tierra muestra un cuarto de verdad
  // (paredes del estrato con su textura, sombra propia y lámpara adentro).
  float holeSDF(vec3 p) { return sdRoundBox(p - uHole.xyz, uHoleSize.xyz * 0.5, max(0.02, uHoleSize.w)); }

  // ---------- escena ----------
  // Devuelve la distancia y deja en matId el índice del objeto más cercano.
  float mapScene(vec3 p, out int matId, out float screenMask) {
    screenMask = 0.0;
    matId = -1;
    float d = 1e9;
    // La cavidad solo excava TIERRA (texturas soil/rock/sand): lo construido dentro del hueco
    // —muebles, personaje, concreto— queda intacto. Sin esta separación, el cuarto se borraba solo.
    float dTerra = 1e9;
    int terraId = -1;
    for (int i = 0; i < ${MAX_OBJ}; i++) {
      if (i >= uCount) break;
      vec3 lp = p - uPos[i].xyz;
      lp = rotX(-uMat2[i].w) * rotY(-uMat2[i].z) * lp;
      vec3 s = uSize[i].xyz * 0.5;   // el API habla de TAMAÑO; las distancias usan semiextensión
      float kind = uSize[i].w;
      float di;
      if (kind < 0.5) {                       // slab: caja redondeada
        di = sdRoundBox(lp, s, uPos[i].w);
      } else if (kind < 1.5) {                // box: caja dura
        di = sdRoundBox(lp, s, 0.004);
      } else if (kind < 2.5) {                // sphere / elipsoide
        di = (sdSphere(lp / s, 1.0)) * min(s.x, min(s.y, s.z));
      } else if (kind < 3.5) {                // cylinder
        di = sdCylinder(lp, s.x, s.y);
      } else if (kind < 4.5) {                // card: lámina fina redondeada
        di = sdRoundBox(lp, s, max(uPos[i].w, 0.02));
      } else if (kind < 5.5) {                // stack: pila de láminas (servidores, libros, platos)
        di = 1e9;
        for (int k = 0; k < 6; k++) {
          vec3 off = vec3(0.0, (float(k) - 2.5) * (s.y * 0.42), 0.0);
          di = min(di, sdRoundBox(lp - off, vec3(s.x, s.y * 0.16, s.z), uPos[i].w));
        }
      } else {                                // phone: cuerpo + pantalla emisiva en la cara +z
        float body = sdRoundBox(lp, s, max(uPos[i].w, 0.03));
        di = body;
        // Máscara de pantalla: área de la cara frontal, ligeramente hundida.
        vec3 sp = lp - vec3(0.0, 0.0, s.z * 0.92);
        float sx = s.x * uScreen[i].z, sy = s.y * uScreen[i].w;
        float scr = sdRoundBox(sp, vec3(sx, sy, 0.03), 0.035);
        if (scr < 0.004) screenMask = uScreen[i].y;
        di = min(body, scr);
      }
      // Silueta irregular: la roca no tiene cantos perfectos. Se desplaza la distancia, no el punto,
      // así el raymarch sigue convergiendo y el borde queda dentado como un low-poly de verdad.
      if (uExtra[i].z > 0.0) di += (vnoise(p * (uExtra[i].y * 1.6 + 2.0)) - 0.5) * uExtra[i].z;
      if (di < d) { d = di; matId = i; }
      float tx = uExtra[i].x;
      if (tx > 0.5 && tx < 3.5 && di < dTerra) { dTerra = di; terraId = i; }
    }
    // Piso infinito opcional (en un corte de tierra el piso ES el bloque: apagarlo o tapa todo).
    if (uFloorOn > 0.5) {
      float floorD = p.y - uFloorY;
      floorD += 0.004 * sin(p.x * 3.1) * sin(p.z * 2.7);
      if (floorD < d) { d = floorD; matId = -2; }
    }
    if (uHole.w > 0.5) {
      float carved = max(dTerra, -holeSDF(p));
      if (carved < d) { d = carved; matId = terraId; }
    }
    return d;
  }

  float mapS(vec3 p) { int m; float sm; return mapScene(p, m, sm); }

  vec3 calcNormal(vec3 p) {
    const vec2 e = vec2(0.0015, 0.0);
    return normalize(vec3(
      mapS(p + e.xyy) - mapS(p - e.xyy),
      mapS(p + e.yxy) - mapS(p - e.yxy),
      mapS(p + e.yyx) - mapS(p - e.yyx)));
  }

  // Oclusión ambiental por muestreo del campo (sin SSAO: nada de buffers extra).
  float calcAO(vec3 p, vec3 n) {
    float occ = 0.0, sca = 1.0;
    for (int i = 0; i < 5; i++) {
      float h = 0.02 + 0.14 * float(i) / 4.0;
      occ += (h - mapS(p + n * h)) * sca;
      sca *= 0.86;
    }
    return clamp(1.0 - 2.4 * occ, 0.0, 1.0);
  }

  // Sombra suave: la penumbra sale del mínimo cociente distancia/paso (iq). Es LA diferencia entre
  // un objeto pegado a una pared y un objeto que está en un set con luz.
  float softShadow(vec3 ro, vec3 rd, float k) {
    float res = 1.0, t = 0.02;
    for (int i = 0; i < 40; i++) {
      float h = mapS(ro + rd * t);
      res = min(res, k * h / t);
      t += clamp(h, 0.012, 0.22);
      if (res < 0.02 || t > 6.0) break;
    }
    return clamp(res, 0.0, 1.0);
  }

  // Micro-textura del material: rompe la superficie plástica sin leerse como ruido de compresión.
  float microNoise(vec3 p, float scale) {
    float n = 0.0;
    n += 0.55 * hash21(floor(p.xz * scale));
    n += 0.45 * hash21(floor(p.xz * scale * 2.7) + 7.3);
    return n - 0.5;
  }

  vec3 aces(vec3 x) {
    return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    // Cámara.
    vec3 fw = normalize(uCamTgt - uCamPos);
    vec3 rt = normalize(cross(fw, uCamUp));
    vec3 up = cross(rt, fw);
    float cr = cos(uRoll), sr = sin(uRoll);
    vec3 r2 = rt * cr + up * sr;
    vec3 u2 = up * cr - rt * sr;
    vec3 rd = normalize(uv.x * r2 + uv.y * u2 + uFov * fw);

    // Fondo: gradiente vertical + halo de la luz principal (el set tiene aire, no un color plano).
    float bgT = clamp(uv.y * 0.5 + 0.55, 0.0, 1.0);
    vec3 col = mix(uBgBot, uBgTop, bgT);
    vec3 keyDir = normalize(uKeyDir);
    float halo = pow(max(0.0, dot(rd, keyDir)), 6.0);
    col += uKeyCol * halo * 0.10 * uKeyPow;

    // Marcha.
    float t = 0.0, d = 0.0;
    int matId = -1; float screenMask = 0.0;
    for (int i = 0; i < 110; i++) {
      vec3 p = uCamPos + rd * t;
      d = mapScene(p, matId, screenMask);
      if (d < 0.0015 || t > 14.0) break;
      t += d * 0.92;
    }
    bool hit = d < 0.0015;
    vec3 p = uCamPos + rd * t;
    vec3 n = hit ? calcNormal(p) : vec3(0.0, 1.0, 0.0);

    vec3 albedo = uFloorCol;
    float rough = uFloorRough, metal = 0.0, glow = 0.0;
    vec2 screenUV = vec2(0.0);
    if (matId == -2) {
      albedo = uFloorCol;
      rough = uFloorRough;
      // El piso nunca es un color liso: recibe una mancha de luz y una textura fina.
      albedo *= 0.92 + 0.16 * hash21(floor(p.xz * 26.0));
    } else if (matId >= 0) {
      albedo = uMat[matId].rgb;
      rough = uMat[matId].w;
      metal = uMat2[matId].x;
      glow = uMat2[matId].y;
      albedo *= 1.0 + microNoise(p, 42.0) * 0.05 * (0.4 + rough);
      albedo = textureAlbedo(int(uExtra[matId].x), p, albedo, uExtra[matId].y > 0.0 ? uExtra[matId].y : 6.0);
      // Coordenadas locales de la pantalla: permiten pintar una imagen encendida, no un rectángulo liso.
      vec3 lp = p - uPos[matId].xyz;
      lp = rotX(-uMat2[matId].w) * rotY(-uMat2[matId].z) * lp;
      screenUV = vec2(lp.x / max(1e-4, uSize[matId].x * uScreen[matId].z),
                      lp.y / max(1e-4, uSize[matId].y * uScreen[matId].w));
    }

    // Luces.
    float ao = hit ? calcAO(p, n) : 1.0;
    vec3 v = normalize(uCamPos - p);
    vec3 keyL = keyDir;
    float keySh = hit ? softShadow(p + n * 0.006, keyL, 15.0) : 1.0;
    float ndl = max(0.0, dot(n, keyL));
    vec3 lit = albedo * uKeyCol * uKeyPow * ndl * keySh;

    // Relleno desde el lado opuesto (evita el negro muerto sin lavar el contraste).
    float ndf = max(0.0, dot(n, normalize(vec3(-keyL.x, 0.3, -keyL.z))));
    lit += albedo * uFillCol * uFillPow * ndf * ao;
    // Segundo relleno bajo y lateral: en un set real el piso devuelve luz a las caras oscuras.
    float ndb = max(0.0, dot(n, normalize(vec3(keyL.z, 0.15, -keyL.x))));
    lit += albedo * uFillCol * uFillPow * 0.55 * ndb * ao;

    // Rebote de piso / rim: la luz que devuelve el set.
    float rim = pow(1.0 - max(0.0, dot(n, v)), 3.0);
    lit += albedo * uRimCol * uRimPow * rim * ao;

    // Especular (Blinn-Phong con la dureza del rough) + fresnel en metales.
    vec3 h = normalize(keyL + v);
    float spec = pow(max(0.0, dot(n, h)), mix(220.0, 8.0, rough)) * (1.0 - rough * 0.7);
    lit += uKeyCol * spec * keySh * (0.35 + 0.65 * metal);
    float fres = pow(1.0 - max(0.0, dot(n, v)), 5.0) * (0.15 + 0.6 * metal);
    lit += uRimCol * fres * ao * 0.5;

    // Pantalla emisiva: es el único blanco que puede quemar el cuadro, y por eso vende el volumen.
    if (screenMask > 0.0) {
      // Imagen encendida: un hotspot suave (como una foto o un video) + caída al borde de la pantalla.
      float wall = 0.5 + 0.5 * exp(-length(screenUV - vec2(0.18, 0.34)) * 1.9);
      float edge = smoothstep(1.02, 0.82, max(abs(screenUV.x), abs(screenUV.y)));
      lit = mix(lit, uScreenCol * screenMask * wall * 1.5, 0.96 * edge);
    }

    // Luz puntual: la lámpara de un cuarto ilumina paredes y piso (sin esto el interior es un pozo negro).
    if (dot(uLampCol, vec3(1.0)) > 0.001) {
      vec3 lv = uLampPos - p;
      float ld = length(lv);
      float nl = max(0.0, dot(n, lv / max(1e-4, ld)));
      lit += albedo * uLampCol * nl / (1.0 + ld * ld * 7.0);
    }

    // Lámpara del cuarto: sin ella la cavidad es un agujero negro y no se lee nada adentro.
    if (uHole.w > 0.5 && holeSDF(p) < 0.03) {
      vec3 lp = uHole.xyz + vec3(0.0, uHoleSize.y * 0.38, 0.0);
      float dd = length(p - lp);
      lit += uHoleLight * 1.15 / (1.0 + dd * dd * 11.0);
    }

    // Emisión propia (cubos radiactivos, luces, pantallas sin UI): el objeto ilumina, no solo refleja.
    if (matId >= 0 && uExtra[matId].w > 0.0) lit += albedo * uExtra[matId].w * 1.8;

    // Rebote de la pantalla sobre lo que tiene cerca (la mesa, el piso): la luz que devuelve el set.
    for (int i = 0; i < ${MAX_OBJ}; i++) {
      if (i >= uCount) break;
      if (uScreen[i].x < 0.5) continue;
      vec3 src = uPos[i].xyz + vec3(0.0, 0.0, uSize[i].z);
      float dd = length(p - src);
      lit += uScreenCol * uScreen[i].y * 0.22 / (1.0 + dd * dd * 16.0);
    }

    // Contacto: el piso justo debajo del objeto se oscurece (sin esto los objetos flotan).
    if (matId == -2) lit *= mix(0.55, 1.0, smoothstep(0.0, 0.72, ao));

    // Niebla: separa planos y mata el borde del horizonte. Si el rayo no golpeó nada, el color de
    // fondo sobrevive (antes se reemplazaba por negro y el cielo desaparecía).
    float fogAmt = 1.0 - exp(-uFog * max(0.0, t));
    vec3 fogged = mix(lit, mix(uBgBot, uFogCol, 0.35), fogAmt);
    col = hit ? fogged : mix(col, uFogCol, fogAmt * 0.35);

    // Tono y post.
    col *= uExposure;
    col = aces(col);
    col = pow(col, vec3(1.0 / 2.2));
    // ACES desatura los extremos: sin este paso, un set naranja sale gris y triste.
    // Saturación y contraste se aplican sobre sRGB (estilístico, no fotométrico).
    float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(vec3(lum), col, uSat);
    col = (col - 0.5) * uContrast + 0.5;

    // Viñeta suave: dirige el ojo al centro sin que se vea el círculo.
    vec2 vc = gl_FragCoord.xy / uRes - 0.5;
    float vig = 1.0 - uVignette * dot(vc, vc) * 1.6;
    col *= clamp(vig, 0.0, 1.0);

    // Grano de película (no ruido de compresión): se mueve por fotograma y está en el contrato del look.
    float g = hash21(gl_FragCoord.xy + vec2(uSeed, uSeed * 1.7) + floor(uT * 30.0) * 41.0) - 0.5;
    col += g * uGrain;

    // Dithering ordenado: un degradado de 8 bits SIEMPRE se banda al pasar a H.264 sin esto.
    if (uDither > 0.5) {
      float dth = hash21(gl_FragCoord.xy) - 0.5;
      col += dth / 255.0 * 1.2;
    }

    outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }`;

  const KINDS = { slab: 0, box: 1, sphere: 2, cylinder: 3, card: 4, stack: 5, phone: 6 };
  // Texturas procedurales (no hay mapas: se calculan del punto del mundo, así no hay costuras).
  const TEX = { none: 0, soil: 1, rock: 2, sand: 3, concrete: 4, wood: 5, metal: 6 };

  // Los hex son sRGB. La iluminación se hace en LINEAL y la salida se codifica con gamma:
  // sin esta conversión, cada color entraba ya "brillante", el gamma lo levantaba otra vez y todo
  // salía lavado (grises, arena crema, naranjas desteñidos).
  const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  function hexToRgb(hex) {
    const s = String(hex || '#fff').trim().replace('#', '');
    const n = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
    const v = parseInt(n, 16);
    if (!Number.isFinite(v)) return [1, 1, 1];
    return [srgbToLinear(((v >> 16) & 255) / 255), srgbToLinear(((v >> 8) & 255) / 255), srgbToLinear((v & 255) / 255)];
  }
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

  const DEFAULTS = {
    background: ['#101826', '#1d2b45'],
    fog: 0.06,
    fogColor: '#1a2537',
    floor: { color: '#161a22', rough: 0.7, y: 0 },
    light: {
      key: { dir: [-0.5, 0.85, 0.35], color: '#fff2e2', power: 1.3 },
      fill: { color: '#8fb6ff', power: 0.32 },
      rim: { color: '#ffd9a8', power: 0.45 },
    },
    post: { grain: 0.045, vignette: 0.3, exposure: 1, dither: true, seed: 7, sat: 1.15, contrast: 1.04 },
    camera: { pos: [0, 1, 3.4], target: [0, 0.45, 0], fov: 1.55, roll: 0, up: [0, 1, 0] },
    objects: [],
    hole: null,
    screenColor: '#4ea1ff',
  };

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      throw new Error('studio: shader no compila → ' + log);
    }
    return s;
  }

  function create(stage, opts = {}) {
    const canvas = typeof opts.canvas === 'string'
      ? document.getElementById(opts.canvas)
      : opts.canvas || (() => {
        const c = document.createElement('canvas');
        c.id = 'studio';
        stage.root.appendChild(c);
        return c;
      })();
    canvas.width = opts.width || stage.width;
    canvas.height = opts.height || stage.height;
    Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block' });

    const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    if (!gl) throw new Error('studio: este Chrome no expone WebGL2 (¿--disable-gpu?). La pieza necesita el set para no salir plana.');

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('studio: link → ' + gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = {};
    for (const name of ['uRes', 'uT', 'uCamPos', 'uCamTgt', 'uCamUp', 'uFov', 'uRoll', 'uBgTop', 'uBgBot', 'uFogCol',
      'uFloorCol', 'uFog', 'uFloorRough', 'uFloorY', 'uFloorOn', 'uHole', 'uHoleSize', 'uHoleLight', 'uLampPos', 'uLampCol', 'uKeyDir', 'uKeyCol', 'uFillCol', 'uRimCol', 'uKeyPow', 'uFillPow',
      'uRimPow', 'uCount', 'uPos', 'uSize', 'uMat', 'uMat2', 'uScreen', 'uExtra', 'uScreenCol', 'uGrain', 'uVignette',
      'uExposure', 'uSeed', 'uDither', 'uSat', 'uContrast']) U[name] = gl.getUniformLocation(prog, name);

    let state = JSON.parse(JSON.stringify(DEFAULTS));
    let objects = [];
    let warmup = 0;

    function applyScene() {
      const s = state;
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform3fv(U.uBgTop, hexToRgb(s.background[0]));
      gl.uniform3fv(U.uBgBot, hexToRgb(s.background[1]));
      gl.uniform3fv(U.uFogCol, hexToRgb(s.fogColor));
      gl.uniform1f(U.uFog, s.fog);
      gl.uniform3fv(U.uFloorCol, hexToRgb(s.floor.color));
      gl.uniform1f(U.uFloorRough, s.floor.rough);
      gl.uniform1f(U.uFloorY, s.floor.y);
      gl.uniform1f(U.uFloorOn, s.floor.off ? 0 : 1);
      gl.uniform4f(U.uHole, ...(s.hole ? [...(s.hole.pos || [0, 0, 0]), 1] : [0, 0, 0, 0]));
      gl.uniform4f(U.uHoleSize, ...(s.hole ? [...(s.hole.size || [1, 1, 1]), s.hole.radius ?? 0.04] : [1, 1, 1, 0.04]));
      gl.uniform3fv(U.uHoleLight, hexToRgb(s.hole?.light || '#ffd9a0'));
      gl.uniform3fv(U.uLampPos, s.lamp ? s.lamp.pos : [0, -99, 0]);
      const lc = hexToRgb(s.lamp?.color || '#000000');
      const lp = s.lamp?.power ?? 0;
      gl.uniform3f(U.uLampCol, lc[0] * lp, lc[1] * lp, lc[2] * lp);
      gl.uniform3fv(U.uKeyDir, norm(s.light.key.dir));
      gl.uniform3fv(U.uKeyCol, hexToRgb(s.light.key.color));
      gl.uniform3fv(U.uFillCol, hexToRgb(s.light.fill.color));
      gl.uniform3fv(U.uRimCol, hexToRgb(s.light.rim.color));
      gl.uniform1f(U.uKeyPow, s.light.key.power);
      gl.uniform1f(U.uFillPow, s.light.fill.power);
      gl.uniform1f(U.uRimPow, s.light.rim.power);
      gl.uniform3fv(U.uScreenCol, hexToRgb(s.screenColor));
      gl.uniform1f(U.uGrain, s.post.grain);
      gl.uniform1f(U.uVignette, s.post.vignette);
      gl.uniform1f(U.uExposure, s.post.exposure);
      gl.uniform1f(U.uSeed, s.post.seed);
      gl.uniform1f(U.uDither, s.post.dither ? 1 : 0);
      gl.uniform1f(U.uSat, s.post.sat ?? 1.15);
      gl.uniform1f(U.uContrast, s.post.contrast ?? 1.04);
    }

    function applyCamera(c) {
      const cam = Object.assign({}, state.camera, c);
      state.camera = cam;
      gl.uniform3fv(U.uCamPos, cam.pos);
      gl.uniform3fv(U.uCamTgt, cam.target);
      gl.uniform3fv(U.uCamUp, cam.up);
      gl.uniform1f(U.uFov, cam.fov);
      gl.uniform1f(U.uRoll, cam.roll || 0);
    }

    // Los objetos se suben como arrays de uniformes: mover uno o diez cuesta lo mismo.
    function applyObjects() {
      const pos = new Float32Array(MAX_OBJ * 4);
      const size = new Float32Array(MAX_OBJ * 4);
      const mat = new Float32Array(MAX_OBJ * 4);
      const mat2 = new Float32Array(MAX_OBJ * 4);
      const scr = new Float32Array(MAX_OBJ * 4);
      const ext = new Float32Array(MAX_OBJ * 4);
      const list = objects.slice(0, MAX_OBJ);
      list.forEach((o, i) => {
        const k = KINDS[o.kind] ?? 0;
        pos.set([...(o.pos || [0, 0, 0]), o.radius ?? 0.06], i * 4);
        size.set([...(o.size || [0.5, 0.5, 0.5]), k], i * 4);
        mat.set([...hexToRgb(o.color || '#e8e3da'), o.rough ?? 0.45], i * 4);
        mat2.set([o.metal ?? 0, o.glow ?? 0, o.yaw ?? 0, o.pitch ?? 0], i * 4);
        scr.set([o.screen ? 1 : 0, o.screen?.glow ?? 0, o.screen?.w ?? 0.78, o.screen?.h ?? 0.84], i * 4);
        ext.set([TEX[o.tex] ?? 0, o.texScale ?? 6, o.bump ?? 0, o.glow ?? 0], i * 4);
        if (o.screen?.color) { /* el color de pantalla es global (uniform uScreenCol) */ }
      });
      gl.uniform4fv(U.uPos, pos);
      gl.uniform4fv(U.uSize, size);
      gl.uniform4fv(U.uMat, mat);
      gl.uniform4fv(U.uMat2, mat2);
      gl.uniform4fv(U.uScreen, scr);
      gl.uniform4fv(U.uExtra, ext);
      gl.uniform1i(U.uCount, list.length);
    }

    const set = {
      canvas,
      gl,

      // Definir el set (una vez, o de nuevo cuando cambia de escena).
      scene(cfg = {}) {
        state = Object.assign({}, state, cfg);
        if (cfg.light) state.light = Object.assign({}, DEFAULTS.light, cfg.light);
        if (cfg.floor) state.floor = Object.assign({}, DEFAULTS.floor, cfg.floor);
        // El hueco NO se hereda: un bloque sin cavidad tiene que limpiar la del bloque anterior.
        state.hole = cfg.hole || null;
        state.lamp = cfg.lamp || null;
        if (cfg.post) state.post = Object.assign({}, DEFAULTS.post, cfg.post);
        if (cfg.camera) state.camera = Object.assign({}, state.camera, cfg.camera);
        if (cfg.objects) objects = cfg.objects.map((o) => ({ ...o }));
        applyScene();
        applyCamera({});
        applyObjects();
        return set;
      },

      camera(c) { applyCamera(c); return set; },

      // Mover/ajustar un objeto por índice, por fotograma: set.object(1, { pos: [...] }).
      object(i, patch) {
        const cur = objects[i];
        if (!cur) throw new Error(`studio: no existe el objeto ${i} (hay ${objects.length})`);
        const next = { ...cur, ...patch };
        if (patch.screen) next.screen = { ...cur.screen, ...patch.screen };
        objects[i] = next;
        applyObjects();
        return set;
      },

      // Color de pantalla emisiva (lo que "prende" el objeto).
      screenColor(hex) { state.screenColor = hex; gl.uniform3fv(U.uScreenCol, hexToRgb(hex)); return set; },

      draw(t = 0) {
        gl.uniform1f(U.uT, t);
        gl.uniform1f(U.uSeed, (state.post.seed ?? 7) + Math.floor(t * 30) * 0.0); // semilla fija: el grano cambia por uT
        gl.viewport(0, 0, canvas.width, canvas.height);
        // Doble submit por fotograma: el compositor puede capturar el último cuadro *presentado*, que
        // en un contexto recién creado es el anterior (o ninguno). Dibujar la misma t dos veces hace
        // que cualquier cuadro que se capture sea el correcto; las dos primeras pasadas extra son el
        // calentamiento del driver (compila y cachea el programa).
        const passes = warmup < 2 ? 3 : 2;
        for (let k = 0; k < passes; k++) { gl.drawArrays(gl.TRIANGLES, 0, 3); gl.finish(); }
        warmup++;
        return set;
      },
    };
    return set;
  }

  window.Studio = { create, KINDS, TEX, hexToRgb };
})();
