---
name: sound-design
description: Diseño sonoro para los videos del motor - elegir voz, estilo de música procedural (paper, pulse, ambient, hype, lofi), bpm y secciones de energía, silencios (drops) antes del remate, efectos sintetizados en los momentos de contacto, niveles, recorte por bandas (carve) y ducking bajo la voz, efectos con el pico alineado y loudness final parametrizado por plataforma (social -14 LUFS/pico -2 dBTP · YouTube -16 ±0.5 LUFS/pico ≤ -1 dBTP). Úsala al declarar el audio de una pieza (music y stage.sfx en index.html), cuando el usuario trae su propia pista, o cuando la mezcla mide mal. Recuerda que no puedes escuchar: todo se decide con reglas y se verifica con números.
---

# Diseño sonoro

> Esencia común: lee el **Contrato creativo** de `brief.md` (`creative-contract`). El sonido del gancho suena en el fotograma 0, hay silencio antes del payoff y el payoff lleva el golpe más fuerte.

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

**Música con IA local (ACE-Step 1.5, MIT, salida de uso comercial)**: `music: { ai: 'ace', prompt: 'dark cinematic horror score, low droning strings, eerie music box, no drums', bpm: 60, key: 'D minor', seed: 7, db: -15 }`. Instrumental, a la duración exacta de la pieza, cacheada por parámetros. Suena a producción real (cuerdas, piano, texturas), muy por encima de la procedural; tarda 2–5 min en una GPU de 6 GB. Prompt en inglés, con género + instrumentos + energía + "no drums"/"no vocals" según el caso; nunca nombres de artistas ni canciones. Instalación: clonar `ace-step/ACE-Step-1.5`, `uv sync`, y `node <engine>/voices.mjs config --acestep-dir <ruta>`. Úsala para piezas finales; la procedural sirve para borradores rápidos. Pide **por sensación y tempo, no por tema** ("tense minimal pulse building to a bright drop, 120 bpm"). La tabla tema → prompt + bpm + tonalidad está en `references/ace-prompts.md`.

**La línea de sonido** va al Contrato creativo de `brief.md`, en una sola línea: sensación y tempo de la música · **el único momento en que la música cambia** · qué acciones llevan efecto · dónde hay silencio y por qué. Ej.: "cumbia acústica cálida a 96 · se corta medio segundo antes del payoff y vuelve con golpe · efectos solo en el plato que aterriza, el QR y el precio".

**Que el sonido actúe la historia**: la forma vieja casi en silencio; la música se abre cuando aparece el producto; el golpe se guarda para el remate. Entra en el compás más fuerte de la pista (no en una intro floja) y cierra en barra bajo la tarjeta final. Un silencio deliberado se queda en silencio. La apertura no asusta: los primeros 2 s no suenan más fuerte que el resto. Con el sonido apagado (así arranca el feed) la pieza la cargan la tipografía y los subtítulos.

**Marcar con armonía, no con volumen** (iart soundtrack, MIT): la emoción se marca cambiando acordes y capas, no subiendo faders. Un cambio de acorde con **+3–5 dB** se siente limpio; **+7–10 dB** ya es jump-scare; y capas que entran todas juntas suman ~+11 dB de golpe — por eso entran **≤ 1–2 capas por compás**. El **break** (silencio seco) cae **un compás antes del payoff** y cada corte de sección aterriza en un **downbeat** (verificable con `stage.bar/beat`); el `drops` de las opciones de abajo es la forma fuerte de ese break. Y al escribir la música: **sin notas de pad por debajo de MIDI 48** (≈ C3) — el low-end del pad ensucia la banda grave que la voz necesita (lemo-opuscar, MIT).

