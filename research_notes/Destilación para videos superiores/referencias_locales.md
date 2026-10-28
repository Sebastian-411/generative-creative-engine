# Referencias locales — 10 videos analizados

Destilación de 10 MP4 de referencia (720×1280, 9:16, 30 fps) que sirven de estándar de calidad para las piezas del motor. Método: inspección pura con ffmpeg (frames → hojas de contacto, detección de cortes, medición de audio) + transcripción faster-whisper "small" en CPU int8 (la GPU falla: falta `cublas64_12.dll`). Todo lo marcado **[O]** es observación medida; **[I]** es inferencia/interpretación. No se tocó el plugin ni el motor.

## Convenciones de este archivo
- `v1…v10` = alias en orden de `sorted()` de Python sobre los nombres de archivo (regla de código Unicode: `A` < `¿`). Nombres exactos en cada ficha.
- Tiempos en segundos desde el inicio del archivo (incluye cualquier intro).
- Audio: RMS de banda completa / banda de voz (300–3400 Hz) / banda baja (<250 Hz) en dB, y eventos de silencio (−35 dB por ≥0.35 s). Todos los pics techan cerca de 0 dB → **mezcla limitada al techo en todas**.

## Resumen del set

| # | Idioma | Dur | Corte | Silencios | RMS full/voz/bajo (dB) | Género |
|---|---|---|---|---|---|---|
| v1 | es | 119.1 | 34 | 13 | −17.3 / −20.0 / −22.0 | explicador 3D (búnker) |
| v2 | en | 41.9 | 0 | 0 | −17.6 / −21.0 / −21.9 | ad narrativo (personajes) |
| v3 | es | 50.5 | 7 | 5 | −17.5 / −19.5 / −23.5 | estructura narrativa (montaña rusa) |
| v4 | pt | 59.1 | 0 | 4 | −16.8 / −19.3 / −21.7 | terminal de bolsa (noticia) |
| v5 | en | 47.3 | 17 | 6 | −16.5 / −22.2 / −18.4 | ad SaaS (mystery reveal) |
| v6 | es | 68.8 | 6 | 14 | −17.5 / −20.3 / −22.0 | ad AI (DeepZer) |
| v7 | es | 49.0 | 0 | 0 | −17.2 / −19.8 / −21.8 | comparativa coste (carrera) |
| v8 | es | 36.8 | 10 | 0 | −17.0 / −19.6 / −21.6 | ad SaaS (tarjeta sellos) |
| v9 | es | 45.6 | 1 | 0 | −16.8 / −19.5 / −21.5 | ad SaaS (retención gym) |
| v10 | es | 86.9 | 4 | 1 | −16.9 / −20.4 / −20.4 | explicador hardware (ChatGPT local) |

**[O] Medidas del set:**
- Duración 36.8–119.1 s. Ningún video supera 2 min; el más largo es un explicador puro.
- RMS banda completa: −16.4 a −17.6 dB en 9 de 10 (v5 −16.5) → loudness master muy consistente, como si apuntaran a un target común (~−16/−17). Voz solo 2–4 dB por debajo de la mezcla completa → la voz domina siempre. Banda baja 2–7 dB por debajo → música con poco sub, mixto voice-forward. Pico −0.3 a −3.4 dB → limitador agresivo.
- Silencios (VO pausa con música baja/drop): v1 13 y v6 14 eventos (explicador/ad pausado), v2/v7/v8/v9 cero (bed continuo), resto 1–6.
- Cortes duros: los cut-driven (v1 34, v5 17, v8 10) vs los de cámara continua (v2 0, v4 0, v7 0, v9 1, v10 4, v3 7). Dos gramáticas de edición conviven.
- Gancho (primer beat claro): 3–6 s en todos. CTA: últimos 10–17% del runtime.

---

## v1 — Así se construye un búnker (es, 119.1 s)

`videos/referencias/Así se construye un búnker 🛡️ Con casi un metro de tierra encima, la radiación te llega unas mi.mp4`

