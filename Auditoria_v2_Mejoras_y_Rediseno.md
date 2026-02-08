# 🔍 Auditoría v2 — Estado de Mejoras + Rediseño Estético Coffeinopia

---

## PARTE 1: ESTADO DE LAS MEJORAS DE LA AUDITORÍA ANTERIOR

### ✅ Mejoras BIEN Implementadas

| Mejora | Estado | Notas |
|--------|--------|-------|
| **`.env.local` en `.gitignore`** | ✅ Correcto | Ya no se expone en el repo |
| **`supabase-admin.ts` con Service Role** | ✅ Correcto | `marketing.ts` ahora usa `supabaseAdmin` |
| **Error Boundaries** | ✅ Bien hechos | `error.tsx` global + `admin/error.tsx` específico, con UI profesional |
| **`manifest.ts` dinámico** | ✅ Correcto | Lee de `getShopConfig()`, nombre/colores/icon dinámicos |
| **`layout.tsx` dinámico** | ✅ Correcto | `generateMetadata()` lee de DB, título/favicon/description dinámicos |
| **`ClientConfigContext`** | ✅ Buena decisión | Provider en layout, `useClientConfig()` en todos los componentes |
| **`shop-service.ts`** | ✅ Correcto | Lee config de tabla `shops` en Supabase con fallback |
| **Tabla `shops` en DB** | ✅ Correcto | Configs como JSONB, seed data para ambas cafeterías |
| **`redeem_reward` dinámico** | ✅ Correcto | Lee `stampsPerReward` de `shops.config` en vez de hardcodear 7 |
| **PINs hasheados con pgcrypto** | ✅ Correcto | `bcrypt` via `gen_salt('bf')`, función `verify_shop_pin` |
| **Login usa `verify_shop_pin` RPC** | ✅ Correcto | Ya no hardcodea PINs en el signup flow |
| **Staff canje usa `verify_shop_pin`** | ✅ Correcto | Valida PIN contra DB en vez de comparar string |
| **Métricas filtradas por `client_code`** | ✅ Correcto | `fetchMetrics` filtra clientes, scans y redemptions por shop |
| **Staff logs filtrados** | ✅ Correcto | `fetchLogs` filtra por `client_code` |
| **Realtime en staff** | ✅ Buena adición | Suscripción a `postgres_changes` en `transaction_logs` |
| **Staff stampsNeeded dinámico** | ✅ Correcto | Usa `config.rules.stampsPerReward` |

### ⚠️ Mejoras PARCIALES (necesitan ajuste)

**1. El PIN maestro sigue visible en el admin settings UI:**
```tsx
// admin/page.tsx línea ~1586
<input type="password" value="MARE-ADMIN-2024" disabled />
```
**Solución:** Eliminar este campo o reemplazarlo con un botón "Cambiar PIN" que abra un modal con `current_pin` + `new_pin` validados contra `verify_shop_pin`.

**2. La migración `verify_shop_pin` busca por `config->>'code'` pero la PK de shops es `code`:**
```sql
-- En 20260208_secure_pins.sql:
select admin_pin_hash, staff_pin_hash 
from shops 
where config->>'code' = shop_code;  -- ❌ Debería ser: where code = shop_code
```
La tabla `shops` tiene `code text primary key`, pero la función busca dentro del JSONB. Si el JSONB no tiene un campo `code` interno, esta función **nunca encontrará el shop** y siempre retornará "Shop not found". 

**Corrección:**
```sql
select admin_pin_hash, staff_pin_hash 
into stored_admin_hash, stored_staff_hash
from shops 
where code = shop_code;  -- ✅ Busca por la columna PK
```

**3. El `redeem_reward` busca shop por `profiles.shop_id` pero esa columna referencia UUID:**
```sql
select shop_id into user_shop_id from profiles where id = target_user_id;
select config into shop_config from shops where id = user_shop_id;
```
Pero la tabla `shops` nueva tiene `code text primary key`, no `id uuid`. La migración original de Phase 2 creó una tabla `shops` con `id uuid` PK, y la nueva migración hace `drop table if exists shops cascade` y la recrea con `code text primary key`. Si ya corriste ambas, el `profiles.shop_id` (uuid) no matchea con `shops.code` (text).

**Solución:** La función debería buscar por `profiles.client_code` → `shops.code`:
```sql
select client_code into user_client_code from profiles where id = target_user_id;
select config into shop_config from shops where code = user_client_code;
```

**4. Polling en client/page.tsx sigue hardcodeando 7:**
```tsx
if (stamps >= 7 && data.count < 7) {
```
Debería ser `stamps >= config.rules.stampsPerReward && data.count < config.rules.stampsPerReward`.

**5. `config-loader.ts` sigue existiendo (código muerto):**
El archivo `config-loader.ts` con los configs estáticos todavía existe. Ahora que usas `shop-service.ts` + `ClientConfigContext`, deberías eliminarlo para evitar confusión. Ningún componente actualizado lo importa ya, pero si alguien lo usa por error, cargaría datos desactualizados.

### ❌ Mejoras NO Implementadas (de la auditoría anterior)

| Pendiente | Prioridad |
|-----------|-----------|
| Recuperación de contraseña ("forgot password") | 🟡 Alta |
| Paginación en ClientsTab y logs | 🟡 Alta |
| Menú desde DB en vez de `menu-data.ts` hardcoded | 🟡 Media |
| Tests automatizados | 🔴 Crítica |
| Sentry/error tracking real (los error boundaries solo son UI) | 🟡 Alta |
| Rate limiting en login | 🟡 Alta |
| Supabase Storage para assets | 🟢 Media |
| Validación de inputs (email format, password strength) | 🟡 Alta |

