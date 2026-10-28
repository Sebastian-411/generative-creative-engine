# Árboles vs. estrellas · "Dos mapas, un punto" — demo ~60 s

## Contrato creativo
- Idea en una frase: Este video le dice a **quien scrollea en Colombia/LatAm** que **en la Tierra hay tantos árboles que, aun dándole a la Vía Láctea su cifra más alta de estrellas, a cada estrella le tocan más de siete árboles**.
- Promesa (lo que el gancho ofrece): vamos a contar las dos cosas con la misma regla y vas a ver quién gana y por cuánto.
- Pregunta dramática (lo que mantiene mirando): ¿qué hay más, estrellas en nuestra galaxia o árboles en la Tierra, y por cuánto?
- Payoff (cómo se cumple, concreto y verificable): la estrella bermellón del fotograma 0 queda sola en primer plano y le llegan sus árboles: 7 anillos completos + 1 anillo trazado al 60 % (= 7,6, ref/facts.md §2) con "7,6" grande debajo. Llega en ~52.5 s (≈ 84 %, narrativo).
- Gancho: curiosity gap (apuesta) — "¿Qué hay más: estrellas en nuestra galaxia, o árboles en la Tierra?" + fotograma 0: una hoja partida por una línea de horizonte; arriba un atlas de puntos rellenos (ESTRELLAS) y abajo un plano de anillos (ÁRBOLES), los dos estampándose por filas a la vez, y una sola estrella en bermellón + sonido: ráfaga seca de `tick` de estampado desde el fotograma 0.
- Hilo: **la estrella bermellón** (un punto, `#hilo`, fila 3 / col 17 del bloque de estrellas): está en el fotograma 0, entra al bloque de 400, se ve en el respiro y es la protagonista del payoff y del cierre. Junto a ella viaja la unidad: **1 punto = 1.000 millones**.
- Estructura: Hallazgo (datos) → expectativa (la apuesta y el empate de antes de 2015) / por qué (el conteo: 400.000 parcelas + satélite) / dato que la rompe (3,04 billones, 7× más) / qué significa para ti (más de 7 árboles por cada estrella; "esta noche, mira para arriba").
- Forma: **viaje continuo** sobre un solo pliego (`#world`): la cámara nunca corta; sube al atlas, baja al bosque, entra a una parcela, se aleja a ver los 8 bloques y bucea hasta la estrella-hilo. Persistentes: la estrella-hilo y el pie de unidad "1 punto = 1.000 millones" (hasta 48 s).
- Rima / callback: planta la hoja partida (`#split`: línea de horizonte de 3 px en y=960, "¿QUÉ HAY MÁS?" encima, ESTRELLAS arriba, ÁRBOLES abajo) en t=0 → cobra en t≈56 s con el mismo encuadre: arriba queda solo la estrella bermellón, abajo sus 7,6 anillos bermellón, y "¿QUÉ HAY MÁS?" se cambia por "ÁRBOLES." (mismo id `#q`, line swap). La pregunta y la respuesta ocupan el mismo píxel.
- Respiro: beat 7 (45.6–48.2 s): sin voz, cámara quieta viendo el bloque de estrellas contra los 7,6 bloques de árboles; solo termina de estamparse el último bloque al 60 %.
- Mood: pulso de conteo seco y curioso (~92 bpm, mazos apagados y pizzicato) que se abre de golpe en el giro (40 s) y se calla 0.7 s antes de la respuesta.
- Tono y voz: amigo que te cuenta un dato en la sobremesa y te reta a apostar; curiosidad que crece hasta asombro contenido, nunca épica. Narrador: hombre de 30–40 años, español latinoamericano con leve acento colombiano (bogotano suave), cálido y cómplice, ritmo medio 2.6–2.9 palabras/s, sonrisa en la voz en "ibas bien", sin impostación de locutor ni de documental. · palabras sí: punto, contar, apuesta, empate, parcela, satélite, kilómetro, billones, "millones de millones", estrella, árbol, esta noche · palabras no: universo, infinito, cosmos, "pulmón del planeta", "madre naturaleza", increíble, alucinante, "¿sabías que…?", "billion", "en el mundo actual", moralejas.
- Prohibido (look): hereda el PROHIBIDO global de `motion-craft` + cielo nocturno oscuro con estrellas que brillan o titilan · galaxia espiral, nebulosa, planeta Tierra o globo girando · siluetas de árbol verde, hojas cayendo, brotes en manos · verde como acento · glow, destellos, partículas decorativas · contadores que se pasan de su valor · puntos que aparecen con fundido (se estampan) · mono en mayúsculas como adorno · fondo crema + serif itálica.
- No se dice / no se muestra: nada del universo entero ("más que estrellas en el universo" es falso) · "billón" en el sentido inglés (billón = 10^12; en voz "tres billones. Tres millones de millones") · cuántas estrellas se ven a simple vista · árboles por persona, por país o por Colombia · cuántos años faltan para "acabar" los árboles · la tala (15.000 millones/año) y el 46 % quedan **fuera** de esta versión: son otra idea (ángulo C) · "científicos de la NASA" o cualquier institución que no esté en ref/facts.md · el ~30 por estrella (cifra mínima) solo en la línea de fuente, no en voz.
- Mide el éxito: retención a 3 s, finalización > 50 %, comentarios con la apuesta ("yo dije estrellas"), compartidos.

