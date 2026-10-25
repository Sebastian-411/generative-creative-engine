# Catálogo de recursos para detectar tendencias en redes sociales con Claude Code

**Actualizado:** 24 de octubre de 2026  
**Objetivo:** montar un radar de tendencias que detecte temas emergentes, formatos virales, memes, hashtags, sonidos, creadores y conversaciones relevantes; priorice señales de Colombia y Latinoamérica; y entregue alertas y briefs accionables a `generative-visual-studio`.

> **Importante:** no existe un plugin capaz de observar literalmente todas las tendencias de todas las redes, en tiempo real y sin límites. Las plataformas restringen APIs, cada algoritmo define “tendencia” de forma distinta y varias herramientas tienen límites gratuitos. La estrategia correcta es combinar fuentes oficiales, MCPs/APIs, feeds públicos y una capa de deduplicación/análisis. Los precios, cuotas, políticas y endpoints cambian: compruébalos antes de depender de ellos en producción.

## Cómo leer este catálogo

- **Gratis / local:** puedes instalar o ejecutar el código sin pagar por consulta; tu equipo/servidor sigue consumiendo recursos.
- **Gratis con cuota:** ofrece un nivel gratuito limitado, sujeto a límites y cambios.
- **Freemium / pago:** puede servir para exploración, pero una automatización sostenida probablemente requiere suscripción o créditos.
- **Fuente oficial:** datos y tendencias publicados por la propia plataforma; suele ser el mejor punto de partida.
- **Skill sin datos propios:** mejora el razonamiento de Claude, pero no crea acceso automático a datos privados ni garantiza datos en vivo por sí sola.

---

# 1. Mi stack recomendado: empieza por estos recursos

