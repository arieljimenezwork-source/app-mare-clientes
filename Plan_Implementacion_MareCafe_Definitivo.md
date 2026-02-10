# 🚀 Plan de Implementación Definitivo — Mare Cafe
## Paso a Paso Basado en Prioridades Reales del Negocio

**Fecha:** 9 de Febrero, 2026  
**Versión:** 1.0 — Plan Confirmado  
**Stack:** Next.js 16.1 · React 19 · Supabase · Resend · Vercel  

---

## TUS DECISIONES RESUMIDAS

Antes de arrancar, estas son las decisiones que tomaste organizadas para que queden claras:

### ✅ SÍ, IMPLEMENTAR AHORA

| Módulo | Qué incluye |
|--------|------------|
| **Catálogo de productos** | Upload de documento → auto-parse → nombre, precio, foto. Categorías dinámicas, variantes/tamaños, imágenes |
| **POS (Punto de Venta)** | 🆕 Interfaz estilo MaxiRes: seleccionar productos, tamaños, tipo de leche, cantidades → total → método de pago (MercadoPago/efectivo/tarjeta). Registro contable por mesa |
| **Analíticas** | 3 KPIs básicos + gráfico multi-rango (7d/30d/90d/12m) con comparativa + revenue tracking + cohort + exportación CSV + notificaciones push/toast |
| **Lealtad** | Stamps editables desde admin + niveles con beneficios personalizables por café + puntos (aunque no se usen aún) + referidos con QR/link + café gratis como primera recompensa |
| **Marketing** | Email campaigns + métricas (open/click/unsubscribe) + editor drag-and-drop + push notifications in-app + automatizaciones (bienvenida, reactivación 14d, cumpleaños) + historial + filtro por client_code |
| **Menú digital** | CRUD completo desde admin (foto + nombre + precio + variantes + adicionales + tipo de leche) + tags (vegano, sin gluten, nuevo, popular) + favoritos + precios dinámicos |
| **Staff** | 3 roles simples (dueño/staff/customer) + dashboard interactivo con métricas personales |
| **Seguridad** | TODAS las vulnerabilidades corregidas al 100% |
| **Compliance y estándares** | TODO al nivel más profesional posible |

### ❌ NO, DEJAR PARA DESPUÉS

Control de stock · Costos/márgenes · Mermas · Proveedores · CLV · Heatmap · Funnel · Streak bonuses · Happy Hour dinámico · Gift cards · A/B testing · Manager role · Turnos · Audit trail · Multi-sucursal · Permisos granulares · Pedidos online

---

## EXPLICACIONES QUE PEDISTE

### ¿Qué es `stampsPerReward` editable desde admin UI?

Hoy el número de sellos necesarios para ganar un café gratis (7) está fijo en la configuración. "Editable desde admin UI" significa que la dueña de Mare Cafe pueda, desde su panel de administración, cambiar ese número sin tocar código. Por ejemplo:

- Quiere que ahora sean **5 sellos** en vez de 7 → lo cambia desde un campo numérico en la sección "Ajustes" del panel admin → se guarda en la base de datos → automáticamente todos los clientes necesitan 5 sellos.
- En diciembre quiere hacer promo de "3 sellos = café gratis" → lo cambia → vuelve a 7 en enero.

**Implementación:** Un input numérico en la tab "Ajustes" del MareDashboard que actualiza `shops.config.rules.stampsPerReward` en Supabase.

### ¿Qué es "Categorías dinámicas"?

Hoy las categorías del menú están fijas en el código: `Comidas`, `Bebidas`, `Promociones`. "Dinámicas" significa que la dueña puede crear, editar, renombrar o eliminar categorías desde el panel admin. Por ejemplo:

- Agregar "Pastelería" como nueva categoría
- Renombrar "Comidas" a "Salado"
- Agregar "De Temporada" solo en invierno y eliminarla en verano
- Reordenar las categorías arrastrándolas

### ¿Qué es GDPR/opt-out?