- 720×1280 · 30 fps · h264 · 912 kb/s · AAC 48 kHz. RMS −17.25/−20.00/−21.96, pico −0.5, 13 silencios, 34 cortes. Transcripción: es, 34 segmentos (VAD 118.1).
- **Estructura [O]:** gancho 0–5.6 ("Si armas una casita de campaña en el patio… tendrás un búnker") → problema (polvo radiactivo atraviesa la tela) → tesis en una línea ("A la radiación no la para lo duro, la para lo pesado", 20.2) → 6 bucles problema→solución→nombrar: blindaje (28.3), concreto armado (40.5), entrada en codo (56.4), ventilación filtrada (71.0), puerta blindada (83.8), reserva (97.8) → decaimiento con datos (radiación baja 10× a las 7 h, 100× en 2 días) → dato sorpresa (Suiza: refugio para cada persona) → despedida ("Ojalá nunca lo uses") → "¡Felicidades! ¡Construiste un búnker!" (115.2). **[I]** El remate "nombra la pieza" tras cada bucle es el dispositivo que convierte la lista en historia: cada loop cierra con una etiqueta memorable.
- **Visual [O]:** low-poly 3D estilizado "juguete técnico": corte de tierra con capas, cubos verdes de partículas radiactivas, personaje naranja, escena de garrafones/latas. Captions de UNA palabra a la vez, blanco bold con borde negro, ~mitad del frame. Odometer/corte cada ~3.5 s. Fin: confetti + pull-back.
- **Audio [O]:** voz muy delante, 13 drops de música en las pausas del locutor. **[I]** Bed chill constante debajo; los drops marcan los cierres de bucle.
- **Para el motor:** 100% reproducible con escena 3D + `stage.tl` por bucle; las etiquetas-nombre y el decaimiento con números son los dos dispositivos más portables. Cuidado: 119 s es el techo del formato — cualquier pieza propia de >100 s necesita tanta densidad.

## v2 — Claude and Codex finally met (en, 41.9 s)

`videos/referencias/Claude and Codex finally met. It went… exactly how youd expect 😂One chat for you and your AI a.mp4`

