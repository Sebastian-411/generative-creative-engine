# Prompts para ACE-Step 1.5: tema → sensación + tempo

Pide **por sensación y tempo, no por tema**. Escribe el prompt en inglés con género + instrumentos + energía + `no vocals` (y `no drums` si la voz es íntima). Nunca nombres de artistas ni canciones. Declara siempre `bpm` (sin él no hay cierre en barra) y `key`.

| Tema de la pieza | Prompt (`music.prompt`) | bpm | key |
|---|---|---|---|
| Fintech, banca, seguros | calm cinematic, soft strings, subtle piano, restrained percussion, confident and clear, no vocals | 92 | D major |
| Cripto, web3 | atmospheric electronic, deep bass, futuristic synths, steady pulse, no vocals | 100 | F minor |
| Creativo, diseño, agencia | playful electronic, warm pads, light percussion, plucked synths, no vocals | 115 | C major |
| Tecnología, SaaS (por defecto) | uplifting corporate tech, bright modern piano with synth pads, light claps, no vocals | 108 | G major |
| Restaurante, comida local (LatAm) | warm cheerful latin acoustic guitar, soft cumbia percussion, marimba accents, positive and light, no vocals | 96 | G major |
| Lanzamiento, teaser | tense minimal pulse building to a bright drop, punchy drums after the drop, no vocals | 120 | A minor |
| Datos, historia, reflexivo | sparse ambient piano, soft pads, slow and spacious, no drums, no vocals | 80 | E minor |
| Terror, true crime | dark cinematic horror score, low droning strings, eerie music box, no drums, no vocals | 60 | D minor |
| Lifestyle, relajado | lofi hip hop, mellow electric piano, vinyl texture, soft swung drums, no vocals | 84 | F major |

## Ajuste por arquetipo de historia

- **Problema → agitación → solución**: de menor a mayor. Pide "starts sparse and minor, opens into a bright major section" y marca el cambio con `drops` justo antes de la solución.
- **Antes → después → puente**: ascenso aspiracional ("gradually building, uplifting").
- **Cascada de funciones**: +10 bpm sobre la tabla.
- **Demo en bucle**: −8 bpm y mínima ("minimal, unobtrusive loop").

## Controles

- 90–110 bpm se siente calmo; 110–130, enérgico.
- Para promo, pide brillo ("bright", "sparkling", "crisp"). Si `mix.md` avisa que más del 55 % de la energía está bajo 150 Hz, quita "deep bass"/"sub" y agrega "plucked", "piano" o "marimba": en el parlante de un celular los graves no suenan.
- Lo que no quieres va dicho en positivo dentro del prompt ("no vocals", "no drums"); ACE no tiene campo de prompt negativo.
- Cambia `seed` para otra toma con el mismo carácter; la caché es por parámetros.

Fuentes: inferencia de humor y arquetipos de media-use (`bgm.md`) · parte destilada de HyperFrames (Apache-2.0)
