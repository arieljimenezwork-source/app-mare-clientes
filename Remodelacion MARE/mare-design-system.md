# Mare Café — Sistema de Diseño Premium

## Propuesta de Dirección de Arte & Interfaz Digital

---

## 1. Concepto Visual

### Moodboard Descriptivo

La identidad de **Mare Café** vive en la intersección entre la **pastelería artesanal europea** y la **costa atlántica argentina**. El flyer revela un universo visual claro: ilustración editorial a una sola tinta, tipografía bold con personalidad manual, y una paleta binaria azul profundo/crema que evoca cerámica portuguesa, manteles de lino y la bruma marina de Mar del Plata.

### Palabras Clave de Estilo

| Eje | Descriptor |
|---|---|
| Atmósfera | Calma costera, mañana de domingo, brisa salada |
| Estética | Neo-editorial, post-minimal, artesanal-digital |
| Materialidad | Cerámica esmaltada, lino crudo, papel verjurado |
| Tecnología | Invisible — la sofisticación está en lo que *no* se ve |
| Referentes | Kinfolk Magazine, Cereal Magazine, Aesop Stores, Blue Bottle Coffee App |

### Principio Rector

> *"El lujo silencioso aplicado al café: nada sobra, nada falta."*

La app debe sentirse como hojear una revista de gastronomía independiente, no como usar un delivery genérico. Cada pantalla es una composición editorial donde el contenido respira.

---

## 2. Paleta de Colores

### Colores Primarios (Derivados del Flyer)

| Rol | Nombre | Hex | Uso |
|---|---|---|---|
| **Primary** | Royal Deep Blue | `#1A3278` | Encabezados, navegación activa, CTA primario, iconografía |
| **Surface** | Parchment Cream | `#F2EDE3` | Fondo principal, áreas de contenido, cards |
| **Canvas** | Warm White | `#FAF8F4` | Fondo base de la app, áreas de respiración |

### Colores Secundarios & Acentos

| Rol | Nombre | Hex | Uso |
|---|---|---|---|
| **Accent Warm** | Espresso Gold | `#C8A96E` | Badges premium, recompensas, estados "gold" |
| **Accent Soft** | Mare Blue Light | `#4A6BB5` | Estados hover, links, elementos interactivos secundarios |
| **Neutral Dark** | Ink | `#2A2A2E` | Texto body principal |
| **Neutral Mid** | Stone | `#8C8B88` | Texto secundario, placeholders, metadata |
| **Neutral Light** | Mist | `#E5E1D9` | Bordes sutiles, separadores, líneas de card |
| **Semantic Success** | Sage | `#5B8C6A` | Confirmaciones, estados completados |
| **Semantic Error** | Terracotta | `#C0574A` | Errores, alertas (nunca rojo puro) |

### Gradientes

```css
/* Hero / Header gradient — simula la profundidad del mar */
--gradient-ocean: linear-gradient(175deg, #1A3278 0%, #243D8A 45%, #2E4F9E 100%);

/* Glassmorphism surface — para modales y overlays */
--glass-cream: rgba(242, 237, 227, 0.72);
--glass-blur: blur(24px) saturate(1.4);

/* Gold reward shimmer — para momentos "wow" */
--gradient-gold: linear-gradient(135deg, #C8A96E 0%, #E8D5A0 50%, #C8A96E 100%);
```

### Psicología del Color

El azul royal (`#1A3278`) no es un azul corporativo frío — es un **azul mediterráneo profundo** que transmite confianza, tradición y serenidad. Combinado con el crema (`#F2EDE3`), genera un contraste de alto impacto sin agresividad, similar a la cerámica Delft o los azulejos de las cafeterías clásicas portuarias. El dorado (`#C8A96E`) aparece solo en momentos de *recompensa*, creando un sistema de refuerzo positivo visual.

---

## 3. Tipografía

### Pares Tipográficos

#### Display & Headlines: **DM Serif Display**
- *Por qué:* Serif editorial con curvas generosas que evocan la calidez de la pastelería artesanal. Compatible con la tipografía condensada bold del flyer pero más refinada para pantalla.
- Alternativa: **Playfair Display** (ya configurado en el codebase como `--font-playfair`) o **Lora**.
- Uso: Títulos principales, nombre del café, encabezados de sección.
- Weight: `400` (regular) y `700` (bold).

