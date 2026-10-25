---
name: voice-director
description: Dirección de voz para la narración de los videos - convierte un pedido como "historia de terror narrada por un caleño, misteriosa" o "háblame emocionado, paisa" en un guion dirigido (emoción, intensidad y ritmo por línea), elige la voz de la biblioteca con el acento correcto, sintetiza varias tomas con un motor expresivo gratuito (Chatterbox local, Gemini en la nube) y se queda con la toma que mejor dice el guion. Úsala siempre que un video lleve voz, cuando el usuario pida un tono, emoción, personaje o acento regional (caleño, paisa, rolo, costeño, venezolano, mexicano, argentino…), o cuando diga que la voz suena plana o robótica. También para crear voces nuevas (casting) a partir de grabaciones.
---

# Director de voz

> Esencia común: lee el **Contrato creativo** de `brief.md` (`creative-contract`). El arco emocional de la voz sigue el del contrato: el gancho con la emoción que promete, el payoff como el momento más claro.

Una voz sintética suena plana por tres razones, y hay que atacar las tres: **el motor** (edge-tts no actúa), **la dirección** (sin emoción por línea todo sale igual) y **el guion** (texto escrito para leer, no para decir). Este skill resuelve las tres sin costo.

## Motor por defecto: Qwen3-TTS (Apache 2.0) actuando de corrido

Ganó en la comparación de oído contra Chatterbox, edge y VoxCPM2. Dos claves:
1. **Voz diseñada por descripción** (VoiceDesign 1.7B): edad, género, acento, timbre y tipo de pieza en inglés.
2. **La narración se actúa entera, de corrido**, no frase por frase: así hay continuidad, respiración y arco emocional. `voice.mjs` genera 2–3 tomas completas por bloque de hablante, Whisper elige la más fiel y corta cada línea por la alineación de palabras (la animación sigue anclada a `stage.word`).

```json
{ "engine": "qwen", "takes": 3, "direction": "terror psicológico contado en voz baja",
  "cast": { "narrador": { "description": "A natural, expressive Latin American Spanish narrator. A mature male voice with a subtle Colombian accent, warm timbre and realistic human phrasing. This is a psychological horror story, not a news report or a commercial voiceover." },
            "abuela": { "description": "An elderly Colombian grandmother, soft and slightly raspy, tender, almost a whisper." } },
  "lines": [ { "id": "solo", "text": "Yo pensé que estaba solo.", "emotion": "confidencial" }, … ] }
```
- **Dónde corre**: primero el Space gratis de Hugging Face; si no hay cuota, tu GPU NVIDIA en **bf16** (en GTX 16xx/Turing va emulado: ~4× más rápido que la CPU, ~4.7 GB de VRAM; **fp16 da NaN**, no lo uses), y la CPU float32 solo si no hay GPU. El venv de Qwen debe tener torch con CUDA (`python -c "import torch;print(torch.cuda.is_available())"` → True).
- **Ritmo**: Qwen actuado con `pace: "lento"`/`"pausado"` en muchas líneas cae a ~1.8 palabras/s (una pieza de 60 s sale de 90). Úsalo en 1–2 líneas como mucho y mide el total antes de animar.
- **`tempo`** (en `script.json`, 0.8–1.35): acelera o frena toda la narración sin cambiar el tono (atempo) y reescala los tiempos por palabra; no regenera la voz (usa la caché). 1.10–1.20 sigue sonando natural; úsalo cuando Qwen sale lento antes de recortar texto.
- **Cifras grandes**: dilas de forma que no se puedan confundir ni transcribir mal ("tres millones de millones"); la palabra ambigua ("billones") va en pantalla, con su aclaración.
- `emotion` por línea se convierte en un arco escrito ("sentence by sentence: 1) …; 2) …") dentro de la descripción.
- Puntuación = actuación: `…` crea suspenso, saltos de línea separan respiraciones.
- **Dónde corre**: la GPU gratuita del Space oficial de Hugging Face (~36 s por toma). Sin cuota o sin internet cae solo a esta máquina (CPU: ~10× la duración del audio). Con una cuenta gratis de HF hay más cuota: `node <engine>/voices.mjs config --hf-token hf_…`.
- No clona voces de la biblioteca (diseña la voz por texto). Para un acento exacto de una persona real, usa Chatterbox con su clip.

## Motores (todos gratis)