| Prioridad | Recurso | Para qué lo usaría | Coste / limitación |
|---|---|---|---|
| 1 | [Trend Research — GTM Agents](https://github.com/gtmagents/gtm-agents) | Skill para detectar momentos culturales, tendencias, memes y oportunidades para contenido reactivo. | Skill gratis; el acceso a datos depende de las fuentes que conectes. |
| 2 | [Trends MCP](https://github.com/trendsmcp-ai/Trends-MCP) | MCP agregado para consultar tendencias de Google, TikTok, YouTube, Reddit y más fuentes. | El repo anuncia cuota gratuita de 100 solicitudes/mes; verificar cuota vigente. |
| 3 | [Google Trends MCP — lhitches](https://github.com/lhitches/google-trends-mcp) | Trending Now, consultas relacionadas, interés por región y evolución de términos desde Claude Code. | Sin API key según el proyecto; endpoint no oficial y Google puede limitar solicitudes. |
| 4 | [Google Trends MCP — HasData](https://github.com/HasData/google-trends-mcp) | Datos estructurados de interés por tiempo, región y consultas relacionadas. | La documentación anuncia 1.000 créditos/mes, equivalentes aproximadamente a 100 llamadas; requiere clave. |
| 5 | [Bluesky MCP Server](https://github.com/cyanheads/bluesky-mcp-server) | Leer temas en tendencia, feeds, posts, hilos y búsqueda pública de Bluesky. | Código abierto; endpoint de tendencias señalado como inestable por Bluesky. |
| 6 | [TikTok Creative Center](https://ads.tiktok.com/business/creativecenter/trends) | Hashtags, canciones, videos y creadores que están ganando popularidad en TikTok. | Herramienta oficial, gratuita; filtros y datos dependen de región y categoría. |
| 7 | [Google Trends — Tendencias actuales](https://trends.google.com/trending?geo=CO&hl=es-419) | Señales de búsqueda en Colombia para validar que un tema supera su volumen habitual. | Gratis; la disponibilidad de “Trending Now” y los datos varía por país. |
| 8 | [Social Skills — Scrollmark](https://github.com/scrollmark/social-skills) | `trend-radar`, análisis de hooks, tono cultural, convenciones de plataforma y rendimiento de contenido. | Skills gratuitas; por sí solas no conectan cuentas ni garantizan datos vivos. |
| 9 | [Social Media Skills — 106 skills](https://github.com/social-media-skills/skills) | Kit amplio para estrategia, crecimiento, producción, publicación y analítica de redes. | Repo gratuito; las integraciones externas pueden tener coste. |
| 10 | [Social Media Suite para Claude Code](https://github.com/idapixl/social-media-suite) | Sistema local de agentes, skills, playbooks, registro de publicaciones y exploración de tendencias. | Código público; revisar actividad, requisitos y licencia del repositorio. |
| 11 | [Social Machine](https://github.com/michaelsaia/social-machine-skill) | Escanea un proyecto/marca, investiga tendencias y propone contenido, memes y gráficos. | Skill gratuita; la investigación en vivo depende de fuentes disponibles/configuradas. |
| 12 | [Google Alerts](https://www.google.com/alerts?hl=es) | Alertas de temas, marcas, personas y frases en Web, noticias, blogs y foros. | Gratis; no es un radar social exhaustivo y la entrega no siempre es instantánea. |

**Recomendación:** instala primero `trend-research`, conecta un único MCP agregado y añade las fuentes nativas de TikTok, YouTube, Google y Reddit. Solo después agrega scrapers, APIs comerciales o más MCPs.

---

# 2. Skills y plugins para Claude Code

Estos recursos enseñan a Claude a investigar, interpretar señales sociales, detectar oportunidades y convertir tendencias en ideas. No todos traen datos o API propia.

1. [GTM Agents — repositorio](https://github.com/gtmagents/gtm-agents) — Colección de plugins/skills de marketing y social listening.
2. [Trend Research skill](https://github.com/gtmagents/gtm-agents/tree/main/plugins/social-media/skills/trend-research) — Identifica memes, momentos culturales, sonidos/creadores y oportunidades para reaccionar a tiempo.
3. [Social Media Skills — 106 skills](https://github.com/social-media-skills/skills) — Colección grande para estrategia, contenido, crecimiento, publishing y analytics.
4. [Social Skills — Scrollmark](https://github.com/scrollmark/social-skills) — Incluye `trend-radar`, `hook-anatomy`, `platform-fluency`, `content-autopsy`, `voice-matching` y adaptación multiplataforma.
5. [Integrated Content OS](https://github.com/drshailesh88/integrated_content_OS) — Incluye una skill de investigación de tendencias con Google Trends, Reddit y otras fuentes; comprobar qué herramientas/API siguen funcionando.
6. [Social Media Suite](https://github.com/idapixl/social-media-suite) — Agentes de estrategia, trend scouting, análisis de audiencia, competencia y hooks.
7. [Social Machine](https://github.com/michaelsaia/social-machine-skill) — Pipeline de escaneo de marca, investigación de tendencias, ideas, memes y gráficos.
8. [Marketing Skills para Claude Code](https://github.com/marcosmodly/marketing-skill) — Skills de investigación de competidores, calendario editorial, Reels/Shorts y marketing.
9. [Social Media Trends Research — ficha](https://www.aimcp.info/en/skills/77fd21df-2704-4d96-baaf-5b77a82b7fdd) — Descripción e instalación de una skill basada en herramientas gratuitas.
10. [Trend Research — ficha de Claude Skills Hub](https://claudeskills.info/skills/gtmagents/gtm-agents/trend-research/) — Resumen, licencia declarada e instalación.
11. [Trend Skill — ClawHub](https://docs.clawhub.ai/zcqqq/plugins/trend-skill) — Plugin que afirma agregar tendencias y producir digest diario; anónimo limitado y autenticación para algunas funciones.
12. [Awesome Claude Video Skills](https://github.com/zhuyansen/awesome-claude-video-skills) — Directorio de skills para unir detección de tendencias con producción de videos cortos.
13. [Awesome Agent Video Skills](https://github.com/clonn/awesome-agent-video-skills) — Directorio general de habilidades de producción social/video para agentes.
14. [Awesome MCP](https://github.com/abordage/awesome-mcp) — Catálogo mantenido de servidores MCP, incluidos varios de redes sociales.
15. [MCP Servers — lista comunitaria](https://github.com/modelcontextprotocol/servers) — Repositorio de referencia para servidores MCP y ejemplos; no es un catálogo exclusivo de tendencias.
16. [MCP.so](https://mcp.so/) — Buscador de servidores MCP.
17. [Glama MCP Directory](https://glama.ai/mcp/servers) — Directorio de servidores MCP con descripciones y compatibilidad.
18. [Smithery](https://smithery.ai/) — Directorio/registro para buscar e instalar servidores y herramientas de agentes.
19. [Skills Directory](https://skills.sh/) — Busca skills de agentes; comprobar el repositorio original antes de instalar.
20. [Claude Code Docs — plugins](https://docs.anthropic.com/en/docs/claude-code/plugins) — Documentación oficial de instalación y gestión de plugins.

### Comandos de instalación de los primeros candidatos

```bash
# Instalar solo la skill de research de GTM Agents
npx skills add gtmagents/gtm-agents --skill trend-research --agent claude-code

# Instalar las skills de social media (revisa la lista antes de instalarlas todas)
npx skills add social-media-skills/skills -g -a claude-code -s '*' -y

# Social Machine: revisar instrucciones y dependencias en su README antes de ejecutar setup
git clone https://github.com/michaelsaia/social-machine-skill.git
```

> Seguridad: inspecciona los `SKILL.md`, scripts de instalación, permisos y llamadas de red antes de ejecutar un plugin comunitario. No les entregues tokens de cuentas de redes sociales sin comprobar cómo los manejan.

---

# 3. MCPs y conectores de tendencias / búsqueda social

| Recurso | Cobertura anunciada | Estado de coste / advertencias |
|---|---|---|
| [Trends MCP](https://github.com/trendsmcp-ai/Trends-MCP) | Google, TikTok, YouTube, Reddit, Amazon, Wikipedia, noticias, tráfico web, apps y más de 30 fuentes. | Cuota gratuita anunciada; requiere clave y límites. |
| [Trends MCP — web](https://www.trendsmcp.ai/) | Interfaz y documentación del agregador. | Consultar cuota, fuentes y condiciones actuales. |
| [Google Trends MCP — Trends MCP](https://github.com/trendsmcp-ai/google-trends-mcp) | Consultas, evolución y señales de Google Trends. | Revisar el free tier actual. |
| [Google Trends MCP — HasData](https://github.com/HasData/google-trends-mcp) | Interest over time, región, consultas relacionadas y temas. | 1.000 créditos gratuitos/mes anunciados en su README; requiere cuenta. |
| [Google Trends MCP — lhitches](https://github.com/lhitches/google-trends-mcp) | `trending_now`, interés por zona, consultas relacionadas y evolución histórica. | MIT; fuente no oficial y susceptible a throttling. |
| [Bluesky MCP — cyanheads](https://github.com/cyanheads/bluesky-mcp-server) | Tendencias actuales, perfiles, feeds, búsquedas y conversaciones de Bluesky. | Público/abierto; endpoint de trending puede cambiar. |
| [Reddit MCP Buddy](https://github.com/karanb192/reddit-mcp-buddy) | Búsqueda y lectura estructurada de posts, comentarios y usuarios de Reddit. | Verificar autenticación y cuotas actuales de Reddit. |
| [Reddit Research MCP](https://github.com/dialog-tools/reddit-research-mcp) | Investigación estructurada de Reddit para agentes. | Revisar alcance, API/credenciales y licencia del repo. |
| [TikHub Plugin](https://github.com/TikHub/tikhub-plugin) | Trends, hashtags, sonidos, rankings, comentarios y analítica de varias plataformas. | Requiere API key de TikHub; no asumir gratuito a escala. |
| [TikHub](https://user.tikhub.io/) | Panel de cuenta y claves del servicio anterior. | Revisar tarifas y créditos antes de automatizar. |
| [TikTok MCP](https://github.com/Seym0n/tiktok-mcp) | Integración comunitaria de TikTok con MCP. | Comprobar método de acceso, límites y cumplimiento de los términos de TikTok. |
| [X/Twitter scraper](https://github.com/Xquik-dev/x-twitter-scraper) | Búsqueda, perfiles y contenido de X mediante herramientas comunitarias. | No es API oficial; puede romperse o entrar en conflicto con términos de plataforma. |
| [Twikit MCP](https://github.com/adhikasp/mcp-twikit) | Interacción con X/Twitter a través de MCP. | Revisa riesgos de scraping, límites y seguridad de sesión. |
| [Meta MCP](https://github.com/mikusnuz/meta-mcp) | Instagram Graph API, Threads API, insights, publicaciones y comentarios. | Requiere permisos, tokens y cuentas elegibles; no implica acceso a todo el trending global. |
| [Reddit / MCP catalog](https://github.com/topics/reddit-mcp) | Descubrir otros MCPs de Reddit. | Varía según repositorio. |
| [Bluesky / MCP catalog](https://github.com/topics/bluesky-mcp) | Descubrir MCPs y clientes para Bluesky. | Varía según repositorio. |
| [Social Media / MCP catalog](https://github.com/topics/social-media-mcp) | Repositorios MCP relacionados con redes sociales. | Revisa mantenimiento/licencia individual. |
| [Social Listening / GitHub Topic](https://github.com/topics/social-listening) | Proyectos de seguimiento de menciones, tendencias y sentimiento. | Directorio, no producto único. |
| [Awesome MCP — sección social media](https://github.com/abordage/awesome-mcp) | Catálogo de MCPs de Reddit, X, Instagram, TikTok, Bluesky y más. | Útil para descubrir alternativas; valida cada repo. |

---

# 4. Fuentes oficiales de tendencias por plataforma

## TikTok

21. [TikTok Creative Center — Trends](https://ads.tiktok.com/business/creativecenter/trends) — Hashtags, canciones, videos, creadores y señales de tendencia.
22. [TikTok Creative Center — hashtags](https://ads.tiktok.com/business/creativecenter/hashtag/find) — Descubrimiento y análisis de hashtags.
23. [TikTok Creative Center — videos populares](https://ads.tiktok.com/business/creativecenter/inspiration/popular/pc/en) — Creatividades y vídeos de referencia.
24. [TikTok Top Ads](https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en) — Anuncios de alto rendimiento para estudiar formatos creativos.
25. [TikTok Creative Center — ayuda oficial](https://ads.tiktok.com/resources/help/article/creative-center) — Alcance y funcionamiento de la herramienta.
26. [TikTok Trends — guía de uso](https://ads.tiktok.com/resources/help/article/how-to-use-trends) — Filtros por industria, periodo y analítica de hashtags.
27. [TikTok Research API](https://developers.tiktok.com/products/research-api/) — Acceso académico/independiente sujeto a elegibilidad y aprobación; no es una API comercial libre para todos.
28. [TikTok Research Tools — documentación](https://developers.tiktok.com/docs/en/about-research-api) — Tipos de datos públicos y condiciones.
29. [TikTok for Developers](https://developers.tiktok.com/) — APIs e integración oficial.

## Instagram, Facebook y Threads

30. [Instagram Creators](https://creators.instagram.com/) — Recursos oficiales para creadores y prácticas de contenido.
31. [Meta — novedades de Reels y trending audio](https://about.fb.com/news/2023/04/instagram-reels-trending-audio-and-gifts-updates/) — Explica las funciones de descubrimiento de audio en Reels; las opciones pueden variar por cuenta y región.
32. [Instagram Graph API](https://developers.facebook.com/docs/instagram-api/) — Acceso oficial a medios, cuentas profesionales e insights según permisos.
33. [Instagram Platform — documentación](https://developers.facebook.com/docs/instagram-platform/) — Reglas y capacidades para desarrolladores.
34. [Threads API](https://developers.facebook.com/docs/threads/) — Publicación, consulta y métricas según permisos disponibles.
35. [Meta for Developers](https://developers.facebook.com/) — Documentación, permisos y productos de API.
36. [Meta Content Library](https://transparency.meta.com/researchtools/meta-content-library/) — Herramienta de investigación de contenido público; acceso limitado a investigadores elegibles.
37. [Instagram Professional Dashboard](https://help.instagram.com/) — Consultar herramientas profesionales e insights dentro de la app.

## YouTube

38. [YouTube Culture & Trends — español](https://blog.youtube/intl/es-419/culture-and-trends/) — Informes sobre cultura, creadores y tendencias en Hispanoamérica.
39. [YouTube Culture & Trends — global](https://blog.youtube/culture-and-trends/) — Análisis y reportes oficiales de cultura digital.
40. [YouTube Charts & Insights](https://support.google.com/youtube/answer/9014376) — Rankings de música, videos musicales, Shorts y tráileres.
41. [YouTube Trending en Explorar](https://www.youtube.com/feed/trending) — Página de descubrimiento (la experiencia cambia por región y cuenta).
42. [YouTube Data API v3](https://developers.google.com/youtube/v3) — Búsquedas, canales, playlists y estadísticas públicas disponibles.
43. [YouTube API: videos más populares](https://developers.google.com/youtube/data/guides/implementation/videos) — `videos.list` con `chart=mostPopular` y `regionCode`.
44. [Referencia `videos.list`](https://developers.google.com/youtube/v3/docs/videos/list) — Parámetros, categorías y regiones.
45. [YouTube Researcher Program](https://research.youtube/) — Recursos para investigación sobre YouTube.
46. [YouTube Blog](https://blog.youtube/) — Actualizaciones y señales editoriales.

## Google Search, Google Trends y noticias

47. [Google Trends — Tendencias actuales Colombia](https://trends.google.com/trending?geo=CO&hl=es-419) — Búsquedas que suben en Colombia, con ventanas temporales.
48. [Google Trends — Explorar](https://trends.google.com/trends/explore?geo=CO) — Comparar términos por región y periodo.
49. [Google Trends — página principal](https://trends.google.com/trends/) — Explorar tendencias globales y regionales.
50. [Guía oficial de Google Trends](https://developers.google.com/search/docs/monitor-debug/trends-start?hl=es-419) — Explica Tendencias actuales y Explorar.
51. [Google Alerts](https://www.google.com/alerts?hl=es) — Seguimiento de términos, temas, marcas y competidores en la Web.
52. [Google News Colombia](https://news.google.com/?hl=es-419&gl=CO&ceid=CO:es-419) — Noticias actuales y temas que están ganando cobertura.
53. [Google News](https://news.google.com/) — Noticias por país, idioma y tema.
54. [Google Search Trends — documentación](https://developers.google.com/search/docs/monitor-debug/trends) — Recursos para comprender señales de búsqueda.

## Pinterest

55. [Pinterest Trends](https://trends.pinterest.com/) — Herramienta de tendencias; el acceso puede requerir cuenta Business.
56. [Pinterest Trends — ayuda en español](https://help.pinterest.com/es/business/article/pinterest-trends) — Historial, región, estacionalidad y tendencias por audiencia.
57. [Pinterest Trends — guía en inglés](https://help.pinterest.com/en/business/article/pinterest-trends) — Funcionalidades y limitaciones regionales.
58. [Pinterest Predicts](https://business.pinterest.com/pinterest-predicts/) — Informe anual de predicción de tendencias.
59. [Pinterest Business](https://business.pinterest.com/) — Recursos profesionales, herramientas y tendencias comerciales.

## X / Twitter

60. [X Explore](https://x.com/explore) — Tendencias visibles en la interfaz de X, dependientes de ubicación y personalización.
61. [X Developer Platform](https://developer.x.com/) — API oficial, condiciones, productos y acceso vigente.
62. [X API documentation](https://docs.x.com/) — Documentación técnica; revisar precio y endpoints actuales antes de diseñar la integración.
63. [X Advanced Search](https://x.com/search-advanced) — Investigación manual de temas, palabras clave, cuentas y fechas.
64. [Trendsmap](https://www.trendsmap.com/) — Exploración geográfica de conversaciones y tendencias en X; revisar plan vigente.
65. [Trendinalia](https://www.trendinalia.com/) — Historial y listados de trending topics por país, sujeto a cobertura disponible.

## Reddit

66. [Reddit Popular](https://www.reddit.com/r/popular/) — Posts populares de múltiples comunidades.
67. [Reddit All](https://www.reddit.com/r/all/) — Vista amplia de posts en Reddit.
68. [r/trendingsubreddits](https://www.reddit.com/r/trendingsubreddits/) — Comunidades que empiezan a llamar la atención.
69. [r/OutOfTheLoop](https://www.reddit.com/r/OutOfTheLoop/) — Contexto de memes, noticias y discusiones virales.
70. [Reddit Developers](https://developers.reddit.com/) — APIs y herramientas de desarrollo disponibles.
71. [Reddit API documentation](https://www.reddit.com/dev/api/) — Endpoints, autenticación y límites.
72. [Reddit Data API Terms](https://redditinc.com/policies/data-api-terms) — Condiciones de uso que deben revisarse para monitorización y redistribución.

## Bluesky, Mastodon y Fediverse

73. [Bluesky Discover](https://bsky.app/) — Feeds y temas visibles en Bluesky.
74. [Bluesky Developer Docs](https://docs.bsky.app/) — APIs y AT Protocol.
75. [Bluesky API — trending topics](https://docs.bsky.app/docs/api/app-bsky-unspecced-get-trends) — Endpoint específico; puede ser experimental/inestable.
76. [Bluesky Jetstream](https://github.com/bluesky-social/jetstream) — Flujo de eventos públicos para proyectos de análisis en tiempo real.
77. [Bluesky Firehose / AT Protocol](https://atproto.com/) — Documentación de la infraestructura de datos.
78. [Mastodon trends API](https://docs.joinmastodon.org/methods/trends/) — Etiquetas, estados y enlaces con actividad creciente; depende de cada instancia.
79. [Mastodon public timeline](https://docs.joinmastodon.org/methods/timelines/) — Acceso a timelines públicos según instancia y políticas.
80. [FediDB](https://fedidb.org/) — Datos y estadísticas del Fediverse.
81. [Fediverse Observer](https://fediverse.observer/) — Descubrir y monitorizar instancias federadas.

## LinkedIn, Snapchat, Twitch y otras redes

82. [LinkedIn Marketing Solutions](https://business.linkedin.com/marketing-solutions) — Informes, B2B marketing e insights editoriales.
83. [LinkedIn Developers](https://developer.linkedin.com/) — APIs oficiales y permisos disponibles; no ofrece acceso irrestricto a trending global.
84. [LinkedIn Economic Graph](https://economicgraph.linkedin.com/) — Estudios e informes de trabajo, habilidades y economía.
85. [Snapchat Trends / Insights](https://forbusiness.snapchat.com/) — Recursos comerciales y tendencias de audiencia.
86. [Snapchat Analytics — ayuda](https://help.snapchat.com/hc/es) — Métricas de Stories y Spotlight para cuentas elegibles.
87. [TwitchTracker](https://twitchtracker.com/) — Estadísticas, categorías y canales de Twitch.
88. [SullyGnome](https://sullygnome.com/) — Analítica histórica de canales, juegos y categorías de Twitch.
89. [Steam Charts](https://steamcharts.com/) — Juegos que crecen en jugadores concurrentes; útil para tendencias gaming.
90. [SteamDB](https://steamdb.info/) — Rankings y datos de actividad de juegos de Steam.
91. [Product Hunt](https://www.producthunt.com/) — Lanzamientos de productos que generan conversación en tech/startups.
92. [Hacker News](https://news.ycombinator.com/) — Historias y discusiones emergentes del mundo tecnológico.
93. [Show HN](https://news.ycombinator.com/show) — Lanzamientos y proyectos nuevos de la comunidad.
94. [GitHub Trending](https://github.com/trending) — Repositorios de software que ganan atención.
95. [npm Trends](https://npmtrends.com/) — Comparación de interés relativo entre paquetes npm.
96. [PyPI Stats](https://pypistats.org/) — Descargas de paquetes Python como señal de interés técnico.
97. [App Store Rankings](https://www.apple.com/app-store/) — Fuente de referencia; para rankings automatizables busca proveedores de datos con licencia.
98. [Google Play Charts](https://play.google.com/store/apps) — Rankings y categorías de apps Android.

---

# 5. Herramientas de descubrimiento y predicción de tendencias

Estas herramientas ayudan a detectar señales fuera de una sola red. Algunas limitan datos históricos o exportaciones en planes gratuitos.

99. [Exploding Topics](https://explodingtopics.com/) — Detección de temas emergentes y evolución a lo largo del tiempo; freemium.
100. [Glimpse](https://meetglimpse.com/) — Extensión/herramientas para enriquecer Google Trends; funciones gratuitas y pagas.
101. [Trend Hunter](https://www.trendhunter.com/) — Investigación de tendencias, innovación y consumo.
102. [HubSpot Trends](https://trends.hubspot.com/) — Contenido y reportes de tendencias de negocio/marketing.
103. [Think with Google](https://www.thinkwithgoogle.com/) — Estudios de consumidor y tendencias de búsqueda/publicidad.
104. [Google Year in Search](https://trends.withgoogle.com/year-in-search/) — Señales anuales de búsquedas y cultura.
105. [Gartner](https://www.gartner.com/en) — Investigación de mercado; gran parte es de pago.
106. [Forrester](https://www.forrester.com/) — Informes de mercado y comportamiento; gran parte es de pago.
107. [WGSN](https://www.wgsn.com/) — Pronóstico de tendencias de consumidor/diseño; servicio profesional de pago.
108. [Pinterest Predicts](https://business.pinterest.com/pinterest-predicts/) — Predicciones de tendencias visuales y consumo.
109. [TikTok What's Next Trend Report](https://www.tiktok.com/business/en/whats-next) — Reportes de tendencias de cultura, creadores y marketing.
110. [YouTube Culture & Trends](https://blog.youtube/culture-and-trends/) — Investigación oficial y señales culturales.
111. [Meta for Business — insights](https://www.facebook.com/business/insights) — Recursos de marketing y análisis de audiencia.
112. [Think with Google — consumidor](https://www.thinkwithgoogle.com/consumer-insights/) — Estudios de hábitos y comportamiento.
113. [AnswerThePublic](https://answerthepublic.com/) — Preguntas e ideas de búsqueda alrededor de temas; límites por plan.
114. [AlsoAsked](https://alsoasked.com/) — Relaciones entre preguntas de búsqueda; cuotas por plan.
115. [Semrush Trends](https://www.semrush.com/trends/) — Inteligencia competitiva y tendencias; en gran medida de pago.
116. [Similarweb Digital Research](https://www.similarweb.com/corp/digital-research/) — Tráfico, categorías y señales competitivas.
117. [Ahrefs](https://ahrefs.com/) — Tendencias SEO, palabras clave y contenido; algunas herramientas gratuitas.
118. [BuzzSumo](https://buzzsumo.com/) — Contenido con engagement y análisis de temas; principalmente freemium/pago.
119. [SparkToro](https://sparktoro.com/) — Investigación de audiencias y sitios/cuentas que consumen; plan gratuito limitado.
120. [Trend Hunter — research](https://www.trendhunter.com/trends) — Archivo de ideas y señales de innovación.
121. [TrendWatching](https://www.trendwatching.com/) — Tendencias de consumo e innovación; mezcla de contenido público y servicios pagos.
122. [The Future Laboratory](https://www.thefuturelaboratory.com/) — Investigación de tendencias y comportamiento; mayoritariamente comercial.
123. [Springwise](https://www.springwise.com/) — Innovaciones emergentes en productos y negocios.
124. [Cool Hunting](https://coolhunting.com/) — Cultura, diseño y tendencias de consumo.
125. [It's Nice That](https://www.itsnicethat.com/) — Señales de diseño, ilustración, creatividad y cultura visual.
126. [The Dieline](https://thedieline.com/) — Tendencias de packaging y branding.
127. [Behance](https://www.behance.net/) — Descubrimiento de proyectos creativos y dirección de arte.
128. [Dribbble](https://dribbble.com/) — Tendencias de diseño visual e interfaz.

---

# 6. Social listening, monitoreo de marcas y alertas

| Herramienta | Qué aporta | Coste / nota |
|---|---|---|
| [Google Alerts](https://www.google.com/alerts?hl=es) | Avisos por términos y marcas en la Web. | Gratis; señal general, no cobertura social completa. |
| [Talkwalker Alerts](https://www.talkwalker.com/alerts) | Alertas de menciones en fuentes públicas y Web. | Herramienta de alertas gratuita; revisar cobertura vigente. |
| [F5Bot](https://f5bot.com/) | Alertas por palabras clave que aparecen en Reddit y Hacker News. | Gratis con límites definidos por el proyecto. |
| [Feedly](https://feedly.com/) | Agregación RSS y seguimiento de fuentes. | Planes gratuitos/pagos; funciones de IA avanzadas pueden ser de pago. |
| [Inoreader](https://www.inoreader.com/) | RSS, reglas, filtros y notificaciones. | Freemium; verificar límites actuales. |
| [Mention](https://mention.com/) | Seguimiento de menciones de marca y competidores. | Demo/prueba y planes pagos, según oferta actual. |
| [Brand24](https://brand24.com/) | Social listening, menciones y sentimiento. | Principalmente pago/prueba; no asumir uso gratis permanente. |
| [Brandwatch](https://www.brandwatch.com/) | Inteligencia de consumidor y social listening empresarial. | Comercial/empresa. |
| [Meltwater](https://www.meltwater.com/) | Medios y social listening empresarial. | Comercial/empresa. |
| [Sprout Social Listening](https://sproutsocial.com/features/social-listening/) | Escucha social, temas, marcas y audiencia. | Suscripción; comprobar pruebas y límites. |
| [Hootsuite Streams](https://www.hootsuite.com/) | Supervisar conversaciones y menciones desde un panel. | Planes comerciales; funcionalidades según plan. |
| [Awario](https://awario.com/) | Monitorización de menciones y palabras clave. | Principalmente pago/prueba. |
| [Mentionlytics](https://www.mentionlytics.com/) | Monitor de menciones, reputación y sentimiento. | Comercial; confirmar límites. |
| [Metricool](https://metricool.com/) | Planificación, analítica y comparación del rendimiento social. | Freemium con límites de cuentas/historial. |
| [Buffer](https://buffer.com/) | Publicación, calendario y analítica básica de cuentas propias. | Freemium; no es una fuente universal de tendencias externas. |
| [Later](https://later.com/) | Planificación social e información de contenido. | Principalmente suscripción; datos según red conectada. |
| [Socialinsider](https://www.socialinsider.io/) | Benchmarks de competidores y analítica social. | Prueba/planes comerciales. |
| [Rival IQ](https://www.rivaliq.com/) | Benchmarking de competidores y alertas de cambios. | Herramienta comercial. |
| [Social Blade](https://socialblade.com/) | Evolución pública de seguidores/visualizaciones de creadores y canales. | Funciones gratuitas y premium. |
| [Pentos](https://pentos.co/) | Analítica y seguimiento de tendencias de TikTok. | Ver planes y acceso actual; no asumir gratis. |
| [Tokchart](https://tokchart.com/) | Ranking de sonidos de TikTok, uso UGC y crecimiento de audio. | Consulta pública limitada y herramientas de pago/API. |
| [Chartmetric](https://chartmetric.com/) | Inteligencia musical, artistas y tendencias sociales de audio. | Freemium/planes profesionales; varias funciones son premium. |
| [Trendpop](https://trendpop.com/) | Descubrimiento/analítica de tendencias de creadores y contenido corto. | Verificar disponibilidad y planes actuales. |

### Repositorios open source de social listening

129. [Radar Intelligence](https://github.com/Scognamiglio1969/radar-intelligence) — Panel de inteligencia de medios/social listening self-hosted; revisar conectores y claves necesarias.
130. [AI Social Listening Tool](https://github.com/HasData/social-listening-tool) — Pipeline de menciones, análisis LLM, CSV/gráficos y avisos Telegram. Requiere HasData API y una clave de LLM.
131. [GitHub Topic: social listening](https://github.com/topics/social-listening) — Descubrir proyectos nuevos de monitoreo.
132. [GitHub Topic: media monitoring](https://github.com/topics/media-monitoring) — Proyectos para seguir medios, menciones y noticias.
133. [GitHub Topic: brand monitoring](https://github.com/topics/brand-monitoring) — Herramientas de monitorización de marcas.
134. [GitHub Topic: social media analytics](https://github.com/topics/social-media-analytics) — Paneles y analizadores open source.
135. [GitHub Topic: sentiment analysis](https://github.com/topics/sentiment-analysis) — Librerías y aplicaciones de análisis de sentimiento.
136. [GitHub Topic: trend detection](https://github.com/topics/trend-detection) — Algoritmos y sistemas de detección de tendencias.
137. [GitHub Topic: trend analysis](https://github.com/topics/trend-analysis) — Analítica temporal, tendencias y predicción.
138. [GitHub Topic: social network analysis](https://github.com/topics/social-network-analysis) — Analizar redes de cuentas, comunidades y difusión.

---

# 7. Fuentes abiertas, APIs y señales programáticas

Son útiles para construir un radar propio. Una biblioteca que extrae datos no elimina los límites, políticas o requisitos de la fuente original.

139. [Google Trends](https://trends.google.com/trends/) — Interés de búsqueda normalizado, temas relacionados y señales de tendencia.
140. [PyTrends (GitHub)](https://github.com/GeneralMills/pytrends) — Cliente Python no oficial de Google Trends; puede dejar de funcionar o ser limitado por Google.
141. [Google Trends MCP — HasData](https://github.com/HasData/google-trends-mcp) — Integración MCP con resultados estructurados.
142. [Google Trends MCP — lhitches](https://github.com/lhitches/google-trends-mcp) — Integración comunitaria para Claude Code.
143. [YouTube Data API](https://developers.google.com/youtube/v3) — Consulta videos, canales, búsquedas y estadísticas públicas con cuota de API.
144. [YouTube Analytics API](https://developers.google.com/youtube/analytics) — Analítica de canales autorizados; no es un API global para métricas privadas de otros creadores.
145. [Reddit Data API](https://www.reddit.com/dev/api/) — Posts, comunidades y comentarios de acuerdo con acceso/límites.
146. [Bluesky AT Protocol](https://atproto.com/) — Protocolo y herramientas para leer datos públicos.
147. [Bluesky Jetstream](https://github.com/bluesky-social/jetstream) — Consumo de eventos públicos de Bluesky para sistemas reactivos.
148. [Mastodon API](https://docs.joinmastodon.org/api/) — Datos y endpoints de acuerdo con cada instancia.
149. [Mastodon Trends API](https://docs.joinmastodon.org/methods/trends/) — Señales de tags/posts/links crecientes.
150. [GDELT Project](https://www.gdeltproject.org/) — Datos globales de noticias y eventos; útil para detectar temas antes de que se conviertan en tendencia social.
151. [GDELT DOC API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) — Búsqueda de noticias y cobertura temporal en el proyecto GDELT.
152. [News API](https://newsapi.org/) — Búsqueda de artículos y titulares; el nivel gratuito es de desarrollo y tiene retraso/límites.
153. [News API — precios](https://newsapi.org/pricing) — Comprobar retraso, solicitudes diarias y condiciones comerciales.
154. [Media Cloud](https://mediacloud.org/) — Plataforma de investigación de medios y cobertura noticiosa.
155. [Common Crawl](https://commoncrawl.org/) — Corpus abierto de rastreo Web para análisis a escala; no es un radar instantáneo.
156. [Wikipedia Pageviews API](https://wikitech.wikimedia.org/wiki/Analytics/AQS/Pageviews) — Incrementos en páginas vistas como señal de interés.
157. [Wikimedia Pageviews](https://pageviews.wmcloud.org/) — Interfaz para explorar páginas consultadas en Wikipedia.
158. [GitHub REST API](https://docs.github.com/en/rest) — Popularidad, actividad, repositorios y releases de proyectos.
159. [GitHub Trending](https://github.com/trending) — Página pública para detectar proyectos de software que suben.
160. [npm Trends](https://npmtrends.com/) — Interés comparativo en paquetes JavaScript.
161. [PyPI Stats](https://pypistats.org/) — Tendencias de descargas de librerías Python.
162. [Product Hunt API / documentación](https://api.producthunt.com/v2/docs) — Productos y lanzamientos; requiere token y respeta las condiciones actuales.
163. [Hacker News API](https://github.com/HackerNews/API) — API oficial para historias, comentarios y rankings.
164. [Hacker News Algolia Search](https://hn.algolia.com/api) — Búsqueda histórica de historias/comentarios.
165. [Stack Exchange API](https://api.stackexchange.com/) — Preguntas emergentes y actividad por comunidad.
166. [Internet Archive](https://archive.org/developers/) — Metadatos y colecciones para investigación histórica, no un indicador directo de trending.
167. [OpenAlex](https://openalex.org/) — Tendencias de publicaciones/investigación, útil para temas científicos/técnicos.
168. [Crossref API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/) — Metadatos académicos y temas emergentes en publicaciones.
169. [DataReportal](https://datareportal.com/) — Informes públicos de comportamiento digital y uso de redes.
170. [Pew Research Center — Internet & Tech](https://www.pewresearch.org/internet/) — Investigación de adopción y comportamiento digital.

---

# 8. Feeds y fuentes de noticias para alertas automatizadas

171. [Google News RSS (búsqueda)](https://news.google.com/rss/search?q= tendencias%20redes%20sociales&hl=es-419&gl=CO&ceid=CO:es-419) — Feed de noticias filtrado por términos.
172. [Google News RSS — IA](https://news.google.com/rss/search?q=inteligencia%20artificial&hl=es-419&gl=CO&ceid=CO:es-419) — Ejemplo de feed temático.
173. [Google Alerts](https://www.google.com/alerts?hl=es) — Convierte keywords en alertas por correo/feed cuando está disponible.
174. [RSSHub](https://github.com/DIYgod/RSSHub) — Herramienta para crear feeds RSS a partir de fuentes compatibles; algunos módulos dependen de servicios externos y pueden fallar.
175. [RSS-Bridge](https://github.com/RSS-Bridge/rss-bridge) — Genera RSS para servicios sin feed nativo, sujeto a mantenimiento y condiciones de cada web.
176. [Feedly](https://feedly.com/) — Agregador de fuentes/noticias y seguimiento de temas.
177. [Inoreader](https://www.inoreader.com/) — RSS, reglas, filtros y alertas.
178. [F5Bot](https://f5bot.com/) — Alertas de nuevas menciones en Reddit/Hacker News.
179. [IFTTT](https://ifttt.com/) — Automatizar avisos y flujos entre servicios compatibles.
180. [Zapier](https://zapier.com/) — Automatizaciones entre feeds, correo, hojas de cálculo, Slack/Discord y otros servicios; cuota gratis limitada.
181. [n8n](https://n8n.io/) — Orquestación open source/self-hosted para recolectar, deduplicar y distribuir alertas.
182. [n8n GitHub](https://github.com/n8n-io/n8n) — Código y documentación del flujo de automatización.
183. [Activepieces](https://www.activepieces.com/) — Alternativa de automatización con opción open source y plan cloud.
184. [Activepieces GitHub](https://github.com/activepieces/activepieces) — Código y despliegue.
185. [Make](https://www.make.com/) — Automatización visual; límites según plan.
186. [Telegram Bot API](https://core.telegram.org/bots/api) — Canal sencillo para enviar el resumen y alertas.
187. [Discord Webhooks](https://discord.com/developers/docs/resources/webhook) — Enviar resultados a un canal de Discord.
188. [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks) — Alertas para un workspace de Slack.
189. [ntfy](https://ntfy.sh/) — Notificaciones push mediante HTTP; incluye opción self-hosted.
190. [Gotify](https://gotify.net/) — Servidor self-hosted de notificaciones push.

---

# 9. Analítica de audio, memes y tendencias de formatos

191. [Tokchart — tendencias de audio](https://next.tokchart.com/dashboard/tiktok-trending-sounds) — Audios que ganan uso en TikTok; revisar si la métrica/país es global o local.
192. [Tokchart — all-time sounds](https://tokchart.com/dashboard/lists/songs/all-time) — Referencia histórica de sonidos de TikTok.
193. [Chartmetric](https://chartmetric.com/) — Tendencias de artistas, canciones, playlists y señales sociales.
194. [Spotify Charts](https://charts.spotify.com/) — Rankings de canciones y artistas por mercado.
195. [Spotify Viral 50](https://charts.spotify.com/charts/view/viral-global-daily/latest) — Señales de viralidad musical; pueden cambiar los enlaces/rutas.
196. [Spotify for Artists](https://artists.spotify.com/) — Métricas de canciones/artistas propios.
197. [YouTube Charts](https://charts.youtube.com/) — Rankings musicales y contenidos de YouTube.
198. [TikTok Creative Center — Sounds/Popular Music](https://ads.tiktok.com/business/creativecenter/music/pc/en) — Descubrimiento de música popular para el entorno TikTok.
199. [Know Your Meme](https://knowyourmeme.com/) — Contexto, origen y evolución de memes.
200. [Know Your Meme — submissions/news](https://knowyourmeme.com/news) — Cobertura de memes y momentos culturales.
201. [Meme Database](https://memedatabase.com/) — Referencia adicional para investigar formatos y plantillas; comprueba vigencia del servicio.
202. [Imgflip Meme Generator](https://imgflip.com/memegenerator) — Catálogo de plantillas; útil para identificar formatos, no como licencia automática de cada imagen.
203. [Giphy](https://giphy.com/) — GIFs y reacciones populares; revisar permisos según uso.
204. [Tenor](https://tenor.com/) — GIFs y reacciones; revisar derechos de cada contenido.
205. [Reddit Memes](https://www.reddit.com/r/memes/) — Señales comunitarias de formatos de meme.
206. [r/InternetIsBeautiful](https://www.reddit.com/r/InternetIsBeautiful/) — Descubrimiento de herramientas y sitios que se comparten mucho.
207. [r/AskReddit](https://www.reddit.com/r/AskReddit/) — Temas de conversación y preguntas culturales (no es un ranking universal de tendencias).
208. [Know Your Meme — database](https://knowyourmeme.com/memes) — Base de datos para verificar origen y contexto de un meme antes de reutilizarlo.

---

# 10. APIs y servicios comerciales que pueden ayudar, pero no son necesarios para empezar gratis

209. [TikHub](https://tikhub.io/) — Datos sociales agregados y endpoints de tendencias; comprobar costes y permiso de uso.
210. [Ayrshare Social Media API](https://www.ayrshare.com/) — Publicación/análisis multiplataforma y plugin para agentes; API de pago.
211. [Ayrshare Claude Code Plugin](https://github.com/ayrshare/ayrshare-social-media-api-claude-plugin) — Publicar/consultar métricas de varias redes desde Claude Code; necesita servicio/API.
212. [Publora Skills](https://github.com/publora/skills) — Skills para publicar y programar contenido en múltiples redes; servicio conectado, no es un radar autónomo de tendencias.
213. [Posta Skill](https://github.com/STGime/posta-skill) — Publicación, calendario y analytics multiplataforma; requiere el servicio correspondiente.
214. [Brandwatch](https://www.brandwatch.com/) — Social listening empresarial.
215. [Meltwater](https://www.meltwater.com/) — Inteligencia de medios y menciones.
216. [Sprout Social](https://sproutsocial.com/) — Gestión, analítica y escucha social.
217. [Brand24](https://brand24.com/) — Monitorización de menciones/sentimiento.
218. [BuzzSumo](https://buzzsumo.com/) — Contenido popular, backlinks y análisis de temas.
219. [Pentos](https://pentos.co/) — Analítica de TikTok.
220. [Trendpop](https://trendpop.com/) — Descubrimiento de tendencias y creadores de contenido corto.
221. [Chartmetric](https://chartmetric.com/) — Inteligencia musical/social.
222. [Trendsmap](https://www.trendsmap.com/) — Análisis geográfico de tendencias de X.
223. [Similarweb](https://www.similarweb.com/) — Tráfico web y señales competitivas.
224. [Semrush](https://www.semrush.com/) — Tendencias de búsqueda y competencia.
225. [Exploding Topics](https://explodingtopics.com/) — Descubrimiento anticipado de temas.

---

# 11. Cómo convertir estos recursos en un radar realmente útil

La meta no es traer miles de hashtags; es detectar tendencias **tempranas, relevantes y accionables** para tu marca/audiencia.

## Pipeline sugerido

1. **Ingesta:** consultar fuentes oficiales, Trends MCP, Reddit y Bluesky con la frecuencia que permita cada fuente.
2. **Normalización:** guardar una fila por señal con `platform`, `topic`, `source_url`, `country`, `language`, `first_seen_at`, `last_seen_at`, `volume`, `growth`, `engagement`, `sample_posts` y `confidence`.
3. **Deduplicación semántica:** agrupar los distintos hashtags/palabras que se refieren al mismo evento.
4. **Puntuación temporal:** dar peso a aceleración y novedad, no solo a volumen acumulado.
5. **Relevancia:** filtrar por nicho, idioma, región y relación con la marca.
6. **Validación cruzada:** una tendencia que aparece en TikTok y Reddit y también sube en búsqueda merece más confianza que un único post viral.
7. **Salida:** resumen con evidencia, enlaces fuente, nivel de confianza, riesgo de caducidad y una idea concreta de contenido.
8. **Alertas:** enviar a Telegram/Discord/Slack si el tema supera un umbral.
9. **Memoria:** guardar falsos positivos, tendencias ya agotadas y resultados de publicaciones anteriores.

## Fórmula inicial para priorizar señales

Usa un score normalizado, no una cifra falsa de “viralidad universal”:

```text
trend_score =
    0.30 * velocity_score
  + 0.20 * novelty_score
  + 0.20 * cross_platform_score
  + 0.20 * audience_relevance_score
  + 0.10 * source_confidence_score
```

- `velocity_score`: cuánto se aceleró en 1h/6h/24h frente a su propio histórico.
- `novelty_score`: cuánto tiempo lleva apareciendo en tus fuentes.
- `cross_platform_score`: cuántas fuentes independientes corroboran la señal.
- `audience_relevance_score`: coincidencia con el país, idioma y nicho que buscas.
- `source_confidence_score`: calidad y estabilidad del dato original.

No compares directamente valores 0–100 de Google Trends con recuentos de posts de TikTok. Son métricas distintas; normaliza por fuente/periodo y conserva el valor original.

## Formato del digest diario

```markdown
# Radar de tendencias — {{fecha}} — {{región}}

## Oportunidades inmediatas
- Tema:
- Qué cambió y desde cuándo:
- Evidencia (links):
- Plataformas donde crece:
- Velocidad / confianza:
- Ventana probable de oportunidad:
- Idea de reel/video/post:
- Riesgos o contexto que debe verificarse:

## Tendencias en observación
...

## Temas ya saturados o descendiendo
...

## Fuentes que fallaron / limitaciones
...
```

## Frecuencia de consulta inicial

- TikTok Creative Center: revisión manual diaria o integración permitida por herramienta/API disponible.
- Google Trends: cada 2–6 horas para temas prioritarios; no hacer scraping agresivo.
- Reddit/Bluesky: cada 15–60 minutos solo si la fuente/API y las cuotas lo permiten.
- YouTube, Pinterest y reportes oficiales: una o dos veces al día, más revisión semanal.
- Alertas web/noticias: según la disponibilidad del feed y urgencia.

No uses una frecuencia más alta que la que permitan las condiciones del proveedor ni intentes eludir rate limits o controles de acceso.

---

# 12. Cómo preservar una operación realmente gratuita

1. **Prioriza fuentes nativas gratuitas:** TikTok Creative Center, Google Trends, YouTube Culture & Trends, YouTube Charts, Pinterest Trends, Reddit y Bluesky.
2. **Usa cuotas gratuitas solamente donde aporten valor:** por ejemplo, un MCP agregado puede ser útil para un resumen diario, pero no necesariamente para consultar cada red cada minuto.
3. **No dependas de un solo MCP hospedado:** guarda adaptadores independientes para cambiar de proveedor sin reescribir la skill.
4. **Prefiere local/open source para análisis y almacenamiento:** SQLite/Postgres, Python, cron/n8n self-hosted, y un LLM local si quieres evitar cargos variables por análisis.
5. **Separa los datos de la inteligencia:** el conector recolecta; `trend-research` interpreta; `generative-visual-studio` propone y produce la pieza.
6. **No asumas que público significa libre de restricciones:** una web pública todavía puede tener copyright, términos de API, límites de extracción o prohibiciones de redistribución.
7. **Revisa las licencias de los repositorios:** el código puede ser MIT/Apache, pero eso no convierte los datos de terceros en libres.
8. **Evita credenciales de cuentas en repositorios:** usa `.env`, secretos del sistema y permisos mínimos. Nunca subas tokens a Git.
9. **Guarda evidencia y timestamps:** los datos de tendencias caducan rápido; cada afirmación del digest debe incluir URL y fecha de observación.
10. **No publiques automáticamente solo porque algo esté en tendencia:** valida contexto, marca, derechos, seguridad, humor local y riesgo reputacional.

---

# 13. Lista de comprobación antes de adoptar una herramienta

- [ ] ¿Obtiene datos recientes o solo enseña a Claude a razonar sobre ellos?
- [ ] ¿La fuente tiene datos de Colombia/LatAm o solo de Estados Unidos?
- [ ] ¿Devuelve timestamps y enlaces que permitan verificar la señal?
- [ ] ¿Tiene API oficial, cuota gratuita y términos documentados?
- [ ] ¿Requiere un API key, tarjeta o crédito pago?
- [ ] ¿La cuota gratuita alcanza para la frecuencia que necesitas?
- [ ] ¿El proyecto tiene actividad, licencia y issues atendidos?
- [ ] ¿Exige cookies, credenciales de cuenta o scraping frágil?
- [ ] ¿Permite almacenar/analizar/redistribuir los datos según tu caso de uso?
- [ ] ¿Se puede reemplazar su proveedor sin cambiar todo `generative-visual-studio`?

---

# 14. Fuentes principales para validar el catálogo

- [TikTok Creative Center — Trends](https://ads.tiktok.com/business/creativecenter/trends)
- [TikTok — cómo usar Trends](https://ads.tiktok.com/resources/help/article/how-to-use-trends)
- [Google Trends — tendencias actuales](https://trends.google.com/trending?geo=CO&hl=es-419)
- [Google — guía de tendencias](https://developers.google.com/search/docs/monitor-debug/trends-start?hl=es-419)
- [YouTube Culture & Trends](https://blog.youtube/intl/es-419/culture-and-trends/)
- [YouTube Charts & Insights](https://support.google.com/youtube/answer/9014376)
- [Pinterest Trends — ayuda](https://help.pinterest.com/es/business/article/pinterest-trends)
- [Mastodon Trends API](https://docs.joinmastodon.org/methods/trends/)
- [Bluesky MCP Server](https://github.com/cyanheads/bluesky-mcp-server)
- [Trends MCP](https://github.com/trendsmcp-ai/Trends-MCP)
- [Google Trends MCP — lhitches](https://github.com/lhitches/google-trends-mcp)
- [Google Trends MCP — HasData](https://github.com/HasData/google-trends-mcp)
- [Social Media Skills](https://github.com/social-media-skills/skills)
- [Scrollmark Social Skills](https://github.com/scrollmark/social-skills)
- [GTM Agents trend-research](https://github.com/gtmagents/gtm-agents)
- [GitHub Social Listening Topic](https://github.com/topics/social-listening)

**Nota final:** esta lista reúne más de 200 entradas y recursos entre plugins, skills, APIs, fuentes nativas, directorios y herramientas comerciales. No todos son plugins instalables ni todos son gratuitos para uso ilimitado; las etiquetas y notas ayudan a distinguirlos. Los datos de tendencias cambian continuamente, y ningún catálogo puede garantizar que capture todos los temas de todas las redes en todo momento.
