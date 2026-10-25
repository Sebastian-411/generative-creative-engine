---
name: sound-design
description: Diseño sonoro para los videos del motor - elegir voz, estilo de música procedural (paper, pulse, ambient, hype, lofi), bpm y secciones de energía, silencios (drops) antes del remate, efectos sintetizados en los momentos de contacto, niveles, ducking bajo la voz y loudness final (-14 LUFS, ≤ -1 dBTP). Úsala al declarar el audio de una pieza (music y stage.sfx en index.html), cuando el usuario trae su propia pista, o cuando la mezcla mide mal. Recuerda que no puedes escuchar: todo se decide con reglas y se verifica con números.
---

# Diseño sonoro

No escuchas el audio. Por eso el sonido se diseña con reglas, se **mide** (`mix.mjs` reporta LUFS y pico real) y en la entrega dices que está medido, no oído.

## Voz

La voz se dirige con la skill `voice-director` (motor expresivo, emoción por línea, acento por clip de referencia). Aquí solo importa la mezcla: la voz manda, la música se agacha (ducking) y ningún efecto fuerte cae sobre una palabra clave.

## Música procedural

Se declara en `Stage.create({ bpm, music: {...} })` y la compone `mix.mjs` a la duración exacta de la pieza.

| Estilo | Carácter | bpm por defecto | Usar para |
|---|---|---|---|
| `paper` | marimba, bajo pizzicato, palmas suaves (mayor) | 112 | papel recortado, explicadores amables, educativo |
| `pulse` | bajo en corcheas, pad, arpegio (menor) | 118 | tecnología, producto, explicador serio |
| `ambient` | pads y campanas, sin batería | 80 | datos, historia, reflexivo |
| `hype` | four-on-the-floor, palmas, acordes saw (menor) | 124 | lanzamientos, promos, teasers |
| `lofi` | teclado eléctrico con swing, batería suave | 84 | lifestyle, relajado |
| `dread` | zumbido grave disonante, latido que se acelera, campanas lejanas en trítono; sin melodía | 60 | terror, suspenso, true crime |

**Música con IA local (ACE-Step 1.5, MIT, salida de uso comercial)**: `music: { ai: 'ace', prompt: 'dark cinematic horror score, low droning strings, eerie music box, no drums', bpm: 60, key: 'D minor', seed: 7, db: -15 }`. Instrumental, a la duración exacta de la pieza, cacheada por parámetros. Suena a producción real (cuerdas, piano, texturas), muy por encima de la procedural; tarda 2–5 min en una GPU de 6 GB. Prompt en inglés, con género + instrumentos + energía + "no drums"/"no vocals" según el caso; nunca nombres de artistas ni canciones. Instalación: clonar `ace-step/ACE-Step-1.5`, `uv sync`, y `node <engine>/voices.mjs config --acestep-dir <ruta>`. Úsala para piezas finales; la procedural sirve para borradores rápidos.

Opciones de `music`:
- `key`: tónica (`'C'`, `'A'`, `'F#'`…).
- `energy: [[t, nivel], …]`: niveles 0–3 (0 = solo pad, 1 = + bajo/melodía, 2 = + batería ligera, 3 = todo). Por defecto sube 1 → 2 → 3 a lo largo de la pieza. Baja la energía donde la voz explica algo denso.
- `drops: [{ at, dur }]`: silencio total (con cola de reverb) y **golpe** al terminar. Úsalo una vez, antes del remate: 0.3–0.75 s con voz, 1 tiempo en promos.
- `hits: [t, …]`: golpes sueltos (sin silencio previo).
- `end`: cuándo cierra la música con el acorde final (por defecto, duración − 1.6 s).
- `db`: dB **relativos a la voz** (la mezcla mide e iguala cada pista antes de mezclar): −12 por defecto con voz (cama clara pero detrás), −8/−10 para piezas atmosféricas (terror, épico), −15 para explicadores densos; sin voz, 0. `duck`: cuánto más baja mientras alguien habla (6 dB por defecto). `fallback`: estilo procedural si la música con IA falla.
- `file: 'assets/pista.mp3'`: usa una pista del usuario en lugar de componer. Mide su bpm (o pregúntalo) y corta a sus compases.

## Efectos