| Motor | Qué da | Acento regional | Cuándo |
|---|---|---|---|
| `qwen` (defecto, Apache 2.0) | La más natural y expresiva: voz diseñada por descripción, actuada de corrido | Por descripción ("subtle Colombian accent"); no exacto por ciudad | Siempre, salvo que necesites clonar a una persona concreta |
| `chatterbox` (local, MIT) | Clonado de una voz concreta: intensidad (`exaggeration`), ritmo dramático (`cfg_weight`), clona timbre **y acento** de un clip de 10–15 s | **Sí, el del clip de referencia** | Por defecto si está instalado (`setup-voice.mjs`). Corre en GPU NVIDIA ≥ 6 GB o CPU |
| `gemini` (nube, nivel gratis) | La dirección más fina por lenguaje natural ("susurra con miedo, se le quiebra la voz") y etiquetas `<sigh>`, `<whispers>`, `<long pause>` | Poco fiable por texto; Google recomienda no pedir acento en el estilo | Cuando no hay voz con acento grabada y la emoción importa más que el acento. Requiere llave gratis; límite diario; Google puede usar el contenido del nivel gratis |
| `edge` | Voces neurales planas (`es-CO-GonzaloNeural`…) con timing perfecto | Colombiano/venezolano genérico | Respaldo, borradores |
| Kokoro-82M (Apache-2.0, vía `npx hyperframes tts`) | Borrador **sin internet**, rápido en CPU. Voz española `ef_dora` (`--lang es`) | Probablemente peninsular; no sirve para acento colombiano | Solo para medir tiempos o maquetar sin conexión, cuando edge no responde y Qwen en CPU tardaría 10× la duración. Nunca como voz final |

Kokoro como borrador: `npx hyperframes tts guion.txt --voice ef_dora --lang es -o audio/borrador.wav`. No da marcas por palabra: transcribe con `language=es` explícito (como hace `voice.mjs`) antes de anclar animación. Al tener la voz final, vuelve a generar con Qwen y recalcula los tiempos.

**Efectos por búsqueda (complemento de Kenney/Oculus)**: Openverse (openverse.org) busca audio con licencia libre, mayormente de Freesound. Filtra `license=cc0,by`, vuelve a verificar la licencia de cada resultado, prefiere clips ≤ 4 s y CC0 sobre CC-BY, y nombra el efecto en concreto ("glass shatter", no "dramatic sound"). Sin cuenta: 20 búsquedas/min y 200/día. Lo CC-BY va con crédito en `audio/credits.txt`. No copies a la biblioteca los archivos de Pixabay que trae HyperFrames: su licencia restringe la redistribución suelta.

**Verdad incómoda sobre los acentos**: ningún modelo gratis distingue paisa de caleño por instrucción de texto. El acento sale del **clip de referencia** de una persona real de esa región. Por eso existe la biblioteca de voces.

## Biblioteca de voces (casting)

```
node <engine>/voices.mjs list
node <engine>/voices.mjs kit                                  # guion de grabación (5 emociones × 10–15 s)
node <engine>/voices.mjs add caleno-grave --ref grabacion.m4a --emotion misterio \
     --accent "caleño (Cali)" --persona "hombre de 45, voz grave y pausada" \
     --consent "Grabada por Carlos R. el 2026-10-24; autoriza clonado y uso comercial"
```

- Cada voz guarda un clip por emoción (`neutral`, `emocionado`, `misterio`, `triste`, `cálido`…). Al dirigir una línea "terror", el motor usa el clip `misterio` si existe: **la emoción del clip se hereda**, así que un clip grabado con miedo da tomas con miedo.
- **Consentimiento obligatorio**: solo voces propias o de personas que autorizaron por escrito el clonado (en Colombia la voz es dato biométrico sensible, Ley 1581/2012). Nunca clones a alguien sin permiso ni imites a una persona real identificable. Los datasets abiertos (OpenSLR 72/75) sirven para pruebas internas, no como voces de producción.
- Clips limpios: una sola persona, sin música ni eco, celular a un palmo de la boca, hablando natural con su acento y sus expresiones.

## script.json dirigido

```json
{
  "direction": "historia de terror: arranca íntimo y curioso, crece la incomodidad, la última frase da escalofrío",
  "voice": "@caleno-grave",
  "engine": "chatterbox",
  "takes": 3,
  "lines": [
    { "id": "hook",   "text": "Mirá, esto me lo contó mi abuela, y yo no le creí.", "emotion": "confidencial", "intensity": 0.4 },
    { "id": "casa",   "text": "Esa noche la casa estaba demasiado callada.",        "emotion": "misterio", "intensity": 0.6, "pace": "lento" },
    { "id": "nombre", "text": "Y desde el fondo del pasillo… alguien dijo mi nombre.", "emotion": "terror", "intensity": 0.9, "pace": "lento", "pause": 0.9 }
  ]
}
```

