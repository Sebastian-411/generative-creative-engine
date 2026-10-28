# Plan: Harness de calidad de video (oráculo post-render + oficio medible)

## Resumen del diseño

Veredicto de architecture review (vinculante): el big-bang es prematuro; tres incrementos capturan el valor. `build.mjs` sigue siendo la raíz de composición con la secuencia **preflight → check → mix → render → verify → stills**. `verify.mjs` es standalone, con perfiles `social|youtube|benchmark` y estados `PASS|WARN|FAIL|SKIP|UNVERIFIED`; `qa-plan.json` es opcional por pieza; `schemaVersion 2` es opt-in vía `lib/script-rules.mjs` puro; el único toque de runtime es endurecer el seek de video de `stage.js` (bug pre-start/backward, L152–174); las tools (`capture-site`, `variants`, `analyze-reference`, `bench`) son standalone y reutilizan funciones de verify; el export alpha es ruta separada on-demand; skills actualizadas in-place deduplicadas; sin agentes/providers/sitios nuevos.

**Decisiones del planner (cierran la pregunta abierta de la story):**
- Los perfiles de umbrales viven en **un solo archivo**: `engine/lib/verify-probe.mjs` (helpers ffmpeg/ffprobe: muestreo de frames, RMS/LUFS, blackdetect, detección de cortes) + `engine/lib/verify-profiles.mjs` (objetos de datos `social|youtube|benchmark`, importables por verify/bench/analyze-reference/selftest sin fs). Una sola fuente de verdad numérica.
- `verify.mjs` acepta **directorio de pieza** (usa `render/final.mp4` o `render/draft.mp4`) **o ruta directa a un MP4** — necesario para calibrar contra `videos/referencias/*.mp4`, que no son piezas.
- Los fixtures del selftest son **sintéticos**: `selftest.mjs` genera MP4/WAV defectuosos al vuelo con ffmpeg en un dir temporal (sin binarios en git). Cada leg nace con ≥1 fixture que lo rompe + 1 que prueba `SKIP` con razón.

## Fases

Cada fase = una sesión de agente. Track A = F1→F2→F4; Track B = F3; Track C = F5 / F6; Track D = F8. F7 cierra.

### Fase 1 — Oráculo: `verify.mjs` + perfiles + selftest (Track A)
- Alcance (archivos exclusivos): **nuevos** `engine/verify.mjs`, `engine/selftest.mjs`, `engine/lib/verify-probe.mjs`, `engine/lib/verify-profiles.mjs`. No toca `build.mjs` ni nada existente.
- Contenido: legs medibles del informe (cadencia/CV, movimiento @2 Hz, rest, audio pico/clip/silencio con floor RMS, LUFS/dBTP, black frames, legibilidad, curvas/carry); estados PASS/WARN/FAIL/SKIP/UNVERIFIED — input faltante o indecidible = SKIP con razón, jamás pass silencioso; perfiles `social` (−14 LUFS / −2 dBTP) vs `youtube` (−16 ±0.5 LUFS) vs `benchmark`.
- **Calibración ANTES de fijar umbrales bloqueantes** (modo reporte): correr verify sobre `videos/grua/render/final.mp4`, `demos/tastora/render/*` (si hay render; si no, construirlo en F2/F3 y recalibrar), `videos/demo-plugin/render/*`, y las referencias v3/v9/v10 de `videos/referencias/` (identificarlas por las descripciones §3 del informe: v10 = "¿Pagarías 300.000 $…"; v9 = pieza zero-cut de 1 corte → define el skip de `cadence` del perfil film/benchmark). Si falta un MP4, ese leg queda UNVERIFIED — no se inventa umbral.
- Hecho cuando:
  - `node engine/selftest.mjs` pasa: cada leg demostrado con fixture que lo rompe (FAIL) y fixture de input faltante (SKIP con razón).
  - `node engine/verify.mjs videos/grua --profile social` corre sobre el MP4 y sale con código correcto; sobre una pieza sintética sembrada con defectos sale ≠ 0.
  - Perfiles difieren en la práctica: mismo MP4 medido con `--profile social` vs `--profile youtube` produce umbrales/objetivos distintos; perfil benchmark salta `cadence` con SKIP razonado sobre la ref zero-cut.
