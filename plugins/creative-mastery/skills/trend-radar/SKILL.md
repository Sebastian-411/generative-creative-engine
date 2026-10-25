---
name: trend-radar
description: Radar de tendencias que mantiene al plugin actualizado - junta señales públicas y gratuitas (Google Trends y Google News por país, Wikipedia, Bluesky, YouTube con llave gratuita, Hacker News y GitHub Trending), agrupa las que hablan del mismo tema, las puntúa por velocidad, novedad, cruce entre plataformas, relevancia y confianza, e imprime el digest en vivo, en el momento de la consulta (sin historial ni tareas programadas). Úsala ANTES de proponer temas o ganchos para un video, cuando el usuario pida "algo que esté pegando", "tendencias", "qué está de moda", "contenido reactivo" o ideas para redes, y para revisar qué herramientas nuevas de video/voz/música aparecieron. No inventa tendencias: corre el radar cada vez; si las fuentes fallan, dilo.
---

# Radar de tendencias

Claude no se "entrena" con el uso: lo que sabe del presente sale de lo que lee en el momento. Este radar es esa lectura, fechada y con evidencia, para que cada video arranque de lo que está pasando hoy.

## Antes de proponer temas

1. Corre el radar **en ese momento** (≈20–30 s, solo Node 18+, sin instalar nada):
   `node <directorio de esta skill>/radar.mjs --geo CO --lang es --niche "<nicho del usuario>"`
   - Imprime el digest en markdown. `--json` para datos crudos; `--out archivo.md` solo si el usuario quiere guardarlo.
   - Si no conoces la ruta de la skill: busca `**/skills/trend-radar/radar.mjs`.
2. Prioriza en este orden:
   - **Cruzadas entre plataformas**: el mismo tema en 2+ fuentes independientes es lo más confiable.
   - **Explotando ahora** (publicadas hace menos de 12 h): ventana corta (24–72 h); si el video no sale ya, no sirve.
   - **Lo más fuerte de hoy**: volumen alto aunque no sea nuevo; solo con un ángulo propio, nunca repitiendo lo obvio.
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

El radar consulta una vez por corrida, sin evadir límites, y no guarda nada: la **novedad** sale de la fecha de publicación que trae cada fuente (Google Trends y News la informan; para Bluesky, HN, GitHub y Wikipedia se asume una edad típica). Así funciona igual en cualquier máquina o proyecto donde esté el plugin.

## Mantenerlo vivo

- **Siempre en vivo**: no hay rutina ni historial. Cada vez que se necesite el presente, se corre el radar; lo que imprime es lo que está pasando en ese instante.
- **Semanal (herramientas)**: revisar la sección "Tecnología y herramientas" y los catálogos de `ref/` buscando modelos/skills nuevos de video, voz y música; probar lo prometedor contra el banco de voces antes de adoptarlo.
