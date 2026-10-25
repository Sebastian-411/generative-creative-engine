# creative-mastery

Este repo es un plugin multi-host (Claude Code, Cursor, Codex, OpenCode) para generar videos one-shot por código. El criterio canónico vive en `plugins/creative-mastery/`. No dupliques skills ni agentes.

## Punto de entrada

- "Hazme un video / reel / short / explicador / promo" → skill `video-oneshot`.
- Escribir o depurar una pieza, un render que falla o un comando del motor → skill `video-engine`.
- Revisar un video ya hecho → skill `video-review` (o el agente `critic`).
- "¿Qué está pegando?", ideas para redes, contenido reactivo → skill `trend-radar` (lee `knowledge/trends/latest.md`).
- Tono, emoción, personaje o acento de la voz ("que suene caleño", "de terror") → skill `voice-director`.

## Agentes

| Agente | Acceso | Rol |
|---|---|---|
| `scriptwriter` | escribe `brief.md` y `script.json` | Historia y guion medido para voz |
| `art-director` | escribe `design.md` y la prueba de look | Dirección de arte |
| `motion-designer` | lectura y escritura | Anima la pieza o una escena |
| `critic` | solo lectura | Hallazgos con evidencia y veredicto |
| `fact-checker` | solo lectura y web | Verifica datos y licencias |
| `trend-scout` | lectura, web y radar | Convierte el radar diario en 3–5 ideas con evidencia, ángulo y ventana |

Cada agente y cada ronda deben justificarse. Un short de 15 s lo hace el orquestador solo. Los agentes entran en piezas de más de 45 s, piezas para publicar o piezas con marca.

## Reglas del motor (no negociables)

- Cada fotograma es una función pura de t: todo movimiento va en `stage.tl` o en `stage.onFrame`.
- Prohibidos: `Math.random`, `Date`, timers, `requestAnimationFrame` y animaciones CSS.
- La voz es el reloj: los tiempos salen de `voice.json` (`stage.at/word/end`) o del bpm (`stage.bar/beat`).
- `check.mjs` no puede tener fallas antes de renderizar.
- No se entrega sin haber abierto la hoja de contacto final.

## Hosts

- Cursor carga el plugin vía `.cursor-plugin/` y también este `AGENTS.md`.
- Codex carga las skills vía `.agents/plugins/marketplace.json` + `.codex-plugin/`; los agentes están en `.codex/agents/`.
- OpenCode carga skills y agentes vía `opencode.json`.
- Claude Code usa `.claude-plugin/`.
