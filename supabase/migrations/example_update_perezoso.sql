-- Ejemplo para actualizar el perfil de Perezoso Cafe
-- Puedes correr esto en el Editor SQL de Supabase para cambiar colores, textos, etc.

UPDATE shops
SET config = jsonb_set(
    config,
    '{theme}', -- Seleccionamos la parte del JSON a cambiar (theme)
    '{
        "primaryColor": "#2E2333",
        "secondaryColor": "#FFF5E1",
        "accentColor": "#FF5733", -- Nuevo color de acento
        "fontFamily": "var(--font-fredoka)"
    }'::jsonb
)
WHERE code = 'perezoso_cafe';

-- O para cambiar solo un texto especifico:
UPDATE shops
SET config = jsonb_set(
    config,
    '{texts, welcomeSubtitle}',
    '"El mejor café de la ciudad 🦥"'::jsonb
)
WHERE code = 'perezoso_cafe';