#### Body & UI: **Plus Jakarta Sans**
- *Por qué:* Geométrica humanista con terminaciones suaves. Altamente legible en tamaños pequeños, moderna sin ser fría. Evita la genericidad de Inter/Roboto.
- Alternativa: **Outfit** o **General Sans**.
- Uso: Texto body, labels, botones, navegación, metadata.
- Weights: `400`, `500`, `600`, `700`.

#### Monospace (precios/datos): **JetBrains Mono**
- Uso exclusivo: Precios, códigos de pedido, números de mesa.
- Weight: `500`.

### Escala Tipográfica

```
--text-display:    clamp(2rem, 5vw, 3.5rem)   / 1.05  → Títulos hero
--text-h1:         clamp(1.5rem, 3.5vw, 2rem)  / 1.15  → Secciones principales
--text-h2:         1.25rem                       / 1.3   → Subtítulos
--text-body:       0.9375rem (15px)              / 1.6   → Contenido general
--text-caption:    0.8125rem (13px)              / 1.5   → Labels, metadata
--text-micro:      0.6875rem (11px)              / 1.4   → Badges, timestamps
```

### Tracking & Estilo

- Los headlines en serif usan `letter-spacing: -0.02em` (tracking tight para elegancia editorial).
- Los labels de navegación en mayúsculas usan `letter-spacing: 0.08em` (tracking abierto para legibilidad).
- Nunca usar ALL CAPS en más de 2 palabras consecutivas excepto en navegación.

---

## 4. Componentes UI

### 4.1 Navegación Inferior (Tab Bar)

**Estilo:** Barra minimalista con fondo `glass-cream` (backdrop-blur), sin bordes superiores. Los íconos son line-art personalizados (estilo ilustración del flyer — trazo 1.5px). El ítem activo se indica con el ícono en `fill` azul + un punto (`•`) debajo, sin backgrounds ruidosos.

```
┌──────────────────────────────────────────────┐
│   ☕ Inicio    📖 Menú    ♥ Lealtad    👤 Mi  │
│                  •                            │
└──────────────────────────────────────────────┘
```

- 4 tabs máximo para mantener claridad.
- Transición de ícono: `outline → filled` con ease de 200ms.
- Label: Plus Jakarta Sans 11px, `letter-spacing: 0.06em`, uppercase.

### 4.2 Tarjetas de Producto (Product Cards)

**Estilo:** Esquinas redondeadas suaves (`border-radius: 16px`), sin sombra visible — en su lugar, un borde `1px solid #E5E1D9` que se intensifica al `:hover` → `1px solid #1A3278`. La imagen del producto ocupa el 60% superior de la card con `object-fit: cover` y esquinas top redondeadas.

```
┌─────────────────────┐
│                     │
│    [Imagen café]    │   ← aspect-ratio: 4/3
│                     │
├─────────────────────┤
│  Cappuccino         │   ← DM Serif Display, 16px
│  Leche texturizada  │   ← Plus Jakarta, 13px, color: Stone
│                     │
│  $2.800        [+]  │   ← JetBrains Mono + ícono CTA
└─────────────────────┘
```

- Fondo: `#FAF8F4` (Warm White).
- Hover: elevación sutil con `transform: translateY(-2px)` + border color transition.
- El botón `[+]` es un círculo de 36px, fondo `#1A3278`, ícono `+` en crema.

### 4.3 Botones

#### Primario
- Fondo: `#1A3278` → hover: `#243D8A`
- Texto: `#F2EDE3`, Plus Jakarta Sans 14px `font-weight: 600`
- Border-radius: `12px`
- Padding: `14px 28px`
- Transición: `background-color 200ms ease, transform 100ms ease`
- Active state: `transform: scale(0.97)`
- Sin sombras — el contraste cromático es suficiente.

#### Secundario / Ghost
- Fondo: `transparent`
- Borde: `1.5px solid #1A3278`
- Texto: `#1A3278`
- Hover: fondo `rgba(26, 50, 120, 0.06)`

#### Terciario / Text Button
- Sin fondo ni borde.
- Texto: `#4A6BB5` con `text-decoration: underline` offset `3px`.
- Hover: color → `#1A3278`

### 4.4 Modal de Detalle de Producto

**Estilo:** Bottom sheet que sube desde abajo con `spring animation` (leve rebote). Fondo del overlay: `rgba(26, 50, 120, 0.4)` con backdrop-blur de 8px. La sheet tiene esquinas top de `24px`, fondo `#FAF8F4`.

