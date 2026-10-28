# Investigación: pipelines agénticos para video one-shot (6 fuentes externas)

**Alcance.** Estudio de 5 repositorios + 1 run de evaluación externa, para destilar patrones concretos (orquestación, máquinas de estado, pipelines de asset/voz/subtítulos, abstracción de providers, planeación de escenas, reintentos/recuperación, corrección de render, QA/evals) aplicables al motor local one-shot de `creative-mastery` (HTML + GSAP/Canvas → Chrome headless + ffmpeg, voz sintética local). **Solo investigación; no se editó el plugin.** Fecha de acceso: 2026-10-27.

**Fuentes e inventario (con licencia):**

| Fuente | Qué es | Licencia | Tamaño (al acceso) |
|---|---|---|---|
| [OpenMontage](https://github.com/calesthio/OpenMontage) | Sistema agéntico de producción de video: 12 pipelines YAML + skills directores + registro de 100+ herramientas, Remotion/HyperFrames/FFmpeg | **AGPL-3.0** | 72.5k stars, 497 commits |
| [onetake](https://github.com/feitangyuan/onetake) | Claude Agent Skill: films de motion de una sola toma (un take continuo), un HTML `__seek(t)`, biblioteca de 39 movimientos medidos, oráculo de continuidad | **PolyForm Noncommercial 1.0.0** | 3.4k stars, 20 commits |
| [Run de test de onetake](https://agentskillshub.top/best-runs/video/feitangyuan__onetake.html) | Evaluación estandarizada IA-vs-IA (brief único, sin API keys, checks programáticos) | La página referencia el repo `zhuyansen/agent-skills-hub` (licencia del hub no verificada — ver Gaps) | — |
| [motion-video-kit](https://github.com/echris6/motion-video-kit) | Skill kit para videos comerciales premium: loop "Gauntlet" (críticos independientes), gramática de motion de 28 films de lanzamiento, calidad medible, círculos y scripts de medición | **MIT** | 1.2k stars, 7 commits |
| [Raven](https://github.com/EverMind-AI/Raven) | "Harness of harnesses" multi-agente para RSI (auto-mejora recursiva); DAGs, Curator/Evolver, conexiones ACP/CLI a 13 agentes | **Apache-2.0** | 5.9k stars, 1,951 commits |
| [vox-director](https://github.com/Alisa0808/vox-director) | Skill agéntica: tema → video collage tipo Vox end-to-end en Atlas Cloud + ffmpeg; un `beats.json` por proyecto; un script por etapa | **MIT** | 2.5k stars, 30 commits |

Se inspeccionaron README + archivos clave reales: `onetake` (SKILL.md completo y `scripts/verify_promo.py` con código verificado), `vox-director` (SKILL.md completo con schema de `beats.json`), `motion-video-kit` (SKILL.md completo), `OpenMontage` (README + `AGENT_GUIDE.md` completo), `Raven` (README). Lo no leído a nivel código queda en **Gaps**.

---

## Pregunta clave 1 — ¿Qué patrones reducen tasa de fallas e intervención manual?

### Takeaway
Los cinco proyectos convergen en el mismo patrón: **congelar el estado por etapa en artefactos canónicos, verificar disponibilidad antes de gastar, hacer los reintentos y fallbacks automáticos dentro de una capa de provider, y correr una QA programática post-render que falte/dé FAIL antes de que un humano mire**. Los dos proyectos con menor intervención reportada (OpenMontage en gobernanza, vox-director en operaciones de API) convierten cada falla aprendida en un guardia constante dentro de un script o skill, no en una regla suelta.

### Cited Findings

**Máquinas de estado y checkpoints**

- OpenMontage: "There is no code orchestrator. Your AI coding assistant IS the orchestrator" — Python solo expone herramientas y persistencia; el flujo canónico es `research -> proposal -> script -> scene_plan -> assets -> edit -> compose`. — [README](https://github.com/calesthio/OpenMontage)
- Checkpoints por etapa en `projects/<project-id>/checkpoint_<stage>.json` con estados `completed | failed | awaiting_human | in_progress`; `lib/checkpoint.py` **rechaza** marcar `completed` una etapa con gate sin `human_approved=True` (GATE VIOLATION); los checkpoints reemplazados se archivan automáticamente en `projects/<project-id>/history/` para que re-runs no destruyan historia. — [AGENT_GUIDE.md](https://github.com/calesthio/OpenMontage/blob/main/AGENT_GUIDE.md)
- "Approval is per-gate": un "sí" temprano no cubre gates posteriores; la pre-autorización completa debe registrarse como entrada de `decision_log` (`approval_policy`). — [AGENT_GUIDE.md](https://github.com/calesthio/OpenMontage/blob/main/AGENT_GUIDE.md)
- Decision log **append-only** clave-tipo por par `(category, subject)`: si una decisión ya logueada cambia (switch de voice/provider/runtime), se **apendea una nueva entrada con el mismo subject**, nunca se edita la vieja; la board marca "revised". Editar solo el artefacto downstream y no re-loguear es un defecto formal. — [AGENT_GUIDE.md](https://github.com/calesthio/OpenMontage/blob/main/AGENT_GUIDE.md)
- vox-director invierte el diseño: un único archivo `beats.json` por proyecto (`out/<project>/`) es la fuente de verdad que reciben **todos** los scripts de etapa (`keyframes.py`, `clips.py`, `audio.py`, `assemble.py`), con los defaults y pinos declarativos (`voice_id`, `motion_style`, `constraints`, `mix` de audio, `captions`, `watermark`). — [SKILL.md](https://github.com/Alisa0808/vox-director/blob/main/SKILL.md)
- Idempotencia: `keyframes.py` "skips any shot that already has a `keyframe_url`" — re-runear agrega el shot nuevo sin regenerar lo caro. — [SKILL.md](https://github.com/Alisa0808/vox-director/blob/main/SKILL.md)

**Preflight y verificación de capacidades en vivo**

- Preflight obligatorio en OpenMontage: `registry.discover()` + `provider_menu_summary()` que presenta un menú de capacidades tipo "Video Generation: 0/13 configured", con `runtime_warnings` verbatim (p. ej. "hyperframes: npm package not resolvable") y estados `passed | degraded | blocked` — no se empieza producción hasta que el usuario entiende el envolvente real. — [AGENT_GUIDE.md](https://github.com/calesthio/OpenMontage/blob/main/AGENT_GUIDE.md)
- "Model IDs drift — fetch the live list first": vox-director consulta `GET https://api.atlascloud.ai/api/v1/models` (sin auth, filtra `display_console: true`) **antes de cada corrida** en vez de confiar en IDs quemados. — [SKILL.md](https://github.com/Alisa0808/vox-director/blob/main/SKILL.md)
- Setup offer protocol: herramientas ausentes se agrupan por esfuerzo de arreglo (env-var de 1 min → ofrecer configurar; GPU/modelo → anotar y seguir), y "if the user declines setup, proceed with the best available path — no nagging". — [AGENT_GUIDE.md](https://github.com/calesthio/OpenMontage/blob/main/AGENT_GUIDE.md)

**Provider abstraction, reintentos y fallbacks**

- vox-director: toda llamada a API pasa por una capa de provider (`scripts/provider.py`, backend pluggable vía `"provider"` en beats.json); **`run_jobs()` hace submit/poll con auto-resubmit cuando un job se estanca o falla** — los scripts de etapa no cambian. — [SKILL.md](https://github.com/Alisa0808/vox-director/blob/main/SKILL.md)
- Fallbacks por garantía de contenido: para gente real/marcas Omni y Seedance **bloquean** la petición, así que el schema declara `"video_model": "kwaivgi/kling-video-o3-pro/image-to-video"`; en A-roll, todo beat que Omni rechaza reintenta automáticamente en `bytedance/seedance-2.0/reference-to-video` (`video_model_fallback`); en C-roll el fallback de keyframe es `openai/gpt-image-2/edit`. — [SKILL.md](https://github.com/Alisa0808/vox-director/blob/main/SKILL.md)
- OpenMontage: 3 selectores (`tts_selector`, `image_selector`, `video_selector`) que **auto-descubren** providers por capability del registro — agregar un provider tool los habilita sin tocar código del selector — y rankean con **7 dimensiones ponderadas**: task fit 30%, output quality 20%, control 15%, reliability 15%, cost efficiency 10%, latency 5%, continuity 5%; el ganador y sus alternativas quedan en el decision log con confianza. — [README](https://github.com/calesthio/OpenMontage) y [AGENT_GUIDE.md](https://github.com/calesthio/OpenMontage/blob/main/AGENT_GUIDE.md)
- Regla "Motion-Required Requests": si el entregable aprobado depende de movimiento real (trailers, hype edits), el fallback a stills/Ken Burns está **prohibido** sin aprobación explícita; el swap silencioso de runtime (`render_runtime`) es una violación de gobernanza — si falla, hay que escalar el blocker con estructura fija (què se intentó, qué falló, causa, opciones, recomendación) y esperar. — [AGENT_GUIDE.md](https://github.com/calesthio/OpenMontage/blob/main/AGENT_GUIDE.md)
- Economicidad de gates: `host_clips.py` "prints a cost estimate and stops; show it to the user, then re-run with `--yes`" — consentimiento explícito antes de gastar; en OpenMontage, presupuesto con estimate→reserve→reconcile, modos `observe|warn|cap`, umbral por acción $0.50 por defecto y cap total $10. — [SKILL.md vox](https://github.com/Alisa0808/vox-director/blob/main/SKILL.md) y [README OpenMontage](https://github.com/calesthio/OpenMontage)

**QA post-render automático (faltar antes que el humano vea)**

- OpenMontage post-render self-review: "ffprobe validation, extracts frames at 4 positions to check for black frames and broken overlays, analyzes audio levels for silence and clipping, verifies the delivery promise was honored, and checks subtitle presence. If the review fails, the video is not presented." — [README](https://github.com/calesthio/OpenMontage)
- OpenMontage pre-compose validation: bloquea el render si se viola la delivery promise (video "motion-led" con 80% de stills), si el risk-score de slideshow es crítico o falta el renderer; scoring de riesgo slideshow con 6 dimensiones (repetición, decorativos, weak motion, shot intent, overreliance tipográfica, claims cinematográficos sin soporte). — [README](https://github.com/calesthio/OpenMontage)
- Verificación de los requisitos de entrega del runtime elegido **antes** de diseñar el plan: `composition_runtimes` del preflight es la fuente de verdad del HARD RULE "Present Both Composition Runtimes". — [AGENT_GUIDE.md](https://github.com/calesthio/OpenMontage/blob/main/AGENT_GUIDE.md)
- onetake: `scripts/verify_promo.py` (código leído completo) corre 9 legs con thresholds exactos y exit code 1: `cadence` (CV de duraciones de shot ≥ 0.25), `rest` (≥ 25% de frames muertos a <0.5 mean abs diff a 320px + un tramo quieto ≥ 1.0 s), `burst` (ventana 1.5 s con ≥ 3 cambios > 8; solo FAIL si la referencia lo tiene), `not-flat` (advisory), `audio` (pico ≤ −3 dBFS, 0 muestras clippeadas, ≥ 15% de frames de 1/12 s en silencio), `continuity` (carry score vía probe.py: FAIL < 0.5, WARN < 0.7), `curves` (FAIL si algo viaja > 80 px/frame sin shutter blur), `framing` (FAIL si un id declarado en `__meta.inFrame` sale de cuadro en cualquier muestreo de su ventana; modo `'whole'` pide estar completo). — [verify_promo.py](https://github.com/feitangyuan/onetake/blob/main/scripts/verify_promo.py)
- El framing leg cuenta la historia de su valor: "The one-dot film's first camera render lost its dot behind a snap the camera's spring couldn't follow; nothing else caught it." — [verify_promo.py](https://github.com/feitangyuan/onetake/blob/main/scripts/verify_promo.py)

**Evaluación externa estandarizada (IA-vs-IA)**

- [agentskillshub](https://agentskillshub.top/best-runs/video/feitangyuan__onetake.html) corre todos los skills bajo **el mismo brief** (promo 15 s, 5 líneas fijas de copy en pantalla, 1920×1080 a 30 fps, sandbox sin API keys) y valida con checks programáticos de 4 ítems: (1) renderiza a archivo reproducible (H.264), (2) duración/tamaño/fps pedidos (15.0 s, 1920x1080, 30.0 fps), (3) 5 de 5 líneas legibles, (4) "the picture moves" (45% de pares de frames muestreados estaban quietos). El script de scoring público: `ops/video-runs/score_video.py` en `zhuyansen/agent-skills-hub`.
- El run de onetake terminó en 8.5 min con PASS en los 4 checks; el agente reportó un defecto encontrado inspeccionando stills ("the button was growing over line 4 while it faded. I fixed that and re-rendered") y una lista de decisiones tomadas sin preguntar, cada una justificada contra el brief. — [página del run](https://agentskillshub.top/best-runs/video/feitangyuan__onetake.html)

**QA con críticos independientes (motion-video-kit)**

- "The Gauntlet loop: builder ≠ judge, fresh critics on the actual render, item-by-item verification, and a ledger." El builder nunca nota su propio trabajo: cada componente y cada corte completo va a un crítico fresco que solo ve el render, el brief y las referencias. — [SKILL.md](https://github.com/echris6/motion-video-kit/blob/main/business-motion-film/SKILL.md)
- Contramedida de auto-engaño: después de arreglar, va a "a *new* critic that verifies the previous list item by item" — verificación independiente ítem por ítem, no autoreporte. Paro en "the quality bar or when gains become cosmetic (usually 3–5 rounds)". — [SKILL.md](https://github.com/echris6/motion-video-kit/blob/main/business-motion-film/SKILL.md)
- "No bugs is not good": "Clean, smooth and error-free versions still get rejected for being basic, empty or slow. Measure (`scripts/`) and judge creatively." La barra estética es independiente de la barra de defectos. — [SKILL.md](https://github.com/echris6/motion-video-kit/blob/main/business-motion-film/SKILL.md)
- Ledger de generación: modelo, prompt, seed, job id y ventana aceptada por cada asset "never commit API keys"; entrega con Gauntlet ledger (qué encontró cada crítico → qué cambió → números before/after con confesión honesta de qué se midió vs se escuchó, muestreado vs exhaustivo). — [SKILL.md](https://github.com/echris6/motion-video-kit/blob/main/business-motion-film/SKILL.md)
- Deadline mode documentado: "When time is cut, switch to deadline mode: hard stops, integrate, one critic, top fixes, deliver." — [SKILL.md](https://github.com/echris6/motion-video-kit/blob/main/business-motion-film/SKILL.md)

**Guardias de fallas aprendidas.constantes en código**

- vox-director tiene toda una skill de conocimiento de fallas (`references/models-and-gotchas.md`): "every API / ffmpeg gotcha, already solved... most failures are already documented there. Read it before debugging any failure". — [SKILL.md](https://github.com/Alisa0808/vox-director/blob/main/SKILL.md)
- Guardias derivados de fallas reales, baked-in en el pipeline: `anchor_freeze` inyectado en cada prompt de motion porque "the video stage can re-letter a product label (observed: 'PARFUM' → 'PAREUM') or re-time a face"; poses a body-not-face; halftone scopeado al fondo; wardrobe lock para retrato. "Prompt rules that are baked in (all three cost a re-run to learn)". — [SKILL.md](https://github.com/Alisa0808/vox-director/blob/main/SKILL.md)
- Reglas duras de onetake que cada una costó un corte rechazado (código cuenta): "Never cut on a metronome", "Never replace a beat — carry it", "Fast moves need the shutter", "Everything deterministic. `__seek(t)` twice must give the same frame — the shutter depends on it; sims are precomputed from a fixed seed; no `Math.random()` on the render path (`OM.rng(seed)`)". — [SKILL.md](https://github.com/feitangyuan/onetake/blob/main/SKILL.md)

### Inferences
- Nuestro motor ya cumple la parte determinista (`check.mjs`, fotograma función pura de t); lo que aún no tiene es **ninguno de los oróculos numéricos post-render** (cadence/rest/audio/framing/carry) ni el concepto de **verification pass** con crítico fresco — son directamente trasplantables y baratos, pues dependen de ffprobe + frame sampling que ya usamos.
- El patrón "cada falla aprendida se convierte en guardia constante" ya existe en casa como `lessons.md` (creative-contract); lo que aportan estas repos es que los guardias vivan **en los scripts/contrato de trabajo**, no solo en la skill: p.ej. un campo `inFrame` en escenas o guardias de cotización en prompts de look.
- El auto-resubmit stalled-jobs de vox es el análogo exacto de hacer reintentos idempotentes en nuestra síntesis de voz y render — hoy el usuario repite la pieza a mano.

### Gaps
- No leí el código de `lib/checkpoint.py`, `tools/tool_registry.py` ni el YAML de ningún pipeline de OpenMontage: el comportamiento de gates/scoring está constatado por README + AGENT_GUIDE, no por código.
- No leí `scripts/render.py` ni `scripts/probe.py` de onetake (solo verify_promo.py completo y SKILL.md); el cálculo del carry score queda parcialmente substante.
- No leí `references/models-and-gotchas.md`, `references/gauntlet.md` ni los scripts de medición de motion-video-kit; estas skills/textos se citan desde SKILL.md y README.
- No leí `scripts/provider.py` de vox-director: la conducta de auto-resubmit procede de SKILL.md.
- Licencia del repo `zhuyansen/agent-skills-hub` ( donde vive `score_video.py`) no verificada.
- Los conteos de stars/forks son del estado de los repos al 2026-10-27 y solo indican tamaño de adopción, no calidad verificada.

---

## Pregunta clave 2 — ¿Qué patrones soportan un relato visual más fuerte?

### Takeaway
Tres patrones concretos se repiten en los proyectos cuyo output no se siente "PPT": **(a) medir el corte en números antes y después** (referencia deconstruida, ritmo, continuidad), **(b) diseñar cada límite entre beats como un traspaso de objeto (carry), con reglas numéricas de ritmo (varianza, pausa, quieto)**, y **(c) cámara "operator" con reglas** (adelantarse al sujeto, whip antes de que aterrice, shake al aterrar, quietud como contraste). onetake es el único que convierte el anti-slideshow en un número (carry score) y probablemente es el destino natural de QA que hoy hacemos con la rúbrica de 12 preguntas del critic.

### Cited Findings

**Continuidad como número (onetake)**

- El problema enunciado: "Each shot can look fine and the whole still reads like a slideshow, because nothing connects one beat to the next: scenes *replace* each other." La solución: en cada límite "something on screen survives and visibly becomes the next beat". — [README](https://github.com/feitangyuan/onetake)
- Carry scores reportados del mismo film: v1 "perfect rhythm, still a slideshow" → **0.00** (rechazado); v2 → **0.40** (rechazado); v3 "every beat grows out of the last" → **0.75** (aceptado); onetake launch → **0.83**. Contradice la intuición de que el ritmo basta. — [README](https://github.com/feitangyuan/onetake)
- El leg `continuity` en el código falla beats que se reemplazan (ingend: "the only leg that failed both rejected Pocket Weather cuts (v1 0.00, v2 0.40) while the accepted films passed (v3 0.75; motion-web 0.56, a warning)"). — [verify_promo.py](https://github.com/feitangyuan/onetake/blob/main/scripts/verify_promo.py)
- Ritmo también es número: "Vary shot length by ≥ 4× (0.25 s words next to 2.5 s holds). At least one stretch of near-silence in picture and sound... Small elements, big ground." — [SKILL.md](https://github.com/feitangyuan/onetake/blob/main/SKILL.md)
- En código: leg `cadence` exige CV ≥ 0.25 y el leg `rest` exige `still_ratio ≥ 0.25` con quiet stretch ≥ 1.0 s. — [verify_promo.py](https://github.com/feitangyuan/onetake/blob/main/scripts/verify_promo.py)

**Cámara "operator" con reglas explícitas (onetake)**

- "`OM.camera(t, keys)` puts the camera where each beat needs it — key the subject ~0.1 s ahead on `sineInOut`, key the landing point before a snap on `expoInOut` to whip to it, add a hand (slow two-sine float, zero in the holds) and `OM.shake` on every landing." Con helpers `__track` (cajas en pantalla), `__motion` (viaje para el render blur) y `__meta.inFrame` (qué no puede salir de cuadro). — [SKILL.md](https://github.com/feitangyuan/onetake/blob/main/SKILL.md)
- Case real: "with a still camera it was 「就缺灵动的跟踪运镜」; with a camera that chases what each beat frames — lagging, leaning, settling — it was 「运镜、镜头和物理都没问题」". — [SKILL.md](https://github.com/feitangyuan/onetake/blob/main/SKILL.md)

**Motion blur real y determinismo (onetake)**

- "Real motion blur. Every moving frame is several captures across an open 180° shutter, averaged in linear light. Fast moves smear instead of strobing." — [README](https://github.com/feitangyuan/onetake)
- Adaptativo: si la comp declara `window.__motion(t0,t1)` (máximo desplazamiento en pantalla por segmento), el render usa tantas capturas por frame como mantengan copias separadas 6 px (4–48); **un tope fijo de 8 bandas causó banding en un opening de 633 px/frame del film one-dot**. Números de costo: ~0.2 s por captura en Chrome headless, 103 s para 2,480 capturas en 8 workers; "tell the user the estimate before starting a long render". — [SKILL.md](https://github.com/feitangyuan/onetake/blob/main/SKILL.md)
- "Fast moves need the shutter. Over 80 px/frame without motion blur strobes into copies. render.py's default shutter is the fix; CSS blur is not." Y el leg `curves` del oráculo lo impone en código (>80 px/frame sin blur = FAIL). — [SKILL.md](https://github.com/feitangyuan/onetake/blob/main/SKILL.md) y [verify_promo.py](https://github.com/feitangyuan/onetake/blob/main/scripts/verify_promo.py)

**Gramática de motion con catálogo modido (motion-video-kit + onetake)**

- onetake: biblioteca de **39 movimientos medidos** (entradas, carries, contacto/sims en vivo, cámara y helpers de proyección, set de fluidos), cada uno "a function of time returning numbers for a DOM transform or a canvas call. Never re-derive a spring or an ease with fixed constants"; nombrados por t80 y elegidos mirando tabla de curvas ("One hand-rolled smootherstep everywhere makes every move the same soft S-curve; snaps (`ease.expoOut`, t80 .23) and springs are what lands"). — [SKILL.md](https://github.com/feitangyuan/onetake/blob/main/SKILL.md)
- motion-video-kit: "six rules and a catalog of 16 reusable mechanisms, plus notes on all 28 reference films"; storyboard rules numéricas: "12–15 distinct compositions for a 30s film. Vary scale: macro → wide → overhead → UI close-up → type impact. The lead subject fills 60–85% of the usable frame..., No small card floating in a big empty field. Every beat has a readable landing, then an accelerating exit. No holds without motion over ~0.6s." — [SKILL.md](https://github.com/echris6/motion-video-kit/blob/main/business-motion-film/SKILL.md)
- Firma sin nombre de técnica: "Name 3 signature transformations you can describe without effect names, e.g. 'the inspection photo becomes the report's hero image'". — [SKILL.md](https://github.com/echris6/motion-video-kit/blob/main/business-motion-film/SKILL.md)

**Handoff exacto entre "escenas"**

- "Hand objects across scenes at *exact* pixel coordinates, so the last frame of scene A equals the first frame of scene B for the carried object." (motion-video-kit, ensamblado con una root timeline y overlays proyectados de anchors 3D por frame en `templates/projected-overlays.js`). — [SKILL.md](https://github.com/echris6/motion-video-kit/blob/main/business-motion-film/SKILL.md)

**Planeación narrativa por capas (vox-director)**

- La skill separa las dos capas dominantes: `references/beat-layer.md` (la capa de relato: **14 arcos narrativos** — `timeline`, `pas`/`bab` para ads, `how_it_works`, `man_in_hole`... — + reglas de hook y pacing, hook de beat-1 ≤ 3 s) y `references/prompt-guide.md` (la capa de LOOK con presets de tema). "beats.json`" lleva `"arc": "timeline"` como campo de schema. — [SKILL.md](https://github.com/Alisa0808/vox-director/blob/main/SKILL.md)
- Números de cadencia: "cut every ~4–6 seconds; Shots run 3–6s; never let a single shot exceed ~7s"; la narración de un beat (~8–10 s) se reparte en **2 shots** (wide + detail), cortando visualmente a mitad de frase: "This is the single biggest rhythm win"; título solo en el wide shot. — [SKILL.md](https://github.com/Alisa0808/vox-director/blob/main/SKILL.md)
- `camera_move` no se repite entre beats adyacentes, `static` reservado al payoff; bold moves ({orbit, dolly_zoom, roll, whip}) "available, not banned — they can warp the flat art, so pair with `constraints: loose` and re-roll"; un hero element volando "**occasional** punch on a key beat, **not every shot** (a flyer in every frame reads as a formula)". — [SKILL.md](https://github.com/Alisa0808/vox-director/blob/main/SKILL.md)

**Tres conceptos como imágenes antes del beat sheet (onetake)**

- "A concept is one sentence about the *picture*, not the product... ('one element transforms through everything', 'one camera move through scale', 'a chain reaction')... what it rules out (no cards? no cuts?), and **its look**." Además: "Never default to the template's story" — un film nuevo sobre los beats del template se lee como el template "however good the craft" (hubo un caso que pasó el oráculo con carry 1.00 y fue devuelto por "没有创造力" = sin creatividad). — [SKILL.md](https://github.com/feitangyuan/onetake/blob/main/SKILL.md)

**Deconstrucción de referencia en números (onetake)**

- "Deconstruct the reference before touching anything (硬規則)": `analyze_ref.py` extrae mapa de energía, cortes, quietud, contact sheets y "motion line" (median t80 y smear) y "write down the numbers the film has to match". Ejemplo real: la referencia de motion-web era "34 % dead-still, 7 hard cuts en dos ráfagas, cada elemento pequeño con mucho negativo" — nada de eso se ve al ojo en una pasada. — [SKILL.md](https://github.com/feitangyuan/onetake/blob/main/SKILL.md)

**Orden de generación barato→caro con validación visual en el medio (vox-director)**

- "Verify each poster looks like a *real layered collage* before animating — re-roll cheap ($0.08) here rather than paying to animate a weak image." El look no se corrigue downstream: "if the poster isn't a rich collage, nothing downstream will save it". — [SKILL.md](https://github.com/Alisa0808/vox-director/blob/main/SKILL.md)

**UI real reconstruida, no grabada (onetake)**

- "the UI is rebuilt in HTML in the reference's own pixel frame. Every string lives in a table, every state is written by a pure `set(state)`, and the replica sits on the plane where the camera can close in at any zoom... the viewer must see the cause, not just the effect" (la mano se redibuja desde la ruta del puntero grabada). Con `UIK.timeWarp` para mapear narraciones de otro idioma sobre la timeline autoral, verificadas pixel-idénticas por `frame_diff.py`. — [SKILL.md](https://github.com/feitangyuan/onetake/blob/main/SKILL.md)

**Storytelling-bake-off con humano**

- vox: style bake-off — renderizar el mismo beat en 3–4 temas y elegir a ojo: "AI proposes, the library is the quality floor, the human decides"; onetake: mostrar 3 conceptos con su look y "let the user pick". En ambos, el sonido se puntúa veteran: onetake deja un solo material de sonido en una sala ("Every event getting its own synth tone is the audio version of the slideshow"), con pico −8 dBFS de SFX para que la música asiente, master a −16 LUFS; motion-video-kit exige back-timing de la música real para que su ending cae en el end card y "every cut on its beat", y siempre entregar una pista **music-only** para aislar quejas de audio. — [SKILL.md vox](https://github.com/Alisa0808/vox-director/blob/main/SKILL.md), [SKILL.md onetake](https://github.com/feitangyuan/onetake/blob/main/SKILL.md), [SKILL.md mvk](https://github.com/echris6/motion-video-kit/blob/main/business-motion-film/SKILL.md)

### Inferences
- La rúbrica cualitativa de 12 preguntas de `video-review` se puede apoyar en **4–5 números** que cualquier render nuestro puede producir (CV de shots, ratio de quietud, carry entre beats si nuestro stage declara los sujetos, peak/clipped de audio, pico px/frame vs blur) — convirtiendo la revisión en algo medible primero (el orden ya declarado en la skill: "medir primero").
- El carry score es lo que **nos falta**: nuestra calendarización de beats ya existe en `script.json`/stage.tl, y el stage de scene boundaries está bien definido; un "qué sobrevive a cada límite" como mandato de guion + pegunta de QA es un cambio barato con retorno grande en la percepción de oficio.
- El "component lab" de motion-video-kit y el "component Gauntlet antes de unirse a la pieza" se mapea a probar look/mood de una escena(o `look.json`) antes de probar la pieza completa — ya lo hacemos con stills; falta el pass de crítico independiente sobre el still mismo.

### Gaps
- No leí `probe.py` de onetake: el carry se reporta pero no conocemos su algoritmo exacto (p. ej. cómo puntúa coincidencias de objetos/cámara en límites) — reproducirlo vendría de código no auditado aquí.
- No leí los YAML de `pipeline_defs/` ni `skills/meta/reviewer.md` de OpenMontage; el detalle de quality_rules por pipeline es además.
- No leí `references/gauntlet.md` ni `critic-prompts.md` de motion-video-kit (los prompts de crítico listos para usar quedan a nivel de referencia relativa, no de cita directa).
- vox-director declara `beat-layer.md` con "14 narrative arcs" pero no leí el documento; el número es de SKILL.md (podría haber cambiado).

---

## Pregunta clave 3 — ¿Qué es overengineering para nuestro motor actual?

### Takeaway
Tres cosas son claramente sobreingeniería a nuestra escala (un motor local one-shot de HTML → MP4 con voz local): **un harness de RSI multi-agente persistente** (Raven), **un selector de providers con scoring de 7 dimensiones sobre decenas de APIs remotas** (OpenMontage) y **una board/dashboard con servidor** (Backlot). También lo es, a corto plazo, el modelo YAML→director-skill→checkpoints-enforced de OpenMontage: valioso para 12 pipelines multi-host, inadecuado para nuestro plugin que ya tiene orquestador implícito, skills y contrato creativo.

### Cited Findings
- Raven es explícitamente otro nivel de abstracción: "The Harness of Harnesses • built for RSI"; su loop se descompone en 4 asientos (Memory/Planning/Capability/Action) que un **Curator** reescribe; "nothing is installed before it is verified, and a failed check sends it back"; y un **Evolver** separado evalúa cambios de harness contra benchmarks antes de adoptarlos. Su showcase es un juego entero en ~4 días/42 rondas y experimentos de entrenamiento (172 runs/7 rondas sin crash): los costos de esa máquina no fit un pipeline de video one-shot. — [README](https://github.com/EverMind-AI/Raven)
- No es una herramienta de video: lo único video-afín en el repo es una skill `skills/git-story-film` listada en el árbol; el README no la describe (ver Gaps). — [README](https://github.com/EverMind-AI/Raven) y [tree](https://github.com/EverMind-AI/Raven/tree/main/skills)
- OpenMontage declara "12 pipelines, 100+ tools, 700+ agent skill and production-knowledge files", con machine de scoring 7-dimensiones y "60+ provider integrations"; nuestra realidad siendo única-stack local (GSAP/Canvas + edge-tts/Piper + ffmpeg) ganar ia poco de seleccionar entre providers que no usaremos. — [README](https://github.com/calesthio/OpenMontage)
- OpenMontage mismo admite el trade-off de su propio modelo rígido: su regla es "Do not bypass the pipeline. Never write ad-hoc scripts to call tools directly" — costo de entrada alto para cualquier expeción puntual; en comparación, onetake y vox-director son un skill + scripts que un agente lee y usa directo. — [AGENT_GUIDE.md](https://github.com/calesthio/OpenMontage/blob/main/AGENT_GUIDE.md)
- Backlot: "a local board that fills itself in as the pipeline runs... The board is an observer, never a blocker" — requiere un server local (`python -m backlot open <project-id>`); su propuesta de valor (ver escenas generar en vivo con costos y scores) depende de un volumen de fan-out de assets remoto que nuestro fan-out local (voz + ffmpeg) no tiene. — [README](https://github.com/calesthio/OpenMontage) y [AGENT_GUIDE.md](https://github.com/calesthio/OpenMontage/blob/main/AGENT_GUIDE.md)
- El "templated vs atelier" de OpenMontage como *decisión formal logueada* (dos modos de composición, reglas de cuándo usar uno u otro, close with distinctness review) — valioso como idea; como mecanismo burocrático (categorical en decision_log + presentations obligatorias) es peso para piezas de 15 s que nuestro orquestador resuelve solo. — [AGENT_GUIDE.md](https://github.com/calesthio/OpenMontage/blob/main/AGENT_GUIDE.md)
- Los guardias de vox (auto-resubmit, model drift fetch, fallback Kling) operan en torno a **llamadas a APIs remotas fallables/estancables**; nuestro pipeline de voz local no tiene el problema de jobs asincrónicos a la nube, así que la capa de provider completa sería sobreingeniería hoy — el guardia útil es el más pequeño: verificar que el binario/voz/tabla existe en preflight y reintentar la síntesis una vez.
- Fiscal lenge: onetake confiesa qué legs de su oráculo **no separaron** aceptados de rechazados y los degradó o los quitó de la decisión ("not-flat... It passed the rejected Pocket Weather v1 (0.54) and failed the accepted v3 (0.33), so it no longer decides"; "Soft-curve share and median t80 are printed, not judged"). Esto cautela contra el sobre-diseño de métricas prometidas que no correlacionan: a la lista de legs hay que llegar por validación contra cortes reales, no por teoría. — [verify_promo.py](https://github.com/feitangyuan/onetake/blob/main/scripts/verify_promo.py)

### Inferences
- Gáneles las piezas sueltas (checks numéricos, gates baratos, ledger) y queda en reject el marco completo de gobernanza de OpenMontage para uso de un plugin; elegiría "adoptar shapes, no el marco".
- El modelo de orquestación de OpenMontage con checkpoint-protocol enforced por lib Python es replicable de forma más sencilla: los artefactos canónicos ya existen (`script.json`, `voice.json`, `design.md`); el faltante es un índice de estado (progress.json) con skip de etapas completas — no un sistema de gates procesales.

### Gaps
- Sin leer el código de checkpoint/registry (ver Gaps de Pregunta 1) no puedo afirmar el costo real de implementación de ese marco; el veredicto de sobreingeniería se basa en alcance declarado (piped pipelines count + 20+ schemas JSON) más que en weight de código.
- No verificamos los costos de ejecución de Backlot en practice (solo su contrato: "observer, never a blocker").

---

## Pregunta clave 4 — Recomendaciones adopt / defer / reject (por patrón)

### Takeaway
Adoptar rápido: oráculo numérico de ritmo/restaudio/framing/audio (de onetake, reformulado para nostro stage), crítico independiente con verificación ítem-por-ítem (Gauntlet), ledger de generación y preflight de capacidades. Deferir: dashboard en vivo, selector puntuado de providers, deconstrucción de referencia en números, backtiming de música con script (hasta tener pieza con música externa). Rechazar: adoptar código de OpenMontage (AGPL viral) o de onetake (PolyForm Noncommercial), y el harness completo de Raven como infraestructura.

### Cited Findings (comparación de licencias)
- OpenMontage: **AGPL-3.0** — "copyleft fuerte; adaptar código al motor requeriría liberar el plugin bajo AGPL-3.0 o compatible. Las ideas/patrones se pueden adoptar textualmente; el código, no." — [LICENSE](https://github.com/calesthio/OpenMontage/blob/main/LICENSE)
- onetake: **PolyForm Noncommercial 1.0.0** — "free for personal, educational, research and other noncommercial use. Commercial use is not permitted." Nuestro plugin es infraestructura comercial personal/posible producto — prohibido copiar código o assets; leer y destilar patrones sí es uso legítimo de lectura pública. — [LICENSE](https://github.com/feitangyuan/onetake/blob/main/LICENSE)
- motion-video-kit: **MIT** ("MIT for the text, scripts and templates in this repo") — sus scripts de medición (frozen-time, loudness con ebur128, contact-sheet, backtime-music) son portables siempre que ofrecamos atribución. — [LICENSE/README](https://github.com/echris6/motion-video-kit#license)
- vox-director: **MIT** ("MIT © 2026 Alisa Qian") — scripts y referencias portables con atribución. — [LICENSE](https://github.com/Alisa0808/vox-director/blob/main/LICENSE)
- Raven: **Apache-2.0** — librería de harness adoptable en principio, pero mismă escala no aplica. — [LICENSE](https://github.com/EverMind-AI/Raven/blob/main/LICENSE)

### Inferences → recomendación por patrón

**ADOPT (baratos, de alta correlación con mejora de calidad):**
1. **Oráculo numérico post-render** (de onetake, propia implementación para no copiar código): legs `cadence` (CV de shots ≥ 0.25), `rest` (≥25% de frames quietos + tramo mínimo quieto ≥1 s), `audio` (pico ≤ −3 dBFS, 0 clipped, ≥15% quieto), `framing` (sujetos declarados no salen de frame), `curves` (pico de px/frame vs. blur declarado). Apuntarlos a `check.mjs`/`review/auto.md`. Encaja con la regla "medir primero" de `video-review`.
2. **Carry entre beats como contraste del relato**: escribir en brief/script "qué objeto sobrevive cada límite" y auditarlo en frames muestreados (una versión temprana: heurística de similitud de píxeles entre el último fotograma de un beat y el primero del siguiente — concepto trasplantado, no el código).
3. **Gauntlet de 2 rondas con crítico independiente** (motion-video-kit): alineado con "Máximo 2 rondas de corrección" de `video-review`; añadir la contramedida de "verification pass item-by-item con un crítico nuevo" tras la corrección, y el ledger de qué crítico encontró → qué cambió → before/after.
4. **Ledger de generación**: modelo/prompt/seed/job por asset en el folder de la pieza (de OpenMontage y motion-video-kit). Barato y útil para depurar piezas rendidas distinto.
5. **Preflight de capacidades** tipo "X de Y" que verifica Chrome headless, ffmpeg, fuente de voz (edge-tts/Piper), fuentes declaradas en look y lanza `runtime_warnings` antes de any del trabajo creativo (adaptación libre del preflight de OpenMontage — no copy de su mecanismo).
6. **Guardias de prompt por tipo de pausa fallada** (aprender del anchor_freeze de vox y de hard-rules de onetake): errores que ya cometimos y que bloquearían otra vez van a constantes del contrato/skill dueña (ya existe `lessons.md`; la mejora es darles vida operativa en checks).
7. **Validar el last frame == first frame de una escena a los límites con el objeto carried** (exact-pixel handoff) como leg de QA numérica trasplantable a escenes multi-shot de motion-craft.
8. **Decisiones/estados "append-only con re-log con el mismo subject"** para bitácora del brief (OpenMontage): cuando el usuario cambia la voz/marco, registrar revisión con la misma key, preservando el motivo "por qué se reemplazó".
9. **Deliver cap confirmado antes de spend** en etapas de generación externa cuando exista (si alguna pieza necesita demo de voz/GTTS) — `gather → estimate → --yes` de vox.

**DEFER (valioso pero de bajo ROI en piezas 15–45 s hoy):**
1. **Deconstrucción de referencia en números** (`analyze_ref.py` opc/…): requiere pipeline opencv + contact sheets; ganarla cuando el radial de referencias entre al día a día de brief (día no).
2. **Backtime-music + solve-sfx-gains con el mix**: incorporar cuando el motor compose música libre externa; el nuestro genera muzik procedural con ducking ya.
3. **Scoreu de referencia por "risk of slideshow" 6-dim** (OpenMontage): una versión simple en un leg del oráculo adoptado basta; la matriz completa solo tiene sentido en una plataforma de clips multiformatos.
4. **UI real reconstruida para feature-demos** (`lib/ui_kit.js` de onetake): aplicar cuando un cliente pide un feature-demo de una app real; es técnica portable pero depende de la infra `timeWarp`/`subAt` de su lib (no copiable por licencia).

**REJECT (para favor del motor actual):**
1. **Adoptar cualquier código de OpenMontage o onetake** (AGPL-3.0 / PolyForm NC) — a solo leer/patronizar.
2. **El harness completo de Raven o sus mecánicas de RSI** — otros 90% overengineering para un plugin; si un día queremos "lessons.md evolucione con benchmarks fijos", el concepto de Evolver es la pieza a mirar de nuevo, no el sistema.
3. **Selector de providers con scoring 7-dim** — nuestro proveedor es "una stack local"; mantener simple menu estático de capacidades.
4. **Backlot board/server** — la hoja de contactos final ya cumple el rol de observabilidad; un dashboard era iteración de plataforma multi-pipeline.

### Gaps
- No confirmamos la legalidad de portar **ideas numéricas exactas** de `verify_promo.py` bajo PolyForm NC (el texto/thresholds como tal quizás calle copyright; para proteücción legal: implementar propios thresholds de cero con valores tuning a nuestros traits de render). — [LICENSE](https://github.com/feitangyuan/onetake/blob/main/LICENSE)
- Audio de motion-video-kit: no verifiqué en `references/audio.md` ni en `scripts/loudness.sh` el target exacto de loudness; el README solo declara el requisito "`ffmpeg`/`ffprobe` (with the `ebur128` filter)". — [README](https://github.com/echris6/motion-video-kit)
- onetake documenta un estándar de entrega y mezcla: "1080p30 drafts, 4K60 finals" (SKILL.md) y un master a −16 LUFS con techo −3.5 a −4 dBTP elegido para que el AAC quede bajo el límite de −3 dBFS del oráculo (SKILL.md §7). No leí la implementación de mezcla; esos valores quedan como objetivo documentado del proyecto, no como estándar verificado en código aquí.

---

## Apéndice de trazabilidad

- Accesos a archivos raw verificados en esta sesión: `SKILL.md` de onetake, `verify_promo.py` de onetake, `SKILL.md` de vox-director, `SKILL.md` (business-motion-film) de motion-video-kit, `AGENTS.md` + `AGENT_GUIDE.md` de OpenMontage; README de los 6 fuentes; árbol de files de cada repo visto en la página de GitHub.
- `on-take` README declaración de linage "otk-7f3e1c" en SKILL.md y copyright "© 2026 Patrick (github.com/feitangyuan)".
- OpenMontage referencia `skills/core/hyperframes.md` y `docs/PROVIDERS.md` para decisiones Remotion-vs-HyperFrames que no leímos; la distinción agent-first / instruction-driven está documentada en README "How It Works".
- El run de agentskillshub se generó el 2026-10-11 ("test run, 2026-10-11"), con Claude Opus 5.5; exact claims de runtime (8.5 min) son del prticipe de test, no medibles fábricamente.