Es la capacidad de que un cliente diga "no quiero recibir más emails de marketing". Cuando se registra, acepta recibir comunicaciones (opt-in). Si después no quiere más, cada email tiene un link de "Dejar de recibir emails" (opt-out/unsubscribe). Es obligatorio por ley en Argentina (Ley 25.326 de Protección de Datos) y en Europa (GDPR). Si no lo tienen, técnicamente están enviando spam y pueden recibir multas. **Recomiendo implementarlo sí o sí** — es un link al pie de cada email que cambia un campo `email_opt_in: false` en el perfil del cliente.

---

## ARQUITECTURA DE DATOS — ESQUEMA NUEVO

Antes de codificar nada, necesitamos ampliar la base de datos. Este es el mapa completo de tablas nuevas y modificaciones:

### Tablas Nuevas

```
┌─────────────────────────────────────────────────────┐
│                    CATÁLOGO                          │
├─────────────────────────────────────────────────────┤
│ product_categories                                   │
│   id · shop_code · name · sort_order · is_active     │
│                                                      │
│ products                                             │
│   id · shop_code · category_id · name · description  │
│   base_price · image_url · tags[] · is_active        │
│   sort_order · created_at                            │
│                                                      │
│ product_variants                                     │
│   id · product_id · name (ej: "Grande")              │
│   price_modifier (ej: +50) · is_default              │
│                                                      │
│ product_addons                                       │
│   id · shop_code · name (ej: "Leche de Almendras")  │
│   price · addon_group (ej: "tipo_leche")             │
│   is_active                                          │
├─────────────────────────────────────────────────────┤
│                   POS / VENTAS                       │
├─────────────────────────────────────────────────────┤
│ orders                                               │
│   id · shop_code · staff_id · table_number           │
│   subtotal · total · payment_method · status         │
│   notes · created_at                                 │
│                                                      │
│ order_items                                          │
│   id · order_id · product_id · variant_id            │
│   quantity · unit_price · addons[] · line_total       │
│                                                      │
│ daily_closings                                       │
│   id · shop_code · date · total_cash                 │
│   total_card · total_mercadopago · total_general     │
│   order_count · created_by                           │
├─────────────────────────────────────────────────────┤
│                    LEALTAD                            │
├─────────────────────────────────────────────────────┤
│ referral_codes                                       │
│   id · user_id · code · uses_count · created_at      │
│                                                      │
│ referral_logs                                        │
│   id · referrer_id · referred_id · points_awarded    │
│   created_at                                         │
│                                                      │
│ points_ledger                                        │
│   id · user_id · shop_code · amount · type           │
│   description · created_at                           │
├─────────────────────────────────────────────────────┤
│                   MARKETING                          │
├─────────────────────────────────────────────────────┤
│ notification_queue                                   │
│   id · shop_code · user_id · type (email/push)       │
│   title · body · image_url · status · sent_at        │
│                                                      │
│ automation_rules                                     │
│   id · shop_code · trigger_type                      │
│   (welcome/reactivation_14d/birthday)                │
│   template_id · is_active                            │
├─────────────────────────────────────────────────────┤
│                  FAVORITOS                            │
├─────────────────────────────────────────────────────┤
│ favorites                                            │
│   user_id · product_id · created_at                  │
└─────────────────────────────────────────────────────┘
```

### Modificaciones a Tablas Existentes

```
profiles → agregar:
  + birth_date date
  + email_opt_in boolean default true
  + points int default 0
  + referred_by uuid references profiles(id)

campaigns → agregar:
  + shop_code text references shops(code)
  + sent_count int default 0
  + open_count int default 0
  + click_count int default 0

transaction_logs → agregar:
  + metadata jsonb default '{}'

shops.config → agregar keys:
  + rules.stampsPerReward (ya existe, hacerlo editable)
  + rules.levelBenefits: { "2": "10% OFF", "3": "Café doble gratis" }
```

---

## PLAN PASO A PASO — 6 SPRINTS

### 🔴 SPRINT 1: Seguridad + Base de Datos (Días 1-4)
> Sin esto, todo lo demás está construido sobre arena.

**Día 1-2: Fixes de seguridad críticos**

