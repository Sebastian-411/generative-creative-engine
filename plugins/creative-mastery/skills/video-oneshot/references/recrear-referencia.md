# Recrear una referencia

Cuando el usuario trae un video o un GIF y dice "quiero algo así". Se copia el **sistema** (tiempos, conteos, ritmo, relaciones de color), no la identidad (logo, personajes, copy). Ver `video-styles` § Crear un estilo nuevo.

## 1. Transcribir movimiento, no solo composición

Con la referencia en `ref/`, saca fotogramas a tiempos fijos con el ffmpeg del motor:

```bash
FF=$(node -e "console.log(require(require('os').homedir()+'/.generative-creative-engine/node_modules/ffmpeg-static'))")
"$FF" -i ref/ref.mp4 -vf "fps=4,scale=360:-1,tile=6x4" -frames:v 1 ref/sheet.png      # hoja de 6 s a 4 cps
"$FF" -ss 2.5 -i ref/ref.mp4 -frames:v 1 ref/t2.50.png                                 # un instante exacto
```

Escribe en el brief, por plano: duración exacta, trayectoria de cámara, qué hace cada elemento con su t, cómo se solapan las entradas, qué capas están desenfocadas y los hex muestreados. Es la spec visual densa: una frase por elemento, `elemento · movimiento · layout · estilo · timing`, de atrás hacia adelante, con px, ease con nombre y segundos; el texto citado tal cual. Con eso se llega a ~75 %.

## 2. Comparar lado a lado

Renderiza la réplica en **los mismos tiempos**: `stills.mjs videos/<slug> --times 0.5,1.0,2.5 --out review/replica`. Junta referencia | réplica:

```bash
"$FF" -i ref/t2.50.png -i review/replica/frame-002.50s.png -filter_complex "[0]scale=-1:960[a];[1]scale=-1:960[b];[a][b]hstack" ref/vs-2.50.png
```

Abre cada par con Read y anota la diferencia más grande.

## 3. Converger por ejes

Un eje por ronda (tiempos → posiciones → color → textura), con **objetivos absolutos** y congelando lo que ya coincide ("el encuadre está bien, no lo toques; solo el ease de entrada a `expo.out` 0.6 s"). Se suele llegar a 80–90 %.

## 4. Destilar

Lleva las constantes convergidas (tiempos, conteos, hex, ratios, arcos de cámara) al brief o a un STYLE nuevo. Las cualidades continuas (caída de un glow, material, mezcla óptica) no cierran por texto: el `index.html` de la pieza es el artefacto exacto.

Fuentes: parte destilada de HyperFrames (Apache-2.0)
