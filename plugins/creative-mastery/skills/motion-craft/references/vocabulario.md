# Vocabulario: lo que dice el usuario → lo que se escribe

Ningún adjetivo entra al brief sin su número. Los adjetivos sueltos ("premium, moderno, limpio") son donde vive el look por defecto: vacío oscuro, glow, letra chica flotando, todo con fundido. Traduce cada uno con estas tablas y escribe el resultado en `## Especificación` (LOOK / MOVIMIENTO) del brief.

## Adjetivos de look (pieza completa)

| Dice… | Se escribe |
|---|---|
| premium, lujoso | un **material** con números: papel satinado con 2 % de grano, sombra de contacto al 55 %; curvas `power3.out` 0.6 s o resorte ζ 0.7–0.85; **cero** sobrepaso |
| moderno | cámara + sistema tipográfico: un empuje de 30 fotogramas en una sola curva; display al 9 % del alto con −2 % de tracking |
| limpio | rejilla y ración: 12 columnas, márgenes de 96 px (vertical: 60–84), acento en **una** palabra por plano |
| dinámico | cortes a compás (`stage.beat`), cambio de layout cada compás de 4 golpes (`stage.bar`), salidas `power4.in` |
| juguetón | resortes ζ 0.45–0.6 **solo en posición y escala**, poses exageradas 10–30 % |
| cinematográfico | "lente 35 mm": luz principal arriba-izquierda, contraluz, viñeta del 6 %, empuje de cámara continuo 4–8 %, grano 0.08–0.16 |
| serio, sobrio | ζ 1.0, sin sobrepaso, cortes secos + cortar la curva, 1 acento |
| viejo, retro | elige **una** falla (cinta, tubo o cámara), ver `video-styles/references/tratamientos.md` |

## Curva y duración

| Dice… | Curva | Duración | Se siente |
|---|---|---|---|
| suave, natural | `power2.out` | 0.4 s | desaceleración natural |
| seco, decidido, "snappy" | `power4.out` | 0.2–0.35 s | rápido y firme |
| con peso, que rebote | `back.out(1.4–1.7)` | 0.4–0.5 s | se pasa y se asienta |
| elástico, de goma | `Stage.spring(t,{stiffness:180,damping:12})` (ζ≈0.45), **solo personajes** | — | oscila (nunca `elastic.out`) |
| dramático | `expo.out` | 0.6–1.2 s | arranque fuerte, planeo largo |
| onírico, flotante | `sine.inOut` | 1–2 s | lento y simétrico |
| lujoso, premium | `power3.out` / resorte ζ 0.7–0.85 | 0.6 s | contenido, sin rebote |
| golpe, sello, impacto | `power3.in` → `tl.set` + `stage.sfx` en el contacto | 0.15–0.2 s | acelera hacia el choque |
| instantáneo | `tl.set` | 0 | corte |

Velocidad: rápido 0.2 s = energía · medio 0.4 s = profesional · lento 0.6 s = lujo · muy lento 1–2 s = cine.
Resortes (`Stage.spring`, ζ = damping/(2√stiffness)): 1.0 no rebota · 0.7–0.85 premium · 0.4–0.6 juguetón · < 0.3 caricatura. Opacidad, color y números nunca rebotan.

## Cámara (siempre sobre un contenedor, nunca sobre el texto)

| Dice… | Se construye |
|---|---|
| acercamiento lento | escala +4–8 % en toda la escena, `power1.inOut`, duración = escena × 1.12 |
| alejarse, abrir | escala hacia abajo mientras entran elementos (Z atrás = llegada: solo en el payoff) |
| paneo | traslación horizontal del contenedor de escena |
| grúa arriba/abajo | deriva vertical + leve cambio de escala (2–3 %) |
| látigo | 0.13–0.3 s de traslación con blur direccional 16–40 px hacia el encuadre siguiente |
| paralaje | capas a 0.2× / 1× / 6× de la velocidad de cámara |
| órbita | 3–5 °/s de rotación del fondo (pseudo 3D) |
| que se sienta en mano | `Stage.noise(seed, t*0.6)` × 3–6 px en x/y del contenedor, rotación ≤ 0.3° |

## Profundidad

| Dice… | Se construye |
|---|---|
| bokeh de primer plano | UN elemento grande con `filter: blur(22px)` que cruza delante del contenido a 6× |
| planos de profundidad | 2–3 capas a velocidades distintas |
| fondo fuera de foco | capa trasera con blur 8–14 px y a 0.2× |

## Ritmo

| Dice… | Se construye |
|---|---|
| punzante | 1.5–4 s por idea, cortes secos, entradas solapadas 30–50 % |
| montaje | cortes cada 0.13–0.8 s |
| demo | un encuadre de 7–10 s mientras la interfaz actúa |
| a compás | cortes en `stage.beat(n)`, cambios de composición en `stage.bar(n)` |
| respiro | 0.3–0.75 s de quietud antes del remate |
| reposo | la cámara se detiene 1.5–2.5 s; el mundo sigue resolviendo |

## Subtítulos por tono

| Tono | Tipografía | Animación | Tamaño (1080 de alto; vertical ×1.3) | Palabras por página |
|---|---|---|---|---|
| hype | pesada | pop de escala | 72–96 px | 2–3 |
| corporativo | sans limpia | fundido + deslizamiento | 56–72 px | 3–5 |
| tutorial | mono | máquina de escribir | 48–64 px | 3–5 |
| narrativo | serif | fundido lento | 44–56 px | 4–6 |
| social | redondeada | pop (resorte ζ 0.6) | 56–80 px | 2–3 |

Transición por energía: calma 0.5–0.8 s (blur 20–30 px) · media 0.3–0.5 s · alta 0.15–0.3 s (blur 3–6 px).
Audio-reactivo: texto 3–6 %, fondos 10–30 %.

## Notas del usuario o del crítico → cambio

| Dice… | Cambia | No cambia |
|---|---|---|
| "muy rápido" | zooms y paneos a 0.7× de velocidad | **nada más** |
| "más rápido", "más corto" | acorta el contenido y el beat en la misma medida; los beats siguientes suben | las curvas |
| "los títulos se mueven" | aterrizan y quedan quietos hasta salir; la deriva pasa a la cámara | — |
| "parece diapositivas" | entra a la escena siguiente a través de un objeto en pantalla; corta en pleno movimiento | — |
| "se ve genérico", "se ve IA" | busca el tic en el PROHIBIDO de `SKILL.md`, nómbralo y agrégalo al PROHIBIDO de la pieza | — |
| "le falta energía" | blur de movimiento medido, golpes con `tl.set` en el beat, reemplaza fundidos por llegadas desde grande | la duración total |

Fuentes: `motion-craft` · parte destilada de HyperFrames (Apache-2.0): `/prompting/vocabulary`, `references/motion.md`, `references/spec.md`.
