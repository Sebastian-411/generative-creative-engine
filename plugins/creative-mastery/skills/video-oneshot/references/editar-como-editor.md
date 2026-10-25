# Editar como editor (cambios sobre una pieza entregada)

El usuario habla como en un editor de video. Traduce cada pedido a un verbo y a **un objetivo absoluto**, toca lo mínimo y verifica solo lo cambiado.

| Dice el usuario | Verbo | Qué se toca en la pieza |
|---|---|---|
| "que la escena 2 empiece después" | mover | el ancla: `stage.at('id', +0.4)` o `stage.word(...)` a otra palabra |
| "que el logo se vaya antes" | recortar fin | el `tl.set(sel, {opacity:0}, b)` o el fin del bloque de la escena |
| "salta el primer segundo del clip" | recortar inicio (metraje) | `data-start` del `<video>` o el primer par de `video.__time` |
| "la escena 2 dura 4 s" | retimar | con voz, la duración la da la voz: recorta texto de esa línea o cambia su `pause`; con música, cuántos `stage.bar` ocupa. Si cambia el largo, decide *misma velocidad + sostener* o *estirar los tweens* (pregunta cuál si no lo dijo) |
| "más ágil" / "más relajado" | sentir | eases y duraciones en **una** escena por ronda: ágil = `power4.out` y −30 % de duración; dramático = `expo.out`; calma = `sine.inOut` y +30 % |
| "la música está muy alta" | nivel | `music.db` en `Stage.create` (default −12 con voz), `music.carve` si tapa la voz, o los dB de `stage.sfx`; pasos de 3 dB |
| "cambia la música por assets/x.mp3" | reemplazar | `music: { file: 'assets/x.mp3' }` en `Stage.create`; la animación no se toca (re-ancla a `stage.bar` solo si el bpm cambia) |
| "el titular dice 'Hecho en casa'" | copy | texto citado tal cual. Si es línea de voz: `script.json` → `voice.mjs` (rehace solo esa línea) → revisa anclas por palabra que ya no existan |
| "el CTA más grande y en el acento" | restyle | valor absoluto ("CTA a 120 px, color `--acento`") + cláusula: el encuadre y el movimiento no se tocan |
| "parte la escena 2 en el 0:04" | dividir | dos bloques adyacentes; el corte en una palabra-ancla cercana |
| "quita el subtítulo cuando sale el titular" | ocultar | el `id` de la línea en `skip` de `Stage.captions` |

## Protocolo

1. Escribe en `## Bitácora`: pedido → verbo → objetivo absoluto ("radio del punto = 25 % del espaciado", no "2× más fino": lo relativo oscila).
2. Guarda el estado anterior: `stills.mjs videos/<slug> --times <alrededor del cambio> --out review/antes`.
3. Diff mínimo. **Una variable por ronda**; si piden tres cosas, van en orden y se verifica cada una.
4. `check.mjs`, y `stills.mjs --times <los mismos> --out review/despues`. Abre las dos hojas y compáralas.
5. `build.mjs`. La caché de voz y música evita rehacer lo que no cambió.

Si un arreglo no se sostiene: fotogramas a ambos lados del problema, lista cada diferencia y cambia solo la línea que la causa. Si se siente cargado: quita un tercio del movimiento y quédate con lo que guía el ojo. Si una escena falla una y otra vez: déjala en lo mínimo que funcione y vuelve a sumar capas de a una (sujeto → cámara → fondo → estilo).

Si la corrección vale para todas las piezas → `creative-contract/lessons.md`.

Fuentes: parte destilada de HyperFrames (Apache-2.0)
