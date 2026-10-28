# Demo: vender-guion — clon de la gramática de v3 (Comenta VENDER, montaña rusa)

## Contrato creativo
- Idea en una frase: Este video le dice al creador que un video que se ve completo se arma con ocho piezas — y lo demuestra recorriendo un riel que ES el video.
- Promesa (lo que el gancho ofrece): la receta completa de un video que se ve hasta el final, con la pieza más importante revelada al final.
- Pregunta dramática: ¿cuál es la pieza más importante, si no es el gancho?
- Payoff: doble — (a) la respuesta: "la rima", la pieza 8; (b) el payoff meta al ~86 %: plano cenital blueprint del riel con las 8 piezas numeradas y "¿Te diste cuenta? Este video está armado igual. Llegaste al final."
- Gancho: mecanismo 1 (curiosity gap) + pregunta de oficio — "¿Cómo se arma un video que se ve hasta el final?" + imagen del fotograma 0: la cámara YA corriendo por el riel sobre el atardecer, chip 1 asomando + sonido: riel que corre (tick suave continuo).
- Hilo: el riel — un solo objeto que viaja del fotograma 0 al payoff; cada pieza es un chip numerado clavado en el riel; el marker "TÚ ESTÁS AQUÍ" viaja con la cámara.
- Estructura: pregunta → tesis (ocho piezas, mismo orden) → twist de tesis (la más importante no es el gancho) → recorrido 1–8 → payoff meta cenital → CTA guardar/comentar.
- Forma: toma continua — la cámara recorre el riel TODO el video; UN solo corte de bloque (a cenital blueprint en el payoff meta). CV de tramos objetivo ≈ 0.5–0.6, quietud 0 %.
- Rima / callback: planta el riel como recorrido (frame 0) → cobra como mapa (cenital, t≈43): el mismo path, ahora blueprint con las 8 piezas numeradas. Mismo objeto, dos vistas.
- Respiro: el beat de la pieza 6 (el respiro SE demuestra: la card se asienta mientras la cámara sigue deslizándose — nunca quietud total).
- Mood: crucero al atardecer — cama chill con sub en cada pin de sección.
- Tono y voz: catedrático de oficio, cercano, que confiesa el truco al final; palabras sí: piezas, orden, riel, bucle; palabras no: secreto, fórmula mágica, garantizado.
- Color por sección (semántico, no decorativo — mismo significado = mismo color): 1 Gancho coral #ff5e7a · 2–3 Cuerpo dorado #ffc94d · 4–5 Bucle/Giro cyan #3ad0ff · 6–8 Cierre verde #35e08c · marker "TÚ ESTÁS AQUÍ" blanco. El acento de cada caption-pill = el color de su sección.
- Prohibido (look): hereda los tics de `motion-craft` + degradado suave a pantalla completa (el cielo es FRANJADO de afiche: 4 bandas planas navy→violeta→coral→oro, sin gradiente continuo — anti-banding H.264 y anti-look-AI), partículas, glow fuera de los pins, rebote en el riel, cortes sin vector.
- No se dice / no se muestra: que la plantilla "asegura viralidad"; números de retención inventados; la marca de nadie (el CTA es guardar + comentar GUION, sin logo).
- Mide el éxito: retención a 3 s; guardados; comentarios con GUION.

### Números objetivo (cut-sheet de la referencia, ref-analysis/)
50.48 s · CV tramos 0.496 · quietud @2 Hz 0.0 % · diff media 23.09 (el más cinético del set) · −14.3 LUFS · pico −0.3 dBTP · 7 cortes solo para giros de bloque (nosotros: 1 bloque → 2 tramos).