## Especificación
```text
META:       el espectador siente que perdió la apuesta con gusto y se queda con una imagen: una estrella y sus
            siete árboles; quiere contárselo a alguien esta noche.
SALIDA:     1080×1920, 30 fps · reloj: voz (voice.json; stage.at/word/end). Música sin bpm de anclaje.
TIEMPO:     55–65 s × 30 = 1650–1950 fotogramas; estimado 62.5 s = 1875 f (la voz manda; si pasa de 65 s
            se corta la línea `mapa`, luego `apuesta`; nunca `empate`, `billones` ni el payoff).

LOOK:       Medio = un pliego técnico impreso con una sola tinta: arriba un atlas estelar (puntos rellenos),
            abajo el plano de una parcela forestal (anillos = copas vistas desde arriba con su punto de fuste).
            Se mueve como un plotter: los puntos se ESTAMPAN fila por fila; las copas de la parcela se TRAZAN.
            Fondo papel #e9ece4 (gris verdoso claro, mate; NO crema), grano de papel 3 % con Stage.noise
            (estático por coordenada + deriva con la cámara), viñeta 0 %, sin sombras.
            Tinta #1b2421 (verdinegro) para todo lo que se lee y todos los puntos/anillos.
            Tintas de contexto = la misma tinta al 72 / 45 / 18 / 8 % (color-mix), nunca un gris nuevo.
            UN acento: bermellón de imprenta #d9481c. Significa "lo que le toca a una estrella": solo la
            estrella-hilo, sus 7,6 anillos en el payoff/cierre y el numeral "7,6". Ninguna otra cosa.
            Display: Archivo 800 (Google Fonts), tracking −2 %, titulares 150–180 px (7.8–9.4 % del alto),
            máx. 2 líneas y ≤ 5 palabras; números Archivo 800 `tabular-nums`: "3,04" a 340 px, "7,6" a 400 px,
            cifras de apoyo ("400.000 millones", "3.040.000.000.000") a 64–96 px.
            Apoyo y rótulos de campo: Hanken Grotesk 600, 52–64 px; pie de unidad 52 px; línea de fuente 48 px
            (piso de check.mjs). Subtítulos: Hanken Grotesk 600 58 px tinta sin caja (fondo > 180), ≤ 4
            palabras, palabra activa subrayada 4 px en tinta (NO en bermellón), riel base y≈1385,
            contenedor left 65 / width 875.
            Zona segura: texto en x 65–940, y 250–1330; puntos y anillos pueden llegar a y 1498.

OBJETOS:    estrella (punto de atlas): círculo relleno de tinta; en el gancho 3 tallas como magnitudes de atlas
              (Ø 7/11/15 px), en los bloques Ø 11 px a paso 19 px.
            estrella-hilo `#hilo`: el mismo punto en #d9481c, Ø 15 px a escala 1; en el payoff Ø 120 px.
            árbol (copa en planta): anillo de trazo 2.5 px, Ø 13 px, con punto de fuste Ø 3 px al centro
              (convención de plano forestal: se lee "árbol visto desde arriba" tras la parcela del beat 5).
            copa de parcela (primer plano, beat 5): contorno lobulado de 6–9 lóbulos (radio ± 12 % con
              Stage.noise), Ø 60–110 px, trazo 4 px, fuste Ø 8 px; 24 copas en una parcela.
            parcela: cuadro 640×640 px de filete 3 px con estacas de 12×12 px en las 4 esquinas.
            bloque: 20×20 = 400 unidades a paso 19 px (380×380 px); separación entre bloques 40 px.
              estrellas = 1 bloque (400 exactos) · árboles antes de 2015 = 1 bloque (~400) ·
              árboles 2015 = 7 bloques llenos + 1 bloque con 12 filas (240) = 3.040 anillos EXACTOS,
              dispuestos 2 columnas × 4 filas bajo el bloque de estrellas.
            retícula de km (solo beat 5): líneas de 2 px al 15 % cada 64 px; celdas sombreadas por densidad
              con tinta al 8 / 18 / 45 %.
            barrido de satélite: banda horizontal de 48 px de tinta al 12 % con borde inferior 2 px al 45 %.
            horizonte `#split`: filete 3 px de tinta, x 100–980, y=960 en el encuadre del gancho y del cierre.
            pie de unidad: "1 punto = 1.000 millones" bajo el campo (y≈1250), NUNCA en una esquina.
            sello "EMPATE": Archivo 800 150 px en tinta dentro de un rectángulo de filete 6 px, rotado −4°.