| # | Tarea | Archivo(s) | Qué hacer exactamente |
|---|-------|-----------|----------------------|
| 1.1 | Filtrar campañas por `client_code` | `src/app/actions/marketing.ts` | En la query de `profiles.select('email')`, agregar `.eq('client_code', 'mare_cafe')` o pasar `client_code` como parámetro del formData. Sin esto, un admin puede enviar emails a clientes de OTROS cafés. |
| 1.2 | Agregar `shop_code` a tabla `campaigns` | Nueva migración SQL | `ALTER TABLE campaigns ADD COLUMN shop_code text REFERENCES shops(code);` + actualizar RLS: `using (shop_code = (select client_code from profiles where id = auth.uid()))` |
| 1.3 | Validar `client_code` cruzado en `add_stamp` | Migración SQL (función RPC) | Dentro de la función, verificar que el `client_code` del staff y del cliente target sean iguales. Si no, retornar error. |
| 1.4 | Eliminar PIN visible en admin UI | `MareDashboard.tsx` | Eliminar cualquier renderizado de PIN. Crear un botón "Cambiar PIN" que abre modal con campo `PIN actual` + `PIN nuevo` → valida con `verify_shop_pin` → actualiza hash con `crypt()`. |
| 1.5 | Firmar QR con HMAC | Nuevo util + migración | Server-side: generar payload QR firmado. En `add_stamp`: verificar firma antes de procesar. Previene QR falsificados. |
| 1.6 | Rate limiting en login | Supabase config + middleware | Configurar Supabase Auth rate limit (ya built-in). Agregar Vercel Edge Middleware para throttle por IP: max 5 intentos por minuto. |
| 1.7 | Opt-out de marketing | Migración SQL + email template | Agregar `email_opt_in boolean default true` a `profiles`. En cada email de Resend, agregar footer con link `/unsubscribe?token=...` que cambia el campo a `false`. En `sendCampaign`, filtrar `.eq('email_opt_in', true)`. |

**Día 3-4: Migraciones de base de datos**

| # | Tarea | Qué hacer |
|---|-------|----------|
| 1.8 | Crear migración consolidada | Un solo archivo SQL con TODAS las tablas nuevas (products, product_categories, product_variants, product_addons, orders, order_items, daily_closings, referral_codes, referral_logs, points_ledger, notification_queue, automation_rules, favorites) + modificaciones a tablas existentes. |
| 1.9 | Generar tipos TypeScript | Correr `supabase gen types typescript --project-id=... > src/types/database.types.ts`. Usar estos tipos en TODAS las queries nuevas. |
| 1.10 | Paralelizar queries del dashboard | En `MareDashboard.tsx`, cambiar las 3 llamadas secuenciales a `await Promise.all([fetchMetrics(config), fetchCampaigns(), fetchChartData(config)])`. Mejora ~60% tiempo de carga. |
| 1.11 | Paginación en ClientsTab | Cambiar query a `.range(offset, offset + 24)`. Agregar botones "Anterior/Siguiente" o infinite scroll. |

**Entregable Sprint 1:** App segura, base de datos lista para todos los módulos nuevos, dashboard más rápido.

---

### 🟠 SPRINT 2: Catálogo de Productos + Menú CRUD (Días 5-12)
> El menú es la base del POS. Sin productos en la DB, el POS no puede funcionar.

**Día 5-7: Backend del catálogo**

| # | Tarea | Detalle |
|---|-------|--------|
| 2.1 | **Parser de documentos** | Crear un Server Action (`src/app/actions/catalog.ts`) que reciba un archivo (PDF, Excel, CSV, TXT, DOCX). Usar librerías: `pdf-parse` para PDF, `xlsx` para Excel, `papaparse` para CSV. Extraer líneas con patrón `nombre — precio`. Retornar array de `{ name, price, category? }` para review antes de insertar. |
| 2.2 | **Upload de imágenes** | Configurar bucket `product-images` en Supabase Storage. Crear helper `uploadProductImage(file)` que sube, genera URL pública, y retorna la URL para guardar en `products.image_url`. |
| 2.3 | **CRUD de categorías** | API functions: `createCategory`, `updateCategory`, `deleteCategory`, `reorderCategories`. Cada categoría tiene `shop_code`, `name`, `sort_order`, `is_active`. |
| 2.4 | **CRUD de productos** | API functions: `createProduct`, `updateProduct`, `deleteProduct`. Incluye relación con categoría, variantes y addons. |
| 2.5 | **CRUD de variantes y addons** | Variantes: "Chico/Mediano/Grande" con `price_modifier` (ej: +0, +50, +100). Addons: "Leche de almendras" (+80), agrupados por `addon_group` (ej: "tipo_leche", "extras"). |