- Comandos de verificación: `node engine/selftest.mjs` · `node engine/verify.mjs videos/grua` · `node engine/verify.mjs "videos/referencias/¿Pagarías 300.000 $ por tener tu propio Chatgpt.mp4" --profile benchmark`.
- Rollback: 4 archivos nuevos; borrarlos y no queda rastro.

### Fase 2 — Integración en build: preflight + verify + qa-plan (Track A, depende de F1)
- Alcance (archivos exclusivos): `engine/build.mjs`, **nuevo** `engine/lib/preflight.mjs`, `engine/check.mjs`, `engine/stills.mjs`.
- Contenido: `build.mjs` ejecuta preflight → check → mix → render → **verify** → stills; verify falla ⇒ build falla (exit 1; escape `--skip-verify` espejo del `--skip-check` existente; en `--draft` verifica `draft.mp4`). `preflight.mjs` reporta Chrome headless/ffmpeg/voz/fuentes con estados passed/degraded/blocked y corre standalone. `check.mjs`/`stills.mjs` consumen `qa-plan.json` **si existe** (ventanas de riesgo → brackets de stills y foco de check); ausente = cero cambio de comportamiento. **Esta fase también añade en `check.mjs` la regla de provenance de assets externos** (fuente/licencia obligatoria; falta ⇒ blocker estructurado: qué se intentó/qué falló/opciones — jamás swap silencioso), ya que es el dueño exclusivo de check.mjs hasta F4.
- Hecho cuando: build de una pieza legacy (`videos/grua` o `demos/huella-cafe`) produce el mismo resultado de siempre (contratos CLI de check/stills intactos); build de una copia temporal con defecto sembrado falla en el paso verify tras el render; `qa-plan.json` presente cambia las hojas de stills y ausente no rompe nada; asset sin provenance ⇒ blocker con estructura completa.
- Comandos: `node engine/build.mjs videos/grua` · `node engine/build.mjs <pieza-con-defecto>` (debe fallar) · `node engine/preflight.mjs` (o vía build) · `node engine/check.mjs demos/tastora` con y sin `qa-plan.json`.
- Rollback: revert del wiring en build.mjs + borrar preflight.mjs; los cambios en check/stills quedan inertes sin `qa-plan.json`.

### Fase 3 — Endurecimiento del seek de footage en `stage.js` (Track B, **PARALELA con F1 y F2** — archivo disjunto)
- Alcance (archivo exclusivo): `engine/runtime/stage.js` — **solo** el bloque de seek de video L152–174: bug pre-start (`target < 0` hoy resuelve sin tocar el elemento ⇒ frame stale; debe fijar primer frame/estado hold declarado) y seek backward determinista. Nada más del runtime.
- Hecho cuando: doble render de `demos/tastora` (pieza con capa de footage) produce **checksums/diff de fotogramas = 0**; los stills muestran los clips alineados a beat y el pre-start ya no muestra frame congelado del punto anterior.
- Comandos: dos corridas de `node engine/render.mjs demos/tastora` + diff de checksum por frame; `node engine/stills.mjs demos/tastora --review`.
- Rollback: revert de un solo archivo. Si el diff no-da-cero por causas de encode y no del seek, aislar comparando hashes a nivel de stills antes de culpar al fix — `render.mjs` está fuera de alcance.