MOVIMIENTO: cámara (contenedor `#cam` sobre `#world`): reencuadres 1.1–1.3 s `power2.inOut`; deriva por
              escena 4–6 % `power1.inOut` sobre ventana ×1.12; buceo al payoff 1.3 s `power2.inOut` con blur
              pico 10 px en el fotograma más rápido; nunca acercar y alejar seguidos.
            estampado (canvas, estado S en tl + dibujo en onFrame): una fila por fotograma; cada punto
              entra con escala 1.25→1 en 3 fotogramas `power3.out`, opacidad binaria (tl.set), sin fundido.
            trazo de copas: stroke-dashoffset 0.5 s `power1.inOut`, escalonado 50 ms (24 copas ≈ 1.65 s:
              es el mundo resolviéndose, excepción declarada al tope de 500 ms).
            titulares: máscara yPercent 105→0, 0.45 s `expo.out`, palabras a 60 ms; salida 0.3 s `power3.in`
              con blur 8 px. Variaciones obligatorias: EMPATE = R8 slam (scale 1.6→1, 0.58 s expo.out +
              sacudida de 3 fotogramas en #cam); giro y cierre = R9 line swap; cifras = R12 por fotograma.
            contadores: 1.4 s `power2.out` en onFrame (R12), terminan en la palabra que dice el número, sin
              sobrepaso; string final exacto ("400.000 millones", "3,04", "7,6").
            sellos: back.out(1.4) solo en escala; nunca en opacidad, color ni cifras. Sin resortes.
            secundarios: 50–70 % del recorrido del héroe, arrancan 100–200 ms después.

PLANOS:
 P1 0.0–4.2   gancho · héroe: las dos mitades de la hoja se estampan por filas a la vez + deriva de cámara
              1.00→1.04 · lee "¿QUÉ HAY MÁS?" (170 px, sobre el horizonte) 0.0–4.2, "ESTRELLAS · Vía Láctea"
              (64 px, y≈300) y "ÁRBOLES · Tierra" (64 px, y≈1250) 0.0–4.2 · sonido: ráfaga de tick −22 dB
              desde f0, cama entra en 0.0 · sale: la cámara sube al atlas, fin 4.2 (todavía en vuelo).
 P2 4.2–9.3   apuesta + unidad · héroe: un punto del atlas sube y crece a Ø 260 px (en "punto") y vuelve
              a su sitio dejando el pie "1 punto = 1.000 millones" · lee "1 punto = 1.000 millones"
              (96 px) 6.9–9.3, luego queda como pie de 52 px · sonido: pop −18 dB en "punto" · fin 9.3.
 P3 9.3–17.0  galaxia · héroe: el atlas se contrae en un bloque de 20×20 (cada estrella vuela a su celda,
              filas a 1 fotograma); la estrella-hilo queda en fila 3 / col 17 · lee "100.000 – 400.000
              millones" (contador R12 que termina en "cuatrocientos") 10.5–17.0; en "alta" el "100.000" se
              tacha en tinta y queda "400.000 millones · 400 puntos" · sonido: tick cada 4 filas −24 dB,
              thud suave −16 dB cuando el bloque asienta · fin 17.0, la cámara baja medio bloque.
 P4 17.0–26.5 antes / empate · héroe: bajo las estrellas se estampa un bloque idéntico de 400 anillos
              (filas a 1 fotograma, arranca en "Árboles") · lee "Árboles antes de 2015: ~400.000 millones"
              (56 px) 18.5–22.8; sello "EMPATE" (R8) en "Empate" ~23.2, sostenido hasta 26.5 · sonido:
              @stamp/@impact wood −14 dB en el contacto del sello · fin 26.5.
 P5 26.5–37.5 conteo · héroe: Z adelante: la cámara entra a un anillo del bloque de árboles, que se abre en
              una parcela de 640 px; se trazan 24 copas lobuladas; la parcela se encoge a una celda y la
              cámara se aleja sobre la retícula de km mientras la banda de satélite barre de arriba a abajo
              (1.2 s, ease none, en "satélite") y las celdas se sombrean por densidad (en "kilómetro") ·
              lee "más de 400.000 parcelas" (contador R12 en "cuatrocientas") 28.0–31.5, "+ satélite"
              (64 px) 31.8–33.6, "1 mapa, km² por km²" 34.2–37.3 · sonido: tick por copa −26 dB (tomas
              rotadas), swish −20 dB con la banda · fin 37.5: el mapa se comprime de vuelta en el bloque.
              (escena larga 1 de 2: 10.3 s de voz).
 P6 37.5–45.6 giro · héroe: en "No eran" el rótulo "~400.000 millones" del bloque de árboles se tacha; en
              "tres" (≈40.3) line swap R9 a "3,04 billones" (340/96 px) con "3.040.000.000.000" (64 px)
              debajo, cambio en 1–3 fotogramas; en "Siete" (≈43.1) se estampan 6 bloques más + el octavo
              empieza (cascada, 60 ms entre bloques, total ≤ 0.5 s) y la cámara retrocede a escala 0.55 ·
              lee "3,04 billones" 40.3–45.6, "×7" (en tinta, no en bermellón) 43.2–45.6 · sonido: snap −14 dB en el
              swap, cascada de thud −18 dB (tomas rotadas), whoosh −18 dB en el retroceso, la cama se
              abre (cuerdas graves) en 40.3 · fin 45.6 con la cámara asentándose.
 P7 45.6–48.2 RESPIRO · cámara quieta a escala 0.55: arriba 1 bloque de estrellas con la estrella-hilo,
              abajo 7 bloques de anillos; lo único que se mueve: el octavo bloque termina sus 12 filas
              (una fila cada 5 fotogramas) · lee solo los rótulos "ESTRELLAS" / "ÁRBOLES" (64 px) ·
              sonido: solo cama · fin 48.2.
 P8 48.2–56.0 payoff · héroe: buceo de 1.3 s a la estrella-hilo hasta Ø 120 px en (540, 760); en el
              silencio (≈51.8–52.5) todo quieto y la música cortada; en "estrella" (≈52.6) llegan 7 anillos
              bermellón Ø 64 px + 1 anillo trazado al 60 % desde sus bloques, escalonados 60 ms, y asientan
              en círculo de radio 220 px en "siete" (≈54.0) · lee "7,6" (400 px, bermellón, R12 0→7,6
              terminando en "siete") 53.0–56.0, "árboles por estrella" (72 px) 53.6–56.0, "con la cifra más
              alta de estrellas" (48 px) 54.2–56.0 · sonido: corte total 0.7 s → @impact soft −12 dB en el
              asentamiento, la cama vuelve más llena · fin 56.0.
 P9 56.0–62.5 cierre · héroe: la cámara se aleja y baja al encuadre exacto del fotograma 0 (`#split` en
              y=960): arriba el atlas al 18 % con solo la estrella-hilo al 100 %, abajo sus 7,6 anillos
              bermellón; "¿QUÉ HAY MÁS?" (`#q`) hace line swap a "ÁRBOLES." en "abajo" · lee "ÁRBOLES."
              (170 px) 58.5–62.5, "más de 7 por estrella" (64 px) 59.0–62.5, fuente (48 px, y≈1240):
              "Crowther et al., Nature 2015 · ESA/Gaia: 100.000–400.000 millones de estrellas" 59.5–62.5 ·
              sonido: paper −20 dB en el movimiento, la música cierra en cadencia 0.3 s antes del último
              fotograma · pose final 1.5 s (61.0–62.5), fin 62.5.

PROHIBIDO:  = línea Prohibido (look) del contrato (crece tras cada render).

QA:         t=0.0   gancho: hoja partida, "¿QUÉ HAY MÁS?" legible, ambas mitades estampándose, estrella bermellón visible
            t=0.3   lo mismo legible a 360 px de ancho (miniatura)
            t=8.5   "1 punto = 1.000 millones" grande, un punto a Ø 260 px
            t=16.5  bloque de 400 estrellas asentado, "400.000 millones" con el 100.000 tachado, hilo en fila 3/col 17
            t=24.5  dos bloques idénticos + sello EMPATE (rotado −4°)
            t=30.0  parcela con copas lobuladas trazándose + contador "400.000"
            t=35.5  retícula de km sombreada, banda de satélite ya pasó
            t=40.4  giro: "3,04 billones" ya cambiado (1–3 f después de "tres"), "~400.000" tachado
            t=46.8  RESPIRO: 1 bloque de estrellas vs 7 bloques llenos + el 8.º a medias; cámara quieta
            t=52.2  silencio: estrella-hilo Ø 120 px sola, nada se mueve más que la deriva
            t=54.5  payoff: estrella + 7 anillos + 1 anillo al 60 %, "7,6" en bermellón, sin sobrepaso
            t=60.0  callback: mismo encuadre que t=0, "ÁRBOLES." en el lugar de la pregunta, fuente legible
            t=62.4  pose final idéntica a 61.0; nada en y > 1498 ni x > 940 que se tenga que leer
```

## Ángulos
Ideas de una línea (≥ 5): ① dos mapas de puntos con la misma unidad, la cámara viaja de uno al otro · ② carrera de conteo narrada como partido de fútbol · ③ la tala: el único de los dos mapas que se puede borrar · ④ POV en la Tatacoa sin luna mirando arriba y luego al suelo (descartada: exige cifras de estrellas visibles que no están en la fuente) · ⑤ zoom infinito de una copa a la parcela, al país y al planeta (descartada: los conteos intermedios por país no están en la fuente y habría que derivarlos) · ⑥ una persona midiendo un árbol con cinta en una parcela (descartada como ángulo; queda como beat dentro de A).

```
A · Dos mapas, un punto — dispositivo: un número aterriza (1 punto = 1.000 millones; el conteo de 2015
    rompe el empate) · forma: viaje continuo sobre un pliego   ← RECOMENDADO: la apuesta y el empate le dan
    tensión a un dato, y la misma unidad hace la comparación honesta y visible sin una sola cifra derivada.
  Se ve / se siente: un atlas de estrellas y un plano de bosque impresos en la misma hoja, contados con la
    misma regla; parece empate hasta que la parcela y el satélite cuentan de verdad y el bosque se multiplica
    7,6 veces. Se siente como perder una apuesta con gusto.
  0–2 s exactos: hoja partida por el horizonte, arriba puntos rellenos, abajo anillos, ambos estampándose por
    filas, una estrella bermellón · "¿QUÉ HAY MÁS?" · "¿Qué hay más: estrellas en nuestra galaxia, o árboles
    en la Tierra?" · ráfaga de tick de estampado.
  Beats: gancho (apuesta) → unidad → galaxia (400 puntos, cifra alta) → antes de 2015: empate → el conteo
    (parcelas + satélite) → giro: 3,04 billones, ×7 → respiro (8 bloques) → payoff (7,6 árboles por
    estrella) → cierre en el mismo encuadre: "ÁRBOLES."
  Look: papel técnico #e9ece4, una tinta verdinegra, bermellón solo para la estrella-hilo y lo suyo;
    Archivo 800 + Hanken Grotesk; el medio se estampa y se traza.
  Sonido: cama de mazos apagados + pizzicato ~92 bpm, seca; se abre con cuerdas graves en el giro (40 s),
    corte total 0.7 s antes del payoff; ticks en el estampado, sello en EMPATE, snap en el swap.

B · El clásico — dispositivo: el tipo carga el argumento (dos contadores compiten como dos equipos) ·
    forma: split-screen que colapsa   ← la audaz
  Se ve / se siente: un marcador partido ESTRELLAS | ÁRBOLES y un relator de fútbol colombiano que narra el
    conteo como un partido; las estrellas "se quedan sin aire" en 400.000 millones y los árboles siguen; la
    pantalla de estrellas se encoge hasta ser una franja y el bosque se come el marcador. Divertido y muy
    compartible; riesgo de que el chiste tape el asombro.
  0–2 s exactos: marcador de estadio dibujado en tinta, dos contadores en 0 arrancando · "ESTRELLAS vs.
    ÁRBOLES" · "¡Arranca el partido más grande de la galaxia!" · pito de árbitro + murmullo de tribuna.
  Beats: pitazo → estrellas arrancan fuerte (100.000… 400.000 millones) → "¡se queda sin aire!" → árboles
    pasan con el conteo de 2015 → "¡tres billones!" → repetición en cámara lenta: 7,6 por estrella → pitazo final.
  Look: risografía en dos planchas (tinta + bermellón) sobre papel; Barlow Condensed 800 de marcador.
  Sonido: hype procedural a 128 bpm, golpes en cada gol de conteo, tribuna CC0 de la biblioteca bajo la voz.

C · Lo que se puede borrar — dispositivo: antes y después (la tala como giro) · forma: un cuadro que se
    reordena
  Se ve / se siente: el mismo campo de 3.040 anillos contra 400 estrellas; gana el bosque, pero entonces
    cada año se borran 15 puntos (15.000 millones talados al año): de los dos mapas, solo uno se puede
    borrar. Más grave y reflexivo; arriesga sermón y saca la pieza del asombro.
  0–2 s exactos: un borrador pasa sobre un anillo y lo quita, deja la marca del papel · "−15 al año" ·
    "Cada año borramos quince de estos puntos." · fricción de borrador.
  Beats: borrado → ¿qué es un punto? (1.000 millones) → el campo completo vs las estrellas → los árboles
    ganan → el borrado sigue → "las estrellas no se talan" → cierre en el campo con huecos.
  Look: el mismo pliego de A, con huecos que dejan el fantasma al 8 %.
  Sonido: ambient lento a 70 bpm, borrador y papel reales de la biblioteca, sin golpes.
```

## Ganchos
Puntaje 0–5: especificidad · curiosidad · claridad a 0.3 s (sin sonido, vertical) · dibujable · honestidad.

| # | Mecanismo | Imagen (0.0 s) | Texto | Voz | Sonido | Promesa → ¿se cumple? | Puntaje |
|---|---|---|---|---|---|---|---|
| **G1 ganador** | Curiosity gap (apuesta) | hoja partida: atlas de puntos arriba, anillos abajo, ambos estampándose; estrella bermellón | "¿QUÉ HAY MÁS?" + ESTRELLAS / ÁRBOLES | "¿Qué hay más: estrellas en nuestra galaxia, o árboles en la Tierra?" | ráfaga de tick | quién gana y por cuánto → sí, 7,6 por estrella a los 52.5 s | 5·4·5·5·5 = **24** |
| G2 alt. | Mito vs. realidad | los dos bloques iguales con sello EMPATE que se tacha | "EMPATE. *Error.*" | "Hasta dos mil quince, árboles y estrellas iban empatados." | sello + rasgón | que el empate era falso → sí, en el giro | 4·4·4·5·4 = 21 (la comparación con el máximo de estrellas debe decirse en la pieza) |
| G3 alt. | Clímax primero | una estrella bermellón con sus 7 anillos y uno al 60 % | "7,6 por estrella" | "A cada estrella de la galaxia le tocan más de siete árboles." | impacto suave | luego se explica el porqué → sí, pero el payoff queda gastado | 5·3·4·5·5 = 22 |
| G4 | Objeto fuera de lugar | atlas estelar donde un "punto" es una copa diminuta | "Esta no es una estrella" | "Una de estas no es una estrella." | tick que se corta | que hay árboles entre las estrellas → solo de forma metafórica | 3·4·2·5·3 = 17 |
| G5 | Número que choca | "3.040.000.000.000" estampándose dígito a dígito | "ÁRBOLES" | "Tres billones de árboles. Tres millones de millones." | ráfaga de ticks | el tamaño → sí, pero sin rival se pierde la apuesta | 4·3·3·5·5 = 20 |

Gana **G1**: es el único que abre la pregunta dramática exacta y deja al espectador apostando (lo que alimenta los comentarios) y se entiende sin sonido. **G3** sirve como variante A/B (clímax primero para quien ya conoce el dato); **G2** queda adentro como beat 4.

## Arco
Marco: **Hallazgo** — expectativa (apuesta y empate) → por qué (cómo se contó) → dato que la rompe (3,04 billones, 7×) → qué significa para ti (7,6 por estrella, esta noche). Duración estimada 62.5 s (rango 55–65, la voz manda); ~145 palabras; ~9 s sin voz (14 %).

| # | Beat | % | t (s) | Qué pasa (un verbo) | Cambia |
|---|---|---|---|---|---|
| 1 | Gancho | 0–7 | 0.0–4.2 | la hoja partida se estampa; la pregunta | abre la apuesta |
| 2 | Unidad | 7–15 | 4.2–9.3 | un punto crece y se vuelve la regla: 1 punto = 1.000 millones | da la herramienta de comparación |
| 3 | Galaxia | 15–27 | 9.3–17.0 | el atlas se contrae a 400 puntos; se le da la cifra más alta | fija el rival en su mejor versión |
| 4 | Empate | 27–42 | 17.0–26.5 | se estampa un bloque igual de árboles (antes de 2015); sello EMPATE | falsa resolución: la apuesta "estrellas" iba bien |
| 5 | Conteo | 42–60 | 26.5–37.5 | la cámara entra a una parcela, se trazan copas; satélite y mapa por km² | la prueba: cómo se sabe |
| 6 | Giro | 60–73 | 37.5–45.6 | "~400.000" se tacha → "3,04 billones"; el bosque se multiplica ×7 | rompe el empate (en 1–3 fotogramas) |
| 7 | **RESPIRO** | 73–77 | 45.6–48.2 | cámara quieta: 1 bloque contra 7,6; termina el último | deja sentir la escala |
| 8 | Payoff | 77–90 | 48.2–56.0 | buceo a la estrella-hilo; silencio; llegan sus 7,6 árboles | responde "por cuánto" (≈ 84 %) |
| 9 | Cierre / callback | 90–100 | 56.0–62.5 | vuelve el encuadre del fotograma 0; la pregunta se cambia por "ÁRBOLES." | la hoja queda contestada |

## Borrador de voz
Un solo hablante (`narrador`, Qwen3-TTS VoiceDesign). Números escritos como se dicen. El texto en pantalla complementa (no repite): ver PLANOS.

| id | speaker | línea | emoción | intención |
|---|---|---|---|---|
| hook | narrador | ¿Qué hay más: estrellas en nuestra galaxia, o árboles en la Tierra? | curiosidad retadora · 0.55 · ritmo medio | abrir la apuesta en ≤ 4 s |
| apuesta | narrador | Haz tu apuesta. Y ahora, contemos. | complicidad, sonrisa · 0.5 | comprometer al espectador con una respuesta |
| unidad | narrador | Aquí, cada punto vale mil millones. | claro, didáctico sin sermón · 0.45 | fijar la regla (anclar "punto") |
| galaxia | narrador | La Vía Láctea tiene entre cien mil y cuatrocientos mil millones de estrellas. | asombro contenido · 0.5 | dar el dato con su rango honesto |
| generosa | narrador | Démosle la más alta: cuatrocientos puntos. | generoso, juguetón · 0.5 · pausa 0.5 después | poner al rival en su mejor versión (anclar "alta") |
| antes | narrador | Árboles. Antes de dos mil quince, se calculaban unos cuatrocientos mil millones. | narrativo, pausa breve tras "Árboles." · 0.45 | preparar la falsa resolución |
| empate | narrador | Empate. Si apostaste por las estrellas, ibas bien. | divertido, cómplice · 0.55 · pausa 0.4 después | soltar la tensión antes del giro (anclar "Empate") |
| conteo | narrador | Ese año, un equipo cruzó mediciones de más de cuatrocientas mil parcelas de bosque con imágenes de satélite. | interés creciente, ritmo un poco más ágil · 0.55 | la prueba (anclar "cuatrocientas", "satélite") |
| mapa | narrador | Y armó un mapa de árboles, kilómetro por kilómetro. | concentrado · 0.5 · pausa 0.5 después | cerrar el método (anclar "kilómetro"); primera en cortarse si sobra |
| resultado | narrador | No eran cuatrocientos mil millones. | conspirativo, más lento · 0.55 | cargar el giro |
| billones | narrador | Eran tres billones. Tres millones de millones. | asombro, golpe en "tres" · 0.75 | el giro (anclar "tres"); aclarar billón = 10^12 |
| siete | narrador | Siete veces más de lo que creíamos. | asombro que se asienta · 0.6 · luego RESPIRO ~2.6 s | escalar (anclar "Siete") |
| aun | narrador | Así que, aun dándole a la galaxia su cifra más alta… | íntimo, despacio · 0.5 · pausa 0.7 (silencio total) | preparar el payoff |
| payoff | narrador | a cada estrella le tocan más de siete árboles. | revelación cálida, sin gritar · 0.8 | la respuesta (anclar "estrella", "siete") |
| cierre | narrador | Esta noche, mira para arriba. Por cada estrella, más de siete árboles aquí abajo. | cálido, cercano · 0.6 · pose final 1.5 s | llevar el dato a la vida del espectador (anclar "abajo") |

Notas para el scriptwriter: 145 palabras; si la medida pasa de 65 s, corta `mapa` y luego `apuesta`; no toques `empate`, `billones` ni `payoff`. En `say`, "dos mil quince", "cuatrocientos mil millones", "tres billones" tal cual; en pantalla, "2015", "400.000 millones", "3,04 billones" / "3.040.000.000.000". Pronunciación a vigilar en Whisper: "Vía Láctea", "billones" (no "millones").

## Rúbrica
| Criterio | 0–5 | Nota |
|---|---|---|
| Especificidad | 4 | la hoja partida, la unidad y los 7,6 anillos solo sirven para este dato |
| Curiosidad | 4 | la apuesta abre una pregunta con dos respuestas posibles y un "por cuánto" |
| Claridad | 4 | sin sonido: ESTRELLAS/ÁRBOLES, bloques iguales, EMPATE, ×7, 7,6 |
| Tensión | 3 | apuesta + falsa resolución (empate) antes del giro |
| Progresión | 4 | cada beat cambia: regla → rival → empate → prueba → giro → escala → respuesta |
| Emoción | 3 | asombro y complicidad; sin persona en pantalla |
| Originalidad | 4 | dos mapas impresos con la misma tinta (atlas + plano de parcela), punto relleno vs. anillo; cero cielo oscuro ni hojas |
| Payoff | 5 | la estrella del fotograma 0 recibe sus 7,6 árboles, exactamente lo prometido |
| Voz propia | 3 | narrador cómplice colombiano; sin marca |
| Honestidad | 5 | todas las cifras de ref/facts.md; se usa el máximo de estrellas y se dice; 3.040 anillos exactos |
| **Promedio** | **3.9** | ninguno < 3 |

Más débil: **tensión** (empatada con emoción y voz propia). Qué hice: convertí el dato anterior a 2015 (~400.000 millones, el mismo número que el máximo de estrellas) en un **empate sellado** a la mitad, con "si apostaste por las estrellas, ibas bien", para que el espectador crea que ganó justo antes del giro; y le di al rival su cifra más alta para que la derrota sea limpia.

Lecturas cruzadas:
- **Líneas solas**: la voz sola cuenta la apuesta, la regla, el rival, el empate, el método, el giro y la respuesta; se entiende sin imágenes. ✓
- **Imágenes solas** (texto tapado): dos mitades → un bloque de puntos → un bloque igual de anillos + sello → parcela de copas → el bloque de anillos se multiplica ×7,6 → una estrella con sus 7,6 anillos → la hoja del inicio con la estrella arriba y los anillos abajo. Cuenta la historia; el único punto débil es que los anillos se leen como "árbol" solo después de la parcela (beat 5), por eso los rótulos ESTRELLAS/ÁRBOLES van en el gancho. ✓ con esa salvedad.

## Fuentes
- `ref/facts.md` (verificado 2026-10-25):
  - ~3,04 billones de árboles (3.040.000.000.000): Crowther, T. W. et al. (2015) "Mapping tree density at a global scale", *Nature* 525: 201–205, https://www.nature.com/articles/nature14967 · Yale: https://environment.yale.edu/news/article/Yale-study-reveals-there-are-3-trillion-trees-on-earth
  - Método: densidad medida en más de 400.000 parcelas forestales + imágenes satelitales → mapa global por km².
  - ~7 veces más que la estimación anterior (~400.000 millones).
  - Vía Láctea: 100.000–400.000 millones de estrellas, ESA/Gaia (Jos de Bruijne) vía Space.com https://www.space.com/25959-how-many-stars-are-in-the-milky-way.html
  - ~7,6 árboles por estrella con el máximo; ~30 con el mínimo (solo en la línea de fuente).
- No se usan en esta versión (quedan para el ángulo C): tala > 15.000 millones/año; caída de ~46 % desde el inicio de la civilización; reparto tropical/boreal/templado.

## Supuestos
- Ruta **Dato** · 55–65 s, la voz manda (más largo que el rango 15–35 s de la ruta porque el encargo lo pide) · 1080×1920, 30 fps · reloj = voz · voz Qwen3-TTS VoiceDesign local (en vez de voz de estudio) · música ACE-Step local o procedural `pulse` → `ambient` (en vez de catálogo) · SFX sintetizados + biblioteca CC0 Kenney. Nada de pago.
- Plantilla `voice-short` + canvas para los campos de puntos (3.440 unidades + copas). Estilo: medio propio "pliego técnico" derivado de `data-story` (versión clara, una serie en acento, unidades) con el trazo de pluma de `line-drawing` solo para las copas de la parcela; es un solo medio (impreso + trazado), no dos estilos mezclados. Sin art-director aparte: LOOK/OBJETOS/MOVIMIENTO los fijé yo.
- **Riesgo medio — el empate**: junta dos cifras con fuente (estimación previa ~400.000 millones y máximo de estrellas 400.000 millones). No es derivado, pero solo es empate contra el máximo: la pieza dice antes "démosle la más alta". fact-checker debe confirmar que la voz no lo presente como empate absoluto.
- **Riesgo medio — "un equipo cruzó mediciones"**: el estudio compiló mediciones de parcelas (no las midió todas el mismo equipo en campo). Por eso "cruzó mediciones", no "midió".
- **Riesgo bajo — 7,6 como 7 anillos + 1 al 60 %**: es un promedio, dibujado como promedio; el vuelo de los anillos desde sus bloques es ilustrativo.
- Los anillos se leen como árboles por convención de plano forestal; si la hoja de contacto muestra que no se entienden en el gancho, se agrega un fuste corto (2 px × 6 px) bajo cada anillo solo en el gancho, sin pasar a siluetas verdes.
- La duración estimada (62.5 s) sale de 145 palabras a ~2.75 palabras/s; la real sale de `voice.json`.
- Línea de fuente a 48 px (no 36–40 como sugiere `data-story`) para pasar el piso de `check.mjs`.

## Bitácora