**Día 8-10: UI del catálogo en admin**

| # | Tarea | Detalle |
|---|-------|--------|
| 2.6 | **Tab "Productos" en MareDashboard** | Nueva tab en el sidebar. Vista principal: grid de productos con foto thumbnail, nombre, precio, categoría, tags. Buscador + filtro por categoría. |
| 2.7 | **Modal "Agregar/Editar Producto"** | Formulario: foto (drag-and-drop), nombre, descripción, precio base, categoría (dropdown), tags (checkboxes: vegano, sin gluten, nuevo, popular), variantes (agregar/quitar filas), addons disponibles (checkboxes). |
| 2.8 | **Import masivo** | Botón "Importar desde archivo". Sube el documento → el parser extrae productos → muestra tabla de preview con checkboxes → el admin revisa, corrige nombres/precios, y confirma. Se insertan todos de golpe. |
| 2.9 | **Gestión de categorías** | Sección dentro de la tab con lista de categorías, botón "+", editar nombre, drag-and-drop para reordenar, toggle activa/inactiva. |

**Día 11-12: Menú del cliente actualizado**

| # | Tarea | Detalle |
|---|-------|--------|
| 2.10 | **Menú desde DB** | Modificar `src/app/client/menu/page.tsx` para que lea de tabla `products` filtrada por `shop_code = 'mare_cafe'` y `is_active = true`, en vez de `menu-data.ts`. |
| 2.11 | **Tags visuales** | Badges en cada producto: 🌱 Vegano, 🚫 Sin Gluten, ⭐ Nuevo, 🔥 Popular. |
| 2.12 | **Favoritos** | Botón corazón en cada producto. Guarda en tabla `favorites`. Sección "Mis Favoritos" en el perfil del cliente. |
| 2.13 | **Variantes en detalle** | Al tocar un producto, el modal muestra: selector de tamaño (Chico/Mediano/Grande con precio), selector de tipo de leche, otros addons. Precio se actualiza en tiempo real. |

**Entregable Sprint 2:** Catálogo completo de productos gestionable desde admin, menú del cliente conectado a DB, import masivo funcionando.

---

### 🟡 SPRINT 3: POS — Punto de Venta (Días 13-22)
> Esta es la feature más grande y más importante que pediste. Le damos 10 días completos.

**Día 13-15: Arquitectura del POS**

| # | Tarea | Detalle |
|---|-------|--------|
| 3.1 | **Nueva ruta `/admin/pos`** | Página dedicada full-screen para el POS. Se accede desde el sidebar del admin o desde un botón directo. Optimizada para tablet/desktop. |
| 3.2 | **Modelo de datos de órdenes** | Tabla `orders` con: `shop_code`, `staff_id` (quién registra), `table_number` (opcional), `subtotal`, `total`, `payment_method` (enum: `cash`, `card`, `mercadopago`), `status` (enum: `open`, `closed`, `cancelled`), `notes`, `created_at`. |
| 3.3 | **Modelo de items de orden** | Tabla `order_items` con: `order_id`, `product_id`, `variant_id`, `quantity`, `unit_price`, `addons` (jsonb con array de addons seleccionados y sus precios), `line_total`. |

**Día 16-19: UI del POS**

La interfaz del POS tiene 3 columnas (o 2 en mobile):

