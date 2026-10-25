# Catálogo de recursos de música, efectos de sonido y audio para `generative-visual-studio`

**Actualizado:** 24 de octubre de 2026  
**Objetivo:** construir bandas sonoras, música de fondo, transiciones, ambientes, impactos, foley y efectos de interfaz con coste recurrente cero y el menor riesgo posible de reclamaciones de copyright.

> **Nota legal importante:** “gratis”, “royalty-free”, “sin atribución” y “sin copyright” no significan lo mismo. Un archivo royalty-free normalmente sigue protegido por copyright, pero su titular te concede ciertos permisos. Ningún catálogo ni modelo puede garantizar al 100 % que nunca recibas una reclamación automática o de terceros. Este documento prioriza CC0, dominio público verificado, generación procedural propia y licencias claras para proyectos terminados. No es asesoría jurídica.

## Recomendación ejecutiva

Para un flujo verdaderamente gratuito y con trazabilidad, empezaría así:

1. **Efectos cotidianos, interfaz, impactos, sci-fi y pequeños loops:** [Kenney Audio](https://kenney.nl/assets) (packs CC0), [Meta Open Sound](https://github.com/facebookincubator/Meta-open-sound) (usa únicamente las colecciones etiquetadas CC0) y [BigSoundBank](https://bigsoundbank.com/licenses.html) (solo archivos marcados “Free and Royalty Free”).
2. **Gran biblioteca de calidad profesional para uso en videos:** [Sonniss GDC Game Audio Bundle](https://gdc.sonniss.com/) — licencia comercial sin atribución para proyectos multimedia sincronizados, pero **no es dominio público** y prohíbe usar sus sonidos para entrenar IA.
3. **Crear tus propios efectos de forma procedural:** [jfxr](https://github.com/ttencate/jfxr), [Bfxr](https://www.bfxr.net/) o [sound-effects de pepperonas](https://github.com/pepperonas/sound-effects).
4. **Crear música desde tu GPU:** [ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5) y su integración para Claude Code [claude-music](https://github.com/AgriciDaniel/claude-music). La licencia del proyecto/modelo es MIT, pero sigue revisando los modelos exactos que instales y conserva registro de prompts y resultados; ninguna IA garantiza por sí sola ausencia de similitud con obras existentes.
5. **Montar, limpiar y sincronizar:** [Audacity](https://www.audacityteam.org/), [FFmpeg](https://ffmpeg.org/) y [Ardour](https://ardour.org/).
6. **Para búsqueda puntual:** [Freesound con filtro CC0](https://freesound.org/search/?q=&f=license%3A%22Creative+Commons+0%22). Comprueba la licencia en la página de cada archivo: Freesound también contiene CC-BY y CC-BY-NC.

---

## 1. Reglas de licencia para un flujo de “no quiero atribuir ni recibir reclamaciones”

| Tipo | ¿Usarlo en el flujo más estricto? | Qué significa |
|---|---|---|
| **CC0 1.0** | **Preferido** | El titular renuncia a derechos en la medida permitida por la ley; normalmente no requiere atribución. Descarga la licencia o conserva la página original. |
| **Dominio público verificado** | **Preferido, con comprobación** | Comprueba tanto la composición como la grabación concreta. Una composición antigua puede tener una grabación moderna aún protegida. |
| **Licencia comercial sin atribución** | Apto con documentación | No es “sin copyright”: los derechos permanecen, pero la licencia permite incluirlo en un producto terminado. Conserva la versión de la licencia y evidencia de descarga. |
| **CC-BY** | Evitar si no quieres dar créditos | Requiere atribución; no es “sin copyright”. |
| **CC-BY-SA** | Evitar en el modo simple | Requiere atribución y puede imponer compartir adaptaciones bajo la misma licencia. |
| **CC-BY-NC** | **No usar para proyectos comerciales** | Prohíbe el uso comercial. |
| **CC-BY-ND** | Evitar para montajes | Las restricciones sobre adaptaciones pueden complicar edición, sincronización o remezcla. |
| **Licencia desconocida / “no copyright” en un título de YouTube** | **No usar** | Una etiqueta o descripción no sustituye una licencia verificable del titular. |
| **Modelo generativo local** | Útil, pero no garantía absoluta | No pagas por generación local, pero debes revisar licencia de código, pesos, datos de referencia y términos de uso. Una salida puede parecerse a una obra existente. |

Lecturas esenciales:

1. [Creative Commons: CC0](https://creativecommons.org/public-domain/cc0/)
2. [Creative Commons: licencias y herramientas](https://creativecommons.org/share-your-work/cclicenses/)
3. [Creative Commons: consideraciones para quienes reutilizan obras](https://wiki.creativecommons.org/wiki/Considerations_for_licensees)
4. [Freesound: FAQ sobre licencias](https://freesound.org/help/faq/)
5. [Freesound: explicación de licencias](https://freesound.org/help/faq/#licenses)
6. [Mixkit: licencias por tipo de recurso](https://mixkit.co/license/)
7. [Pixabay: FAQ y permisos de uso](https://pixabay.com/service/faq/)
8. [Sonniss: licencia de GDC Bundle](https://sonniss.com/gdc-bundle-license/)
9. [YouTube: política de Audio Library](https://support.google.com/youtube/answer/3376882?hl=en)
10. [Free Music Archive: guía de licencias](https://freemusicarchive.org/License_Guide)

## 2. Plugins y skills de Claude Code

| # | Recurso | Qué hace | Coste/licencia y advertencia |
|---:|---|---|---|
| 11 | [music-gen-skill](https://github.com/sirruf/music-gen-skill) | Composición algorítmica mediante MIDI, melodías, acordes, loops y efectos; render con instrumentos sampleados. | Skill MIT, local y sin API. Revisa la licencia del SoundFont que elijas. |
| 12 | [claude-music](https://github.com/AgriciDaniel/claude-music) | Genera música completa local con ACE-Step 1.5, desde Claude Code y un dashboard local. | Código MIT; requiere instalar el modelo y usar recursos locales. Revisa el modelo/pesos instalados. |
| 13 | [soundeffects-claude-code](https://github.com/manthanpatelll/soundeffects-claude-code) | Transcribe el video, ubica momentos y compone una pista WAV de efectos sincronizados. | Plugin MIT. Comprueba los recursos de sonido incluidos y su procedencia antes de redistribuirlos. |
| 14 | [audiogen](https://github.com/zeveck/audiogen) | Skill única para música, SFX y voz desde Claude Code. | **No encaja con cero coste estricto:** está conectada a la API de ElevenLabs, que consume créditos. |
| 15 | [Sonilo Claude Plugin](https://github.com/sonilo-ai/sonilo-claude-plugin) | Genera música/SFX, sincroniza música con video y hace ducking. | **No encaja con cero coste estricto:** generación en servicio alojado de pago. |
| 16 | [Awesome Claude Video Skills](https://github.com/zhuyansen/awesome-claude-video-skills) | Directorio para encontrar skills audiovisuales; incluye recursos de audio. | Catálogo, no una licencia única; la licencia se revisa por repositorio. |
| 17 | [Awesome Agent Video Skills](https://github.com/clonn/awesome-agent-video-skills) | Colección de herramientas de video y audio para distintos agentes. | Catálogo; cada elemento tiene condiciones propias. |
| 18 | [Free Game Dev Assets — catálogo de audio](https://github.com/TMHSDigital/Free-Game-Dev-Assets/blob/main/catalog/audio/README.md) | Lista curada de música, Foley, sonidos e impulso acústico con licencias y alertas. | Muy útil para descubrimiento; cada activo conserva su propia licencia. |
| 19 | [Free Game Dev Assets — guía de licencias](https://github.com/TMHSDigital/Free-Game-Dev-Assets/blob/main/docs/licenses.md) | Diferencia CC0, CC-BY, royalty-free y restricciones de redistribución. | Referencia comunitaria; confirma siempre en el sitio original. |
| 20 | [Awesome ACE-Step](https://github.com/ace-step/ACE-Step-1.5) | Ecosistema de UIs, integraciones y herramientas para generar música local. | Verifica por separado la licencia de cada integración. |

## 3. Bibliotecas preferidas: CC0 o uso seguro sin atribución

### 3.1 Kenney Audio — packs CC0

Kenney declara que sus assets de las páginas correspondientes se publican bajo CC0; aun así, conserva los archivos de licencia descargados con cada pack.

21. [Todos los assets de audio de Kenney](https://kenney.nl/assets?search=audio)  
22. [Interface Sounds — 100 sonidos](https://kenney.nl/assets/interface-sounds)  
23. [UI Audio — 50 sonidos](https://kenney.nl/assets/ui-audio)  
24. [Impact Sounds — 130 sonidos](https://kenney.nl/assets/impact-sounds)  
25. [Sci-fi Sounds — 70 sonidos](https://kenney.nl/assets/sci-fi-sounds)  
26. [Digital Audio — 60 sonidos](https://kenney.nl/assets/digital-audio)  
27. [Music Jingles — 85 piezas cortas](https://kenney.nl/assets/music-jingles)  
28. [Music Loops](https://kenney.nl/assets/music-loops)  
29. [RPG Audio](https://kenney.nl/assets/rpg-audio)  
30. [Casino Audio](https://kenney.nl/assets/casino-audio)  
31. [Voiceover Pack](https://kenney.nl/assets/voiceover-pack)  
32. [Voiceover Pack: Fighter](https://kenney.nl/assets/voiceover-pack-fighter)  
33. [Retro Sounds](https://kenney.nl/assets?search=retro%20sounds)  
34. [Synth Voice](https://kenney.nl/assets?search=synth%20voice)  
35. [Foley Sounds](https://kenney.nl/assets?search=foley%20sounds)  
36. [Kenney: preguntas de licencia y uso comercial](https://kenney.nl/support)

> Los packs de Kenney están pensados en parte para videojuegos, pero los efectos incluidos pueden servir como sonidos de interfaz, transiciones, blips, impactos y recursos de diseño. Revisa la ficha de cada pack antes de usarlo en un proyecto comercial.

### 3.2 Colecciones CC0 para efectos, instrumentos y Foley

37. [Meta Open Sound — página principal](https://github.com/facebookincubator/Meta-open-sound) — instrumentos y cientos de efectos de juego/VR. **Ojo:** las colecciones no son todas iguales; los instrumentos son CC0, mientras que Oculus Audio Pack lleva CC-BY 4.0. Usa solo carpetas/manifiestos CC0 si no quieres atribución.  
38. [Meta Open Sound — releases](https://github.com/facebookincubator/Meta-open-sound/releases) — descargas empaquetadas con manifest y sumas SHA-256.  
39. [BigSoundBank — biblioteca](https://bigsoundbank.com/) — sonidos grabados de Foley y ambientes.  
40. [BigSoundBank — licencia CC0](https://bigsoundbank.com/licenses.html) — descarga solo archivos cuya ficha los marque “Free and Royalty Free”.  
41. [Freesound — búsqueda](https://freesound.org/search/) — gran archivo comunitario; no todo es libre para uso comercial sin crédito.  
42. [Freesound — búsqueda CC0](https://freesound.org/search/?q=&f=license%3A%22Creative+Commons+0%22) — úsala como filtro inicial y revisa la página de cada archivo.  
43. [Freesound — FAQ de licencias](https://freesound.org/help/faq/) — explicación oficial de CC0, CC-BY y CC-BY-NC.  
44. [Sonniss — GDC 2026 Game Audio Bundle](https://gdc.sonniss.com/) — colección grande de SFX comerciales sin atribución.  
45. [Sonniss — archivo histórico GDC](https://sonniss.com/gameaudiogdc/) — paquetes gratuitos de años anteriores.  
46. [Sonniss — licencia del bundle](https://sonniss.com/gdc-bundle-license/) — permite proyectos sincronizados, pero no revender el audio por separado ni usarlo para entrenar IA.  
47. [Sonniss — GDC 2024](https://gdc.sonniss.com/gdc-2024-game-audio-bundle/) — bundle previo y licencia de su descarga.  
48. [Pond5 Public Domain Project](https://www.pond5.com/public-domain) — colección de audio histórico marcado como dominio público bajo el criterio de EE. UU.; verifica cada elemento y la jurisdicción de publicación.  
49. [Pond5 Public Domain Project — ayuda](https://www.pond5.com/help/en/articles/10085990-what-is-the-pond5-public-domain-project) — explica qué significa su etiqueta de dominio público.  
50. [Pixabay — música y efectos](https://pixabay.com/music/) — gratis y normalmente sin atribución bajo Pixabay Content License; **no significa dominio público** y puede haber reclamaciones erróneas o derechos de terceros.  
51. [Pixabay — efectos de sonido](https://pixabay.com/sound-effects/) — sonidos de interfaz, ambientes, animales, maquinaria y transiciones.  
52. [Pixabay — licencia/FAQ](https://pixabay.com/service/faq/) — condiciones de reutilización.  
53. [Mixkit — música gratis](https://mixkit.co/free-stock-music/) — verifica que la pista tenga la Free License aplicable.  
54. [Mixkit — efectos de sonido gratis](https://mixkit.co/free-sound-effects/) — sin atribución para usos permitidos por su licencia.  
55. [Mixkit — licencias](https://mixkit.co/license/) — la licencia cambia según el tipo de activo.  
56. [Mixkit — licencia Free para SFX](https://mixkit.co/license/modal/sfxFree/) — permite uso comercial y no comercial en productos finales; no permite redistribuir el efecto aislado.  
57. [YouTube Audio Library](https://youtube.com/audiolibrary) — música y SFX que YouTube identifica como seguros para su plataforma. Comprueba atribución por pista; no asumas que eso concede todos los derechos fuera de YouTube.  
58. [Ayuda oficial de YouTube Audio Library](https://support.google.com/youtube/answer/3376882?hl=en) — explica filtros de atribución y limitaciones de la garantía de Content ID.  
59. [OpenGameArt — audio](https://opengameart.org/art-search-advanced?keys=&field_art_type_tid%5B%5D=12) — música y SFX; cada item puede usar una licencia diferente, por lo que no es un catálogo entero CC0.  
60. [OpenGameArt — FAQ/licencias](https://opengameart.org/content/faq) — revisa las obligaciones por activo.  
61. [Wikimedia Commons — archivos de audio](https://commons.wikimedia.org/wiki/Category:Audio_files) — filtra por dominio público o CC0 y revisa la ficha de la grabación.  
62. [Wikimedia Commons — archivos de audio en dominio público](https://commons.wikimedia.org/wiki/Category:Public_domain_audio_files) — colección de partida, no sustituye la comprobación individual.  
63. [Openverse — búsqueda de audio](https://openverse.org/) — buscador de medios CC; usa filtros CC0/dominio público y verifica la fuente original.  
64. [Musopen — música](https://musopen.org/music/) — repertorio clásico; verifica la grabación concreta, no solo la composición musical.  
65. [Musopen — FAQ de dominio público](https://musopen.org/faq/) — recuerda que la situación legal de la grabación puede variar por país.  
66. [Internet Archive — audio](https://archive.org/details/audio) — inmenso archivo con derechos heterogéneos; **no uses un archivo sin comprobar Rights/License**.  
67. [Public Domain Review](https://publicdomainreview.org/) — historias y colecciones históricas; útil para encontrar materiales, pero no es una licencia general para todo lo que enlaza.  
68. [Free Music Archive](https://freemusicarchive.org/) — biblioteca con licencias mixtas; solo usar pistas CC0/dominio público cuando la ficha lo confirme.  
69. [Free Music Archive — guía de licencias](https://freemusicarchive.org/License_Guide) — no todas las canciones son comerciales o se pueden editar sin condiciones.  
70. [Free Music Archive — FAQ](https://freemusicarchive.org/FAQ/) — explica por qué “gratis” no significa libre para cualquier uso.

## 4. Música gratuita con permiso de uso, pero no necesariamente sin copyright

Estas fuentes pueden servir si su licencia permite el uso final y aceptas conservar documentación. No las trates como CC0.

71. [Incompetech — música](https://incompetech.com/music/royalty-free/) — catálogo de Kevin MacLeod; la opción Creative Commons gratuita suele exigir atribución.  
72. [Incompetech — licencias](https://web.incompetech.com/music/royalty-free/licenses/) — opción CC gratuita con crédito y licencia estándar de pago sin crédito.  
73. [Audionautix](https://audionautix.com/) — música con condiciones de atribución; comprueba la licencia de cada uso.  
74. [ccMixter](https://ccmixter.org/) — música y samples con licencias Creative Commons diversas; filtra y verifica.  
75. [Jamendo Licensing](https://licensing.jamendo.com/) — licencias comerciales, generalmente no es la opción gratuita universal.  
76. [Uppbeat](https://uppbeat.io/) — biblioteca con planes y condiciones de uso; el plan gratuito tiene límites.  
77. [ZapSplat](https://www.zapsplat.com/) — gran biblioteca de sonidos y música; el plan Basic normalmente requiere crédito.  
78. [ZapSplat — FAQ/licencia](https://www.zapsplat.com/faq/) — confirma licencia individual, atribución y formatos.  
79. [Soundly Free](https://getsoundly.com/) — biblioteca preparada para uso comercial dentro de proyectos; no revendas ni redistribuyas los archivos por separado.  
80. [Soundly — FAQ de uso comercial](https://getsoundly.com/faq/how-can-i-use-the-sounds/) — si se añade Freesound, activa el filtro CC0 para evitar atribuciones/licencias no comerciales.  
81. [SoundJay — SFX](https://www.soundjay.com/) — licencia gratuita para proyectos, con restricciones relevantes: no se puede redistribuir el audio aislado ni usarlo para entrenar IA.  
82. [SoundJay — términos](https://www.soundjay.com/tos.html) — lee las prohibiciones antes de usarlo.  
83. [Sound Effects +](https://www.soundeffectsplus.com/) — efectos gratuitos para proyectos terminados bajo su propia licencia; no es CC0.  
84. [Sound Effects + — licencia](https://www.sou.soundjay.com/content/license/) — restricciones de reventa, redistribución, aplicaciones cuyo producto sea el sonido y entrenamiento IA.  
85. [Freesfx.co.uk](https://freesfx.co.uk/) — confirma los requisitos de crédito y usos permitidos de cada recurso.  
86. [The Free Music Archive — biblioteca de música](https://freemusicarchive.org/genre/) — navega por estilos; revisa el tipo de licencia por pista.  
87. [Musopen — grabaciones](https://musopen.org/music/) — en grabaciones de obras clásicas, comprueba derechos de intérpretes y fonograma.  
88. [Library of Congress National Jukebox](https://www.loc.gov/collections/national-jukebox/) — archivo histórico; muchas grabaciones solo están disponibles para streaming bajo permiso, así que no descargues/reutilices sin revisar Rights & Access.  
89. [National Jukebox — derechos y acceso](https://www.loc.gov/collections/national-jukebox/about-this-collection/rights-and-access/) — explica los permisos de los fonogramas.  
90. [NASA — uso de imágenes y medios](https://www.nasa.gov/nasa-brand-center/images-and-media/) — los medios NASA generalmente no están sujetos a copyright de EE. UU., con excepciones y reglas de marca/identidad; verifica los créditos de terceros.  

## 5. Generar efectos de sonido desde cero (sin descargar samples)

Esta es una de las rutas más fuertes para evitar problemas con archivos de terceros. Los sonidos creados por síntesis procedural no dependen de un sample musical de otra persona; conserva el código, el seed y la licencia del generador.

91. [jfxr — generador de SFX en navegador](https://jfxr.frozenfractal.com/) — sonidos de juego, clicks, coins, láseres, golpes y blips. El autor indica que las salidas son tuyas para uso comercial.  
92. [jfxr — repositorio](https://github.com/ttencate/jfxr) — BSD-3-Clause; el README afirma que los sonidos generados son del usuario.  
93. [Bfxr](https://www.bfxr.net/) — generador de efectos retro basado en sfxr; exporta WAV.  
94. [jsfxr](https://sfxr.me/) — generador de sonidos 8-bit directamente en navegador. Comprueba la licencia del código y de la salida en el repositorio vinculado antes de distribuirlo como parte de un producto.  
95. [SFXR — repositorio original](https://github.com/DrPetter/sfxr) — generador procedural clásico de SFX.  
96. [pepperonas/sound-effects](https://github.com/pepperonas/sound-effects) — sonidos proceduralmente sintetizados en Python, con salida WAV/MP3 y licencia MIT; no se basa en samples.  
97. [SFXR-to-WAV](https://github.com/search?q=sfxr-to-wav&type=repositories) — búsqueda de conversores de presets SFXR a WAV; revisa cada repo antes de usarlo.  
98. [Tone.js](https://github.com/Tonejs/Tone.js) — framework MIT para sintetizar, secuenciar y aplicar efectos en navegador mediante Web Audio.  
99. [Web Audio API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — base para síntesis procedural, osciladores, filtros, ruido y envelopes.  
100. [SuperCollider](https://github.com/supercollider/supercollider) — síntesis y composición algorítmica; GPL-3.0 para el software.  
101. [Pure Data](https://github.com/pure-data/pure-data) — programación visual de sonido y síntesis; licencia BSD mejorada.  
102. [Csound](https://csound.com/) — lenguaje de síntesis y procesamiento de audio. Revisa la licencia de cada componente/distribución.  
103. [Sonic Pi](https://sonic-pi.net/) — live coding musical y composición algorítmica.  
104. [Strudel](https://strudel.cc/) — live coding de ritmos y música en navegador; es AGPL y los bancos de sonidos de terceros tienen licencias aparte.  
105. [TidalCycles](https://tidalcycles.org/) — patrones rítmicos y composición algorítmica.  
106. [Faust](https://faust.grame.fr/) — lenguaje para síntesis DSP, filtros, efectos y plugins.  
107. [SoX](https://sourceforge.net/projects/sox/) — generación, conversión y procesamiento por CLI; revisa la licencia de la distribución que uses.  
108. [FFmpeg](https://ffmpeg.org/) — montaje, mezcla, filtros, fades, loops, ducking y exportación; las opciones de compilación afectan la licencia.  
109. [FFmpeg filters documentation](https://ffmpeg.org/ffmpeg-filters.html) — referencia para efectos de audio programáticos.  
110. [LilyPond](https://lilypond.org/) — partituras reproducibles desde código; combina con un sintetizador/MIDI para generar música original.  
111. [Mido — MIDI para Python](https://github.com/mido/mido) — crear notas, progresiones y arreglos MIDI desde código.  
112. [FluidSynth](https://github.com/FluidSynth/fluidsynth) — sintetizador SoundFont para renderizar MIDI; el motor no determina la licencia del SoundFont.  
113. [TiMidity++](https://sourceforge.net/projects/timidity/) — renderizado MIDI a audio; revisa el SoundFont usado.  
114. [MIDIUtil](https://github.com/MarkCWirt/MIDIUtil) — crear archivos MIDI programáticamente.  
115. [music21](https://github.com/cuthbertLab/music21) — teoría, análisis y composición musical programática; revisa licencias de cualquier archivo de ejemplo.  
116. [PrettyMIDI](https://github.com/craffel/pretty-midi) — creación y análisis MIDI desde Python.  
117. [Pydub](https://github.com/jiaaro/pydub) — edición sencilla, cortes, mezcla y exportación de audio en Python.  
118. [SoundFile](https://github.com/bastibe/python-soundfile) — lectura y escritura de audio desde Python.  
119. [librosa](https://librosa.org/) — análisis de audio, tempo, espectrogramas y características.  
120. [pyloudnorm](https://github.com/csteinmetz1/pyloudnorm) — medición/normalización de loudness en Python.

## 6. Generación local de música con modelos abiertos

### Recomendados para investigar primero

121. [ACE-Step 1.5 — repositorio](https://github.com/ace-step/ACE-Step-1.5) — generación local de música; repositorio con licencia MIT. Conserva prompt, seed, revisión de similitud y modelo exacto.  
122. [ACE-Step — proyecto principal](https://github.com/ace-step/ACE-Step) — código y ecosistema de ACE-Step.  
123. [ACE-Step — documentación del modelo](https://ace-step.github.io/ACE-Step-1.5/) — características, instalación y modelos.  
124. [ACE-Step — modelo en Hugging Face](https://huggingface.co/ACE-Step/Ace-Step1.5) — model card y archivos; comprueba la licencia de la revisión concreta.  
125. [claude-music](https://github.com/AgriciDaniel/claude-music) — skill local para generar canciones mediante Claude Code + ACE-Step.  
126. [music-gen-skill](https://github.com/sirruf/music-gen-skill) — música algorítmica y MIDI local, sin API ni descarga de un modelo de generación.  
127. [Stable Audio 3.0 — anuncio oficial](https://stability.ai/news-updates/meet-stable-audio-3-the-model-family-built-for-artistic-experimentation-with-open-weight-models) — modelo con pesos disponibles; **no es CC0/MIT universal**: se aplican las licencias de Stability AI.  
128. [Stable Audio — guía de licencias de datos](https://stability.ai/explainers/how-stable-audios-training-data-licensing-works) — explica los datasets usados por Stable Audio 3.0.  
129. [Stable Audio Open — anuncio](https://stability.ai/news-updates/introducing-stable-audio-open) — generación local de samples, efectos y materiales de producción.  
130. [Stable Audio Tools](https://github.com/Stability-AI/stable-audio-tools) — herramientas de inferencia/entrenamiento; el código y los pesos pueden tener licencias diferentes.  
131. [Stable Audio Open — guía de inferencia](https://github.com/vllm-project/recipes/blob/main/StabilityAI/Stable-Audio-Open.md) — uso local y generación de efectos por texto; revisa las condiciones de la licencia comunitaria antes de uso comercial.  
132. [AudioLDM](https://github.com/haoheliu/AudioLDM) — texto a audio, música y efectos; no asumir uso comercial sin verificar licencias específicas del modelo/pesos.  
133. [AudioLDM 2](https://github.com/haoheliu/audioldm2) — generación de audio/música por texto; revisar licencia del checkpoint que se descarga.  
134. [AudioCraft / MusicGen / AudioGen](https://github.com/facebookresearch/audiocraft) — código MIT, pero los pesos de los modelos publicados tienen CC-BY-NC 4.0; **no usar como base de producción comercial sin otra autorización**.  
135. [Licencia de pesos de AudioCraft](https://github.com/facebookresearch/audiocraft/blob/main/LICENSE_weights) — CC BY-NC 4.0.  
136. [MusicGen: documentación](https://github.com/facebookresearch/audiocraft/blob/main/docs/MUSICGEN.md) — documentación técnica; atención a la licencia no comercial de los pesos.  
137. [HunyuanVideo-Foley](https://github.com/Tencent-Hunyuan/HunyuanVideo-Foley) — genera efectos sincronizados con video; utiliza licencia comunitaria de Tencent, con condiciones territoriales y restricciones. No es mi primera opción para una política legal simple.  
138. [Licencia HunyuanVideo-Foley](https://github.com/Tencent-Hunyuan/HunyuanVideo-Foley/blob/main/LICENSE) — leer antes de uso; la licencia prohíbe usar sus outputs para mejorar otros modelos y contiene restricciones de territorio.  
139. [FoleyCrafter](https://foleycrafter.github.io/) — investigación de generación de foley sincronizado con video; verifica la licencia del código, checkpoints y datos antes de producción.  
140. [Tango — generación de texto a audio](https://github.com/declare-lab/tango) — opción de investigación para efectos/ambientes; comprobar licencia de checkpoints y restricciones comerciales.  
141. [AudioLDM — página del proyecto](https://audioldm.github.io/) — demos e investigación relacionada.  
142. [Hugging Face — tareas de text-to-audio](https://huggingface.co/tasks/text-to-audio) — descubre modelos por tarea; inspecciona cada model card y licencia.  
143. [Hugging Face — búsqueda de modelos text-to-audio](https://huggingface.co/models?pipeline_tag=text-to-audio) — filtro por modelos de audio.  
144. [ComfyUI](https://github.com/comfyanonymous/ComfyUI) — interfaz de pipelines locales; cada nodo/modelo conserva su licencia.  
145. [Awesome ACE-Step](https://github.com/ace-step/ACE-Step-1.5#community--ecosystem) — enlaces a UIs, nodos, integraciones y optimizaciones de ACE-Step.

> **Advertencia sobre generadores:** una licencia permisiva del código no convierte automáticamente los sonidos generados en “libres de copyright”. También importan los pesos, las muestras de referencia, los datos de entrenamiento y la similitud del resultado. Nunca pidas “hazlo exactamente como [artista/canción viva]”; usa descripciones técnicas propias (tempo, instrumentación, energía, dinámica y estructura).

## 7. DAWs, mezcla y edición local

146. [Audacity](https://www.audacityteam.org/) — edición multipista, reducción de ruido, fades, normalización y exportación.  
147. [Código de Audacity](https://github.com/audacity/audacity) — GPLv3.  
148. [Ardour](https://ardour.org/) — DAW multipista para edición, grabación, mezcla y automatización.  
149. [LMMS](https://lmms.io/) — composición musical, secuenciador, piano roll y plugins.  
150. [Código de LMMS](https://github.com/LMMS/lmms) — GPL-2.0.  
151. [Hydrogen Drum Machine](https://github.com/hydrogen-music/hydrogen) — baterías y ritmos; GPL-2.0.  
152. [Qtractor](https://qtractor.org/) — DAW MIDI/audio para Linux.  
153. [Rosegarden](https://www.rosegardenmusic.com/) — secuenciación MIDI/audio y notación.  
154. [REAPER](https://www.reaper.fm/) — potente, pero propietario y de pago tras su evaluación; no es el primer candidato para cero coste permanente.  
155. [Tenacity](https://tenacityaudio.org/) — editor de audio comunitario. Revisa estado y licencia actuales del proyecto.  
156. [Carla audio plugin host](https://github.com/falkTX/Carla) — alojar plugins y enrutar audio.  
157. [Surge XT](https://surge-synthesizer.github.io/) — sintetizador open source para crear pads, drones, bajos, texturas y música.  
158. [Repositorio Surge XT](https://github.com/surge-synthesizer/surge) — sintetizador bajo licencia GPL-3.0.  
159. [Dragonfly Reverb](https://github.com/michaelwillis/dragonfly-reverb) — reverbs open source.  
160. [LSP Plugins](https://lsp-plug.in/) — ecualizadores, compresores, limitadores y utilidades de mezcla.  
161. [x42 Plugins](https://x42-plugins.com/) — analizadores, medidores, efectos y herramientas de audio.  
162. [Calf Studio Gear](https://calf-studio-gear.org/) — conjunto de plugins de audio.  
163. [ChowDSP](https://chowdsp.com/) — plugins y herramientas DSP.  
164. [Airwindows](https://www.airwindows.com/) — colección de efectos y procesadores; revisa la licencia del plugin específico.  
165. [LV2 — especificación de plugins](https://lv2plug.in/) — estándar para plugins de audio, útil para construir efectos propios.  
166. [VST SDK de Steinberg](https://steinbergmedia.github.io/vst3_dev_portal/) — documentación y SDK; revisa condiciones de SDK/redistribución.  
167. [Carla — GitHub](https://github.com/falkTX/Carla) — código para hosting y routing de plugins.  
168. [FFmpeg — documentación](https://ffmpeg.org/documentation.html) — sincronización y render final del video.  
169. [FFmpeg — filtros de audio](https://ffmpeg.org/ffmpeg-filters.html) — ducking, delays, reverbs, compresión, ecualización y mezcla.  
170. [SoX — manual](https://sox.sourceforge.net/sox.html) — filtros y síntesis por línea de comandos.

## 8. Instrumentos y muestras para crear música original

Usar instrumentos sampleados es válido siempre que la licencia de **cada muestra** permita el proyecto. Para minimizar riesgos, empieza por la colección CC0 de Meta Open Sound o sintetizadores que generan sus propias ondas.

171. [Meta Open Sound — piano y guitarras CC0](https://github.com/facebookincubator/Meta-open-sound) — descarga muestras CC0 y el archivo de licencia de cada instrumento.  
172. [Meta Open Sound — catálogo](https://github.com/facebookincubator/Meta-open-sound/tree/main) — revisa `manifest.json`, `catalog.json` y `LICENSE`.  
173. [Surge XT](https://surge-synthesizer.github.io/) — sonidos sintetizados sin requerir sample externo.  
174. [Vital](https://vital.audio/) — sintetizador wavetable; software gratuito, pero no completamente open source en todas sus partes. Verifica su licencia y las de los presets.  
175. [Dexed](https://github.com/asb2m10/dexed) — sintetizador FM basado en el Yamaha DX7; revisa también los derechos de los bancos de presets.  
176. [ZynAddSubFX](https://zynaddsubfx.sourceforge.io/) — sintetizador para composición musical.  
177. [Helm](https://tytel.org/helm/) — sintetizador open source.  
178. [Sforzando](https://www.plogue.com/products/sforzando.html) — reproductor SFZ; la licencia del reproductor no determina la licencia de los samples.  
179. [SFZ format](https://sfzformat.com/) — formato abierto de instrumentos sampleados.  
180. [FluidSynth](https://www.fluidsynth.org/) — motor de SoundFont; usa SoundFonts con licencia comercial clara.  
181. [MuseScore](https://musescore.org/) — notación y creación MIDI; comprueba licencias de las grabaciones y soundfonts que uses.  
182. [LilyPond](https://lilypond.org/) — partituras desde texto; útil para componer material original reproducible.  
183. [MIDIUtil](https://github.com/MarkCWirt/MIDIUtil) — escribir MIDI desde código.  
184. [Mido](https://github.com/mido/mido) — lectura, creación y edición MIDI.  
185. [music21](https://github.com/cuthbertLab/music21) — análisis de teoría musical y composición asistida.

## 9. Recursos de archivo, ciencia y sonidos del mundo real — con cautela

Estos archivos pueden ser excelentes para atmósferas y textura, pero la página de un archivo público no implica automáticamente permiso para reutilizar toda grabación.

186. [NASA — media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) — los medios NASA generalmente no están protegidos por copyright en EE. UU., salvo excepciones; revisa logos, terceros y uso de imagen/identidad.  
187. [NOAA Ocean Exploration](https://oceanexplorer.noaa.gov/) — expediciones y materiales de audio/ambiente marino; comprueba derechos en cada recurso.  
188. [USGS](https://www.usgs.gov/) — datos científicos y recursos audiovisuales; licencias y terceros pueden variar.  
189. [National Park Service — Sound Gallery](https://www.nps.gov/subjects/sound/sound-gallery.htm) — sonidos de parques/ambientes naturales; revisa los términos de cada archivo.  
190. [Library of Congress — Recorded Sound Research](https://guides.loc.gov/recorded-sound-research/using-the-library/sound-recordings) — explica que muchos fonogramas continúan protegidos.  
191. [Library of Congress — derechos de audio](https://www.loc.gov/collections/national-jukebox/about-this-collection/rights-and-access/) — algunas grabaciones solo se pueden escuchar en streaming con autorización.  
192. [Wikimedia Commons — sonidos de animales](https://commons.wikimedia.org/wiki/Category:Animal_sounds) — comprueba licencia de la grabación concreta.  
193. [Wikimedia Commons — naturaleza y ambientes](https://commons.wikimedia.org/wiki/Category:Nature_sounds) — verificar ficha y derechos.  
194. [Wikimedia Commons — efectos sonoros](https://commons.wikimedia.org/wiki/Category:Sound_effects) — filtros por CC0/dominio público.  
195. [Internet Archive — audio histórico](https://archive.org/details/audio) — derechos mixtos, no usar como fuente universal sin revisión.  
196. [Pond5 Public Domain — audio](https://www.pond5.com/public-domain?media=audio) — buscar clips históricos marcados como dominio público.  
197. [Openverse](https://openverse.org/) — buscador para descubrir assets Creative Commons; sigue el enlace a la fuente original.  
198. [Musopen](https://musopen.org/) — verificar por separado partituras, composición y fonograma.  
199. [Free Music Archive](https://freemusicarchive.org/) — usar filtros de licencia y consultar cada pista.  
200. [Freesound](https://freesound.org/) — usa exclusivamente CC0 en el modo sin créditos; no confíes solo en tags de búsqueda.

## 10. Aprendizaje: diseño sonoro, mezcla y Foley

201. [Sound design — Sonniss GDC archive](https://sonniss.com/gameaudiogdc/) — estudia bibliotecas profesionales para aprender cómo se organizan los sonidos. Respeta las restricciones de la licencia.  
202. [Kenney — catálogo completo](https://kenney.nl/assets) — referencia rápida para packs de uso permitido.  
203. [Audacity Manual](https://manual.audacityteam.org/) — cortes, fades, reducción de ruido y mezcla.  
204. [FFmpeg Filters](https://ffmpeg.org/ffmpeg-filters.html) — ejemplos de procesamiento.  
205. [Tone.js examples](https://tonejs.github.io/) — síntesis y composición programática en web.  
206. [Strudel tutorial](https://strudel.cc/learn/) — patrones y loops generados por código.  
207. [Sonic Pi tutorials](https://sonic-pi.net/tutorial.html) — música por código.  
208. [SuperCollider tutorials](https://doc.sccode.org/Tutorials/) — síntesis avanzada.  
209. [Pure Data documentation](https://puredata.info/docs) — diseño modular de audio.  
210. [Csound FLOSS Manual](https://flossmanual.csound.com/) — composición y síntesis con código.  
211. [LMMS Manual](https://docs.lmms.io/) — organizar y producir música.  
212. [Ardour manual](https://manual.ardour.org/) — mezcla y automatización multipista.  
213. [Sforzando/SFZ resources](https://sfzformat.com/) — aprender a mapear muestras.  
214. [Creative Commons — elegir licencia](https://creativecommons.org/chooser/) — para publicar tus propios recursos con licencia clara.  
215. [Creative Commons — preguntas frecuentes](https://creativecommons.org/faq/) — resolver dudas sobre licencias.

## 11. Qué evitar si la prioridad es no pagar y reducir el riesgo de copyright

- **No uses MusicGen/AudioCraft como base comercial por defecto:** el repositorio indica que los pesos de los modelos están bajo CC-BY-NC 4.0. El código MIT no anula la licencia no comercial de los pesos.
- **No uses cualquier resultado de Freesound:** la colección mezcla CC0, CC-BY y CC-BY-NC. Filtra CC0 y abre la página del sonido.
- **No asumas que “royalty-free” significa dominio público.** Sonniss, Pixabay, Mixkit, Soundly y ZapSplat conceden permisos de uso bajo sus condiciones; pueden seguir existiendo titulares de derechos.
- **No metas assets de Sonniss en el entrenamiento de un modelo:** su licencia del GDC bundle lo prohíbe explícitamente. Sí permite sincronizarlos con un proyecto audiovisual bajo sus términos.
- **No subas música comercial a un generador para hacer “variaciones”** a menos que poseas los derechos de la grabación y composición o tengas permiso explícito.
- **No uses pistas de canales de YouTube que se llamen “no copyright music”** sin licencia escrita trazable y procedencia comprobable.
- **No uses música CC-BY-NC en anuncios, monetización o productos comerciales.**
- **No generes “exactamente como” una canción o artista concreto.** Describe tempo, dinámica, instrumentación y emoción con lenguaje propio.
- **No confundas una composición en dominio público con una grabación en dominio público.** Una interpretación moderna de Bach, por ejemplo, puede tener derechos propios.

## 12. Protocolo de trazabilidad por cada asset

Para cada archivo incorporado a una producción, crea un registro como este:

```json
{
  "asset_id": "sfx_thunder_001",
  "kind": "sound_effect",
  "title": "Thunder distant low rumble",
  "source_url": "https://example.com/original-asset-page",
  "downloaded_at": "2026-10-24",
  "license_name": "CC0-1.0",
  "license_url": "https://creativecommons.org/publicdomain/zero/1.0/",
  "requires_attribution": false,
  "commercial_use": true,
  "ai_training_allowed": "not_assumed",
  "original_filename": "thunder.wav",
  "sha256": "<sha256-of-downloaded-file>",
  "used_in": ["campaign_001"],
  "notes": "Guardar captura/página de licencia de la fuente original."
}
```

Para música generada o SFX sintetizados añade:

- modelo y revisión exacta (si aplica);
- licencia del software y licencia de pesos;
- prompt original, negative prompt, seed y parámetros;
- fecha de generación, hashes del WAV/FLAC y resultado final mezclado;
- fuentes de referencia que se usaron (idealmente ninguna, o todas con licencia explícita);
- comprobación humana de que no parece una melodía o sample reconocible;
- versión de FFmpeg/procesador y parámetros de mezcla.

Puedes guardar el inventario como `audio-assets.jsonl` y añadir una prueba automatizada que rechace todo asset sin `source_url`, licencia, fecha, hash y confirmación de uso comercial.

## 13. Pipeline que recomiendo para tu sistema

```text
Video + storyboard
    ↓
Sound Director (Claude): define cue sheet por escena
    ↓
Asset Resolver
    ├─ CC0: Kenney / Meta CC0 / BigSoundBank CC0 / Freesound CC0
    ├─ Licensed sync: Sonniss / Pixabay / Mixkit, con licencia guardada
    └─ Original: jfxr / síntesis procedural / ACE-Step local
    ↓
SFX Composer: whoosh, impacts, risers, ambience, foley, transitions
    ↓
Music Composer: tempo, tonalidad, densidad y arco emocional
    ↓
FFmpeg / Audacity / Ardour: mezcla, ducking, fades, loudness y sincronización
    ↓
QA: clipping, silencios, picos, loudness, sync y trazabilidad legal
    ↓
Entrega: WAV master + MP3/AAC + cue sheet + asset manifest
```

### Estándares de exportación recomendados

- **Master de trabajo:** WAV estéreo, 48 kHz, 24-bit, sin clipping.
- **Video social:** AAC en el contenedor MP4, con picos controlados y música por debajo de la voz cuando hay narración.
- **Archivo de proyecto:** conserva WAV/FLAC y la sesión editable; no guardes solo el MP3 final.
- **Cue sheet:** incluye `start`, `end`, `asset_id`, `gain_db`, `pan`, `fade_in_ms`, `fade_out_ms`, `ducking_group` y `license_status`.
- **Automatización:** rechaza para producción cualquier asset sin licencia identificada o marcado `NC`, `ND`, `unknown`.

---

## Lista corta final: configuración ideal de coste recurrente cero

- **Música:** [claude-music](https://github.com/AgriciDaniel/claude-music) + [ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5); usar generación original y revisar los resultados.
- **SFX creados desde cero:** [jfxr](https://github.com/ttencate/jfxr) y [pepperonas/sound-effects](https://github.com/pepperonas/sound-effects).
- **Biblioteca CC0:** [Kenney Audio](https://kenney.nl/assets?search=audio), [Meta Open Sound CC0](https://github.com/facebookincubator/Meta-open-sound) y [BigSoundBank CC0](https://bigsoundbank.com/licenses.html).
- **SFX sincronizados:** [soundeffects-claude-code](https://github.com/manthanpatelll/soundeffects-claude-code) + librería CC0 propia.
- **Edición final:** [Audacity](https://www.audacityteam.org/) + [FFmpeg](https://ffmpeg.org/).
- **Inventario legal:** manifest JSONL, hash SHA-256, copia de licencia y fecha por asset.

La estrategia más estricta es generar lo que puedas desde cero, usar CC0 cuando necesites muestras reales y aceptar bibliotecas “royalty-free” solo cuando su licencia te dé de forma explícita los derechos que necesitas. No existe un botón que garantice cero reclamaciones para todo audio de internet o cualquier salida de IA.