- `emotion`: neutral, cálido, emocionado, alegre, misterio, terror, suspenso, triste, nostalgia, urgente, épico, confidencial, ironía, rabia, ternura (acepta sinónimos: miedo, entusiasta, secreto…).
- `emotion_arc` (global): lista de emociones en orden, p. ej. `["confidencial", "misterio", "terror"]`; reparte la emoción por tramos a las líneas sin `emotion` y sube la intensidad de 0.35 a 0.9 hacia el final. Lo que declares por línea manda.
- `intensity` 0–1: escala la actuación. Construye **arcos**: no pongas todo en 0.9; sube hacia el clímax y baja después.
- `pace`: muy lento, lento, pausado, normal, rápido, muy rápido.
- `cast` + `speaker` para varios personajes: `"cast": { "narrador": { "voice": "@caleno-grave" }, "abuela": { "voice": "@paisa-mayor" } }`.
- `takes`: tomas por línea (3 por defecto). `take: n` fuerza una toma después de escucharlas.
- `direction` (global) y `direction` por línea: texto libre que Gemini usa literal; en Chatterbox lo que manda es `emotion` + `intensity` + el clip.
- `say`: lo que se pronuncia si difiere de lo mostrado ("2.000" → "dos mil").
- `wps` (por línea): velocidad objetivo en palabras/s si quieres fijarla; por defecto 2.85 × el ritmo de la emoción (terror ≈ 2.5, emocionado ≈ 3.0). Los clones heredan la velocidad del clip de referencia; `voice.mjs` mide cada toma y la corrige con atempo (máx. −20 % / +10 %).
- `room` (global): sala de la mezcla de locución: `seco`, `estudio` (defecto), `sala`, `iglesia`. `"master": false` la desactiva.

## Por qué suena sintético y qué hace el motor

1. **Ritmo**: un clon apurado (> 3.4 palabras/s) suena a máquina → corrección de velocidad por toma y preferencia por la toma de ritmo más natural.
2. **Silencio digital y cero respiraciones** → tono de sala a −60 dBFS y respiraciones suaves antes de las frases que vienen tras una pausa.
3. **Voz "seca"** → cadena de locución: highpass, calidez a 180 Hz, menos barro a 380 Hz, presencia a 3.2 kHz, de-esser, compresor 3:1 y una sala corta (ver «Cadena de voz»).
4. **La referencia manda**: si el clip es alguien leyendo plano, el clon lee plano. La mejora más grande y gratis es grabar clips **actuados**, conversacionales, con la emoción de cada uno (`voices.mjs kit`).

## Cadena de voz y nivel parejo

**Orden: restar antes de sumar.** Primero el rumble y el barro (una voz apagada casi siempre tiene demasiado medio-grave, no muy poco agudo), luego el nivel, luego las relaciones (el carve de la música, cuando la voz ya está resuelta), luego el carácter (sala) y al final el techo. `voice.mjs` respeta ese orden.

| Paso | Referencia | Nuestro valor |
|---|---|---|
| Rumble | highpass 80–120 Hz | 75 Hz |
| Retumbe | 200 Hz −4 dB Q1.4 | +1.5 dB a 180 Hz (calidez) |
| Barro | 250 Hz −3 dB Q1.2 | −2 dB a 380 Hz |
| Caja | 400 Hz −3 dB Q1.4 | — |
| Claridad | 3 kHz +2.5 dB Q1 | +2 dB a 3.2 kHz |
| Aspereza (si cansa) | 3.2 kHz −3 dB Q1.6 | — |
| Sibilancia | corte estrecho en 5–9 kHz | `deesser` (mejor) |

- **Ojo con los 3.2 kHz**: las voces de Qwen ya vienen brillantes. Nuestro +2 dB cae en la misma zona que HF recorta cuando una voz cansa. Si el usuario dice "suena chillona" o "cansa", ese realce es lo primero que se quita.
- **Nivel parejo entre líneas**: cortamos líneas de tomas distintas, así que la deriva de nivel entre bloques es real. La regla es llevar cada línea hacia **el percentil 80 de la propia pista** (LUFS de corto plazo por línea → ganancia por línea con tope de ±4 dB y fundidos de 30 ms), de modo que una pista pareja queda intacta. Es mejor que `dynaudnorm`, que bombea dentro de la palabra. Mientras `voice.mjs` no lo haga, revisa la tabla «voz sobre música por línea» de `audio/mix.md`: una línea 4 dB por debajo de sus vecinas es deriva de la toma, no de la música.
- **Ritmo**: 2.85 palabras/s (≈ 171 ppm) en español es coherente con los 145–155 ppm de un narrador en inglés, porque las palabras son más cortas.