- 720×1280 · 30 fps · h264 · 436 kb/s · AAC 96 kHz. RMS −17.64/−21.02/−21.87, pico −0.3, 0 silencios, 0 cortes. Transcripción: en, 13 segmentos (VAD 33.86) + endcard.
- **Estructura [O]:** diálogo de personajes: Youssef pide "Claude, can you build the sign-up page?" → Claude "Done. I just need the API." → "API's ready. Sent it an hour ago." → gag "Who is that? / That's Codex. He does the backend." → giro ~23 s: "So you've been copy-pasting between us?" → "Okay, group chat. Now." → "Tests pass. It's live." → chiste de cierre "I'm taking credit for this. / Oh, absolutely not." → endcard 37–42: "Your team and your AI agents. One chat." + logo **Syndor** (la voz lee "CINDOR", [I] la TTS/marca suena así).
- **Visual [O]:** 0 cortes: una sola toma continua. Escena dark office con bokeh; personajes voxel 3D (humano, cubo naranja Claude, cubo oscuro Codex). Captions con **speaker labels** codificados por color (YOUSSEF/CLAUDE/CODEX). En 22.06 la escena cambia a UI blanca de producto (group chat, canal #launch, typing indicator, goal card) dentro de la misma toma. Endcard escalonado (0.5–0.7 s entre apariciones): 3 iconos de app → claim → "One chat." → pill "syndor.dev". Fade-in desde negro 0–0.5 s.
- **Audio [O]:** bed continuo sin drops; la risa/música sostiene el clima. **[I]** El humor sostiene el hook (no hay promesa de precio ni número).
- **Para el motor:** la toma continua con personajes es cara, pero la estructura (diálogo → giro → product UI en la misma toma → endcard escalonado) es portable; los speaker labels con color son triviales en HTML/CSS.

## v3 — Comenta VENDER: estructura de video corto (es, 50.5 s)

`videos/referencias/Comenta VENDER y te mando un tutorial donde utilizo casos reales y desmenuzo estructuras de gu.mp4`

- 720×1280 · 30 fps · h264 · 1234 kb/s (el más pesado del set) · AAC 44.1 kHz. RMS −17.54/−19.51/−23.48, pico −0.4, 5 silencios, 7 cortes. Transcripción: es, 22 segmentos (VAD 50.37).
- **Estructura [O]:** pregunta gancho "¿Cómo se arma un video corto que la gente vea hasta el final?" → "Con ocho piezas, siempre en el mismo orden. Y la más importante no es el gancho." → recorre: gancho → introducción → primer cuerpo → **bucle abierto** ("Pero eso no es lo más loco") → repetir (otro cuerpo, otro bucle, último cuerpo) → llamado a la acción → **payoff meta** 45–50: "¿Te diste cuenta? Este video está armado igual. ¿Y llegaste hasta aquí? Guárdalo…". CTA = guardar (sin marca, sin comentario).
- **Visual [O]:** metáfora única sostenida: montaña rusa en 3D, atardecer neón sobre el mar, cámara que viaja por el riel TODO el video (7 cortes solo para giros de bloque). Chips numerados 1–8 sobre el riel; pins de sección color-codificados (Gancho rojo/rosa, Introducción naranja, Cuerpo dorado, Bucle abierto cyan, CTA verde, "Tú estás aquí" blanco). Captions = frase completa con la keyword en pill. Payoff: plano cenital blueprint del riel en ~45 s + "llegaste al final".
- **Audio [O]:** los 5 silencios coinciden con los cierres de sección **[I]** (drops de sub/bass).
- **Para el motor:** esta pieza es casi un documental de las skills del plugin: es story-grammar + hook-lab contados sobre un solo objeto 3D. La rima inicio-final (riel = video) es el mejor ejemplo de callback del set.

## v4 — Comenta "bolsa" (pt-BR, 59.1 s)

`videos/referencias/Comenta “bolsa” que te mando o link!#claudecode #ia #claude #openai #codex.mp4`

- 720×1280 · 30 fps · h264 · 537 kb/s · AAC 44.1 kHz. RMS −16.82/−19.28/−21.67, pico −1.6, 4 silencios, 0 cortes. Transcripción: pt, 18 segmentos (VAD 57.62).
- **Estructura [O]:** noticia: bolsa brasileña derretida ~14%, Magazine Luiza perdió la mitad en un día, maior queda desde pandemia, circuit breaker ("botão de pânico", media hora), dólar mayor alta en 23 años (5,40) → pregunta "la acción que cayó 50% hoy: ¿peixe ou armadilha?" → repo con **116 mil estrelas** TradingAgents → 4 analistas IA simultáneos (números / notícias / sentimento / gráfico) → 2 pesquisadores debaten (otimista/pessimista) → trader monta, risco confere, gestor aprueba/rechaza → funciona con Claude/GPT/Gemini/modelo local → "É de graça, código aberto, feito para pesquisa" → disclaimer hablado "Não é recomendação de investimento, nem de quem fez, nem minha" → CTA comenta "bolsa" → "manda para aquele amigo que comprou na alta".
- **Visual [O]:** sistema "Bloomberg-terminal": negro + rojo + dorado. Kicker "A BOLSA DERRETEU" + chip "E A IA?". Card IBOVESPA −13.88% con odometer de puntos que rueda, goteo/fundido rojo saliéndose de la card, lluvia de líneas rojas. Card GitHub con contador de estrellas rodando (12 mil→116 mil). 4 analyst cards alrededor de "AÇÃO X". Captions abajo con palabra activa dorada. Payoff: gráfico verde "COMPROU NA ALTA" que se voltea a crash rojo (−11,48%) con figura cayendo (chiste). Termina en el chiste, **sin card de logo**. Capa legal fija: banner cinta-peligro "NÃO É RECOMENDAÇÃO DE INVESTIMENTO". CTA: mock de input de comentario tecleando "bolsa".
- **Audio [O]:** pico −1.6 (algo más bajo que el resto), bed tenso continuo. **[I]** El rumor/estética terminal justifica la textura sonora de alerta.
- **Para el motor:** el sistema HUD de datos (odometers, chips legales, cards de repo) es un patrón reutilizable; el ending "en el chiste" demuestra que el CTA no tiene que ser el último plano.

## v5 — Comment CARD (en, 47.3 s)

`videos/referencias/Comment CARD and we'll build your business a loyalty card for free. 👇 Know a business owner Sen.mp4`

- 720×1280 · 30 fps · h264 · AAC (tasa 48 kHz) . RMS −16.45/−22.15/−18.42 (banda baja alta: −18.42, la más cargada de sub del set), pico −3.4, 6 silencios, 17 cortes. Transcripción: en, 22 segmentos (VAD 45.04).
- **Estructura [O]:** mystery reveal en cadena: "Did you know some restaurants can send you a notification? Just for walking past?" → negaciones ("not a text, not an email, no app") → "So how do they know? Are they tracking you? / Nope. They have no idea where you are." → "But there's something you can't see. An invisible force field. A hundred meter radius." → **twist** ~20 s: "It's not the restaurant watching, it's YOUR phone." → explicación (digital loyalty card en Wallet, la force field viene con ella, "your phone taps you on the shoulder") → "Ever had this happen?" → "That business was using a card system from Tappy" → CTA (39–45): send to business owner friend + comment CARD + "we'll build it for their business for free".
- **Visual [O]:** dark city map, punto azul caminando = "you", anillo dorado punteado alrededor del restaurante (la "force field"). Captions estilo keyword-pill: la palabra clave en pill con outline azul + línea de progreso fina cyan arriba. Mockups de iPhone (lock screen 11:42, notificaciones, Wallet, comentario "CARD" tecleándose), gags de láser rojo ("NOPE." rosa como punch word), chip de escala "= 1 football pitch", chip de honestidad "Illustration not to scale", grid de 4 wallpapers como beat de repetición, plano cálido de fachada "Olmo KITCHEN". Fin: phone map + logo tappi fade-in.
- **Audio [O]:** la banda baja más presente del set (−18.4) **[I]** = drops de sub al ritmo de los reveals. Silencios 6.
- **Para el motor:** el mejor ejemplo del set de hook-lab "curiosity gap + mito vs realidad": engancha con comportamiento imposible y lo resuelve con un twist de POV. Los honesty chips y la progress line son detalles de oficio portables.

## v6 — Este anuncio lo hizo una IA (es, 68.8 s)

`videos/referencias/Este anuncio no lo hizo una persona- lo hizo una inteligencia artificial, y te encontró a ti.Com.mp4`

- 720×1280 · 30 fps · h264 · AAC 48 kHz. RMS −17.54/−20.33/−21.96, pico −0.6, **14 silencios**, 6 cortes. Transcripción: es, 21 segmentos (VAD 68.08).
- **Estructura [O]:** hook dirigido al espectador: "Si estás viendo este anuncio es porque tu empresa probablemente vende más de 30 millones de pesos al mes" → "no es casualidad: a ti te encontró una IA" → demo del sistema (Meta Ads: público, texto, presupuesto; similar a los mejores clientes) → "y hasta este vídeo lo creó una IA. Ni la campaña ni el vídeo los hizo una persona" → "sistema de ventas 24/7" → "Ahora imagina lo mismo con tu empresa" → flip retórico "¿Tú no encontraste este anuncio? Este anuncio te encontró a ti" → oferta Black Friday (super precio, primeras 5 empresas, límite doble: cupos o fin de BF) → "Deja de perder dinero en Meta Ads" → CTA comenta "CRECER".
- **Visual [O]:** cinematic 3D nocturno: ciudad de noche, brackets verdes de targeting sobre la torre, card roja "$30.000.000/mes", anillo dorado de objetivo; mock de Meta Ads Manager esqueleto→relleno (Público/Texto/Presupuesto, $0/día, checks verdes); multitud de peones grises con UN peón dorado (usted = el peón dorado); tag colgante hexagonal **BLACK FRIDAY** como héroe con sticker verde "SÚPER PRECIO"; palabra activa de caption que se materializa de blur a sharp; mock de comentarios (Andrés/Laura + typing "CRECER" + check verde); endcard "DeepZer — Te diseñamos el sistema de ventas automatizado 24/7".
- **Audio [O]:** el más pausado del set: 14 silencios, pico −0.6. **[I]** Cadencia de "ad para dueños de empresa": frases cortas con respiro, música de tensión baja.
- **Para el motor:** StoryBrand con IA como guía; el flip "el anuncio te encontró a ti" es un ejemplo de giro en 2ª persona. El duplicado de escasez (cupos O fecha) es el patrón de urgencia completo.

## v7 — Si quieres hacer vídeos como estos (es, 49.0 s)

`videos/referencias/Si quieres hacer vídeos como estos métete en mi perfil🔗.mp4`

- 720×1280 · 30 fps · h264 · AAC 48 kHz. RMS −17.16/−19.76/−21.84, pico −1.0, 0 silencios, 0 cortes. Transcripción: es, 22 segmentos (VAD 48.93).
- **Estructura [O]:** hook de precio: "Este segundo que acabas de ver vale 50 euros. Y este, y este…" → "Eso te cobra un estudio de animación, con cinco personas y un mes de trabajo." → "Yo lo hice con una frase. Empieza la carrera." → carrera estudio-vs-IA: guionista 3 días / locutor 1 día ("esta voz la hizo mi IA en segundos") / ilustrador 2 semanas / animador 1 semana / sonido 2 días → "Cuando mi IA terminó, el estudio seguía en la primera reunión. La factura: más de 2.000 euros." → oferta "Mi carpeta… 49 euros, una vez. Y haces todos los que quieras" → requisitos (ordenador + ChatGPT o Claude; voz céntimos) → garantía "si tu primer vídeo no sale, te ayudo hasta que salga, o te devuelvo el dinero" → CTA sígueme + envía al amigo con "Instagram que da pena" + "la carpeta en el enlace de mi perfil".
- **Visual [O]:** 0 cortes, cámara continua sobre el "set" dorado-on-black. Odometer € que corre pegado a los beats (45→50→100→255→373→745→868→990→1.113→2.450 €). 5 role cards; mock de factura papel "49 s × 50 €/s = TOTAL 2.450 €"; barra de días; checklist ✔; "REUNIÓN DE INICIO · DÍA 1"; perfil IG muerto "barpaco_oficial" (112 seguidores, sello CERRADO, chip "HACE 3 AÑOS") vs "resultaquee" (71.6 mil); dedo gigante 3D con lápiz como callback. Captions con pill azul de keyword. Termina con CTA link-in-bio, sin logo card.
- **Audio [O]:** 0 silencios con voz continua encima. **[I]** El odómetro sincronizado a la voz es el motor del ritmo (mismo principio del reloj del motor).
- **Para el motor:** mejor ejemplo de "número que choca" + "contraste antes/después" encadenados. La factura-papel y el sello CERRADO son props baratos y muy visibles.

## v8 — Ten tu programa listo en 10 minutos (es, 36.8 s)

`videos/referencias/Ten tu programa listo en 10 minutos🧑🏻‍💻✅¡¡Comenta “TARJETA” y te damos acceso totalmente grat.mp4`

- 720×1280 · 30 fps · h264 · AAC 48 kHz. RMS −16.97/−19.64/−21.61, pico −0.5, 0 silencios, 10 cortes (agrupados 13–20 s). Transcripción: es, 16 segmentos (VAD 36.27).
- **Estructura [O]:** hook cuantificado: "Un cliente que viene cada semana son 52 cafés al año" → dolor ("y si un día deja de venir, ni se despidió. Se fue con el de enfrente") → "Dale una razón para volver contigo" → producto: tarjeta de sellos en su Wallet, QR de tu barra, sin app, sellos desde tu móvil, 8 sellos = un café gratis → vida dentro del producto: al séptimo le llega "Te falta un sello" en la lock screen, y en su cumpleaños lo felicita tu cafetería → "Es RondaFi. Con tu logo y tus colores" → CTA: comenta "TARJETA" → demo, 14 días gratis.
- **Visual [O]:** dark navy + acento lime. Chips de keyword con **fill lime** (no outline) — variante de la familia pill. Grid/array de tazones contando 0→52 con odómetro; chip honestidad "Negocio de ejemplo"; fachadas ilustradas azul noche; mock de app (Cajero · Café La Esquina, botón "Sellar", Wallet, QR); notificaciones de lock screen como beats ("Te falta 1 sello", cumpleaños 🎂); endcard: "Comenta TARJETA ↓" lime + comentario tecleándose + "14 días gratis" + logo rondafy (hoja) + rondafy.es + taza brillante. 10 cortes concentrados en el bloque de demo.
- **Audio [O]:** voz continua sin drops; más sub que v1–v7 (bajo −21.6). **[I]** La densidad de cortes hace innecesario el drop.
- **Para el motor:** la pieza más comprimida del set: cuantificar → dolor → producto → vida-dentro → marca → CTA en 36.8 s. Plantilla directa para demos de SaaS en un solo breath.

## v9 — Y lo peor es que el que se va no avisa (es, 45.6 s)

`videos/referencias/Y lo peor es que el que se va no avisa- simplemente deja de venir.Vyro mira cuándo vino cada soc.mp4`

- 720×1280 · 30 fps · h264 · AAC 48 kHz. RMS −16.82/−19.52/−21.50, pico −0.6, 0 silencios, **1 corte** (42 s). Transcripción: es, 13 segmentos (VAD 45.3, voseo argentino).
- **Estructura [O]:** hook = confesión del problema: "El problema de tener un gimnasio es que si tenés 200 socios… los que se están por ir no te van a avisar" → casos con nombre ("a Julieta le tardaron en cargar su rutina", "Matías lleva 12 días sin venir") → matemática: "10 por mes × 55.000 de cuota = 550.000 pesos por mes" → "6.600.000 al año" → producto: Vyro mira última visita/frecuencia/cuota y avisa "justo antes de que se vaya" → seguimiento desde WhatsApp → beneficio emocional ("la gente se siente más atendida y vuelve") → tesis "tu negocio crece cuando entran más personas de las que se van" → "Vyro te ayuda a que se vayan menos" → CTA link en la descripción.
- **Visual [O]:** ciudad isométrica nocturna → la cámara SE META en el gimnasio (cutaway con chip "GYM · 35 ADENTRO"). Chips de miembros "MATÍAS · 12 DÍAS SIN VENIR". Array de 200 puntos que se erosiona. Card roja de pérdida con odómetro que rueda hasta los valores de la voz (stills mid-roll: 549.897→550.000; 6.564.628→6.600.000 — **[O] los odómetros aterrizan exactamente en el número que la voz dice**). Card producto "Radar de fuga" con severidades (Alto/Medio/Bajo) + botón "Escribirle". Mock de chat estilo WhatsApp. Barras contrafácticas (ENTRAN +12 / SE VAN −6 = +6/mes) + chart de 12 barras. Endcard: V brillante, "VYRO — Que no se te vaya nadie.", pill "vyrocoach.com".
- **Audio [O]:** voz continua, pico −0.6. **[I]** Con 1 solo corte, toda la retención vive en la cámara y en las cards.
- **Para el motor:** la mejor demostración del set de "churn/loss math" con nombres propios (Julieta/Matías) para humanizar el número. El array-de-puntos erosionándose es un dispositivo `canvas` trivial.

## v10 — ¿Pagarías 300.000 $ por tu propio ChatGPT (es, 86.9 s)

`videos/referencias/¿Pagarías 300.000 $ por tener tu propio Chatgpt.mp4`

- 720×1280 · 30 fps · h264 · AAC 48 kHz. RMS −16.86/−20.39/−20.43, pico −2.1, 1 silencio, 4 cortes. Transcripción: es, 38 segmentos (VAD 84.62).
- **Estructura [O]:** hook: "Tener ChatGPT en tu casa te costaría lo mismo que un piso" + promesa abierta "al final te cuento por qué a ti te lo dan por 23 euros al mes" → anatomía (IA = archivo gigante de números; consulta los números para cada palabra; no sabe cuáles hasta el último momento; por eso todos a mano en la memoria de la GPU) → ChatGPT no se descarga, DeepSeek sí: 700 GB vs tu gráfica 8 GB → "No cabe ni de lejos" → memoria RAM: se puede (~6.000 $) pero minutos por respuesta → servidor con 8× Nvidia H200 (140 GB c/u — en pantalla "141 GB"; casi 20× la tuya; cada una cuesta lo que un coche, más de 30.000 $) → juntas ≈ 300.000 $ "un piso" → energía: gasta como varias casas → escala: ChatGPT nadie sabe cuánto ocupa (secreto), los grandes ~10× más → "Eso ya no es un piso. Es un edificio." → resolución de la promesa: "¿Cómo te lo dan por 23 €/mes? Porque esas máquinas no son tuyas, las comparten miles a la vez" → salida práctica: modelos locales ("funcionan, pero no a la altura") → CTA de share: "Mándaselo a quien quiere montarse su propia IA."
- **Visual [O]:** explicador con capítulos dark↔cream: servidor llenándose de 8 GPU doradas con odómetro hasta ≈$300.000 + chips recibos ("+40.816$", "1 SERVIDOR · 8 GPU") vs card "23 €/mes"; stack de ~14 capas de matrices translúcidas con números y células cyan activas + espiral de atención (chat pill "IA | La Torre Eiffel está"); vis de pesos 700 GB; flip a CREAM claro con motherboard y timer "4:00", render H200 dorada, pixel-bar "141 GB vs 8 GB" con leyenda "cada cuadradito = 1 GB"; balancín GPU-vs-coche; medidor ≈7 kW + 7 casitas; chips de honestidad ("estimación, no oficial", "ejemplo: 8×H200 · 326.524 $", "a plena carga"); fin con mock de sheet de envío ("Mándaselo a quien…") + loop "¿Tú pagarías 300.000 $…?" — sin brand card.
- **Audio [O]:** pico −2.1, casi sin silencios (1). **[I]** Los cambios de capítulo dark↔cream funcionan como cortes sin cortar: la luz cambia, la cámara sigue.
- **Para el motor:** la pieza más madura de iteración visual del set (5 capítulos con la misma gramática). Los honesty chips y el "cada cuadradito = 1 GB" son el estándar de claridad numérica.

---

## Patrones transversales [O salvo que se marque]

1. **Sistema de captions (5 variantes de la misma idea):** (a) palabra-a-palabra con borde negro (v1); (b) speaker labels color-coded (v2); (c) frase con **keyword pill** outline (v3 azul, v4 dorada, v5/v6/v7 azul, v10 selección-cyan); (d) chips con fill (v8 lime); (e) abajo + palabra activa dorada (v4). Tamaño grande (~40–60 px a 720p), siempre bold sans, siempre contraste alto sobre fondo oscuro. [I] El pill de keyword es el estándar del set: la palabra que la voz enfatiza se marca en pantalla.
2. **Ganchos, mecanismo por video:** v10 precio escandaloso + promesa aplazada; v1 escena mundana + promesa transformadora; v3 pregunta de oficio + promesa de estructura; v4 breaking-news card + cifra odómetro; v5 comportamiento imposible ("notification por pasar cerca") + negaciones en cadena; v6 targeting directo al espectador ("tu empresa vende 30 millones/mes"); v7 precio-por-segundo; v8 número cuantificado del cliente (52 cafés); v9 confesión del dolor. **[I]** Ninguno abre con "presentamos/introducimos"; todos abren con imagen+situación+voz ya corriendo.
3. **Bucle abierto y payoff:** promesa aplazada explícita ("al final te cuento", v10), meta-loop ("este video está armado igual", v3), naming loops (v1), twist de agencia (v5 "es tu teléfono", v6 "te encontró a ti"), carrera con veredicto (v7), math payoff (v9). El payoff aterriza SIEMPRE antes del CTA, nunca después.
4. **Números con 3 capas:** odómetro que rueda hasta el valor que la voz dice (v4/v7/v8/v9/v10), array-iconografía para el tamaño del conjunto (v8 tazas, v9 200 puntos), chip de nota al pie con el dato exacto (v5 "Illustration not to scale", v10 "ejemplo: 8×H200 · 326.524 $", v8 "Negocio de ejemplo", v4 cinta legal). La honestidad es un chip, no una letra pequeña.
5. **CTA-mockup de comentario:** v4/v5/v6/v8 teclan la keyword en un input de comentario con animación de typing + check verde. **[I]** Garantiza que el viewer vea la palabra exacta; el motor puede hacerlo con un solo elemento HTML.
6. **End-card grammar (4 variantes):** logo + tagline + URL pill (v5/v8/v9); escalonado por capas (v2); terminar en el chiste sin logo (v4); loop de pregunta (v10). El CTA de acción social (comenta/envía/guarda) va ANTES o EN el endcard, jamás un beat después.
7. **Dos gramáticas de cámara:** cut-driven con re-seteo cada 3–4 s (v1, v5, v8) vs toma continua con cámara 3D que recorre/entra (v2, v3, v4, v7, v9, v10). La elección sigue el contenido: listas → cortes; demo/narrativa → continua.
8. **Colores del set (una acento por pieza):** dark+cyan (v2, v10), negro+rojo+dorado (v4), negro+dorado (v7), dark+lime (v8), dark+rojo (v9), atardecer neón (v3), verde/teal toy (v1), azul noche+dorado (v6). **[O]** El acento marca exactamente los momentos que la voz enfatiza (pills, glows, checks).
9. **Audio del set:** target ~−16 a −17 RMS full-band, pico ≤−0.3 dB, voz 2–4 dB por debajo del full band, sub moderado. Drops de música solo donde la voz respira (v1, v3, v5, v6). Nada de FX por encima de la voz. **[I]** Equivalente local a masterizar a ~−14 LUFS con true-peak −2.
10. **Legibilidad micro:** ninguna card convive con captions en la misma zona; los chips legales ocupan franjas (v4) o esquinas (v5/v8/v10) reservadas. Sin excepción, el número héroe ocupa ≥1/3 del frame en su beat.

## Mapa a skills del plugin

- **hook-lab:** v10 (número que choca + promesa aplazada), v5 (curiosity gap + mito vs realidad + negaciones), v7 (contraste precio + demostración en frío), v9 (confesión), v4 (clímax primero). Las negaciones en cadena de v5 ("not a text, not an email, no app") son un mecanismo completo para añadir al banco.
- **storytelling:** v3 (loop/meta-payoff), v5 (twist de agencia), v6 (StoryBrand con 2ª persona), v7 (antes/después con carrera), v10 (in medias res técnico con promesa aplazada), v1 (naming loops). Hilo de datos real: v4 (116 mil estrelas), v9 (550.000/mes).
- **story-grammar:** las tablas de beats de v1 (loops con ancla de "Ese es…"), v3 (8 piezas), v10 (5 capítulos) son plantillas directas de beats con tiempos. Techos por escena: en todos los videos cada beat se resuelve en ≤6 s de voz.
- **motion-craft:** odómetros pegados a la voz (v4/v7/v8/v9/v10), arrays que se cuentan/eroden (v8/v9), stacks de capas con focus-sweep (v10), cámara continua con dives (v9), materialización blur→sharp de keywords (v6). Prohibido en el set: flotar sin ancla, rebotes de más, cortes sin vector.
- **video-styles:** low-poly 3D técnico (v1), personajes voxel + product UI (v2), editorial-cinematic con metáfora única (v3), terminal de datos (v4), dark-SaaS con phone mockups (v5/v8/v9), ad AI cinematic (v6), gold-on-black comparativa (v7), explicador bicolor con capítulos (v10). Texturas: grano/bokeh/luz volumétrica presentes en casi todas; ninguna usa gradientes planos "AI-look".
- **sound-design:** números de mezcla arriba (§Resumen del set). Regla observable: sub para los reveals, drops en las pausas del locutor, bed continuo cuando no hay pausas, techo limitado. Aproximación local: -14 LUFS, pico −2 dBTP.
- **video-review:** usar v3 y v10 como benchmarks de oficio (cámara+typografía+chips), v5/v8 como benchmarks de hook+CTA, v4 como benchmark de sistema HUD.

## Qué copiar primero (prioridad para próximas piezas) [I]

1. Pill de keyword sincronizada con la palabra enfatizada de la voz (estándar de 9 de 10).
2. Odómetro/contador que aterriza exactamente en el número que la voz pronuncia.
3. CTA con mock de comentario tecleando la keyword.
4. Chip de honestidad con el dato exacto en cada figura estimada.
5. End-card de 2–4 capas escalonadas con logo+tagline+URL.
6. Gancho con promesa aplazada explícita ("al final te cuento…").

## Artefactos creados

Todo en `C:\Users\JUANDI~1\AppData\Local\Temp\opencode\refs\`:
- `probe.json` — ficha técnica de los 10.
- `audio.json` — volumedetect + silencedetect + 3 bandas astats por video.
- `transcripts.json` — transcripciones completas con timestamps; `transcribe.log` — log del proceso (CPU int8).
- `v{n}_sheet.png` (n=1..10) — hojas de contacto, 20 celdas de 300 px (20% de la duración entre celdas).
- `v{n}_open.png` — los primeros ~2 s a 2 fps (5 celdas) = ganchos fotograma a fotograma.
- `v{n}_pay.png` — los últimos 4 s (4 celdas) = payoffs/CTA.
- `v{n}_cuts.json` — timestamps de cortes duros.
- `v{n}_sXX.png` — stills a resolución completa para las beats clave leídas (v1: t50.5, t113.5; v3: t22; v4: t22.5, t30; v5: t21.5; v6: t20, t54.5; v7: t25; v9: t12, t19.5; v10: t12.5, t55).
- Scripts auxiliares (temp, no repo): `probe.py`, `frames.py`, `transcribe.py`, `stills.py`, `dump_transcripts.py` en `C:\Users\JUANDI~1\AppData\Local\Temp\opencode\`.