---

## PARTE 2: REDISEÑO ESTÉTICO — COFFEINOPIA STYLE

### Principios de diseño extraídos de Coffeinopia

Analizando las 3 pantallas de referencia:

1. **Header oscuro compacto** — barra superior con color primario, logo pequeño, ubicación, bell icon. No un logo gigante de 192px.
2. **Banner promocional** — card dark con texto grande "OFF 20%", CTA naranja con flecha, ocupa poco espacio vertical.
3. **Cards con rounded corners XXL** — border-radius de 20-24px, sombras sutiles, nunca borders agresivos.
4. **Scroll horizontal** — secciones "Nearby Shop" y "Popular" son sliders horizontales, no listas verticales.
5. **Bottom navigation bar** — 5 iconos fijos, el del centro (QR/carrito) elevado con accent color.
6. **Accent naranja** — botones, badges, indicadores, flechas circulares. Un solo accent domina.
7. **Tipografía bold en números** — conteos grandes (4.8, $3.00), font-weight extra bold.
8. **Fondo gris claro** (#FAFAFA) — no blanco puro, da profundidad.
9. **Micro-animaciones** — transiciones suaves en todo.
10. **Zero visual noise** — máximo 2 acciones por sección, espacio generoso.

### Mapa de cambios por componente

| Componente actual | Problema estético | Rediseño Coffeinopia |
|-------------------|------------------|---------------------|
| `ClientHeader` | Logo de 176px (h-44), ocupa demasiado, header de 192px total | Header compacto dark, logo 40px, nombre + subtítulo texto, h-16 total |
| `WelcomeHero` | Texto centrado genérico "Hola, Cliente 👋" | Eliminado. La info de bienvenida va en el header |
| `StampProgress` | Barra de progreso plana con icono café | Grid de círculos/stamps visuales individuales + barra sutil debajo |
| `RewardsCard` | Botón `animate-bounce` agresivo | Barra fija inferior estilo checkout con "Canjear →" |
| `NewsFeed` | Cards verticales apiladas | Slider horizontal con snap scroll |
| `QRFloatingButton` | FAB circular bounce en esquina | Bottom nav bar con botón central QR elevado |
| `QRModal` | Modal centrado | Bottom sheet con handle y slide-up animation |
| `MenuButton` | Botón flat con color primario | Integrado en bottom nav |
| Fondo página | `secondaryColor` (#FFF5E1 crema) | `#FAFAFA` gris neutro claro |
| `pt-56` (padding top) | 224px de padding por el header gigante | `pt-28` (112px) con header compacto |

### Implementación: qué archivos tocar

Para aplicar el rediseño **sin romper funcionalidad**, estos son los archivos a modificar:

```
src/components/client/ClientHeader.tsx    → Header compacto dark
src/components/client/WelcomeHero.tsx     → ELIMINAR (info va en header)
src/components/client/StampProgress.tsx   → Grid de stamp circles
src/components/client/RewardsCard.tsx     → Barra inferior fija
src/components/client/NewsFeed.tsx        → Horizontal scroll cards
src/components/client/QRFloatingButton.tsx → REEMPLAZAR por BottomNavBar
src/components/client/QRModal.tsx         → Bottom sheet style
src/components/client/MenuButton.tsx      → ELIMINAR (va en nav)
src/app/client/page.tsx                   → Recomponer layout
src/app/globals.css                       → Añadir animaciones + tokens
```

### CSS a añadir en globals.css

```css
/* Coffeinopia design tokens */
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Hide scrollbar for horizontal scroll */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

/* Snap scroll for cards */
.snap-x { scroll-snap-type: x mandatory; }
.snap-start { scroll-snap-align: start; }
```

### Tipografía recomendada

Tu app ya carga **Fredoka** (para Perezoso) y **Playfair Display** (para Mare). Ambas son excelentes elecciones para el estilo Coffeinopia:

- **Fredoka** → Perfecta para Perezoso (rounded, friendly, modern)
- **Playfair Display** → Perfecta para Mare (editorial, premium)

Recomendación adicional: añadir **DM Sans** como body font para UI elements (labels, descriptions, buttons). Es más legible que Geist para tamaños pequeños y tiene personalidad.

```tsx
// layout.tsx
import { DM_Sans } from "next/font/google";
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
```

---

## PARTE 3: RESUMEN DE PRIORIDADES

### 🔴 Arreglar HOY (bugs funcionales)
1. Fix `verify_shop_pin`: cambiar `config->>'code'` → `code` 
2. Fix `redeem_reward`: cambiar `shops.id` → `shops.code` con `profiles.client_code`
3. Fix polling hardcoded `7` → `config.rules.stampsPerReward`
4. Eliminar PIN visible en admin settings UI

### 🟡 Aplicar esta semana (estética Coffeinopia)
1. Reemplazar `ClientHeader` por header compacto dark
2. Reemplazar `StampProgress` por grid de stamp circles  
3. Reemplazar `QRFloatingButton` por `BottomNavBar`
4. Hacer `NewsFeed` horizontal scroll
5. Hacer `QRModal` bottom sheet
6. Hacer `RewardsCard` barra inferior fija

### 🟢 Siguiente sprint
1. Forgot password flow
2. Input validation (email, password strength)
3. Paginación en admin
4. Eliminar `config-loader.ts` (código muerto)
5. Migrar `menu-data.ts` a DB
