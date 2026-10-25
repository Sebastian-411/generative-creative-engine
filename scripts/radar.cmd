@echo off
rem Radar diario de tendencias (lo llama la tarea programada "creative-mastery-radar").
cd /d "%~dp0.."
node plugins\creative-mastery\skills\trend-radar\radar.mjs --out knowledge\trends --geo CO --niche "tecnologia,inteligencia artificial,futbol" >> knowledge\trends\radar.log 2>&1