### Fase 4 — Reglas en `check.mjs`: schemaVersion 2 vía `script-rules.mjs` puro (Track A, depende de F2 — traspaso exclusivo de check.mjs)
- Alcance (archivos exclusivos): **nuevo** `engine/lib/script-rules.mjs` (puro: funciones sobre el objeto script.json, sin fs ni imports del engine), `engine/check.mjs`, extensión de `engine/selftest.mjs`.
- Contenido: si `script.json.schemaVersion === 2` ⇒ validar campos `role/value_from/value_to/lesson/char_budget/out`; giro de valor obligatorio (`value_from ≠ value_to`, `lesson` no vacía) salvo exención `role: cta|respite`; `v1` o ausente ⇒ sin validar, legacy intacto.
- Hecho cuando: selftest prueba v2 válida, beat sin giro ⇒ FAIL, `lesson` vacía ⇒ FAIL, cta/respite exentos, `char_budget` excedido ⇒ FAIL, `out` faltante ⇒ FAIL; `node engine/check.mjs videos/grua` (legacy) sale exactamente igual que antes de esta fase.
- Comandos: `node engine/selftest.mjs` · `node engine/check.mjs videos/grua` (regresión legacy, diff de salida vacío).
- Rollback: opt-in por schemaVersion ⇒ borrar `script-rules.mjs` y revertir el hunk de check.mjs; piezas legacy ni se enteran.

### Fase 5 — Tools de análisis: `analyze-reference.mjs` + `bench.mjs` (Track C, depende de F1, **PARALELA con F2–F4**)
- Alcance (archivos exclusivos, nuevos): `engine/analyze-reference.mjs`, `engine/bench.mjs`.
- Contenido: `analyze-reference` deconstruye un MP4 de referencia (mapa de energía, cortes, quietud, motion line + hoja de contacto) con heurística declarada como aproximada; `bench` corre los 4 checks del hub (H.264 reproducible, specs ffprobe, líneas legibles, movimiento > 0.004) y escribe `measure.json`. Ambos importan `verify-probe`/`verify-profiles` — cero duplicación de umbrales.
- Hecho cuando: `analyze-reference` sobre una ref de `videos/referencias/` imprime la tabla numérica + contact sheet; `bench` sobre `videos/grua` escribe `measure.json` y su veredicto.
- Comandos: `node engine/analyze-reference.mjs "videos/referencias/<ref>.mp4"` · `node engine/bench.mjs videos/grua`.
- Rollback: borrar 2 archivos.

### Fase 6 — Tools de producción: `capture-site.mjs` + `variants.mjs` + `export-alpha.mjs` (Track C, depende de F2 — variants invoca build; **PARALELA con F4–F5**)
- Alcance (archivos exclusivos, nuevos): `engine/capture-site.mjs`, `engine/variants.mjs`, `engine/export-alpha.mjs`.
- Contenido: `capture-site` captura full/page a 2× (hasta 8000 px) + variante móvil + `capture.json` con colores/fuentes/candidatos de logo y **wording exacto como fuente de verdad**; `variants` genera 1→N variantes deterministas (paleta/copy/hook) + hoja de contacto por lote; `export-alpha` produce el export con alpha (VP9/ProRes 4444) por ruta separada on-demand — el render principal no cambia.
- Hecho cuando: `variants.mjs demos/huella-cafe --n 2` produce 2 variantes + contact sheet y re-run = idéntico; `capture-site` sobre un URL/local imprime `capture.json` con wording; `export-alpha` produce archivo con alpha verificable y un build normal de `videos/grua` queda intacto.
- Comandos: `node engine/variants.mjs demos/huella-cafe --n 2` (×2, checksum) · `node engine/capture-site.mjs <url>` · `node engine/export-alpha.mjs videos/grua`.
- Rollback: 3 archivos nuevos sin ediciones en archivos compartidos; borrarlos.