Estructura interna:
```
┌──────────────────────────────────────┐
│           ─── (drag handle)          │
│                                      │
│  [      Imagen grande 16:9      ]    │
│                                      │
│  Caramel Macchiato              ♥    │  ← DM Serif, 22px
│  Espresso, leche y caramelo          │  ← Plus Jakarta, 14px, Stone
│                                      │
│  ── Tamaño ──────────────────────    │
│  [ S ]  [ M ●]  [ L ]               │  ← Pill selector
│                                      │
│  ── Personalización ─────────────    │
│  Tipo de leche        Entera  ▾      │  ← Dropdown sutil
│  Crema batida         ○ Sí  ● No    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │     Agregar · $3.200         │    │  ← CTA Primario full-width
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

- El pill selector de tamaño usa: fondo `transparent` por defecto, seleccionado → fondo `#1A3278` con texto crema. Transición: 200ms ease.
- Separadores de sección: línea `0.5px` en `#E5E1D9` con label en `text-micro`, uppercase, tracking abierto.

### 4.5 Tarjeta de Fidelidad (Stamps)

**Estilo:** Card destacada con borde `1.5px solid #1A3278` y fondo con gradiente sutil:
`linear-gradient(135deg, #F2EDE3 0%, #FAF8F4 100%)`.

Los stamps vacíos son círculos con borde `dashed 1.5px #C8A96E`. Los stamps activos tienen fondo `#1A3278` con un ícono de taza en línea blanca (estilo ilustración del flyer). El stamp final (recompensa) brilla con `gradient-gold` y una micro-animación de pulso sutil.

```
┌──────────────────────────────────────┐
│  Tu Tarjeta Mare                     │  ← DM Serif, 18px
│  3 de 7 para tu café gratis          │  ← Plus Jakarta, 13px
│                                      │
│   ☕  ☕  ☕  ○  ○  ○  [★]           │
│                                      │
│  ──────────────── progreso ──────    │
│  ████████████░░░░░░░░░░  43%        │
└──────────────────────────────────────┘
```

- Progress bar: height `3px`, border-radius `2px`, color de fill `#1A3278`, track `#E5E1D9`.
- Animación de nuevo stamp: el círculo hace `scale(0 → 1.15 → 1)` con un leve `bounce`.

### 4.6 Header de Pantalla

Minimalista. Sin gradientes ni sombras agresivas.

```
┌──────────────────────────────────────┐
│  ←    Mare                     🔔    │
│        Pastelería y Café             │
└──────────────────────────────────────┘
```

- Logo text "Mare" en DM Serif Display, 22px, color `#1A3278`.
- Subtítulo en Plus Jakarta 11px, `letter-spacing: 0.05em`, color `Stone`.
- Fondo: `#FAF8F4` con border-bottom `0.5px solid #E5E1D9`.
- Sticky con backdrop-blur para transparencia al scrollear.

### 4.7 Input Fields

- Border: `1.5px solid #E5E1D9` → focus: `1.5px solid #1A3278`
- Border-radius: `12px`
- Padding: `14px 16px`
- Label: Plus Jakarta 12px, `font-weight: 500`, color `#2A2A2E`, posicionada arriba del input.
- Placeholder: color `#8C8B88`
- Focus ring: `box-shadow: 0 0 0 3px rgba(26, 50, 120, 0.1)`
- Transición: `border-color 200ms ease, box-shadow 200ms ease`

---

## 5. Principios de Interacción & Micro-animaciones

### Filosofía

Las animaciones en Mare son **funcionales y discretas**. Nunca decorativas por sí mismas. Siguen la cadencia natural de una conversación tranquila en un café.

| Interacción | Animación | Duración | Easing |
|---|---|---|---|
| Page transition | Fade-in + translateY(8px → 0) | 300ms | `ease-out` |
| Card appear | Stagger fade-in (50ms delay entre cards) | 250ms | `ease-out` |
| Button press | `scale(0.97)` | 100ms | `ease-in-out` |
| Modal open | Slide-up + spring overshoot | 400ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| Stamp earned | Scale bounce + ripple dorado | 500ms | `spring` |
| Tab switch | Crossfade content + dot slide | 200ms | `ease-in-out` |
| Pull to refresh | Custom wave animation (olas del mar) | Loop | `linear` |

### Detalle Especial: Pull-to-Refresh

En lugar del spinner genérico, se muestra una pequeña animación de olas estilizadas (3 líneas curvas azules que oscilan), alineada con el concepto "Mare" (mar). Es un detalle de marca que eleva la experiencia.

---

## 6. Iconografía