Opciones de `music`:
- `key`: tónica (`'C'`, `'A'`, `'F#'`…).
- `energy: [[t, nivel], …]`: niveles 0–3 (0 = solo pad, 1 = + bajo/melodía, 2 = + batería ligera, 3 = todo). Por defecto sube 1 → 2 → 3 a lo largo de la pieza. Baja la energía donde la voz explica algo denso.
- `drops: [{ at, dur }]`: silencio total (con cola de reverb) y **golpe** al terminar. Úsalo una vez, antes del remate: 0.3–0.75 s con voz, 1 tiempo en promos.
- `hits: [t, …]`: golpes sueltos (sin silencio previo).
- `end`: cuándo cierra la música con el acorde final (por defecto, duración − 1.6 s). Por **backtiming**: fíjalo hacia atrás desde el endcard para que el acorde aterrice exactamente en la tarjeta final (motion-video-kit, MIT).
- `db`: dB **relativos a la voz** (la mezcla mide e iguala cada pista antes de mezclar): −12 por defecto con voz (cama clara pero detrás), −8/−10 para piezas atmosféricas (terror, épico), −15 para explicadores densos; sin voz, 0. `fallback`: estilo procedural si la música con IA falla.
- `carve`: **recorte por bandas bajo la voz** (por defecto `true` = fuerza 0.25 cuando hay voz). La música cede solo las 3 bandas que más ocupa la voz (elegidas midiendo la voz, con más peso en 1–3 kHz) y conserva graves y agudos. El recorte sigue la envolvente real del habla (ataque 15 ms, suelta 300 ms): en las pausas la música queda intacta. Fuerza 0.25 → −6/−3/−3 dB; 0.5 → −10/−5/−5 (ya se oye «ahuecado»; no pases de ahí). `carve: 0` lo apaga.
- `duck`: duck de nivel mientras alguien habla (6 dB por defecto; con carve se aplica al 60 %: 6 → 3.6, 5 → 3). Ataque 0.25 s, suelta 0.6 s. Las pausas de menos de 0.6 s entre líneas se funden en un solo tramo para que la música no bombee entre frases. Si aun así bombea, baja la fuerza del carve.
- `file: 'assets/pista.mp3'`: usa una pista del usuario en lugar de componer. Si es **más corta** que la pieza, se repite con crossfade de 1 compás (1 s sin bpm); si es más larga, no se corta seco. Con `bpm` declarado, la música de archivo o de ACE **cierra con un fundido de 1 compás que termina en línea de compás** (`floor((duración − 0.3) / compás) · compás`); sin bpm, fundido de 2 s al final. `end: t` fuerza el punto de cierre. Declara el bpm de la pista: sin él no hay cierre en barra.

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

## Efectos en la pieza: cuándo, dónde y cuánto

`stage.sfx(nombre, t, db)` con `t` = el **fotograma del evento visible** (cuando el objeto llega, no cuando empieza a moverse). También acepta la ruta a un `.wav` propio (queda como licencia desconocida salvo que la declares).

**Pico alineado (lo hace `mix.mjs`)**: la mayoría de los archivos tienen el golpe después de su inicio. Un whoosh de 0.6 s pica a 0.3 s: puesto por su inicio, caería 9 fotogramas tarde. El motor mide el pico de cada efecto (envolvente RMS de 5 ms) y lo coloca **1 fotograma después de `t`**, porque la luz llega antes que el sonido y un sonido adelantado se siente peor que uno atrasado. Excepción: los sonidos de subida (pico a más de 0.6 s del inicio: `riser`, `creak`, `breath`) se anclan por su **inicio**, y `mix.md` dice dónde cae su pico. El `riser` sintetizado pica a 1.98 s: ponlo en `t_golpe − 2` y verifícalo en el reporte.

**Nivel relativo, no del archivo crudo**: cada efecto se normaliza por su golpe (sonoridad K-weighted máxima en 100 ms) a las sílabas fuertes de la voz de la pieza (P95 en ventanas de 100 ms; sin voz, −13 LUFS). Así `db` significa lo mismo en un `click` que en un `boom`: **dB respecto a la voz** (0 = tan fuerte como la voz). Antes de aplicar `db`, ningún efecto supera −1 dBFS de pico. `mix.md` compara cada golpe con la música en ese instante: lo cómodo es **3–6 dB sobre la música**. Avisa si queda por debajo o a más de +14 dB.

**Tomas rotadas**: los sintetizados repetidos alternan 3 tomas (original, +3 % de tono y más brillo, −3 % y más oscuro). El mismo whoosh en cada corte es la delación más común de una plantilla. Los `@` de la biblioteca ya rotan variantes reales.

| Efecto | Única causa visible que lo justifica | Nivel |
|---|---|---|
| `click` | un clic real de cursor | −14 a −18 dB |
| `whoosh`, `swish` | corte de escena o una tarjeta grande que se mueve rápido | −14 a −18 dB |
| `key`, `tick` | texto que llega letra a letra | −16 a −20 dB |
| `pop`, `tap`, `snap`, `paper` | insignia, chip o número que aterriza | −10 a −14 dB |
| `ding`, `chime`, `sparkle` | acento de logro o de marca | −9 a −14 dB |
| `riser` → golpe | **una vez en toda la pieza**, hacia el remate o la marca | −14 a −20 dB |
| `impact`, `boom` | golpe del remate | −8 a −10 dB |

- **Pocos y exactos**: cada efecto tiene una causa en pantalla. Un short de 30 s lleva 5–12; demasiados suenan a plantilla. Si dos cosas hacen lo mismo, se queda la más clara. Con música fuerte, quita clics y teclas antes de subir niveles.
- **Un solo riser por pieza** (el reporte avisa si hay más).
- Con voz: ningún efecto fuerte encima de una palabra clave; ponlos en las pausas.

## Mezcla (la hace `mix.mjs`)

Orden de la señal: igualar (voz a −18 LUFS, música relativa a ella) → duck de nivel → **carve** → efectos y ambientes → loudnorm (el techo siempre al final).