### Fase 7 — Demo `demos/destilacion-oracle` (cierra todo; depende de F2, F4 y F6)
- Alcance (archivos exclusivos): `demos/destilacion-oracle/**` (nuevo: index.html, script.json v2, brief.md, qa-plan.json, voice.json, capa footage de tastora con provenance). No toca el engine.
- Contenido: 15 s, 1920×1080@30; beats schema-v2 validando (polaridad + lección + presupuesto; cta/respite exentos); contador que aterriza en el número pronunciado; chip de honestidad en la figura estimada; captions con lead/hold; footage tastora con provenance registrada; `qa-plan.json` con ventanas de riesgo; 2 variantes.
- Hecho cuando: `node engine/build.mjs demos/destilacion-oracle` termina en verde (check + verify PASS bajo su qa-plan); doble render ⇒ checksum diff = 0 con footage activo; `variants.mjs` genera las 2 variantes idénticas al re-run.
- Comandos: `node engine/build.mjs demos/destilacion-oracle` · `node engine/variants.mjs demos/destilacion-oracle --n 2` · segunda corrida de build + diff.
- Rollback: borrar el directorio de la demo.

### Fase 8 — Skills con números deduplicados in-place (Track D, **PARALELA con todas**; después de F1 para que los números sean finales)
- Alcance (archivos exclusivos, solo texto): `SKILL.md`/`lessons.md` de las skills `video-engine`, `video-review`, `story-grammar`, `motion-craft`, `video-styles`, `storytelling`, `hook-lab`, `sound-design`, `creative-contract`.
- Contenido: los números del informe (captions 56–80 px/banda 62–70 %/lead 40 ms/hold 120 ms, ganchos por mecanismo, CTA 10–17 %, acento único, audio por plataforma −14 vs −16 LUFS, 6 dispositivos "copiar primero"…) viven **in-place en la skill dueña**, con fuente citada, y sin crear un segundo bloque de constantes: cada literal aparece en exactamente una skill; las demás referencian. En skills de código (`video-engine`) los umbrales operativos son los de `verify-profiles.mjs` — el texto los cita, no los duplica como segunda fuente.
- Hecho cuando: grep de los literales clave encuentra cada umbral en una sola skill home; sin skills ni agentes nuevos (in-place); fuentes citadas (iart/lanshu/vox-director MIT, vibe con atribución, nada literal de onetake/OpenMontage/PDoomVideo).
- Comandos: grep de duplicados entre `plugins/creative-mastery/skills/*/SKILL.md`; lectura cruzada.
- Rollback: revert de texto.

## Riesgos / dependencias entre fases

- **`check.mjs` es el cuello de botella de archivo compartido**: F2 y F4 lo editan en serie (traspaso exclusivo explícito). Ninguna otra fase lo toca — es la razón de que la regla de provenance viva en F2 y el schema v2 en F4.
- **Activos de calibración**: los renders están gitignoreados. Si falta un MP4 al calibrar (F1), construir la pieza primero (grua/demo-plugin/tastora son construibles) o dejar el leg UNVERIFIED; las referencias no se pueden reconstruir — nunca inventar umbral sin medición. La identificación exacta de v3/v9/v10 se hace cruzando §3 del informe con los 10 archivos de `videos/referencias/`.
- **Determinismo (F3)**: si el diff doble-render no da cero, puede ser el encode y no el seek — aislar a nivel de hashes de frame antes de ampliar el alcance; `render.mjs` queda intocable por decisión de arquitectura.
- **Tamaño del plan**: 8 fases supera las 4–5 de un cambio mediano — coherente con que la story es del extremo grande ya aprobado; cada fase cabe en una sesión y 3 tracks corren en paralelo (A: F1→F2→F4 · B: F3 · C: F5/F6 · D: F8), con F7 como cierre. No se parte en historias separadas porque los incrementos 1–3 de la story ya son esa partición.
- **Licencias**: umbrales re-implementados con método citado; prohibido copiar literales de onetake (PolyForm NC), OpenMontage (AGPL) y PDoomVideo (sin LICENSE) — aplica a F1, F5 y F8.