Estilo: **Line icons personalizados** inspirados en la ilustración del flyer (trazo uniforme de 1.5px, terminaciones redondeadas). Evitar sets genéricos como Feather/Lucide sin customización.

Set mínimo necesario:
- Inicio (casita estilizada tipo storefont del flyer)
- Menú (taza de café con vapor)
- Lealtad (estrella o sello circular)
- Perfil (silueta minimalista)
- Carrito (bolsa de papel)
- Corazón (favoritos)
- Campana (notificaciones)
- Flecha atrás
- Plus / Minus (para cantidades)
- Checkmark
- Ubicación (pin)
- Reloj (horarios)

---

## 7. Espaciado & Layout Grid

```
--space-xs:    4px
--space-sm:    8px
--space-md:    16px
--space-lg:    24px
--space-xl:    32px
--space-2xl:   48px
--space-3xl:   64px

Grid: 4-column en mobile, 20px gutters, 16px margins laterales.
Max-width contenido: 420px (centrado en tablets/desktop).
```

### Safe Areas

La app respeta `env(safe-area-inset-*)` para dispositivos con notch. La barra de navegación inferior tiene un padding-bottom adicional de `env(safe-area-inset-bottom)`.

---

## 8. Actualización Sugerida al Config del Codebase

```typescript
// src/config/clients/mare_cafe.ts — Propuesta actualizada
export const mareCafeConfig: ClientConfig = {
    code: 'mare_cafe',
    name: 'Mare Cafe',
    theme: {
        primaryColor: '#1A3278',      // Royal Deep Blue (ajustado)
        secondaryColor: '#F2EDE3',    // Parchment Cream
        accentColor: '#C8A96E',       // Espresso Gold
        fontFamily: 'var(--font-dm-serif)',
    },
    texts: {
        welcomeTitle: 'Mare',
        welcomeSubtitle: 'Pastelería y Café de Especialidad',
        stampCardTitle: 'Tu Tarjeta Mare',
        rewardsTitle: 'Tus Recompensas',
    },
    rules: {
        stampsPerReward: 7,
    },
    assets: {
        logo: '/logo-mare.png',
    },
    features: {
        showBuyButton: true,
        externalMenuUrl: undefined,     // Ahora con menú nativo
        showNewsFeed: true,
        menuEnabled: true,              // ← Habilitar menú in-app
        showAboutUs: true,
    },
};
```

---

## 9. Prompt para Generación de Imagen (Midjourney / DALL-E)

```
A premium mobile app UI mockup for "Mare Cafe", an artisan pastry and specialty
coffee shop. The design features a sophisticated two-tone palette: deep royal blue
(#1A3278) and warm parchment cream (#F2EDE3) with subtle gold accents. The layout
shows a coffee ordering screen with editorial serif typography for headings (similar
to DM Serif Display), clean sans-serif for body text, rounded cards with thin
borders (no shadows), minimalist line-art icons with 1.5px stroke. The aesthetic is
inspired by Kinfolk magazine, Aesop packaging, and Portuguese ceramic tiles.
Bottom navigation with 4 tabs: Home, Menu, Loyalty, Profile. A stamp loyalty card
is visible with custom illustrated coffee cup stamps in a single-color blue line
art style. The overall feel is calm, coastal, luxurious yet approachable. Shot on
a marble surface with soft directional light. UI/UX design, Figma style mockup,
4K, ultra-detailed --ar 9:16 --style raw --v 6.1
```

---

## 10. Resumen Ejecutivo de Diferenciadores

| Lo que evitamos | Lo que hacemos |
|---|---|
| Gradientes saturados, neon | Paleta binaria azul/crema con acentos dorados quirúrgicos |
| Sombras `box-shadow` pesadas | Bordes finos `1px` con transiciones de color |
| Tipografía genérica (Inter, Roboto) | Par editorial: DM Serif Display + Plus Jakarta Sans |
| Iconos Lucide/Feather sin personalizar | Line-art custom inspirada en la ilustración del flyer |
| Navegación recargada (5+ tabs) | 4 tabs, glass background, dot indicator |
| Bottom sheets aburridos | Spring animations con overshoot natural |
| Pull-to-refresh spinner genérico | Olas animadas del mar (identidad de marca) |
| Cards con sombras difusas | Cards con borde `Mist` que transiciona a `Royal Blue` en hover |

---

*Documento preparado para Mare Café — Belgrano 2268, Mar del Plata.*
*Versión 1.0 — Febrero 2026*
