# generative-creative-engine

Marketplace con un plugin, **creative-mastery**, para generar **videos one-shot por código**. Pides un video y sale un MP4 terminado, con voz sintética, música procedural, efectos y subtítulos palabra a palabra. Por dentro, el agente escribe la pieza en HTML + GSAP + Canvas y el motor la renderiza localmente con Chrome headless y ffmpeg.

Es hermano de [generative-clean-software](https://github.com/Sebastian-411/generative-clean-software) (`architecture-mastery`). Tiene la misma estructura multi-host y el mismo principio: **cada paso tiene que justificarse**, y la revisión la hace el agente con números e imágenes antes de entregar, no el usuario a mitad de camino.

- **Sin claves de API ni GPU.** ffmpeg viene incluido. La voz usa edge-tts (gratis, necesita internet al sintetizar) o Piper (offline).
- **Determinista.** Cada fotograma es una función pura del tiempo, así que el render siempre coincide con la vista previa.
- **QA automático.** Revisa determinismo, texto cortado o ilegible, zona segura, tramos muertos, destellos, recursos rotos y loudness.

Funciona en **Claude Code**, **Cursor**, **Codex** y **OpenCode**.

## Instalación

### Claude Code

```
/plugin marketplace add Sebastian-411/generative-creative-engine
/plugin install creative-mastery@creative-mastery
```

### Codex

```
codex plugin marketplace add Sebastian-411/generative-creative-engine
```

Los agentes de Codex viven en `.codex/agents/`. Para usarlos en otro proyecto, copia esa carpeta.

### Cursor

En **Customize**, importa el repo con *From GitHub Repository*. Cursor detecta `.cursor-plugin/marketplace.json`.

### OpenCode

Clona el repo. `opencode.json` declara las skills y los 5 agentes.

### Motor (una vez por máquina)

```
node plugins/creative-mastery/skills/video-engine/engine/setup.mjs
```

Instala `playwright-core`, `ffmpeg-static` y `gsap` en `~/.generative-creative-engine` (cámbialo con `CREATIVE_ENGINE_HOME`) y además edge-tts. Usa el Chrome o Edge instalado; si no hay ninguno, usa el Chromium de Playwright o el que indiques en `CHROME_PATH`. Si te saltas este paso, el agente lo corre solo la primera vez que lo necesita.

Requisitos: Node 18+, Chrome o Edge, y Python 3 solo si el video lleva voz.

**Voz expresiva (opcional, recomendado)**: `node plugins/creative-mastery/skills/video-engine/engine/setup-voice.mjs --dir D:i-models` instala Chatterbox (local, MIT, ~8 GB) y faster-whisper. Corre con GPU NVIDIA de 6 GB o en CPU. Luego crea voces con acento: `node .../voices.mjs kit`. Opcional: Gemini TTS gratis en la nube (`voices.mjs config --gemini-key …`).

## Uso

```
hazme un short de 25 s explicando cómo funciona el cifrado de extremo a extremo, en papel recortado
```

La skill `video-oneshot` hace todo el recorrido sin pedirte aprobaciones:

1. brief y guion
2. verificación de datos
3. voz
4. animación anclada a cada palabra
5. QA y hoja de contacto
6. corrección (máximo 2 rondas)
7. render y entrega con números

Las piezas quedan en `videos/<slug>/`, con el entregable en `render/final.mp4`.

¿Prefieres ver el guion y el look antes del render? Pide **modo estudio**.

## Qué incluye

| Skill | Para qué |
|---|---|
| `video-oneshot` | Orquestador: pedido → MP4 en una pasada |
| `video-engine` | El motor: contrato de la pieza, API de `stage`, comandos, kit de papel, plantillas |
| `story-grammar` | Formatos narrativos, arco, guion para voz sintética, tabla de beats |
| `motion-craft` | Duraciones, curvas, coreografía, cortes en movimiento, tics prohibidos |
| `video-styles` | 8 estilos con paleta, tipografía, reglas y receta |
| `voice-director` | Voz que actúa: emoción/intensidad/ritmo por línea, voces con acento (caleño, paisa, venezolano…) clonadas de grabaciones autorizadas, varias tomas verificadas con Whisper |
| `trend-radar` | Radar diario de tendencias (Google Trends/News por país, Wikipedia, Bluesky, YouTube, HN, GitHub) con score y evidencia en `knowledge/trends/latest.md` |
| `sound-design` | Música procedural, efectos, ducking, −14 LUFS |
| `video-review` | Rúbrica de 8 preguntas, hallazgos con evidencia, rondas |

| Agente | Acceso | Rol |
|---|---|---|
| `scriptwriter` | escribe `brief.md` y `script.json` | Historia y guion medido para voz |
| `art-director` | escribe `design.md` y la prueba de look | Paleta, tipografía y reglas del look |
| `motion-designer` | lectura y escritura | Anima la pieza o una escena hasta que pasa el QA |
| `critic` | solo lectura | Segundo par de ojos y veredicto de publicación |
| `fact-checker` | solo lectura y web | Verifica datos y licencias |
| `trend-scout` | lectura, web y radar | Convierte el radar diario en 3–5 ideas con evidencia, ángulo y ventana |

Para piezas cortas, el orquestador trabaja solo. Los agentes entran cuando la pieza es larga, se va a publicar o trae marca o referencias.

### Estilos

| Estilo | Plantilla base |
|---|---|
| Papel recortado / stop motion | `paper-explainer` |
| Editorial cinético | `voice-short` |
| Lanzamiento oscuro | `kinetic-promo` |
| Risografía | receta |
| Collage editorial tipo Vox | receta |
| Explicador plano | receta |
| Historia con datos | receta |
| Trazo de línea | receta |

### Comandos del motor

Todos están en `plugins/creative-mastery/skills/video-engine/engine/`:

```
new.mjs <dir> --template voice-short|paper-explainer|kinetic-promo|blank
voice.mjs <dir>      # script.json dirigido → tomas verificadas → audio/voice.wav + voice.json + review/voice.html
voices.mjs list|add|kit|config   # biblioteca de voces con acento
preview.mjs <dir>    # vista previa en vivo
check.mjs <dir>      # QA automático → review/auto.md
stills.mjs <dir>     # fotogramas + contact-sheet.png
mix.mjs <dir>        # música + voz + efectos → audio/mix.wav (−14 LUFS)
render.mjs <dir>     # MP4 (--draft a mitad de resolución)
build.mjs <dir>      # check → mix → render → verificación → hoja de contacto
```

## Cómo está empaquetado

```
.claude-plugin/marketplace.json          # Claude Code
.cursor-plugin/marketplace.json          # Cursor
.agents/plugins/marketplace.json         # Codex
opencode.json                            # OpenCode (skills + agentes)
AGENTS.md                                # instrucciones de proyecto (todos)
plugins/creative-mastery/
  plugin.json                            # Agent Plugins 1.0 (portable)
  .claude-plugin/ .cursor-plugin/ .codex-plugin/
  agents/                                # canónico — Claude + Cursor
  skills/                                # canónico — todos los hosts
    video-engine/engine/                 # el motor (Node)
    video-engine/templates/              # plantillas que funcionan de punta a punta
.codex/agents/                           # overlay Codex (TOML)
ref/                                     # repos, voces y sonido estudiados (links-*.md)
```

## Créditos

El diseño del motor y de las reglas se inspira en proyectos abiertos estudiados en `ref/`, en especial:

- [cth9191/animate](https://github.com/cth9191/animate) (MIT)
- [illodev/drawn-by-code](https://github.com/illodev/drawn-by-code) (MIT)
- [FavioVazquez/showtime](https://github.com/FavioVazquez/showtime) (MIT)
- [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) (Apache-2.0)
- motionmaxxing, claude-motion-design y LottieFiles motion-design-skill

No se copió código de ellos: el motor, los kits y la música procedural se escribieron para este repo.

## Contribuir

Cada skill nueva va en `plugins/creative-mastery/skills/<nombre>/SKILL.md`, con un `description` que diga cuándo SÍ y cuándo NO usarla. Cada agente nuevo va en `plugins/creative-mastery/agents/` y lleva además su entrada en `opencode.json` y su `.codex/agents/<nombre>.toml`. Una plantilla nueva tiene que pasar `build.mjs` sin fallas.

## Licencia

MIT — ver `LICENSE`.