## Transcripción → subtítulos

- **Idioma explícito siempre** (`language=es`): los modelos `.en` traducen en silencio.
- **Control de calidad**: si más del 20 % de los tokens son `♪`/`�` o hay palabras sin sentido, repite con el modelo mayor. Limpia rellenos (eh, em, ah) de menos de 0.1 s. Desconfía de palabras con `end − start < 0.05 s`.
- **Agrupar**: energía alta 2–3 palabras por grupo, conversacional 3–5, calmo 4–6. Corta en fin de oración, en pausas ≥ 150 ms o al tope de palabras. Un grupo visible a la vez, que desaparece en `group.end`. En vertical, a 600–700 px del borde inferior y nunca sobre la cara. Estilo propio para números, marcas, MAYÚSCULAS y llamados a la acción.
- **Subtítulos que reaccionan a la música**: escala 3–6 % y brillo según los graves y agudos del grupo, calculados al construir (en `stage.tl`), no en tiempo real.
- **Revisión**: una pasada con sonido (sincronía) y otra en silencio (legibilidad). El feed arranca sin sonido: los subtítulos son obligatorios.
- **Alternativa por probar**: Parakeet-TDT (CC-BY-4.0, ~640 MB, español incluido; WER 6.05 % frente a 7.44 % de Whisper y 5–10× más rápido). Compararlo con faster-whisper sobre 10 tomas de Qwen antes de cambiar.

## Flujo

1. Traduce el pedido del usuario a: **voz** (acento + persona), **arco emocional** (inicio → clímax → cierre) y **emoción + intensidad por línea**. Anótalo en `brief.md`.
2. Si la voz con ese acento no existe en `voices.mjs list`: dilo, usa la más cercana (o Gemini para la emoción) y entrega el `voices.mjs kit` para que el usuario grabe la voz real. No finjas un acento.
3. `node <engine>/voice.mjs <pieza>`: sintetiza todas las tomas, las transcribe con faster-whisper, elige por cada línea la toma que dijo el guion completo (y de duración típica), y alinea palabra a palabra para la animación.
4. Lee el reporte: toda línea con ⚠ (la toma difiere > 15 % del guion) se rehace con más `takes` o se reescribe más simple.
5. `review/voice.html` es la audición: todas las tomas con lo que el verificador oyó. El usuario puede elegir otra (`take: n`) sin re-sintetizar.
6. Si el usuario pidió revisar la voz antes del video, **detente aquí** y entrega la audición. Si no (one-shot), sigue; pero en la entrega di que la elección de toma es por exactitud, no por gusto.

## Escribir para el oído

- Frases cortas, una idea por frase. La puntuación es dirección: `…` alarga y suspende, `,` respira, `.` cierra, `¿?` y `¡!` cambian la entonación.
- Las pausas dramáticas van en `pause` (entre líneas) o con `…` dentro de la línea.
- Números, siglas y URLs escritos como se dicen en `say`.
- Tensión: frase larga que acumula, frase corta que golpea.
- **Dialecto sin caricatura** (máximo 1–2 marcas por línea, ortografía normal, que el acento lo ponga la voz):
  - Paisa: voseo (vos tenés, vení, mirá), "pues" al final, "parce", "¿quiubo?", "qué más pues", "hágale".
  - Caleño: voseo marcado, "ve" ("mirá ve", "oís ve"), "¿q'hubo ve?", "pues ve".
  - Rolo (Bogotá): usted, "sumercé", "qué pena con usted".
  - Venezolano (Caracas): tú, "chamo/chama", "pana", "vale", "chévere", "burda", "¡epa!".
  - Nunca humor basado en el acento ni estereotipos (narco, malandro).

## Límites honestos (dilos en la entrega)

- Tú no escuchas: la elección automática garantiza que **dice el guion**, no que **actúe mejor**. La audición es para que el usuario elija por actuación.
- Chatterbox marca cada audio con una marca de agua inaudible (Perth) que identifica audio sintético.
- Gemini gratis: límite diario de pedidos y Google puede usar ese contenido; no lo uses para guiones confidenciales.
- **Ruido bajo la voz**: una compuerta cierra las pausas, pero el siseo debajo de las palabras no se quita. `afftdn`/`arnndn` sirven para limpiar clips de referencia de casting.
- **Igualar una voz con otra** (dos tomas, dos motores): no hay curva automática; es EQ a mano y a oído.

Fuentes: documentación de Qwen3-TTS, Chatterbox, Kokoro-82M y Openverse · parte destilada de HyperFrames (Apache-2.0)
