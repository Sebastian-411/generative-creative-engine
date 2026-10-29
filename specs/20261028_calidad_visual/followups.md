# Followups abiertos (deuda reconocida, no bloquea la mejora visual)

Origen: auditoría completa del repo del 2026-10-28. Se anotan acá para no perderlos; **no** se
trabajan ahora salvo que toquen la calidad visual.

## Alta

1. **El spec `specs/20261027_video_quality_harness/story.md` no está reconciliado.** Los 10 criterios
   de aceptación siguen sin marcar aunque el trabajo se commiteó (`7df86cb`). Al reconciliar, dos
   criterios van a quedar abiertos porque **no existen en el código**:
   - `qa-plan.json`: **0 referencias** en `check.mjs` / `stills.mjs` (Fase 2 del plan lo pedía).
   - Provenance de assets externos (fuente/licencia obligatoria, blocker estructurado): **0
     referencias** en todo el engine.

2. **Fase 7 (`demos/destilacion-oracle`) quedó a mitad** respecto del plan: es 1080×1920 (el plan pedía
   1920×1080), no tiene capa de footage de tastora, no tiene `qa-plan.json`, no tiene `variants.json`
   ni provenance. Sí cumple: schema v2, contador anclado a la voz, chip de honestidad, captions.

## Media

3. **`build.mjs --draft` no puede pasar verify, por diseño.** `--draft` implica `--scale 0.5` y el leg
   `specs` del perfil social exige lado corto ≥ 1080 → FAIL garantizado (reproducido: 540×960). El
   escape documentado es `--skip-verify`, así que el camino "borrador verificado" no existe. Arreglo
   sugerido: degradar `specs` a WARN cuando la entrada es `draft.mp4`, o que el perfil se elija con
   `--draft`.

4. **Documentación desactualizada en dos puntos concretos**: README y la `description` de
   `video-engine` ofrecen **Piper** como motor de voz; Piper no existe (motores reales: `edge`,
   `gemini`, `chatterbox`, `qwen`, `voxcpm`). README dice "los 5 agentes" y hay 7.

5. **Números duplicados entre skills** (contra la Fase 8 del plan, que pedía una sola casa por
   literal): `0.5 s + 0.3 s por palabra` vive en `story-grammar`, `motion-craft`,
   `video-engine/SKILL.md` y `check.mjs`.

6. **`bench.md` no es reproducible desde un clone**: mide `videos/referencias/`, que está ignorado, y
   no documenta cómo regenerar la tabla.

## Baja

7. **Higiene de repo**: `demos/tastora/assets/site-3d.mp4` (12.7 MB) y seis PNG de referencia están
   versionados, contra la propia política de "pesados en local".
8. `demos/voz-prueba` no tiene `index.html` (solo `comparacion.html`) y no está trackeada.
9. `.atl/skill-registry.cache.json` indexa skills del usuario, no las 12 del plugin: un subagente
   lanzado con ese registry no las ve. Pasar rutas explícitas.

## Del trabajo visual (2026-10-28)

10. **Flake de determinismo con WebGL.** `check.mjs` marca ~1 de cada 6 corridas una diferencia en frío de
    **138 píxeles** (0.007 % de 1080×1920) en `demos/studio-look`. No se reproduce aislado (12 intentos
    dedicados dieron 0), así que es una carrera de captura bajo carga de varias páginas. Mitigado con
    doble submit en `studio.draw()`; **no eliminado**. Si aparece en una pieza que se va a publicar, correr
    `check.mjs` dos veces y quedarse con la corrida limpia; si se repite, aislar con una sola página.

11. **El pico true peak del MP4 queda 0.9 dB arriba del de `mix.wav`** (−2.0 → −1.1 dBTP) por el encode
    AAC; con objetivo −2 dBTP el verify lo marca WARN. El limiter de `mix.mjs` debería apuntar a
    −2.6/−3 dBTP para dejar aire al encode.

12. **`visual-audit.mjs` describe perfiles, no rankea calidad.** Publicar sus números como objetivo
    (`soft ≥ 0.60`, `sat ≤ 0.50`, `rango 0.38–0.55`, ya en `video-styles`) es legítimo; usarlos como
    veredicto automático, todavía no: falta calibrar contra piezas buenas y malas de varios tipos.

13. **`specs/20261028_calidad_visual/refs.txt` y `audit-*.json` tienen rutas absolutas de esta máquina.**
    Si el repo se comparte, convertir a rutas relativas o regenerarlos.