Dos fuentes, ambas sin atribución ni riesgo de licencia:

1. **Sintetizados** (por nombre): `whoosh`, `swish`, `pop`, `click`, `tick`, `tap`, `thud`, `impact`, `riser`, `ding`, `chime`, `paper`, `slide`, `snap`, `key`, `bubble`, `sparkle`, `glitch`, `boom`, `creak`, `heartbeat`, `breath`, `stinger`.
2. **Biblioteca real CC0** (prefijo `@`): grabaciones verificadas (Kenney: impactos de madera/metal/vidrio, puertas, interfaz, monedas, sci-fi, RPG, jingles; 600+). `stage.sfx('@impact wood heavy', t, -12)` busca la mejor coincidencia (acepta español: "@golpe madera pesado", "@puerta"); `stage.sfx('@kenney/impact-sounds/impactWood_heavy_000', t)` usa uno exacto. Cada cue con la misma búsqueda toma una variante distinta para que no suene clonado.
   - Buscar: `node <engine>/sfx-library.mjs search "door"`.
   - Instalar/actualizar: `node <engine>/sfx-library.mjs fetch && node <engine>/sfx-library.mjs index` (configurable con `config --dir`).

**Ambientes** (loops reales debajo de un tramo, en estéreo, con crossfade y ducking leve bajo la voz):
`Stage.create({ ambience: [{ sfx: '@rain forest loop', from: 0, to: 12, db: -22, fadeIn: 1, fadeOut: 1.5, duck: 4 }] })`.
Hay noche de bosque, lluvia (cabaña, bosque, ciudad), viento en árboles, tono de cuarto (casa, máquinas), playa, ciudad, agua (Oculus Audio Pack, CC BY: los créditos se escriben solos en `audio/credits.txt`). Un ambiente a −20/−26 dB es lo que más "pone" a la escena en un lugar real.

Prefiere grabaciones reales para contactos físicos (golpes, puertas, pasos, objetos) y síntesis para lo abstracto (whoosh, riser, glitch, interfaz).

## Licencias y trazabilidad

`mix.mjs` escribe `audio/assets.json`: cada voz, música y efecto que suena, con su fuente, licencia, sha256 y si es **publicable**. Reglas:
- Publicable: CC0, generado por el motor, voces edge, voces clonadas con consentimiento escrito.
- No publicable (el reporte lo marca ⚠): licencia desconocida, CC-BY-NC/ND, voces clonadas sin consentimiento o marcadas "solo demo".
- Música del usuario: declara `music: { file, license: 'CC0-1.0', source: 'url' }`; sin licencia queda como no publicable.
- Nunca: Freesound sin filtrar CC0, MusicGen/AudioCraft (pesos no comerciales), canales "no copyright music" sin licencia escrita, Sonniss para entrenar modelos.

`stage.sfx(nombre, t, db)` en el **fotograma de contacto** (cuando el objeto llega, no cuando empieza a moverse). También acepta la ruta a un `.wav` propio (queda como licencia desconocida salvo que la declares).

| Tipo | Nivel |
|---|---|
| Transiciones (whoosh, swish) | −14 a −18 dB |
| Contactos (pop, tap, snap, paper) | −10 a −14 dB |
| Golpe del remate (impact, boom) | −8 a −10 dB |
| Acentos (ding, chime, sparkle) | −9 a −14 dB |

- Un efecto por evento que lo merece; no sonorices todo. Un short de 30 s lleva 5–12.
- El `riser` termina exactamente en el golpe: ponlo en `t_golpe − 2`.
- Con voz: ningún efecto fuerte encima de una palabra clave; ponlos en las pausas.

## Mezcla (la hace `mix.mjs`)

- Normalización en dos pasadas a **−14 LUFS integrados**, pico real ≤ −1.5 dBTP.
- Ducking de la música bajo la voz: ataque 0.25 s antes de cada línea, suelta 0.6 s después.
- Si el reporte da más de 1 LU de diferencia con el objetivo o el pico pasa de −1 dBTP, algo está mal: un efecto muy alto o una pista del usuario saturada.

## Entrega

Di siempre: "el audio está medido (−14 LUFS, pico −1.5 dBTP), no escuchado; revisa el balance de la música con audífonos".
