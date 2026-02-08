-- Create SHOPS table
drop table if exists shops cascade;
create table if not exists shops (
    code text primary key,
    name text not null,
    config jsonb not null default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table shops enable row level security;

-- Policy: Everyone can read shop configs (needed for login/landing pages)
create policy "Allow public read access to shops"
    on shops for select
    using (true);

-- Policy: Only admins can update (future proofing)
-- For now we can leave it open or restrict to service_role

-- Seed Data: Perezoso Cafe
insert into shops (code, name, config)
values (
    'perezoso_cafe',
    'Perezoso Cafe',
    '{
        "theme": {
            "primaryColor": "#2E2333",
            "secondaryColor": "#FFF5E1",
            "accentColor": "#F5A623",
            "fontFamily": "var(--font-fredoka)"
        },
        "texts": {
            "welcomeTitle": "Perezoso",
            "welcomeSubtitle": "Café para ir con calma 🦥",
            "stampCardTitle": "Tu Tarjeta de Recompensas",
            "rewardsTitle": "Mis Regalos"
        },
        "rules": {
            "stampsPerReward": 10
        },
        "assets": {
            "logo": "/assets/perezoso/LogoPerezoso.png",
            "gallery": [
                "/assets/perezoso/image-1.png",
                "/assets/perezoso/image-2.png",
                "/assets/perezoso/image-3.png",
                "/assets/perezoso/image-4.png",
                "/assets/perezoso/image-5.png",
                "/assets/perezoso/image-6.png",
                "/assets/perezoso/image-7.png",
                "/assets/perezoso/image-8.png"
            ]
        },
        "social": {
            "instagram": "https://www.instagram.com/perezoso.cafe/"
        },
        "features": {
            "showBuyButton": true,
            "externalMenuUrl": "https://perezosocafe.com/menu",
            "showNewsFeed": true,
            "menuEnabled": true,
            "showAboutUs": true
        }
    }'::jsonb
)
on conflict (code) do update set config = EXCLUDED.config;

-- Seed Data: Mare Cafe
insert into shops (code, name, config)
values (
    'mare_cafe',
    'Mare Cafe',
    '{
        "theme": {
            "primaryColor": "#1E3A8A",
            "secondaryColor": "#F5F5DC",
            "fontFamily": "var(--font-playfair)"
        },
        "texts": {
            "welcomeTitle": "Mare",
            "welcomeSubtitle": "Pastelería y Café de Especialidad",
            "stampCardTitle": "Tu Tarjeta de Fidelidad",
            "rewardsTitle": "Tus Recompensas"
        },
        "rules": {
            "stampsPerReward": 7
        },
        "assets": {
            "logo": "/logo-mare.png"
        },
        "features": {
            "showBuyButton": false,
            "externalMenuUrl": "https://instagram.com/marecafe",
            "showNewsFeed": true,
            "menuEnabled": false
        }
    }'::jsonb
)
on conflict (code) do update set config = EXCLUDED.config;
