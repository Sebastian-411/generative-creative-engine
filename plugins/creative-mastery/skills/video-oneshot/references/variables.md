# Variables y versiones

Para cuando habrá varias versiones de la misma pieza (otro precio, otra marca, otro idioma, otra ciudad). Hornear "Acme — Pro — $49" y pedir después "hazlo reutilizable" cuesta una pasada de edición por variante: declara las variables **desde el principio** si el usuario ya sabe que habrá versiones.

## Lo que funciona hoy (sin tocar el motor)

1. **Look → CSS custom properties** en `:root`: `--fondo`, `--tinta`, `--acento`, `--display`. Todo el CSS de la pieza las usa; un re-skin cambia solo ese bloque. El arte raster se hace neutro (gris o duotono) y se tiñe con CSS, para que sobreviva al cambio de marca.
2. **Copy y datos → un objeto arriba del script**, con tipo y default en un comentario:

```js
const VARS = {
  producto: 'Tastora',   // string
  precio: 29000,         // number, 0–999999, COP
  acento: '#C8321F',     // color → también en --acento
  mostrarQR: true,       // boolean
};
document.documentElement.style.setProperty('--acento', VARS.acento);
```

   Si prefieres un archivo, `vars.json` en la pieza y cárgalo antes del fotograma 0 con `stage.wait(fetch('vars.json').then((r) => r.json()).then(...))`; arma el timeline que dependa de esos valores dentro del `then` (medidas de texto incluidas).
3. **Una versión = una carpeta**: copia `videos/<slug>` a `videos/<slug>-<variante>`, cambia `VARS` (o `vars.json`) y corre `build.mjs` en cada una.
4. **Si la variable entra en la voz** (el nombre, el precio dicho), cambia la línea en `script.json`: `voice.mjs` rehace solo esa línea por caché y la duración se ajusta sola (`duration: 'voice'`). Revisa las anclas por palabra que dependan de ella.

## Lo que no puede ser variable

Dimensiones, fps y formato: son otra pieza.

## Prueba diferencial

Renderiza la versión default y la variante con `stills.mjs --times` en los mismos instantes. Si salen idénticas, la variable nunca llegó al DOM: pasa todos los QA y falla igual.

## Pendiente (no existe hoy)

`build.mjs --vars filas.json --out "render/{name}.mp4"` (una salida por fila, con `--strict` para llaves no declaradas) y un `stage.vars` que las publique como custom properties. Hasta que existan, usa una carpeta por versión.

Fuentes: parte destilada de HyperFrames (Apache-2.0)