```
┌──────────────────────────────────────────────────────────────┐
│  MARE CAFE — Punto de Venta                    Mesa: [  3 ] │
├──────────────────┬──────────────────┬────────────────────────┤
│  CATEGORÍAS      │  PRODUCTOS       │  ORDEN ACTUAL          │
│                  │                  │                        │
│  ☕ Bebidas      │  Latte    $2500  │  1× Latte Grande      │
│  🥐 Pastelería  │  Cappucc. $2200  │     + Leche almendras  │
│  🥗 Salado      │  Espresso $1800  │                $3080   │
│  🎁 Promos      │  Matcha   $3000  │  2× Medialuna         │
│                  │  ...             │                $1600   │
│                  │                  │  ─────────────────     │
│                  │                  │  Subtotal:     $4680   │
│                  │                  │                        │
│                  │                  │  [Efectivo]            │
│                  │                  │  [Tarjeta]             │
│                  │                  │  [MercadoPago]         │
│                  │                  │                        │
│                  │                  │  [ COBRAR → $4680 ]    │
└──────────────────┴──────────────────┴────────────────────────┘
```

| # | Tarea | Detalle |
|---|-------|--------|
| 3.4 | **Columna 1: Categorías** | Lista vertical de categorías desde DB. Al tocar una, filtra la columna 2. Icono + nombre. |
| 3.5 | **Columna 2: Grid de productos** | Cards con imagen, nombre, precio base. Al tocar uno, se abre un mini-modal inline con: selector de variante (tamaño), checkboxes de addons (tipo de leche, extras), selector de cantidad (+/-), botón "Agregar a orden". |
| 3.6 | **Columna 3: Orden actual** | Lista de items agregados con: nombre, variante, addons, cantidad (editable), precio por línea. Botón ❌ para quitar item. Subtotal auto-calculado. |
| 3.7 | **Selector de mesa** | Input numérico o dropdown en el header. Opcional (puede quedar vacío para "para llevar"). |
| 3.8 | **Selector de método de pago** | 3 botones: Efectivo, Tarjeta, MercadoPago. Se puede seleccionar uno o split (avanzado, después). El seleccionado se resalta. |
| 3.9 | **Botón "Cobrar"** | Muestra modal de confirmación con resumen: items, total, método de pago. Al confirmar: inserta `order` + `order_items` en DB, limpia la pantalla, muestra toast "✅ Venta registrada — $4680". |

**Día 20-22: Revenue tracking + Cierre de caja**

| # | Tarea | Detalle |
|---|-------|--------|
| 3.10 | **Métricas de ventas en Overview** | Nuevos KPIs en el dashboard: "Ventas Hoy" (suma de orders del día), "Ticket Promedio" (total / count), "Revenue Mensual" (suma del mes). |
| 3.11 | **Historial de ventas** | Nueva sub-tab o sección dentro de "Actividad": lista de órdenes del día con hora, mesa, total, método de pago. Filtrable por fecha. |
| 3.12 | **Cierre de caja** | Botón "Cerrar Caja del Día" que calcula totales por método de pago (efectivo: $X, tarjeta: $Y, MP: $Z, total: $T), genera registro en `daily_closings`, muestra resumen imprimible. |
| 3.13 | **Exportar ventas** | Botón para descargar CSV/Excel con todas las órdenes de un rango de fechas. Columnas: fecha, hora, mesa, productos, total, método de pago. |

**Entregable Sprint 3:** POS completo y funcional. La dueña de Mare Cafe puede registrar ventas desde tablet/desktop, ver revenue en tiempo real, y cerrar caja al final del día.

---

### 🟢 SPRINT 4: Lealtad + Referidos + Puntos (Días 23-30)

**Día 23-25: stampsPerReward editable + Niveles personalizables**

| # | Tarea | Detalle |
|---|-------|--------|
| 4.1 | **Editar stampsPerReward desde admin** | En la tab "Ajustes" del MareDashboard, agregar input numérico "Sellos para recompensa" con botón guardar. Actualiza `shops.config.rules.stampsPerReward` en DB. El cambio aplica inmediatamente para todos los clientes. |
| 4.2 | **Beneficios por nivel editables** | En "Ajustes", sección "Niveles de Lealtad". Tabla editable: Nivel 2 → campo de texto libre (ej: "10% de descuento"), Nivel 3 → campo de texto libre (ej: "Café doble gratis"). Se guarda en `shops.config.rules.levelBenefits` como JSON. El staff ve estos beneficios cuando escanea a un cliente de ese nivel. |
| 4.3 | **Mostrar beneficio al cliente** | En `MareClient.tsx`, debajo del progreso de stamps, mostrar: "Nivel 2: 10% de descuento en tu próxima compra" (leyendo de la config del shop). |

