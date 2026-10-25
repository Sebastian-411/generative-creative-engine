---
name: trend-radar
description: Radar de tendencias que mantiene al plugin actualizado - junta señales públicas y gratuitas (Google Trends y Google News por país, Wikipedia, Bluesky, YouTube con llave gratuita, Hacker News y GitHub Trending), agrupa las que hablan del mismo tema, las puntúa por velocidad, novedad, cruce entre plataformas, relevancia y confianza, y escribe un digest diario en knowledge/trends/latest.md. Úsala ANTES de proponer temas o ganchos para un video, cuando el usuario pida "algo que esté pegando", "tendencias", "qué está de moda", "contenido reactivo" o ideas para redes, y para revisar qué herramientas nuevas de video/voz/música aparecieron. No inventa tendencias: si el digest está viejo o vacío, corre el radar o dilo.
---

# Radar de tendencias

Claude no se "entrena" con el uso: lo que sabe del presente sale de lo que lee en el momento. Este radar es esa lectura, fechada y con evidencia, para que cada video arranque de lo que está pasando hoy.

## Antes de proponer temas

1. Abre `knowledge/trends/latest.md` (en la raíz del proyecto). Mira la fecha del encabezado.
   - Si tiene más de 24 h o no existe: `node <skill>/radar.mjs --out knowledge/trends --geo CO --niche "<nicho del usuario>"` (≈30 s).
2. Prioriza en este orden:
   - **Cruzadas entre plataformas**: el mismo tema en 2+ fuentes independientes es lo más confiable.
   - **Oportunidades inmediatas**: nuevas hoy y con tracción. Ventana corta (24–72 h): si el video no sale ya, no sirve.
   - **Ya se están agotando** (vistas 3+ días): solo con un ángulo nuevo, nunca repitiendo lo obvio.
3. Para cada idea propuesta da: el tema, **la evidencia (enlaces del digest)**, por qué le importa a la audiencia del usuario, el ángulo (no la noticia, el giro), el formato (`story-grammar`) y la ventana de oportunidad.
4. Abre la evidencia antes de escribir el guion: los titulares solos engañan.

## Filtros obligatorios

- **No** hagas contenido de entretenimiento sobre tragedias, muertes, desastres con víctimas o violencia. Un huracán en tendencia puede ser un explicador útil ("cómo se forma", "cómo prepararse"), nunca un meme.
- Política, salud y dinero: solo con fuentes verificadas (`fact-checker`) y tono informativo.
- Que algo sea tendencia no da derechos: no uses música, clips, logos ni imágenes de terceros; la pieza se hace con el motor.
- Relevancia > volumen: un tema enorme que no tiene nada que ver con la marca del usuario es ruido.

## Fuentes y límites

| Fuente | Llave | Qué aporta |
|---|---|---|
| Google Trends (RSS por país) | no | búsquedas que explotan hoy, volumen aproximado y noticias asociadas |
| Google News (país e idioma) | no | temas con cobertura creciente |
| Wikipedia (páginas más vistas ayer) | no | interés real sostenido |
| Bluesky (trending topics) | no | conversación global, sobre todo en inglés |
| YouTube Data API (mostPopular por país) | sí, gratuita | `node <video-engine>/engine/voices.mjs config --youtube-key …` |
| Hacker News, GitHub Trending | no | tecnología y herramientas nuevas para el propio motor |
| TikTok Creative Center, Reels | — | requieren navegador/cuenta: revisión manual |
| Reddit | — | bloquea sin OAuth |

El radar consulta una vez por corrida, sin evadir límites. Cada día queda en `knowledge/trends/YYYY-MM-DD.json`: con 7 días de historia el puntaje de novedad distingue lo que nace de lo que ya se cansó.

## Mantenerlo vivo

- **Diario (local, gratis)**: tarea programada de Windows `creative-mastery-radar` que corre `scripts/radar.cmd` a las 7:00 (si el PC estaba apagado, corre al encenderlo). Ver: `Get-ScheduledTask creative-mastery-radar`. Quitar: `Unregister-ScheduledTask creative-mastery-radar`. Log: `knowledge/trends/radar.log`.
- **Semanal (herramientas)**: revisar la sección "Tecnología y herramientas" y los catálogos de `ref/` buscando modelos/skills nuevos de video, voz y música; probar lo prometedor contra el banco de voces antes de adoptarlo.