## Especificación
META: el espectador siente que le acaban de dar el plano — y que el video que acaba de ver era la demo.
SALIDA: 1080×1920, 30 fps · reloj: voz (~120 palabras) · bpm 84 (ambient).
TIEMPO: ~50 s (voz manda; payoff meta ~43 s; CTA últimos 14 %).
LOOK: cielo franjado de afiche (navy #141a33 / violeta #4a2a5e / coral #ff6a4d / oro #ffc94d — bandas planas horizontales), mar plano abajo #0d1526 con reflejo de líneas; riel y soportes en tinta #f2f4f8 con ties; card de sección cristal oscuro rgba(10,14,24,.82) borde 2px; display Archivo 800 (titulares 110–150 px, tracking −2 %), números de chip IBM Plex Mono 600; captions frase completa 58 px bold con keyword en pill del color de sección; grano 2 % + viñeta 6 %.
OBJETOS: (1) riel de montaña rusa (curva con colinas deterministas, ties y soportes) que cruza el frame; (2) 8 chips numerados clavados en el riel con pin de su color de sección; (3) marker "TÚ ESTÁS AQUÍ" blanco que viaja junto a la cámara; (4) card de sección (nombre de la pieza + una línea) que entra en cada pin; (5) vista cenital blueprint (riel como trazo de líneas, nodos numerados, cotas) para el payoff meta; (6) CTA-mockup de comentario tecleando GUION + check verde; (7) captions frase con pill.
MOVIMIENTO: cámara = u(t) sobre el riel con acelerón suave en cada cierre de sección (power1.inOut), deriva lateral con noise ±3 px; chips con entrada crisp (0.16,1,0.3,1) 300 ms al cruzar su pin; cards reveal 20/50/30; corte de bloque a cenital: cut en movimiento con white-flash de 1 frame NO — corte seco con snap de sonido; cenital: nodos que se encienden en orden 1→8 (60 ms stagger) y el trazo del path se dibuja (draw-on 10/70/20, caps butt).
PLANOS: ver tabla de beats; `camera_move` = viaje continuo (no repetido porque es el mismo plano todo el video); static reservado: ninguno (quietud 0 %).
PROHIBIDO: = línea Prohibido (look) del contrato.
QA: t≈0.3 cámara ya corriendo + chip 1 visible · t≈5 twist de tesis card · t≈8–34 ocho pins en orden con sus colores correctos · t≈35 respiro card asentada con cámara deslizándose · t≈43 corte a cenital + nodos encendiéndose · t≈46 CTA GUION tecleándose ≥1.5 s legible.

## Tabla de beats (anclas de voice.json; t reales tras voice.mjs)

| # | ancla | t (est) | trabajo · persuasión · emoción | focal/apoyo (cue) | sonido |
|---|---|---|---|---|---|
| 1 | hook | 0–3.6 | gancho · pregunta · curiosidad | riel corriendo + marker blanco / "final" | tick riel |
| 2 | tesis | 3.6–7.0 | tesis · estructura · orden | chip 1 pasa / "ocho" | pop |
| 3 | twist | 7.0–10.2 | giro de tesis · tensión | card "no es el gancho" / "gancho" | sub corto |
| 4 | p1 | 10.2–14.5 | pieza 1 · instrucción | pin coral + card Gancho / "gancho" | impacto seco |
| 5 | p2 | 14.5–18.6 | pieza 2 · instrucción | pin dorado + card Promesa / "promesa" | impacto seco |
| 6 | p3 | 18.6–23.0 | pieza 3 · instrucción | pin dorado + card Prueba / "prueba" | impacto seco |
| 7 | p4 | 23.0–27.4 | pieza 4 · bucle abierto | pin cyan + card Bucle / "bucle" | drop sub |
| 8 | p5 | 27.4–31.6 | pieza 5 · giro | pin cyan + card Giro / "giro" | impacto |
| 9 | p6 | 31.6–36.0 | pieza 6 · respiro (meta) | card asentada, cámara desliza / "respiro" | cama sola |
| 10 | p7 | 36.0–39.8 | pieza 7 · payoff | pin verde + card Payoff / "payoff" | impacto seco |
| 11 | p8 | 39.8–43.0 | pieza 8 · LA respuesta | pin verde + card Rima / "rima" | golpe + sub |
| 12 | meta | 43.0–47.0 | payoff meta · revelación | CORTE a cenital + nodos 1→8 / "armado" | corte + snap |
| 13 | cta | 47.0–50.5 | CTA · guardar + comentar | mock GUION tecleándose / "GUION" | typing + ding |

## Revisión
- Decisiones creativas · historias no construidas: (a) usar su keyword VENDER (es el funnel de otro canal — ours: GUION); (b) clonar también el v5/CARD (mystery reveal) — queda para iteración 3.
- Medido: check PASS 0 fallas/1 aviso · verify social+asr 7 PASS/0 WARN/0 FAIL · ASR ida-vuelta 93.7 % (135/135 palabras sobre el MP4) · mix −14.0 LUFS, pico −2.7 dBTP, 20 cues (3.1/10 s) · quietud @2 Hz **0.0 %** con racha 0.0 s (referencia: 0.0 % — clavado) · movimiento 0.0140 norm (referencia 0.090: 3D completo vs 2D canvas — delta honesto declarado, no se persigue a costa de legibilidad) · specs 1080×1920@30, 64.30 s.
- Solo mirado: **nada — UNVERIFIED**: sin acceso a imágenes en esta sesión (crítico NO-VISUAL). Hojas generadas: review-beats (28 cuadros), phone, 12 seams, contact-sheet final.
- Nadie verificó: el sonido se midió, no se oyó; el look se midió por coordenadas, no se vio.
- Plano más débil: por números, el bloque p2–p3 (dos pins dorados consecutivos con la misma card-gramática — la deriva de cámara y nubes sostienen el movimiento, pero confirmar variedad en hoja).
- Avisos mantenidos a propósito y por qué: hook_duration ~4.2 s > 3 s — es el gancho de la referencia v3 ("¿Cómo se arma un video corto que la gente vea hasta el final?" corre ~4.5 s allí); se clona su cadencia, no se recorta.

FEEDBACK:
- → video-engine: `uOf(t)` por segmentos de voz es la receta general para "cámara que recorre TODO el video" anclada a voz — candidato a receta en motion-craft (cámara-continua por voice.json). [sugiere]
- → motion-craft: el centro medido del bloque de captions (carril 100–930 px) debe respetar x<939.6 — ya está en story-grammar el contenedor left:65/width:875; estos carriles más angostos (100–930) pasan con margen. Nada que cambiar. [sugiere]
- → orchestration: revisión visual pendiente de ojos (hojas listas). [bloquea la publicación, no la entrega]

## Bitácora
- orquestador: contrato v1 — clon de gramática v3 con contenido propio (las 8 piezas del plugin); corte de bloque único a cenital en el payoff meta. El color por sección es semántico (cada color = una familia de piezas), declarado como excepción al "un solo acento". [abierto]
- voz r1: 76.0 s a 2.11 w/s (lento) → dirección de cast afilada ×3 → 64.3 s a 2.40 w/s (banda). [resuelto]
- PS5.1 round-trip del script.json metió BOM y rompió JSON.parse → reescrito con Write/Node; lección ya documentada en video-engine. [resuelto]
- QA r1: char_budget p1/p6/p7 → 68/64/60; card .n 44→48 px; cards acortadas; saveHint eliminado (colisionaba con captions). [resuelto]
- QA r1 → sonda de rects: captions se APILABAN (dos capline visibles: cola +0.25 s pisa gap 0.3 s) → ventanas exclusivas por línea; y el carril centrado llegaba a x=950 (942 > 939.6) → carril 100–930. [resuelto]
- verify r1: quietud 21.1 % con racha 2.5 s (violaba la gramática v3 de 0 %) → ronda 2 de movimiento: colinas ×1.6, nubes parallax, cámara viva (balanceo+zoom+bob), pulsos en pins, grid vivo en blueprint → 0.0 % quietud, racha 0.0 s. [resuelto]