**Día 26-28: Sistema de puntos + Referidos**

| # | Tarea | Detalle |
|---|-------|--------|
| 4.4 | **Points ledger** | Cada vez que un cliente gana un sello, también gana 10 puntos. Se registra en `points_ledger` con tipo `stamp_earned`. Se suma al campo `profiles.points`. Por ahora es acumulativo sin canje — la base está lista para cuando quieran usarlos. |
| 4.5 | **Generar código de referido** | Cada cliente tiene un código único (ej: `MARE-A7X3`). Se genera automáticamente al registrarse. Se guarda en `referral_codes`. |
| 4.6 | **QR y link de referido** | En el perfil del cliente, botón "Invitar Amigos" que muestra: QR con URL `https://app.marecafe.com/auth/login?role=customer&ref=MARE-A7X3` + botón "Copiar Link" + botón "Compartir" (Web Share API). |
| 4.7 | **Tracking de referidos** | En el flujo de registro (`login/page.tsx`), si hay `?ref=CODIGO` en la URL: guardar en `profiles.referred_by` (el UUID del referente). Crear entrada en `referral_logs`. Sumar +50 puntos al referente. Notificar al referente: "¡Tu amigo se unió a Mare Cafe! +50 puntos". |
| 4.8 | **Puntos visibles** | En `MareClient.tsx`, mostrar total de puntos del cliente. Formato sutil: "127 pts" al lado del nivel. |

**Día 29-30: Mejoras al dashboard de lealtad**

| # | Tarea | Detalle |
|---|-------|--------|
| 4.9 | **Cohort de retención** | En el dashboard admin (tab Overview o nueva sub-sección), gráfico de retención: "De los clientes que se registraron en enero, ¿cuántos volvieron en febrero?". Query: agrupar `profiles.created_at` por mes, cruzar con `transaction_logs` del mes siguiente. |
| 4.10 | **Métricas de referidos** | Card en dashboard: "X referidos este mes", "Top referidores" (los 3 clientes que más invitaron). |

**Entregable Sprint 4:** Programa de lealtad completo con stamps editables, niveles con beneficios, puntos acumulables, y sistema de referidos funcional.

---

### 🔵 SPRINT 5: Marketing Profesional (Días 31-40)

**Día 31-33: Editor de campañas mejorado**

