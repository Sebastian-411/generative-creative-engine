# Demo: destilacion-oracle

## Contrato creativo
- Idea en una frase: Este video le dice al creador escéptico que la calidad no se mira, se mide — y se audita a sí mismo en vivo mientras lo dices.
- Promesa (lo que el gancho ofrece): vas a ver un video que se aprueba solo, con números en pantalla.
- Pregunta dramática: ¿qué pasa cuando el inspector vive DENTRO del video?
- Payoff: el estado del HUD pasa de REVISANDO (rojo) a APROBADO (verde) en el frame en que la voz dice "pasó" — llega al ~86 % de la pieza (narrativo).
- Gancho: mecanismo 14, negación en cadena — "Esto no se mira. Se mide." + imagen del fotograma 0: el HUD del inspector ya abierto sobre el primer cuadro (nada de logo ni negro) + sonido: tick de medición seco en el frame 0.
- Hilo: el medidor del HUD — el mismo widget que nace midiendo en el frame 0 crece cuadro a cuadro (odómetro de fotogramas) y es el que firma el APROBADO final.
- Estructura: negación en cadena → el árbitro existe → lo que mide (cuadros, hertz, LUFS, negro) → confesión (2 renders rechazados solos) → el build se cae solo → respiro → APROBADO en vivo → CTA.
- Forma: toma continua, cámara que deriva sobre un solo mundo HUD (gramática de v9: 0–1 cortes, retención por movimiento interno y cards).
- Rima / callback: planta el HUD en frame 0 con estado "REVISANDO…" → cobra en el payoff con el mismo id `hud` cambiando a "APROBADO" + el odómetro aterrizando en el número final.
- Respiro: beat 9 (entre el "build se cae" y el payoff) — el único cuadro quieto, sin voz.
- Mood: pulso técnico que resuelve cálido — cama mínima con ticks, drop antes del payoff.
- Tono y voz: locutor técnico seguro que confiesa; palabras sí: medir, falla, cuadro, número; palabras no: mágico, increíble, garantizado.
- Prohibido (look): hereda los tics de `motion-craft` + degradados morados, glow decorativo fuera del acento verde, partículas, HUD falso que no esté atado a un número real de esta pieza, tercer color decorativo (el rojo #ff4d5e solo como estado de falla: REVISANDO… y barra rota).
- No se dice / no se muestra: que "reemplaza a un editor humano"; métricas que la pieza no mide de verdad (todo número en pantalla sale de verify.json del build anterior o del propio render).
- Mide el éxito: retención a 3 s; el CTA mock debe dejar la palabra ORACULO legible ≥ 1.5 s.

### Referencia de la casa (calibración bench.md sobre 10 MP4 de videos/referencias)
−14.1 LUFS · pico ≤ −2 dBTP · quietud @2 Hz 11 % (v9, cámara continua) · 0–1 cortes · gancho claro en 3–6 s · payoff antes del CTA · CTA últimos 10–17 %.

## Especificación
META: al final el espectador confía en el número, no en el gusto — y quiere el inspector.
SALIDA: 1080×1920, 30 fps · reloj: voz (~103 palabras) · bpm 96 para los ticks del HUD.
TIEMPO: ~44 s (voz manda; respiro 1.8 s sin voz antes del payoff; tail 0.8 s).
LOOK: fondo #0b0e14 con grano 2 % + viñeta 5 %; tinta #f2f4f8; UN acento #35e08c (verde del check) solo en lo que el oráculo aprueba (pill de caption activa, checks, APROBADO, cifras verificadas); rojo #ff4d5e SOLO como estado REVISANDO del HUD. Display: Archivo 800 (titulares 120–150 px, tracking −2 %); apoyo Archivo 500 (52–64 px); mono IBM Plex Mono para números del HUD (tabular-nums). Sombra de contacto 0/8/0.35.
OBJETOS: (1) HUD inspector: tarjeta superior con estado + odómetro de fotogramas ( partes: marco 2px, led de estado, contador mono, barra de progreso que ES el % de frames renderizados); (2) odómetros de datos (1290 cuadros, 2 Hz, 14 LUFS, 0 negro) que aterrizan exactos en la palabra dicha; (3) chip de honestidad "rechazados en este mismo pipeline" sobre la cifra de renders rechazados; (4) CTA-mockup: input de comentario con "ORACULO" tecleándose + check verde; (5) captions palabra-a-palabra estilo pill (fondo tinta, palabra activa en verde).
MOVIMIENTO: entrada UI crisp (0.16,1,0.3,1) 300–450 ms; odómetros con ease al VALOR easeOutCubic + snap; cámara drift 0.02/s + push 4 % por beat (power1.inOut 1.1×la escena); salidas 2× más cortas; reveal 20/50/30 en las cards; handoff HUD↔cards en coordenadas de píxel exactas; springs solo en el pill de caption (damping 12/mass 0.6/scale 0.6→1).
PLANOS: (ver tabla de beats) — cada beat = 1 card nueva + HUD persistente; `camera_move` no repetido entre beats adyacentes; static reservado al respiro.
PROHIBIDO: = línea Prohibido (look) del contrato.
QA: t≈0.3 gancho legible + HUD vivo · t≈6 odómetro corriendo · t≈14 hertz card con medidor · t≈23 chip de honestidad visible · t≈30 respiro quieto legítimo (data-hold) · t≈36 APROBADO verde + odómetro aterrizado · t≈40 CTA tecleándose completo.

## Tabla de beats (anclas de voice.json; t reales tras voice.mjs)

| # | ancla | t (est) | trabajo · persuasión · emoción | focal/apoyo (cue) | transición | sonido |
|---|---|---|---|---|---|---|
| 1 | hook | 0–2.4 | gancho · negación · reto | HUD entra con REVISANDO / — | — | tick seco frame 0 |
| 2 | inspector | 2.4–6.8 | setup · promesa · curiosidad | odómetro 0→ corre / "cada" | push 4 % | pop suave |
| 3 | frames | 6.8–11.0 | dato · odómetro · asombro | 0→1290 aterriza en "anterior" / "cuadros" | corte a media frase | tick ×3 |
| 4 | hertz | 11.0–16.5 | regla · amenaza · tensión | card 2 Hz + pinta el umbral / "congela" | deriva lateral | riser corto |
| 5 | audio | 16.5–21.5 | dato · orden · alivio | 14 LUFS + pico / "LUFS" | corte | drop 0.3 s |
| 6 | negro | 21.5–26.5 | blindaje · enumeración · firmeza | 0 negro + check / "palabra" | corte | check verde |
| 7 | giro | 26.5–31.0 | confesión · honestidad · golpe | 2 renders rechazados + chip / "solas" | apagón parcial | thud bajo |
| 8 | duro | 31.0–35.5 | regla dura · inevitabilidad | build cae: barra rota / "solo" | corte | snap |
| 9 | RESPIRO | 35.5–37.3 | tensión · — · espera | HUD solo, quieto (data-hold) | — | cama sola |
| 10 | payoff | 37.3–41.0 | payoff · prueba · resolución | HUD→APROBADO verde + odómetro final / "pasó" | iris | golpe + sub |
| 11 | cta | 41.0–44.0 | CTA · petición · cercanía | input teclea ORACULO + check / "ORACULO" | hold | typing |

## Revisión
- Decisiones creativas · historias no construidas: (a) versión "churn-math" clon de v9 con datos de una tienda; (b) clon cut-driven de v5 (negación en cadena sobre footage). La meta-HUD ganó: es la única que demuestra el harness y usa su propio producto.
- Medido: check PASS 0 fallas/0 avisos · verify social 6 PASS/1 WARN/2 SKIP · ASR ida-vuelta 97.4 % (101/101 palabras sobre el MP4 final) · mix −14.0 LUFS, pico −2.8 dBTP, 17 cues (4.1/10 s) · movimiento 0.0214 norm (referencias 0.012–0.06) · quietud 4.9 % @2 Hz (rango de la casa 0–13 %) · specs 1080×1920@30, 41.63 s.
- Solo mirado: **nada — UNVERIFIED**: el crítico con contexto limpio no pudo abrir imágenes en esta sesión (NO-VISUAL). La hoja de contacto (review/final/contact-sheet.png), review-beats y 9 seams están generadas y pendientes de ojos humanos.
- Nadie verificó: el sonido se midió, no se oyó; el look se midió por coordenadas del QA, no se vio.
- Plano más débil: por números, el beat "hertz" (única escena con medidor dibujado en canvas — riesgo de leerse crudo); confirmar en hoja.
- Avisos mantenidos a propósito y por qué: verify "negro" WARN 1.93 s/6 tramos = respiro deliberado sobre look oscuro + apagón del giro; las referencias de la casa cargan 0.33–0.43 s de negro — el nuestro es 4.6 % por el respiro de 1.8 s (data-hold declarado). Decisión: mantener, revisar en hoja.

FEEDBACK:
- → video-engine: blackdetect Warn en piezas de tema oscuro con respiros deliberados — candidato a regla de leg: umbral de negro calibrado por luminancia del tema de la pieza (dark vs light), o excluir tramos con `data-hold` activo. [sugiere]
- → orchestration: la revisión visual necesita ojos (humano o sesión con visión) antes de publicar cualquier variante de esta pieza. [bloquea la publicación, no la entrega]

## Bitácora
- orquestador: contrato v1 — pieza meta elegida sobre clones directos de v9/v5; los clones quedan como historias no construidas para la iteración 2. [abierto]
- QA r1 → orquestador: char_budget inspector/negro excedidos → presupuestos 70/84. [resuelto]
- QA r1 → motion: palabra 'solas' no existe (es 'sola') → el script moría a mitad de timeline (34.89 s) → corregido; timeline completo 41.64 s. [resuelto]
- QA r1 → motion: etiquetas fuera de zona por deriva de cámara (±7 px) + push 1.035 → drift ±3 px, push ≤1.02, .big left 96/right 160, s10 partido en 2 líneas. [resuelto]
- verify r1 → orquestador: negro WARN justificado (respiro + apagón); no se retoca a ciegas. [resuelto]
- critic: NO-VISUAL — límite de la sesión documentado; hojas pendientes de ojos. [abierto]