- Normalización en dos pasadas al objetivo de la **plataforma**, medido sobre el **archivo estéreo final** (el MP4 entregado, no las fuentes): **social −14 LUFS** integrados con pico real objetivo **−2 dBTP** · **YouTube −16 ±0.5 LUFS con pico ≤ −1.0 dBTP** — fuera de esos números se rechaza la publicación (lanshu, MIT; el perfil lo aplica `engine/verify.mjs --profile social|youtube`). En social se dejan 2 dB de margen porque el limitador deja pasar picos entre muestras y el AAC los aumenta. Si `loudnorm` no puede trabajar en modo lineal (cae en silencio a modo dinámico), el motor limita antes a −3 dBFS y repite; el reporte lo dice.
- **Voz sobre música por línea** (tabla en `audio/mix.md`): una pista de ACE puede subir justo en el clímax y los LUFS integrados no lo ven. Lo cómodo es ≥ +10 dB en cada línea; con < +8 el reporte avisa ⚠ con el id de la línea. Un carve no arregla una música que simplemente está más fuerte que la voz: esa brecha es aritmética, y se arregla bajando `music.db`.
- **Prueba del parlante de celular**: si más del 50 % de la energía de la música está bajo 150 Hz, en un teléfono suena a nada y el reporte avisa. Pide en el prompt más medios ("bright", "plucked", "piano", "marimba") o sube la voz.
- **Low-end plano**: la banda 20–120 Hz del master queda dentro de **±3 dB** (medición por bandas del archivo final; lemo-opuscar, MIT): un bajo que sobresale se come la voz en el parlante del celular y triggerea el limitador.
- Si el reporte da más de 1 LU de diferencia con el objetivo o el pico pasa de −1 dBTP, algo está mal: un efecto muy alto o una pista del usuario saturada.
- El pico medido sobre `mix.wav` y el del AAC del mp4 difieren (~0.5 dB): por eso el objetivo final se verifica sobre el MP4 entregado (arriba), no sobre la mezcla fuente.

## Lo que no tiene respuesta honesta (dilo en la entrega)

- **Ruido bajo la voz**: una compuerta cierra las pausas, pero el siseo debajo de las palabras no se quita. `afftdn`/`arnndn` sirven para limpiar clips de referencia de casting, no para TTS.
- **Igualar una voz con otra**: no hay curva automática; es EQ a mano y a oído.
- **Envolventes sobre compresor, limitador o pitch** no hacen nada: lo que se automatiza es la ganancia antes de esa etapa.
- **No escuchas**: el balance se mide (LUFS, pico, voz sobre música por línea, golpe sobre la música). El gusto lo decide un humano con audífonos y con el parlante de un celular.

## Entrega

Di siempre: "el audio está medido (perfil de plataforma: social −14 LUFS/pico ≤ −2 dBTP · YouTube −16 ±0.5 LUFS/pico ≤ −1 dBTP; voz sobre música mínima +X dB en la línea Y), no escuchado; revísalo una vez con audífonos y otra en el parlante del celular".

Fuentes: EBU R128 / ITU-R BS.1770 (K-weighting), Audio EQ Cookbook (RBJ), Regalia-Mitra (peaking paralelo) · parte destilada de HyperFrames (Apache-2.0) · lanshu, iart, lemo-opuscar y motion-video-kit (MIT)


---

## Números duros añadidos 2026-10-27 (destilación cross-repo: master-skills/edit, lemo-opuscar, video-shotcraft)

- Master social: **-14 LUFS** con una sola ganancia fija (sin compresor ni AGC en la voz); limitador con pico ≈ **-1.5 dBTP** (`alimiter=limit=0.841:attack=5:release=50:level=false` con `aresample=192000` antes). El loudness final se verifica midiendo **ebur128 sobre el audio del MP4 ya renderizado**, no solo sobre mix.wav. Si hay corrimiento sistemático respecto a los cues, se corrige con una constante única de offset, jamás cue por cue.
- Música **≈15 dB bajo la voz** a nivel fijo; fade ~1 s antes del final. Verificación por línea: mínimo +10 dB de voz sobre música (aviso < +8).
- Coreografía de silencios: **≥2 silencios reales antes del giro y del payoff**; el primer sonido tras cada silencio es uno de los momentos más importantes de la mezcla; para que se oiga, el silencio exige stop seco (sends y sostenidos cerrados en el último beat previo).
- Payoff audio: pausa 0.5–4 s → chord stab ~0.4 s + sub en el golpe → calma después (nada compitiendo encima). En piezas con voz, el payoff cae en la pausa de la voz.
- SFX: se colocan **por su pico**, no por su inicio (whoosh en su pico de paso, riser en su hit); cada SFX se recorta a la duración exacta de la acción que acompaña; bajo voz, máximo 1 SFX por cada 3 s; alternar tomas para que no suene mecánico.
- Regla del parlante de celular: si >50% de la energía de la música está bajo 150 Hz, no se oye en un celular — pide más medios en el arreglo o sube la voz.