| # | Tarea | Detalle |
|---|-------|--------|
| 5.1 | **Integrar editor drag-and-drop** | Instalar `react-email-editor` (basado en Unlayer). Reemplazar el EmailEditor actual. Permite arrastrar bloques: texto, imagen, botón, divisor, columnas. Preview desktop/mobile. Exporta HTML listo para enviar. |
| 5.2 | **Templates prediseñados** | Crear 3-4 templates base dentro del editor: "Promoción General", "Nuevo Producto", "Evento Especial", "Reactivación". La dueña elige uno, lo personaliza, y envía. |
| 5.3 | **Métricas de campañas** | Configurar Resend Webhooks para capturar eventos: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`. Endpoint: `src/app/api/webhooks/resend/route.ts`. Actualiza `campaigns.open_count`, `click_count`, etc. Mostrar en historial: "Enviados: 120, Abiertos: 45 (37.5%), Clicks: 12 (10%)". |

**Día 34-36: Push notifications in-app**

| # | Tarea | Detalle |
|---|-------|--------|
| 5.4 | **Service Worker para PWA** | Configurar `next-pwa` (ya tienen `@ducanh2912/next-pwa` en dependencias). Crear Service Worker que cachea assets y maneja push. |
| 5.5 | **Web Push subscription** | Al instalar la PWA, pedir permiso de notificaciones. Guardar subscription endpoint en nueva tabla `push_subscriptions` (user_id, endpoint, keys). |
| 5.6 | **Enviar push desde admin** | En la sección de Marketing, opción "Enviar Notificación Push" además de email. Usa `web-push` library server-side. El cliente recibe notificación con título, mensaje e imagen incluso con la app cerrada. |
| 5.7 | **Notificaciones in-app** | Componente `NotificationBell` en el header del cliente. Badge con número de notificaciones no leídas. Al tocar, dropdown con lista de notificaciones (campañas, nivel subido, referido exitoso). Lee de tabla `notification_queue`. |

**Día 37-40: Automatizaciones**

| # | Tarea | Detalle |
|---|-------|--------|
| 5.8 | **Motor de automatizaciones** | Tabla `automation_rules` con tipos: `welcome`, `reactivation_14d`, `birthday`. Cada regla tiene: trigger, template de email/push, estado activo/inactivo. |
| 5.9 | **Trigger: Bienvenida** | Cuando se crea un nuevo `profile` con `client_code = 'mare_cafe'`, automáticamente se encola un email/push de bienvenida con los datos del shop. Implementar con Supabase Database Webhook o trigger SQL + Edge Function. |
| 5.10 | **Trigger: Reactivación 14 días** | Cron job diario (Supabase `pg_cron` o Vercel Cron): buscar clientes cuyo último `transaction_log` tiene >14 días. Enviar email/push: "¡Te extrañamos! Tu próximo café tiene sorpresa". |
| 5.11 | **Trigger: Cumpleaños** | Cron job diario: buscar clientes cuyo `birth_date` es hoy (o mañana). Enviar email/push: "¡Feliz cumpleaños! Tenemos un regalo para vos". Requiere que el campo `birth_date` esté en el perfil. Agregar campo en el registro o en el perfil del cliente. |
| 5.12 | **UI de automatizaciones** | En la tab Marketing del admin, sección "Automatizaciones" con toggle por cada trigger: Bienvenida ✅, Reactivación 14d ✅, Cumpleaños ✅. Preview del mensaje de cada una. |

**Entregable Sprint 5:** Marketing profesional con editor visual, métricas de campañas, push notifications, y automatizaciones funcionando.

---

### 🟣 SPRINT 6: Polish + Estándares + Performance (Días 41-50)

**Día 41-43: Accesibilidad y compliance**

| # | Tarea | Detalle |
|---|-------|--------|
| 6.1 | **WCAG 2.1 AA** | Audit completo con axe-core. Agregar `aria-label` a todos los botones icon-only. Verificar contraste en tema oscuro del sidebar. Focus management en modales. Tab navigation funcional. |
| 6.2 | **Política de privacidad** | Crear página `/privacy-policy` con: datos que recopilan, cómo los usan, derechos del usuario (acceso, rectificación, eliminación). Link en footer y en registro. |
| 6.3 | **Términos de servicio** | Crear `/terms`. Checkbox obligatorio en registro: "Acepto los Términos de Servicio y la Política de Privacidad". |
| 6.4 | **Derecho al olvido** | En el perfil del cliente, botón "Eliminar mi cuenta". Borra perfil, stamps, logs, favorites, push subscriptions. Soft-delete con 30 días de gracia. |

**Día 44-46: Performance**

| # | Tarea | Detalle |
|---|-------|--------|
| 6.5 | **Migrar assets a Supabase Storage** | Mover todas las imágenes de `/public/assets/mare/` a bucket de Supabase Storage. Actualizar URLs. Usar `next/image` con loader de Supabase para optimización automática (WebP, resize). |
| 6.6 | **Eliminar override en shop-service** | Quitar el `if (code === 'mare_cafe') return mareCafeConfig`. Migrar todas las features de `mare_cafe.ts` al seed de DB. La DB es la single source of truth. |
| 6.7 | **Error tracking con Sentry** | Instalar `@sentry/nextjs`. Configurar con DSN. Source maps en producción. Alertas a Slack/email cuando hay errores. |
| 6.8 | **Refactorizar MareDashboard** | Dividir el archivo de 750+ líneas en componentes: `MareOverviewTab.tsx`, `MareMarketingTab.tsx`, `MareSettingsTab.tsx`, `MarePOSTab.tsx`. Crear hooks: `useMetrics.ts`, `useCampaigns.ts`, `useOrders.ts`. |
| 6.9 | **PWA offline** | Service Worker cachea: shell de la app, menú, última data de stamps. Modo offline muestra QR del cliente + menú cached + mensaje "Sin conexión". |

**Día 47-50: Testing y hardening**

| # | Tarea | Detalle |
|---|-------|--------|
| 6.10 | **Tests unitarios** | Jest + React Testing Library. Tests para: funciones RPC (add_stamp, redeem_reward, verify_shop_pin), parser de documentos, cálculos del POS (totales, addons). Mínimo 15 tests. |
| 6.11 | **Tests E2E** | Playwright. 6 flujos críticos: (1) Registro cliente, (2) Login admin, (3) Escaneo QR → sello, (4) Canje de recompensa, (5) Crear orden en POS, (6) Enviar campaña email. |
| 6.12 | **Logging estructurado** | Reemplazar `console.log/error` con Pino. Niveles: info, warn, error. Contexto: user_id, shop_code, action. Output JSON para parseo en Vercel logs. |
| 6.13 | **Core Web Vitals** | Medir con Lighthouse CI. Targets: LCP < 2.5s, FID < 100ms, CLS < 0.1. Optimizar imágenes, fonts, bundle size. |

**Entregable Sprint 6:** App a nivel profesional con compliance legal, accesibilidad, tests, monitoring, y performance optimizado.

---

## CALENDARIO VISUAL

```
Semana 1  ████████ Sprint 1: Seguridad + DB
Semana 2  ████████ Sprint 2: Catálogo + Menú CRUD  
Semana 3  ████████ Sprint 3: POS (Parte 1)
Semana 4  ████████ Sprint 3: POS (Parte 2) + Revenue
Semana 5  ████████ Sprint 4: Lealtad + Referidos
Semana 6  ████████ Sprint 5: Marketing (Parte 1)
Semana 7  ████████ Sprint 5: Marketing (Parte 2)
Semana 8  ████████ Sprint 6: Polish + Testing
```

**Total estimado:** 8 semanas de trabajo (~50 días hábiles)

---

## DEPENDENCIAS ENTRE SPRINTS

```
Sprint 1 (Seguridad + DB) ─────┐
                                ├── Sprint 2 (Catálogo) ──── Sprint 3 (POS)
                                │                                   │
                                ├── Sprint 4 (Lealtad) ─────────────┤
                                │                                   │
                                └── Sprint 5 (Marketing) ───────────┤
                                                                    │
                                                        Sprint 6 (Polish)
