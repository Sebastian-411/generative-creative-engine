# Recursos para voz expresiva, emociones y acentos con Claude Code

**Objetivo:** producir narraciones gratuitas por generación, preferentemente en local con tu GPU, capaces de interpretar emociones (terror, entusiasmo, tristeza, misterio, humor…), cambiar de registro y aproximarse a variedades regionales como caleño, paisa o venezolano.

**Revisión de enlaces:** 24 de octubre de 2026. Los repositorios, modelos, licencias y niveles gratuitos pueden cambiar; confirma la licencia del código **y de los pesos** antes de integrar algo en producción.

## Recomendación rápida

1. **Integración inmediata con Claude Code:** [Local TTS](https://github.com/vdk888/local-tts), plugin local basado en VoxCPM2.
2. **Pipeline por escena, duración, SRT y manifiesto:** [skill-tts](https://github.com/captjt/skill-tts). Úsalo con el proveedor local que tenga sentido; no presupongas que soporta cualquier backend sin adaptador.
3. **Motores principales que vale comparar:** [VoxCPM2](https://github.com/OpenBMB/VoxCPM), [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS), [Chatterbox](https://github.com/resemble-ai/chatterbox) e [IndexTTS-2.5](https://github.com/index-tts/index-tts).
4. **Acentos colombianos y venezolanos:** prueba primero los datasets regionales de [OpenSLR](https://www.openslr.org/resources.php); SLR72 es colombiano y SLR75 venezolano. No están etiquetados necesariamente como caleño o paisa.
5. **Control de calidad:** [WhisperX](https://github.com/m-bain/whisperX) para transcripción/alineación, [Audacity](https://www.audacityteam.org/) para escuchar y editar, [FFmpeg](https://ffmpeg.org/) para componer.

> **Criterio de gratuidad:** “local” significa que no pagas por cada generación, pero sí consumes GPU, electricidad, almacenamiento y tiempo. Un modelo con código abierto puede tener pesos con licencia diferente. Los servicios en nube pueden imponer cuota gratuita, límites, cambios de precio o condiciones de privacidad.

---

## 1. Skills, plugins y workflows para Claude Code

| Recurso | Para qué sirve | Enlace |
|---|---|---|
| Local TTS | Plugin para generar voz en local con VoxCPM2; diseño y clonación de voz según su documentación | [GitHub](https://github.com/vdk888/local-tts) |
| skill-tts | Skill/CLI de voz para Claude Code y otros agentes; crea clips por escena, voz unificada, subtítulos y manifiesto de duración | [GitHub](https://github.com/captjt/skill-tts) |
| Referencia de proveedores de skill-tts | Opciones de proveedores y configuración disponible | [providers.md](https://github.com/captjt/skill-tts/blob/main/skills/tts/references/providers.md) |
| Demo de skill-tts | Ejemplos de salida del pipeline | [Carpeta demo](https://github.com/captjt/skill-tts/tree/main/docs/demo) |
| Plugin system de Claude Code | Documentación oficial para instalar/administrar plugins | [Docs de Claude Code](https://code.claude.com/docs/en/plugins) |
| Skills de Claude Code | Documentación oficial de skills | [Docs de Claude Code](https://code.claude.com/docs/en/skills) |
| Claude Code | Repositorio/documentación general del producto | [GitHub](https://github.com/anthropics/claude-code) |
| Skills de agentes | Catálogo/herramientas de skills compatibles con agentes; revisa cada paquete antes de instalarlo | [skills.sh](https://skills.sh/) |
| NPM: skills | Paquete CLI usado por varios flujos de instalación de skills | [NPM](https://www.npmjs.com/package/skills) |

### Instalación sugerida de Local TTS

```text
/plugin marketplace add vdk888/local-tts
/plugin install local-tts@local-tts-marketplace
/local-tts:local-tts
```

Revisa sus requisitos actuales: la documentación indica Python 3.10+, descarga inicial de pesos y soporte para macOS Apple Silicon o Linux con CUDA. Confirma compatibilidad con tu sistema operativo/GPU antes de instalar.

### Instalación sugerida de skill-tts

```bash
npx skills add captjt/skill-tts
```

O como plugin de Claude Code, siguiendo siempre el README actualizado del repositorio.

---

## 2. Modelos locales de TTS: primeras opciones a evaluar

### Recomendados para una voz expresiva y configurable

| Modelo | Puntos de interés | Licencia / precaución | Enlace |
|---|---|---|---|
| VoxCPM2 | Diseño de voz mediante descripción, clonación controlable, español, salida de alta calidad | El repositorio indica Apache-2.0 para código y pesos; confirma los términos vigentes | [GitHub](https://github.com/OpenBMB/VoxCPM) |
| VoxCPM2 — Hugging Face | Pesos/model card para descargar y revisar requisitos | Revisar model card y términos de pesos | [Hugging Face](https://huggingface.co/OpenBMB/VoxCPM2) |
| Qwen3-TTS | Diseño de voz, instrucciones de estilo, clonación y generación en varios idiomas, incluido español | Confirma la licencia del checkpoint concreto | [GitHub](https://github.com/QwenLM/Qwen3-TTS) |
| Colección Qwen3-TTS | Catálogo de modelos disponibles | Selecciona VoiceDesign, CustomVoice o Base según la tarea | [Hugging Face](https://huggingface.co/collections/Qwen/qwen3-tts) |
| Qwen3-TTS VoiceDesign 1.7B | Diseño de voz a partir de descripción | Revisa requisitos de VRAM/licencia en la tarjeta | [Modelo](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign) |
| Qwen3-TTS CustomVoice 1.7B | Voces predefinidas con control de estilo | Revisa limitaciones y licencia del checkpoint | [Modelo](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice) |
| Qwen3-TTS Base 1.7B | Clonación/diseño basado en audio de referencia, según variante | Revisa la documentación oficial | [Modelo](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-Base) |
| Chatterbox | Síntesis expresiva, clonación y controles como `exaggeration` en sus variantes | Código/modelos y términos pueden variar entre variantes; comprueba el repo/model card | [GitHub](https://github.com/resemble-ai/chatterbox) |
| Chatterbox Multilingual — español de Latinoamérica | Checkpoint regional para comparar español latino | Comprueba la tarjeta/licencia exacta y el alcance regional | [Hugging Face](https://huggingface.co/ResembleAI/Chatterbox-Multilingual-es-mx-latam) |
| Chatterbox Multilingual — español de España | Variante específica para castellano de España; útil como comparación, no como sustituto de acento colombiano | MIT según la tarjeta consultada; revisa versión | [Hugging Face](https://huggingface.co/ResembleAI/Chatterbox-Multilingual-es-es) |
| IndexTTS-2.5 | Separación entre timbre y emoción, control de velocidad, soporte de español | Usa licencia de modelo de Bilibili; no asumir que es Apache/MIT | [GitHub](https://github.com/index-tts/index-tts) |
| IndexTTS-2.5 model card | Requisitos, idiomas y licencia del checkpoint | Revisión obligatoria antes de uso comercial | [Hugging Face](https://huggingface.co/IndexTeam/IndexTTS-2.5) |
| OpenVoice | Clonación de tono vocal y control granular de estilo/acento, según el proyecto | El repo declara MIT para V1/V2; verifica dependencias y pesos | [GitHub](https://github.com/myshell-ai/OpenVoice) |
| OpenVoice — documentación | Guía de instalación/uso | Seguir el README y guías del proyecto | [Uso](https://github.com/myshell-ai/OpenVoice/tree/main/docs) |

### Otros modelos y motores que vale la pena comparar

| Modelo | Uso principal | Licencia / precaución | Enlace |
|---|---|---|---|
| Kokoro-82M | TTS liviano, rápido y local; buena alternativa económica para narraciones más simples | Apache-2.0 según model card; confirma soporte/voz española en la implementación concreta | [GitHub](https://github.com/hexgrad/kokoro) |
| Kokoro-82M — model card | Pesos, muestras y notas del modelo | Lee la tarjeta antes de elegir voces | [Hugging Face](https://huggingface.co/hexgrad/Kokoro-82M) |
| Kokoro ONNX | Ejecución de Kokoro con ONNX | Revisa paquetes y modelos de voz compatibles | [GitHub](https://github.com/thewh1teagle/kokoro-onnx) |
| Kokoro FastAPI | Servicio HTTP local para integrar Kokoro en otros proyectos | La imagen Docker/versión puede cambiar; revisar README | [GitHub](https://github.com/remsky/Kokoro-FastAPI) |
| F5-TTS | Síntesis basada en flow matching y generación con voz de referencia | Código MIT, pero pesos preentrenados bajo CC-BY-NC según el repo; cuidado con uso comercial | [GitHub](https://github.com/SWivid/F5-TTS) |
| Fish Speech | TTS multilingüe y clonación | Licencia comunitaria de Fish Audio; los pesos S2-Pro pueden tener licencia distinta | [GitHub](https://github.com/fishaudio/fish-speech) |
| Parler-TTS | Control de estilo por descripción textual de la voz | Revisa la licencia de los checkpoints específicos | [GitHub](https://github.com/huggingface/parler-tts) |
| StyleTTS2 | Síntesis expresiva / investigación de estilo vocal | El repo establece condiciones para el uso de voces preentrenadas; revisar README y dependencias | [GitHub](https://github.com/yl4579/StyleTTS2) |
| Coqui TTS | Toolkit general de TTS y variedad de modelos | La licencia cambia por modelo; no asumir que todo el catálogo permite uso comercial | [GitHub](https://github.com/coqui-ai/TTS) |
| XTTS-v2 | Clonación multilingüe, incluido español | Coqui Public Model License; leer los términos del modelo | [Documentación](https://github.com/coqui-ai/TTS/blob/dev/docs/source/models/xtts.md) |
| CosyVoice | Síntesis multilingüe, control de estilo y clonación según la variante | Revisa licencia/idiomas de la versión elegida | [GitHub](https://github.com/FunAudioLLM/CosyVoice) |
| MeloTTS | TTS multilingüe con inferencia eficiente | Revisa licencia de código y de los modelos | [GitHub](https://github.com/myshell-ai/MeloTTS) |
| GPT-SoVITS | Entrenamiento/inferencia de TTS y clonación de voz | Revisar licencia, datasets y pesos antes de producción | [GitHub](https://github.com/RVC-Boss/GPT-SoVITS) |
| Piper (Open Home Foundation) | Motor TTS neuronal rápido y local | El motor actual es GPL-3.0; revisar por separado las licencias de cada voz | [GitHub](https://github.com/OHF-Voice/piper1-gpl) |
| Piper: lista de voces | Voces preentrenadas y configuraciones disponibles | Cada voz puede tener licencia propia | [Voces](https://github.com/rhasspy/piper/blob/master/VOICES.md) |
| Bark | Generación de audio y habla con capacidades generativas amplias | Revisa límites, calidad en español y licencia del proyecto | [GitHub](https://github.com/suno-ai/bark) |
| ChatTTS | Habla conversacional y otros eventos vocales según configuración | Verifica idioma y licencia de la versión actual | [GitHub](https://github.com/2noise/ChatTTS) |
| Orpheus-TTS | Síntesis generativa con estilo/expresividad | Comprueba disponibilidad de español y licencias de los pesos | [GitHub](https://github.com/canopyai/Orpheus-TTS) |
| VALL-E X | Clonación zero-shot y transferencia de estilo a partir de audio de referencia | No es la primera opción para español: los idiomas documentados son limitados | [GitHub](https://github.com/Plachtaa/VALL-E-X) |
| Tortoise TTS | TTS de alta calidad con generación relativamente lenta | Revisa licencias, requisitos y calidad en español | [GitHub](https://github.com/neonbjb/tortoise-tts) |
| Real-Time Voice Cloning | Framework clásico de clonación a partir de pocos segundos | Proyecto más antiguo; probar calidad y compatibilidad actuales | [GitHub](https://github.com/CorentinJ/Real-Time-Voice-Cloning) |
| VITS | Arquitectura clásica de TTS con implementaciones y checkpoints comunitarios | Cada checkpoint/dataset tiene licencia independiente | [GitHub](https://github.com/jaywalnut310/vits) |
| SpeechBrain | Toolkit de investigación de voz y audio, con componentes de TTS y procesamiento | No es un TTS listo para todo uso: escoger recetas/modelos | [GitHub](https://github.com/speechbrain/speechbrain) |
| ESPnet | Toolkit de investigación para ASR/TTS y voz | Requiere seleccionar/configurar recetas y modelos | [GitHub](https://github.com/espnet/espnet) |
| NVIDIA NeMo Speech | Framework de voz y audio con recetas de TTS/ASR | Revisar licencia de cada modelo preentrenado | [Documentación](https://docs.nvidia.com/nemo/speech/nightly/tts/datasets.html) |
| Silero models | Modelos de voz/idioma y componentes de procesamiento | Revisa qué modelos del repositorio cubren realmente TTS en español | [GitHub](https://github.com/snakers4/silero-models) |
| Mimic 3 | Sistema local de TTS de Mycroft, útil como referencia histórica | Revisar estado de mantenimiento y voces disponibles | [GitHub](https://github.com/MycroftAI/mimic3) |

---

## 3. Servicios en nube y demos para comparar calidad

Estos no cumplen necesariamente el requisito de coste recurrente cero. Úsalos como referencia de calidad, pruebas ocasionales o solo si el plan gratuito actual te alcanza.

| Recurso | Qué ofrece | Gratuidad/privacidad | Enlace |
|---|---|---|---|
| Gemini API — speech generation | TTS de uno o varios hablantes; instrucciones sobre emoción, acento, ritmo y tono | Tiene cuota/nivel gratuito sujeto a límites y condiciones; revisar política de datos | [Documentación](https://ai.google.dev/gemini-api/docs/speech-generation) |
| Gemini API — precios | Tarifas, cuotas gratis y condiciones actuales | La cuota gratuita puede cambiar y el contenido del nivel gratis puede usarse para mejorar productos | [Precios](https://ai.google.dev/gemini-api/docs/pricing) |
| Google AI Studio | Probar TTS y prompts de estilo desde la interfaz | Límites sujetos al estado de la cuenta y producto | [Abrir AI Studio](https://aistudio.google.com/) |
| Límites de Gemini API | Consultar cuotas/rate limits aplicables | Las cuotas efectivas varían por tier y cuenta | [Rate limits](https://aistudio.google.com/docs/rate-limits) |
| Gemini API — precios de nuevo | Página oficial de referencia para recalcular el coste antes de activar nube | Reconfirmar al usar, no asumir precios memorizados | [Pricing](https://ai.google.dev/gemini-api/docs/pricing?authuser=1) |
| ElevenLabs | TTS de alta calidad, controles de estilo y narración | Servicio cerrado; plan gratuito sujeto a límites y términos | [Sitio oficial](https://elevenlabs.io/) |
| ElevenLabs API docs | Control por API y configuración de modelos | API con cuotas/planes; revisar el tier gratis vigente | [Docs](https://elevenlabs.io/docs) |
| Cartesia | TTS expresivo y API de voz | Servicio cerrado con planes/cuotas variables | [Sitio oficial](https://cartesia.ai/) |
| Cartesia docs | API e integración | Revisar precio y límites vigentes | [Docs](https://docs.cartesia.ai/) |
| Deepgram Aura | TTS y productos de voz | Servicio/API; verificar créditos y tarifas vigentes | [Sitio oficial](https://deepgram.com/) |
| Deepgram docs | API de TTS | Revisar pricing actual | [Docs](https://developers.deepgram.com/docs/tts) |
| OpenAI audio/TTS | Opciones de voz por API | API de pago según tarifa y modelo; no es un motor local gratis | [Audio docs](https://platform.openai.com/docs/guides/text-to-speech) |
| Hugging Face Spaces | Demos comunitarias para escuchar modelos antes de instalarlos | La disponibilidad pública y los recursos gratuitos no están garantizados | [Spaces](https://huggingface.co/spaces) |
| Chatterbox demos/modelos | Ejemplos y checkpoints de Chatterbox | Revisa los términos del Space/model card y recursos compartidos | [Colección de modelos](https://huggingface.co/ResembleAI) |
| Qwen TTS model collection | Modelos y demos compartidos por el equipo Qwen | La demo en la nube puede limitarse; los pesos se pueden ejecutar localmente si tu máquina los soporta | [Colección](https://huggingface.co/collections/Qwen/qwen3-tts) |

---

## 4. Acentos y datasets de español regional

**Importante:** una grabación regional sirve para análisis, diseño de voz o entrenamiento si la licencia y los consentimientos lo permiten. No implica que un modelo TTS ya sepa reproducir ese dialecto. Los datasets regionales OpenSLR son de español por país/región y no garantizan etiquetas finas como “caleño de Cali” o “paisa de Medellín”.

| Dataset/recurso | Variedad o contenido | Licencia/precaución | Enlace |
|---|---|---|---|
| OpenSLR — catálogo | Índice de datasets de voz | Revisar licencia individual de cada dataset | [Catálogo](https://www.openslr.org/resources.php) |
| SLR61 | Español argentino | CC BY-SA 4.0 según la ficha; verificar condiciones | [Dataset](https://www.openslr.org/61/) |
| SLR71 | Español chileno | CC BY-SA 4.0 según la ficha | [Dataset](https://www.openslr.org/71/) |
| SLR72 | Español colombiano | CC BY-SA 4.0 según la ficha; no garantiza acento caleño/paisa por hablante | [Dataset](https://www.openslr.org/72/) |
| SLR73 | Español peruano | CC BY-SA 4.0 según la ficha | [Dataset](https://www.openslr.org/73/) |
| SLR74 | Español de Puerto Rico | CC BY-SA 4.0 según la ficha | [Dataset](https://www.openslr.org/74/) |
| SLR75 | Español venezolano | CC BY-SA 4.0 según la ficha | [Dataset](https://www.openslr.org/75/) |
| Datasets OpenSLR en Hugging Face | Acceso indexado a varios datasets OpenSLR | Respeta la licencia original de cada subconjunto | [Dataset Hub](https://huggingface.co/datasets/openslr/openslr) |
| Google Language Resources | Índice/código relacionado con varios datasets lingüísticos | Leer la licencia por dataset | [GitHub](https://github.com/google/language-resources) |
| Common Voice | Voz crowdsourced, transcripciones y variedad de idiomas/acento según versión | Consultar la versión y licencia vigente del corpus | [Proyecto](https://commonvoice.mozilla.org/) |
| Common Voice en Hugging Face | Dataset para investigar/procesar voz y acentos | Leer card y licencia por versión | [Datasets](https://huggingface.co/datasets/mozilla-foundation/common_voice_17_0) |
| FLEURS | Corpus multilingüe para evaluación de voz/ASR, con variedades lingüísticas | No asumir que cada región tiene datos suficientes para entrenar TTS | [Dataset](https://huggingface.co/datasets/google/fleurs) |
| Silencio — Accents of Spanish | Muestra pequeña con etiquetas de variedad/acento autodeclarado | CC BY-NC 4.0 en la ficha mostrada; no usar para producción comercial sin permiso compatible | [Dataset](https://huggingface.co/datasets/SilencioNetwork/spanish-accents-speech) |
| VCTK | Voces inglesas multi-hablante, útil para pruebas generales de TTS/VC | Revisar licencia y finalidad | [Dataset/descarga](https://datashare.ed.ac.uk/handle/10283/3443) |
| LibriTTS | Corpus inglés para TTS | Revisar licencia y aplicabilidad al modelo | [OpenSLR](https://www.openslr.org/60/) |
| MLS — Multilingual LibriSpeech | Corpus de lectura multilingüe basado en audiolibros | Revisar idiomas/licencia; no es un dataset regional colombiano | [OpenSLR](https://www.openslr.org/94/) |
| RAVDESS | Dataset de expresión emocional en voz y video; inglés | Usarlo con fines de investigación conforme a su licencia | [Sitio oficial](https://zenodo.org/records/1188976) |
| CREMA-D | Corpus audiovisual de emociones | Revisar términos de descarga/uso | [GitHub](https://github.com/CheyneyComputerScience/CREMA-D) |
| MELD | Diálogos multimodales anotados con emociones | Principalmente inglés; más útil para investigación/evaluación | [Sitio del proyecto](https://affective-meld.github.io/) |
| IEMOCAP | Corpus de actuación/emoción del habla | Acceso/licencia de investigación; puede requerir solicitud | [USC SAIL](https://sail.usc.edu/iemocap/) |
| CoVoST | Corpus de traducción de voz basado en Common Voice | CC0 según la ficha del proyecto; diseñado para speech translation, no para clonación de voz | [Meta AI](https://ai.meta.com/tools/covost) |
| ACCENT — créditos de audio | Índice de créditos/fuentes de datos de acento | Útil para rastrear atribuciones y licencias | [Créditos](https://accentle.com/credits) |

### Cómo crear un perfil regional sin caricaturizarlo

1. Graba o consigue audio con **consentimiento explícito** de hablantes nativos del lugar.
2. Registra país, ciudad/región autodeclarada, edad aproximada, género vocal, condiciones de grabación, transcripción y permiso de uso.
3. Crea una prueba de frases comunes y frases largas, no solo una palabra o saludo.
4. Evalúa por hablantes nativos: pronunciación, ritmo, entonación y naturalidad; no puntúes solo por “parece colombiano”.
5. Mantén licencias, consentimientos y restricciones junto a cada muestra. No clones voces de personas reales sin autorización.

---

## 5. Conversión de voz y transferencia de timbre

Esto es distinto de TTS. Primero se produce una interpretación y después se transforma su timbre; puede ayudar a probar estilos/acento, pero no garantiza pronunciación regional auténtica.

| Recurso | Uso | Enlace |
|---|---|---|
| OpenVoice | Clonación y control de estilo/tono vocal a partir de referencia | [GitHub](https://github.com/myshell-ai/OpenVoice) |
| RVC WebUI | Conversión del timbre de una voz a otro modelo de voz | [GitHub](https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI) |
| Applio | Interfaz/entorno para flujos RVC | [GitHub](https://github.com/IAHispano/Applio) |
| so-vits-svc | Conversión de voz cantada/hablada basada en SVC; revisar aplicabilidad | [GitHub](https://github.com/svc-develop-team/so-vits-svc) |
| Real-Time Voice Cloning | Framework clásico de clonación de voz | [GitHub](https://github.com/CorentinJ/Real-Time-Voice-Cloning) |
| VALL-E X | Clonación multilingüe de pocos segundos; idiomas limitados | [GitHub](https://github.com/Plachtaa/VALL-E-X) |

**Regla de seguridad:** usa la voz propia o una muestra con permiso. No uses clonación para hacer pasar el audio sintético como una persona real sin consentimiento.

---

## 6. Transcripción, alineación, segmentación y control de calidad

| Herramienta | Para qué sirve | Enlace |
|---|---|---|
| Whisper | Transcripción local de audio | [GitHub](https://github.com/openai/whisper) |
| faster-whisper | Implementación rápida y eficiente de Whisper | [GitHub](https://github.com/SYSTRAN/faster-whisper) |
| WhisperX | Timestamps a nivel palabra, alineación y diarización | [GitHub](https://github.com/m-bain/whisperX) |
| whisper.cpp | Ejecución de Whisper en C/C++ y distintos dispositivos | [GitHub](https://github.com/ggml-org/whisper.cpp) |
| WhisperKit | Transcripción optimizada para dispositivos Apple | [GitHub](https://github.com/argmaxinc/WhisperKit) |
| Vosk | Reconocimiento de voz offline | [GitHub](https://github.com/alphacep/vosk-api) |
| pyannote.audio | Diarización y segmentación por hablante; pipeline comunitario con condiciones de modelo | [GitHub](https://github.com/pyannote/pyannote-audio) |
| Silero VAD | Detecta tramos con voz; útil para recortar silencios sin cortar palabras | [GitHub](https://github.com/snakers4/silero-vad) |
| Montreal Forced Aligner | Alineación forzada de texto y audio | [GitHub](https://github.com/MontrealCorpusTools/Montreal-Forced-Aligner) |
| aeneas | Alineación texto-audio y creación de subtítulos | [GitHub](https://github.com/readbeyond/aeneas) |
| SpeechBrain | Toolkit para tareas de voz, embeddings y clasificación | [GitHub](https://github.com/speechbrain/speechbrain) |
| NeMo Speech | Componentes de voz, ASR y datasets | [Docs](https://docs.nvidia.com/nemo/speech/) |
| librosa | Análisis de señales, pitch, espectrogramas y features | [GitHub](https://github.com/librosa/librosa) |
| torchaudio | Procesamiento de audio basado en PyTorch | [Docs](https://pytorch.org/audio/stable/index.html) |
| soundfile | Lectura/escritura de audio en Python | [GitHub](https://github.com/bastibe/python-soundfile) |
| pydub | Manipulación sencilla y edición programática de clips | [GitHub](https://github.com/jiaaro/pydub) |
| SoX | Procesamiento de audio desde CLI | [Sitio oficial](https://sourceforge.net/projects/sox/) |
| phonemizer | Convierte texto en fonemas para algunos pipelines de TTS | [GitHub](https://github.com/bootphon/phonemizer) |
| espeak-ng | Motor de fonemización y voz base de varios sistemas | [GitHub](https://github.com/espeak-ng/espeak-ng) |
| gruut | Herramientas de normalización y fonemización para TTS | [GitHub](https://github.com/rhasspy/gruut) |

---

## 7. Edición, mezcla, masterización y exportación (local)

| Herramienta | Uso | Enlace |
|---|---|---|
| Audacity | Escucha crítica, edición, reducción de ruido, EQ y mezcla | [Sitio oficial](https://www.audacityteam.org/) |
| Audacity manual | Documentación de edición y efectos | [Manual](https://manual.audacityteam.org/) |
| FFmpeg | Cortar, normalizar, mezclar, ajustar sample rate, concatenar y exportar a video | [Sitio oficial](https://ffmpeg.org/) |
| FFmpeg filters | Filtros de audio, loudness, EQ, compresión, fades y ducking | [Documentación](https://ffmpeg.org/ffmpeg-filters.html) |
| FFmpeg formats | Contenedores/códecs de salida | [Documentación](https://ffmpeg.org/ffmpeg-formats.html) |
| Rubber Band | Time-stretch y pitch-shift de audio | [Sitio oficial](https://breakfastquay.com/rubberband/) |
| REAPER | DAW con periodo de evaluación y licencia comercial; no clasificarlo como open source | [Sitio oficial](https://www.reaper.fm/) |
| Ardour | DAW open source para grabación y mezcla | [Sitio oficial](https://ardour.org/) |
| Blender VSE | Editor secuencial para audio/video dentro de Blender | [Manual](https://docs.blender.org/manual/en/latest/video_editing/index.html) |
| GStreamer | Pipeline multimedia programable | [Sitio oficial](https://gstreamer.freedesktop.org/) |
| SoX effects | Procesamiento simple por CLI | [Manual](https://sox.sourceforge.net/sox.html) |

### Flujo mínimo de mezcla

1. Genera tomas separadas por escena, no un audio monolítico.
2. Escucha cada toma con auriculares y selecciona la mejor interpretación antes de montar el video.
3. Verifica las palabras con ASR y revisa manualmente nombres propios y números.
4. Elimina solo silencios sobrantes; conserva pausas dramáticas y respiraciones que parezcan naturales.
5. Mezcla la música por debajo de la voz, normaliza loudness y limita picos sin aplastar la dinámica.
6. Sincroniza y exporta con FFmpeg; archiva WAV maestro y MP4 final.

---

## 8. Interfaces locales y formas de servir los modelos

| Recurso | Uso | Enlace |
|---|---|---|
| LocalAI | Servir modelos locales mediante una API compatible con varios clientes | [Sitio oficial](https://localai.io/) |
| LocalAI — audio | Capacidades de audio/TTS soportadas según versión | [Documentación](https://localai.io/features/text-to-audio/) |
| Pinokio | Instalador/gestor de aplicaciones de IA locales; revisa cada receta antes de ejecutarla | [Sitio oficial](https://pinokio.computer/) |
| Hugging Face Transformers | Biblioteca de inferencia para modelos compatibles | [GitHub](https://github.com/huggingface/transformers) |
| Hugging Face TTS tasks | Índice de modelos, tareas y documentación de audio | [Docs](https://huggingface.co/docs/transformers/tasks/text-to-speech) |
| Hugging Face model hub | Buscar modelos, demos, tarjetas y licencias | [Modelos](https://huggingface.co/models?pipeline_tag=text-to-speech) |
| Gradio | Crear UI local para probar modelos y comparar tomas | [GitHub](https://github.com/gradio-app/gradio) |
| FastAPI | Exponer un backend local de síntesis a tu pipeline de video | [Docs](https://fastapi.tiangolo.com/) |
| Docker | Empaquetar el servicio de TTS reproduciblemente | [Docs](https://docs.docker.com/) |
| PyTorch | Runtime común de varios modelos TTS locales | [Sitio oficial](https://pytorch.org/) |
| NVIDIA CUDA | Aceleración en GPU NVIDIA | [Docs](https://docs.nvidia.com/cuda/) |

---

## 9. Tutoriales, documentación y papers para estudiar

| Recurso | Qué aprender | Enlace |
|---|---|---|
| VoxCPM | Setup, diseño de voces, clonación controlable e inferencia | [README oficial](https://github.com/OpenBMB/VoxCPM#readme) |
| Qwen3-TTS | Modelos, ejemplos, instrucciones y demos | [README oficial](https://github.com/QwenLM/Qwen3-TTS#readme) |
| Chatterbox | Uso general, controles de expresividad y variantes regionales | [README oficial](https://github.com/resemble-ai/chatterbox#readme) |
| IndexTTS | Instalación, inferencia y configuración de emociones | [README oficial](https://github.com/index-tts/index-tts#readme) |
| Kokoro | Instalación, voces y ejemplos | [README oficial](https://github.com/hexgrad/kokoro#readme) |
| OpenVoice | Clonación zero-shot y control de estilo | [README oficial](https://github.com/myshell-ai/OpenVoice#readme) |
| F5-TTS | Instalación, inferencia y condiciones de licencia | [README oficial](https://github.com/SWivid/F5-TTS#readme) |
| Fish Speech | Instalación y guía por idioma | [README oficial](https://github.com/fishaudio/fish-speech#readme) |
| Coqui XTTS | API de Python, idiomas y licencia del modelo | [Docs](https://docs.coqui.ai/en/latest/models/xtts.html) |
| Piper | CLI, voces, servidor y entrenamiento | [README oficial](https://github.com/OHF-Voice/piper1-gpl#readme) |
| Gemini speech generation | Control con metadatos de estilo y tags vocales en línea | [Tutorial oficial](https://ai.google.dev/gemini-api/docs/speech-generation) |
| Gemini pricing | Comparar cuota gratis y tarifas antes de usar nube | [Pricing oficial](https://ai.google.dev/gemini-api/docs/pricing) |
| Hugging Face Audio Course | Fundamentos de audio/voz con modelos abiertos | [Curso](https://huggingface.co/learn/audio-course) |
| TTS Arena | Comparar modelos por preferencia perceptual, cuando esté activa y tenga modelos disponibles | [Arena](https://huggingface.co/spaces/TTS-AGI/TTS-Arena) |
| OpenVoice paper | Método y diseño del sistema de clonación de voz | [arXiv](https://arxiv.org/abs/2312.01479) |
| F5-TTS paper | Base técnica del modelo F5-TTS | [arXiv](https://arxiv.org/abs/2410.06885) |
| StyleTTS2 paper | Síntesis de habla con estilo | [arXiv](https://arxiv.org/abs/2306.07691) |
| VALL-E X paper | Clonación zero-shot multilingüe | [arXiv](https://arxiv.org/abs/2303.03926) |
| RAVDESS paper/data | Reconocimiento de expresiones vocales/emoción | [Zenodo](https://zenodo.org/records/1188976) |
| Common Voice | Cómo contribuir audio y revisar las condiciones del corpus | [Proyecto](https://commonvoice.mozilla.org/) |

---
## 11. Esquema recomendado para `generative-expressive-voiceover`

La skill debería aceptar un brief sencillo:

```yaml
language: es
locale: es-CO
region: Cali
emotion: suspense
emotion_arc:
  - curiosity
  - unease
  - fear
  - chilling_resolution
voice:
  gender_presentation: masculine
  age_impression: mature
  timbre: warm_low
  accent_strength: natural
performance:
  pace: slow_with_contrasts
  pauses: dramatic
  emphasis: selective
  avoid: [robotic, exaggerated, caricatured_accent]
render:
  local_only: true
  takes_per_scene: 3
  preserve_scene_segments: true
  output: [wav, srt, json_manifest]
```

La salida debería incluir por cada escena: texto exacto, motor/modelo y versión, descripción de voz, instrucciones emocionales, referencia autorizada si existe, ruta del WAV, duración, timestamps, transcripción de validación y evaluación humana. La evaluación de acento y naturalidad no debería delegarse únicamente al mismo modelo que generó el audio.


---

*Catálogo curado para investigación y prototipado. Los enlaces de GitHub/Hugging Face pueden cambiar, los modelos pueden retirarse o actualizarse y las condiciones de uso pueden variar entre versiones. Este documento no sustituye la revisión legal de licencias y consentimiento.*
