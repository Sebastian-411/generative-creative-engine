# Bench interno — perfil benchmark

> Comparación interna entre renders con las mismas sondas. **No es un veredicto frente a un benchmark externo**
> y nunca debe leerse como que algo "pasó" el benchmark. Cortes y continuidad: APROXIMADOS.

Perfil: benchmark (fuente: lib/verify-profiles.mjs (perfil benchmark))

Movimiento = diff media absoluta entre pares de fotogramas consecutivos, gris a 320 px, escala 0-255, a 2 Hz;
quieto si < 0.5. CV = desviación/ media de la duración de los tramos entre cortes. Negro = blackdetect d=0.1, pix_th=0.10.

| entrada | duración | movimiento | % quiet @2 Hz | racha quieta | CV cortes | LUFS | pico (dBTP) | negro (s) | notas |
|---|---|---|---|---|---|---|---|---|---|
| videos\referencias\Así se construye un búnker 🛡️ Con casi un metro de tierra encima, la radiación te llega unas mi.mp4 | 119.06 s | 13.23 | 0.0 % | 0.00 s | 1.58 | -14.1 | -0.5 | 0.00 | 11 cortes (APROX) · 720x1280 · mp4 |
| videos\referencias\Claude and Codex finally met. It went… exactly how youd expect 😂One chat for you and your AI a.mp4 | 41.91 s | 9.92 | 13.3 % | 1.50 s | — (1 tramo) | -14.2 | -0.3 | 0.00 | 0 cortes (APROX) · 720x1280 · mp4 |
| videos\referencias\Comenta VENDER y te mando un tutorial donde utilizo casos reales y desmenuzo estructuras de gu.mp4 | 50.48 s | 23.09 | 0.0 % | 0.00 s | 0.50 | -14.3 | -0.3 | 0.00 | 2 cortes (APROX) · 720x1280 · mp4 |
| videos\referencias\Comenta “bolsa” que te mando o link!#claudecode #ia #claude #openai #codex.mp4 | 59.14 s | 4.45 | 0.0 % | 0.00 s | — (1 tramo) | -14.1 | -1.6 | 0.00 | 0 cortes (APROX) · 720x1280 · mp4 |
| videos\referencias\Comment CARD and we’ll build your business a loyalty card for free. 👇 Know a business owner Sen.mp4 | 47.32 s | 11.56 | 0.0 % | 0.00 s | 0.82 | -14.1 | -3.4 | 0.00 | 12 cortes (APROX) · 720x1280 · mp4 |
| videos\referencias\Este anuncio no lo hizo una persona- lo hizo una inteligencia artificial, y te encontró a ti.Com.mp4 | 68.76 s | 12.60 | 2.2 % | 0.50 s | 0.19 | -14.3 | -0.6 | 0.33 | 2 cortes (APROX) · 720x1280 · mp4 |
| videos\referencias\Si quieres hacer vídeos como estos métete en mi perfil🔗.mp4 | 49.01 s | 8.48 | 0.0 % | 0.00 s | — (1 tramo) | -14.1 | -1.0 | 0.00 | 0 cortes (APROX) · 720x1280 · mp4 |
| videos\referencias\Ten tu programa listo en 10 minutos🧑🏻_💻✅¡¡Comenta “TARJETA” y te damos acceso totalmente grat.mp4 | 36.82 s | 16.74 | 5.6 % | 1.00 s | 1.26 | -14.1 | -0.4 | 0.00 | 6 cortes (APROX) · 720x1280 · mp4 |
| videos\referencias\Y lo peor es que el que se va no avisa- simplemente deja de venir.Vyro mira cuándo vino cada soc.mp4 | 45.62 s | 8.97 | 11.1 % | 4.00 s | — (1 tramo) | -14.3 | -0.5 | 0.43 | 0 cortes (APROX) · 720x1280 · mp4 |
| videos\referencias\¿Pagarías 300.000 $ por tener tu propio Chatgpt.mp4 | 86.89 s | 19.29 | 1.2 % | 0.50 s | — (1 tramo) | -14.1 | -2.1 | 0.00 | 0 cortes (APROX) · 720x1280 · mp4 |