```

Sprint 1 es prerequisito de todo. Sprint 2 es prerequisito del POS (porque el POS necesita productos en la DB). Sprints 4 y 5 pueden ir en paralelo si hay 2 personas trabajando. Sprint 6 va al final como cierre.

---

## PAQUETES NPM NUEVOS A INSTALAR

| Paquete | Para qué | Sprint |
|---------|----------|--------|
| `react-email-editor` | Editor drag-and-drop de campañas de email | 5 |
| `web-push` | Push notifications server-side | 5 |
| `papaparse` | Parsear CSV para import masivo de productos | 2 |
| `xlsx` | Parsear Excel para import masivo | 2 |
| `pdf-parse` | Parsear PDF para import masivo | 2 |
| `@sentry/nextjs` | Error tracking | 6 |
| `pino` | Logging estructurado | 6 |
| `@playwright/test` | Tests E2E | 6 |
| `sharp` | Resize de imágenes (ya viene con Next.js) | 2 |

---

## PRÓXIMO PASO INMEDIATO

**¿Por dónde empezamos?** Recomiendo empezar ahora mismo con el Sprint 1 (Seguridad + DB) porque:

1. Son fixes que protegen los datos de tus clientes actuales
2. Las migraciones de base de datos son prerequisito de TODO lo demás
3. Son tareas rápidas (2-4 días) que desbloquean las semanas siguientes

Si estás listo, puedo generar el archivo SQL de migración consolidada con todas las tablas nuevas y empezar a codificar los fixes de seguridad.
