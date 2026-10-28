# Harness de calidad de video: oráculo post-render + oficio medible (P0/P1/P2 destilados)

## Qué
Implementar el informe `reports/Destilación para videos superiores.md` (todo P0/P1/P2) como **tres incrementos funcionales** que preservan la arquitectura actual (CLI Node simple, cada fotograma función pura de t): (1) oráculo post-render standalone `verify.mjs` integrado al build, con umbrales calibrados por perfil y fixtures por leg; (2) endurecimiento del seek de footage en `engine/runtime/stage.js` (bug pre-start/backward en stage.js:169-170) — no un compositor nuevo; (3) en paralelo: validación narrativa `schemaVersion 2` opt-in vía `engine/lib/script-rules.mjs` puro, skills actualizadas in-place con números deduplicados, tools standalone que reutilizan funciones de verify (`capture-site.mjs`, `variants.mjs`, `analyze-reference.mjs`, `bench.mjs`), export alpha on-demand y la demo `demos/destilacion-oracle` (15 s, 1920×1080@30).

## Por qué
Hoy `check.mjs` nunca abre el MP4 y el oficio vive como prosa en las skills: ningún número bloquea un render malo antes de entregarlo. La conclusión del informe es que cada falla real debe volverse una constante que bloquea el siguiente render. El veredicto de architecture review: el big-bang es prematuro; tres incrementos capturan el valor (oráculo → footage → resto) sin reescribir el motor ni contradecir el Contrato creativo.

## Incrementos (en orden)
1. **Verify + fixtures**: `verify.mjs` standalone invocado por `build.mjs` tras el render; legs medibles (cadencia, movimiento @2 Hz, rest, audio pico/clip/silencio con floor RMS, LUFS/dBTP, black frames, legibilidad). Umbrales **por perfil declarado** — sin contradicciones universales: quiet-frames vs rest, cama continua vs drops, −3 dBFS vs −2 dBTP, shot-CV vs films zero-cut. Cada leg nace con un fixture que lo rompe. Input faltante o indecidible = `skip` reportado con razón, jamás pass silencioso. `qa-plan.json` con ventanas de riesgo declaradas, consumido por `check.mjs`/`stills.mjs`.
2. **Footage hardening**: fix del seek pre-start/backward en `stage.js:169-170`; el asset externo es data con f(t) (sin randomness), con provenance obligatoria (fuente/licencia) y blocker estructurado si falta (no swap silencioso). Determinismo demostrado con doble render idéntico.
3. **Paralelo**: `schemaVersion 2` validado por `script-rules.mjs` puro (campos `role/value_from/value_to/lesson/char_budget/out`; giro de valor obligatorio salvo exención `cta`/`respite`; v1/ausente = sin validar, legacy intacto). Skills existentes actualizadas in-place con números deduplicados (una sola fuente de verdad — no un segundo bloque). `capture-site.mjs` (captura 2×, wording como fuente de verdad), `variants.mjs` (1→N determinista), `analyze-reference.mjs`, `bench.mjs` reutilizando funciones de verify. Export alpha como ruta separada on-demand. Demo que ejercita todo: beats schema-v2, contador anclado a la voz, chip de honestidad, captions con lead/hold, capa de footage del asset tastora con provenance, 2 variantes.

## Criterios de aceptación
- [ ] `node .../engine/verify.mjs <pieza>` corre sobre el MP4 final y hace exit ≠ 0 ante una pieza sembrada con defectos; `build.mjs` falla si verify falla.
- [ ] Cada leg de verify tiene un fixture versionado que lo rompe y lo prueba (reelbench: gate sin fixture no vale).
- [ ] El reporte de verify no contiene passes silenciosos: todo input faltante/indecidible figura como `skip` con razón.
- [ ] Los umbrales difieren por perfil (p. ej. film zero-cut salta `cadence` con `skip` reportado; perfil YouTube mide −16±0.5 LUFS vs −14 LUFS/−2 dBTP local).
- [ ] Doble render de la demo produce fotogramas idénticos (checksum/diff = 0) con la capa de footage activa.
- [ ] `demos/destilacion-oracle` (15 s, 1920×1080@30) renderiza con: beats schema-v2 validando (polaridad + lección + presupuesto; cta/respite exentos), contador que aterriza en el número pronunciado, chip de honestidad en la figura estimada, captions con lead/hold, footage tastora con provenance registrada, 2 variantes.
- [ ] `variants.mjs` genera las 2 variantes + hoja de contacto por lote; re-run = idéntico.
- [ ] Una pieza legacy (sin `schemaVersion`) pasa `check.mjs` y `build.mjs` sin cambios de comportamiento.
- [ ] Las skills llevan los números deduplicados in-place; no existe un segundo bloque de constantes.
- [ ] El export alpha se produce solo on-demand por su ruta separada; el render principal no cambia.

## Fuera de alcance
- Sin compositor nuevo, sin provider frameworks, sin agentes nuevos, sin sitios web.
- Sin copiar código ni umbrales literales de fuentes con licencia restrictiva (onetake/PolyForm NC, OpenMontage/AGPL, PDoomVideo sin LICENSE): re-implementación con umbrales propios calibrados, método citado.
- Sin claims de paridad con Higgsfield ni marketing; el posicionamiento no se toca.
- Sin lip-sync ni photoreal: footage externo es capa de datos, no generador.
- Sin CI ni baselines de regresión en Git LFS.
- **Compatibilidad (dura)**: piezas legacy no se rompen — validación narrativa opt-in por `schemaVersion 2`; los CLIs de `check.mjs`/`stills.mjs` no cambian de contrato para piezas existentes.

## Preguntas abiertas
- ¿Qué asset exacto de tastora entra en la demo y bajo qué licencia? La provenance debe citar fuente/licencia reales.
- ¿Dónde viven los perfiles de umbrales (JSON por perfil junto a verify.mjs vs archivo único)? Lo decide el planner.
