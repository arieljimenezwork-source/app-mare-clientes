import { useState } from "react";

const COLORS = {
  primary: "#1A3278",
  primaryHover: "#243D8A",
  blueSoft: "#4A6BB5",
  surface: "#F2EDE3",
  canvas: "#FAF8F4",
  gold: "#C8A96E",
  goldLight: "#E8D5A0",
  ink: "#2A2A2E",
  stone: "#8C8B88",
  mist: "#E5E1D9",
  sage: "#5B8C6A",
  terracotta: "#C0574A",
};

const fonts = {
  serif: "'DM Serif Display', 'Playfair Display', Georgia, serif",
  sans: "'Plus Jakarta Sans', 'Outfit', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', monospace",
};

const products = [
  { name: "Cappuccino", desc: "Espresso doble, leche texturizada", price: 2800, tag: null },
  { name: "Caramel Macchiato", desc: "Vainilla, espresso, caramelo", price: 3200, tag: "Popular" },
  { name: "Croissant Manteca", desc: "Masa hojaldrada, fermentación lenta", price: 2200, tag: "Nuevo" },
  { name: "Tarta de Frutos Rojos", desc: "Masa sablée, crema diplomática", price: 3500, tag: null },
];

const stamps = [true, true, true, false, false, false, false];

function CoffeeIcon({ filled = false, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={filled ? COLORS.canvas : COLORS.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {filled && <circle cx="12" cy="12" r="11" fill={COLORS.primary} stroke="none" />}
      <path d={filled ? "M8 15c0 1.1.9 2 2 2h4a2 2 0 002-2v-4H8v4z" : "M6 17c0 1.1.9 2 2 2h8a2 2 0 002-2V9H6v8z"} stroke={filled ? COLORS.canvas : COLORS.gold} />
      <path d={filled ? "M16 11h1a2 2 0 010 4h-1" : "M18 9h1.5a2.5 2.5 0 010 5H18"} stroke={filled ? COLORS.canvas : COLORS.gold} />
      {!filled && <>
        <path d="M10 5c0-1 .5-2 1.5-2S13 4 13 5" stroke={COLORS.gold} opacity="0.5" />
        <path d="M7.5 5.5C7.5 4.5 8 3.5 9 3.5" stroke={COLORS.gold} opacity="0.3" />
      </>}
    </svg>
  );
}

function StarIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={COLORS.gold} />
          <stop offset="50%" stopColor={COLORS.goldLight} />
          <stop offset="100%" stopColor={COLORS.gold} />
        </linearGradient>
      </defs>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" fill="url(#goldGrad)" stroke={COLORS.gold} strokeWidth="1" />
    </svg>
  );
}

function WaveLoader() {
  return (
    <svg width="48" height="20" viewBox="0 0 48 20">
      <style>{`
        @keyframes wave1 { 0%,100%{d:path('M0 12 Q6 6 12 12 Q18 18 24 12 Q30 6 36 12 Q42 18 48 12')} 50%{d:path('M0 12 Q6 18 12 12 Q18 6 24 12 Q30 18 36 12 Q42 6 48 12')} }
        @keyframes wave2 { 0%,100%{d:path('M0 14 Q6 8 12 14 Q18 20 24 14 Q30 8 36 14 Q42 20 48 14')} 50%{d:path('M0 14 Q6 20 12 14 Q18 8 24 14 Q30 20 36 14 Q42 8 48 14')} }
      `}</style>
      <path d="M0 12 Q6 6 12 12 Q18 18 24 12 Q30 6 36 12 Q42 18 48 12" fill="none" stroke={COLORS.primary} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" style={{ animation: "wave1 2s ease-in-out infinite" }} />
      <path d="M0 14 Q6 8 12 14 Q18 20 24 14 Q30 8 36 14 Q42 20 48 14" fill="none" stroke={COLORS.blueSoft} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" style={{ animation: "wave2 2s ease-in-out infinite 0.3s" }} />
    </svg>
  );
}

export default function MareDesignSystem() {
  const [activeTab, setActiveTab] = useState("palette");
  const [activeSize, setActiveSize] = useState("M");
  const [stampState, setStampState] = useState(stamps);
  const [hoverCard, setHoverCard] = useState(null);
  const [btnPressed, setBtnPressed] = useState(false);

  const tabs = [
    { id: "palette", label: "Paleta" },
    { id: "typography", label: "Tipografía" },
    { id: "components", label: "Componentes" },
    { id: "screens", label: "Pantallas" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: COLORS.canvas, fontFamily: fonts.sans, color: COLORS.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes stampBounce { 0%{transform:scale(0)} 60%{transform:scale(1.15)} 100%{transform:scale(1)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes dotSlide { from{transform:translateX(var(--dot-from))} to{transform:translateX(0)} }
        .fade-up { animation: fadeUp 0.3s ease-out both; }
        .stamp-bounce { animation: stampBounce 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(250,248,244,0.85)", backdropFilter: "blur(20px) saturate(1.4)",
        borderBottom: `0.5px solid ${COLORS.mist}`,
        padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div>
          <h1 style={{ fontFamily: fonts.serif, fontSize: "22px", color: COLORS.primary, lineHeight: 1.1, letterSpacing: "-0.02em" }}>Mare</h1>
          <span style={{ fontSize: "11px", color: COLORS.stone, letterSpacing: "0.05em", textTransform: "uppercase" }}>Sistema de Diseño</span>
        </div>
        <WaveLoader />
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: "flex", gap: "4px", padding: "12px 16px",
        borderBottom: `0.5px solid ${COLORS.mist}`, overflowX: "auto"
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "8px 16px", borderRadius: "20px", border: "none", cursor: "pointer",
            fontFamily: fonts.sans, fontSize: "13px", fontWeight: 600, letterSpacing: "0.02em",
            background: activeTab === t.id ? COLORS.primary : "transparent",
            color: activeTab === t.id ? COLORS.surface : COLORS.stone,
            transition: "all 200ms ease"
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "24px 20px 100px", maxWidth: 480, margin: "0 auto" }}>
        
        {activeTab === "palette" && (
          <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <section>
              <h2 style={{ fontFamily: fonts.serif, fontSize: "24px", color: COLORS.primary, marginBottom: 16, letterSpacing: "-0.02em" }}>Colores Primarios</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { name: "Royal Blue", hex: COLORS.primary, text: "#fff" },
                  { name: "Parchment", hex: COLORS.surface, text: COLORS.ink },
                  { name: "Warm White", hex: COLORS.canvas, text: COLORS.ink },
                ].map(c => (
                  <div key={c.name} style={{
                    background: c.hex, color: c.text, padding: 16, borderRadius: 16,
                    border: `1px solid ${COLORS.mist}`, minHeight: 100,
                    display: "flex", flexDirection: "column", justifyContent: "flex-end"
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{c.name}</div>
                    <div style={{ fontSize: 11, fontFamily: fonts.mono, opacity: 0.7 }}>{c.hex}</div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 style={{ fontFamily: fonts.serif, fontSize: "24px", color: COLORS.primary, marginBottom: 16, letterSpacing: "-0.02em" }}>Acentos & Neutrales</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {[
                  { name: "Espresso Gold", hex: COLORS.gold },
                  { name: "Mare Blue", hex: COLORS.blueSoft },
                  { name: "Sage", hex: COLORS.sage },
                  { name: "Terracotta", hex: COLORS.terracotta },
                  { name: "Ink", hex: COLORS.ink },
                  { name: "Stone", hex: COLORS.stone },
                  { name: "Mist", hex: COLORS.mist },
                  { name: "Canvas", hex: COLORS.canvas },
                ].map(c => (
                  <div key={c.name} style={{ textAlign: "center" }}>
                    <div style={{
                      width: "100%", aspectRatio: "1", borderRadius: 12, background: c.hex,
                      border: `1px solid ${COLORS.mist}`, marginBottom: 6
                    }} />
                    <div style={{ fontSize: 10, fontWeight: 500, color: COLORS.stone }}>{c.name}</div>
                    <div style={{ fontSize: 9, fontFamily: fonts.mono, color: COLORS.stone }}>{c.hex}</div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 style={{ fontFamily: fonts.serif, fontSize: "24px", color: COLORS.primary, marginBottom: 16, letterSpacing: "-0.02em" }}>Gradientes</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{
                  background: `linear-gradient(175deg, #1A3278, #243D8A 45%, #2E4F9E)`,
                  padding: 24, borderRadius: 16, color: COLORS.surface
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Ocean Gradient</div>
                  <div style={{ fontSize: 11, opacity: 0.7, fontFamily: fonts.mono }}>Headers & Hero sections</div>
                </div>
                <div style={{
                  background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldLight} 50%, ${COLORS.gold})`,
                  backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite",
                  padding: 24, borderRadius: 16, color: COLORS.ink
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Gold Reward Shimmer</div>
                  <div style={{ fontSize: 11, opacity: 0.7, fontFamily: fonts.mono }}>Momentos de recompensa</div>
                </div>
                <div style={{
                  background: `rgba(242,237,227,0.72)`, backdropFilter: "blur(24px) saturate(1.4)",
                  padding: 24, borderRadius: 16, border: `1px solid ${COLORS.mist}`
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Glass Cream</div>
                  <div style={{ fontSize: 11, color: COLORS.stone, fontFamily: fonts.mono }}>Modales & overlays</div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "typography" && (
          <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            <section>
              <div style={{ fontSize: 11, color: COLORS.stone, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Display — DM Serif Display</div>
              <div style={{ fontFamily: fonts.serif, fontSize: "clamp(2rem,5vw,3.5rem)", color: COLORS.primary, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
                Mare Café
              </div>
            </section>

            <section>
              <div style={{ fontSize: 11, color: COLORS.stone, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>H1 — DM Serif Display</div>
              <div style={{ fontFamily: fonts.serif, fontSize: "clamp(1.5rem,3.5vw,2rem)", color: COLORS.ink, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
                Pastelería artesanal y café de especialidad
              </div>
            </section>

            <section>
              <div style={{ fontSize: 11, color: COLORS.stone, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>H2 — Plus Jakarta Sans 600</div>
              <div style={{ fontFamily: fonts.sans, fontSize: "1.25rem", fontWeight: 600, color: COLORS.ink, lineHeight: 1.3 }}>
                Nuestro menú del día
              </div>
            </section>

            <section>
              <div style={{ fontSize: 11, color: COLORS.stone, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Body — Plus Jakarta Sans 400</div>
              <div style={{ fontFamily: fonts.sans, fontSize: "15px", color: COLORS.ink, lineHeight: 1.6 }}>
                Cada mañana horneamos con masa madre, manteca francesa y harinas orgánicas. Nuestro café de especialidad viene de microlotes seleccionados de Huila, Colombia y Sidama, Etiopía.
              </div>
            </section>

            <section>
              <div style={{ fontSize: 11, color: COLORS.stone, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Caption — Plus Jakarta Sans 500</div>
              <div style={{ fontFamily: fonts.sans, fontSize: "13px", fontWeight: 500, color: COLORS.stone, lineHeight: 1.5 }}>
                Belgrano 2268 · Mar del Plata · Lun a Sáb 8:00–20:00
              </div>
            </section>

            <section>
              <div style={{ fontSize: 11, color: COLORS.stone, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Mono — JetBrains Mono (precios)</div>
              <div style={{ fontFamily: fonts.mono, fontSize: "18px", fontWeight: 500, color: COLORS.primary }}>
                $3.200 <span style={{ fontSize: 13, color: COLORS.stone }}>ARS</span>
              </div>
            </section>

            <section>
              <div style={{ fontSize: 11, color: COLORS.stone, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Nav Label</div>
              <div style={{ fontFamily: fonts.sans, fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.primary }}>
                INICIO &nbsp;&nbsp; MENÚ &nbsp;&nbsp; LEALTAD &nbsp;&nbsp; PERFIL
              </div>
            </section>
          </div>
        )}

        {activeTab === "components" && (
          <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            
            {/* Buttons */}
            <section>
              <div style={{ fontSize: 11, color: COLORS.stone, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Botones</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button
                  onMouseDown={() => setBtnPressed(true)}
                  onMouseUp={() => setBtnPressed(false)}
                  onMouseLeave={() => setBtnPressed(false)}
                  style={{
                    background: COLORS.primary, color: COLORS.surface, border: "none",
                    padding: "14px 28px", borderRadius: 12, fontFamily: fonts.sans,
                    fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%",
                    transform: btnPressed ? "scale(0.97)" : "scale(1)",
                    transition: "all 200ms ease"
                  }}
                >
                  Agregar al carrito — $3.200
                </button>
                <button style={{
                  background: "transparent", color: COLORS.primary,
                  border: `1.5px solid ${COLORS.primary}`,
                  padding: "14px 28px", borderRadius: 12, fontFamily: fonts.sans,
                  fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%",
                  transition: "all 200ms ease"
                }}>
                  Ver detalles
                </button>
                <button style={{
                  background: "transparent", color: COLORS.blueSoft, border: "none",
                  padding: "8px 0", fontFamily: fonts.sans, fontSize: 14, fontWeight: 500,
                  cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px",
                  textAlign: "left"
                }}>
                  Ver todos los productos →
                </button>
              </div>
            </section>

            {/* Size Selector */}
            <section>
              <div style={{ fontSize: 11, color: COLORS.stone, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Selector de Tamaño</div>
              <div style={{ display: "flex", gap: 8, background: COLORS.surface, padding: 4, borderRadius: 12, border: `1px solid ${COLORS.mist}` }}>
                {["S", "M", "L"].map(size => (
                  <button key={size} onClick={() => setActiveSize(size)} style={{
                    flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                    fontFamily: fonts.sans, fontSize: 14, fontWeight: 600, cursor: "pointer",
                    background: activeSize === size ? COLORS.primary : "transparent",
                    color: activeSize === size ? COLORS.surface : COLORS.stone,
                    transition: "all 200ms ease"
                  }}>
                    {size === "S" ? "Chico" : size === "M" ? "Mediano" : "Grande"}
                  </button>
                ))}
              </div>
            </section>

            {/* Input */}
            <section>
              <div style={{ fontSize: 11, color: COLORS.stone, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Input Field</div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 6, color: COLORS.ink }}>Código promocional</label>
                <input
                  type="text"
                  placeholder="Ingresa tu código"
                  style={{
                    width: "100%", padding: "14px 16px", borderRadius: 12,
                    border: `1.5px solid ${COLORS.mist}`, fontFamily: fonts.sans, fontSize: 15,
                    outline: "none", background: COLORS.canvas, color: COLORS.ink,
                    transition: "border-color 200ms ease, box-shadow 200ms ease"
                  }}
                  onFocus={e => { e.target.style.borderColor = COLORS.primary; e.target.style.boxShadow = `0 0 0 3px rgba(26,50,120,0.1)` }}
                  onBlur={e => { e.target.style.borderColor = COLORS.mist; e.target.style.boxShadow = "none" }}
                />
              </div>
            </section>

            {/* Loyalty Card */}
            <section>
              <div style={{ fontSize: 11, color: COLORS.stone, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Tarjeta de Fidelidad</div>
              <div style={{
                border: `1.5px solid ${COLORS.primary}`, borderRadius: 20, padding: 24,
                background: `linear-gradient(135deg, ${COLORS.surface}, ${COLORS.canvas})`,
              }}>
                <div style={{ fontFamily: fonts.serif, fontSize: 18, color: COLORS.primary, marginBottom: 4, letterSpacing: "-0.02em" }}>Tu Tarjeta Mare</div>
                <div style={{ fontSize: 13, color: COLORS.stone, marginBottom: 20 }}>3 de 7 para tu café gratis</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
                  {stampState.map((filled, i) => (
                    <div key={i} onClick={() => {
                      if (!filled) {
                        const next = [...stampState];
                        next[i] = true;
                        setStampState(next);
                      }
                    }} style={{ cursor: filled ? "default" : "pointer" }}>
                      {i === 6 ? (
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: stampState.every(Boolean)
                            ? `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldLight}, ${COLORS.gold})`
                            : "transparent",
                          border: stampState.every(Boolean) ? "none" : `1.5px dashed ${COLORS.gold}`,
                        }}>
                          <StarIcon size={20} />
                        </div>
                      ) : (
                        <div className={filled ? "stamp-bounce" : ""} style={{
                          width: 36, height: 36, borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          border: filled ? "none" : `1.5px dashed ${COLORS.gold}`,
                          background: filled ? COLORS.primary : "transparent",
                          transition: "all 300ms ease"
                        }}>
                          {filled ? <CoffeeIcon filled size={20} /> : <CoffeeIcon size={18} />}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ height: 3, borderRadius: 2, background: COLORS.mist, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 2, background: COLORS.primary,
                    width: `${(stampState.filter(Boolean).length / 7) * 100}%`,
                    transition: "width 500ms ease"
                  }} />
                </div>
                <div style={{ fontSize: 11, color: COLORS.stone, marginTop: 6, textAlign: "right", fontFamily: fonts.mono }}>
                  {Math.round((stampState.filter(Boolean).length / 7) * 100)}%
                </div>
              </div>
              <div style={{ fontSize: 11, color: COLORS.stone, marginTop: 8, textAlign: "center" }}>
                Toca los círculos vacíos para simular un stamp ☝
              </div>
            </section>

            {/* Product Card */}
            <section>
              <div style={{ fontSize: 11, color: COLORS.stone, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Product Card</div>
              <div style={{
                borderRadius: 16, border: `1px solid ${COLORS.mist}`, overflow: "hidden",
                background: COLORS.canvas, transition: "all 200ms ease",
                transform: hoverCard === "demo" ? "translateY(-2px)" : "none",
              }}
                onMouseEnter={() => setHoverCard("demo")}
                onMouseLeave={() => setHoverCard(null)}
              >
                <div style={{
                  aspectRatio: "4/3", background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.blueSoft})`,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="24" stroke={COLORS.surface} strokeWidth="1.5" opacity="0.3" />
                    <path d="M22 40c0 2.2 1.8 4 4 4h12a4 4 0 004-4V28H22v12z" stroke={COLORS.surface} strokeWidth="1.5" />
                    <path d="M42 28h3a5 5 0 010 10h-3" stroke={COLORS.surface} strokeWidth="1.5" />
                    <path d="M28 20c0-2 1-4 3-4s3 2 3 4" stroke={COLORS.surface} strokeWidth="1.5" opacity="0.5" />
                    <path d="M33 18c0-2 1-4 3-4" stroke={COLORS.surface} strokeWidth="1.5" opacity="0.3" />
                  </svg>
                </div>
                <div style={{ padding: "16px" }}>
                  <div style={{ fontFamily: fonts.serif, fontSize: 16, color: COLORS.ink, marginBottom: 2, letterSpacing: "-0.01em" }}>Cappuccino</div>
                  <div style={{ fontSize: 13, color: COLORS.stone, marginBottom: 12 }}>Leche texturizada, espresso doble</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: fonts.mono, fontSize: 15, fontWeight: 500, color: COLORS.primary }}>$2.800</span>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", background: COLORS.primary,
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                    }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3v10M3 8h10" stroke={COLORS.surface} strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "screens" && (
          <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            
            {/* Screen: Home */}
            <section>
              <div style={{ fontSize: 11, color: COLORS.stone, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Pantalla — Home</div>
              <div style={{
                borderRadius: 24, overflow: "hidden", border: `1px solid ${COLORS.mist}`,
                background: COLORS.canvas, boxShadow: "0 4px 24px rgba(0,0,0,0.06)"
              }}>
                {/* Status bar mock */}
                <div style={{ background: COLORS.canvas, padding: "8px 20px", display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: COLORS.ink }}>
                  <span>9:41</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <span>●●●●</span>
                    <span>WiFi</span>
                    <span>🔋</span>
                  </div>
                </div>

                {/* Header */}
                <div style={{
                  background: `linear-gradient(175deg, #1A3278, #243D8A 45%, #2E4F9E)`,
                  padding: "24px 20px 32px", color: COLORS.surface
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div>
                      <div style={{ fontFamily: fonts.serif, fontSize: 28, letterSpacing: "-0.02em" }}>Mare</div>
                      <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: "0.04em" }}>Pastelería y Café</div>
                    </div>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.12)",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.surface} strokeWidth="1.5">
                        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
                      </svg>
                    </div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>Hola, Valentina 👋</div>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>Te faltan 4 cafés para tu recompensa</div>
                </div>

                {/* Loyalty Card Mini */}
                <div style={{ padding: "0 16px", marginTop: -16 }}>
                  <div style={{
                    background: COLORS.canvas, borderRadius: 16, padding: "16px 20px",
                    border: `1px solid ${COLORS.mist}`,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontFamily: fonts.serif, fontSize: 14, color: COLORS.primary }}>Tu Tarjeta</span>
                      <span style={{ fontSize: 11, fontFamily: fonts.mono, color: COLORS.stone }}>3/7</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      {stamps.map((f, i) => (
                        <div key={i} style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: f ? COLORS.primary : "transparent",
                          border: f ? "none" : `1px dashed ${COLORS.gold}`,
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          {f && <CoffeeIcon filled size={16} />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div style={{ padding: "20px 16px 8px" }}>
                  <div style={{ fontSize: 11, color: COLORS.stone, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>Acceso rápido</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { icon: "📖", label: "Ver Menú" },
                      { icon: "📍", label: "Cómo llegar" },
                    ].map(a => (
                      <div key={a.label} style={{
                        padding: "14px 16px", borderRadius: 12, border: `1px solid ${COLORS.mist}`,
                        display: "flex", alignItems: "center", gap: 10, background: COLORS.canvas
                      }}>
                        <span style={{ fontSize: 18 }}>{a.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{a.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Destacados */}
                <div style={{ padding: "16px 16px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontFamily: fonts.serif, fontSize: 18, color: COLORS.primary, letterSpacing: "-0.01em" }}>Destacados</span>
                    <span style={{ fontSize: 12, color: COLORS.blueSoft, fontWeight: 500, cursor: "pointer" }}>Ver todos →</span>
                  </div>
                  <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
                    {products.slice(0, 3).map((p, i) => (
                      <div key={i} style={{
                        minWidth: 140, borderRadius: 14, border: `1px solid ${COLORS.mist}`,
                        overflow: "hidden", background: COLORS.canvas, flexShrink: 0
                      }}>
                        <div style={{
                          height: 90, background: `linear-gradient(${135 + i * 30}deg, ${COLORS.primary}, ${COLORS.blueSoft})`,
                          display: "flex", alignItems: "center", justifyContent: "center", position: "relative"
                        }}>
                          <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
                            <path d="M22 40c0 2.2 1.8 4 4 4h12a4 4 0 004-4V28H22v12z" stroke={COLORS.surface} strokeWidth="1.5" />
                            <path d="M42 28h3a5 5 0 010 10h-3" stroke={COLORS.surface} strokeWidth="1.5" />
                          </svg>
                          {p.tag && (
                            <span style={{
                              position: "absolute", top: 6, right: 6, fontSize: 9, fontWeight: 600,
                              background: p.tag === "Nuevo" ? COLORS.sage : COLORS.gold,
                              color: "#fff", padding: "2px 8px", borderRadius: 6, letterSpacing: "0.04em"
                            }}>{p.tag}</span>
                          )}
                        </div>
                        <div style={{ padding: "10px 12px" }}>
                          <div style={{ fontFamily: fonts.serif, fontSize: 13, marginBottom: 2 }}>{p.name}</div>
                          <div style={{ fontFamily: fonts.mono, fontSize: 12, color: COLORS.primary, fontWeight: 500 }}>${p.price.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Nav */}
                <div style={{
                  display: "flex", justifyContent: "space-around", padding: "12px 0 20px",
                  background: "rgba(250,248,244,0.9)", backdropFilter: "blur(20px)",
                  borderTop: `0.5px solid ${COLORS.mist}`
                }}>
                  {[
                    { icon: "⌂", label: "INICIO", active: true },
                    { icon: "☕", label: "MENÚ", active: false },
                    { icon: "♥", label: "LEALTAD", active: false },
                    { icon: "◯", label: "PERFIL", active: false },
                  ].map(t => (
                    <div key={t.label} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 18, opacity: t.active ? 1 : 0.4, color: COLORS.primary }}>{t.icon}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 600, letterSpacing: "0.08em",
                        color: t.active ? COLORS.primary : COLORS.stone
                      }}>{t.label}</span>
                      {t.active && <div style={{ width: 4, height: 4, borderRadius: "50%", background: COLORS.primary }} />}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Screen: Menu */}
            <section>
              <div style={{ fontSize: 11, color: COLORS.stone, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Pantalla — Menú</div>
              <div style={{
                borderRadius: 24, overflow: "hidden", border: `1px solid ${COLORS.mist}`,
                background: COLORS.canvas, boxShadow: "0 4px 24px rgba(0,0,0,0.06)"
              }}>
                {/* Menu Header */}
                <div style={{ padding: "16px 20px", borderBottom: `0.5px solid ${COLORS.mist}` }}>
                  <div style={{ fontFamily: fonts.serif, fontSize: 24, color: COLORS.primary, letterSpacing: "-0.02em" }}>Menú</div>
                </div>

                {/* Categories */}
                <div style={{ display: "flex", gap: 6, padding: "12px 16px", overflowX: "auto" }}>
                  {["Todos", "Café", "Pastelería", "Brunch"].map((c, i) => (
                    <span key={c} style={{
                      padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                      background: i === 0 ? COLORS.primary : "transparent",
                      color: i === 0 ? COLORS.surface : COLORS.stone,
                      border: i === 0 ? "none" : `1px solid ${COLORS.mist}`
                    }}>{c}</span>
                  ))}
                </div>

                {/* Product List */}
                <div style={{ padding: "8px 16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {products.map((p, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 14, padding: 12, borderRadius: 14,
                      border: `1px solid ${COLORS.mist}`, background: COLORS.canvas, alignItems: "center"
                    }}>
                      <div style={{
                        width: 60, height: 60, borderRadius: 12, flexShrink: 0,
                        background: `linear-gradient(${135 + i * 25}deg, ${COLORS.primary}, ${COLORS.blueSoft})`,
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
                          <path d="M22 40c0 2.2 1.8 4 4 4h12a4 4 0 004-4V28H22v12z" stroke={COLORS.surface} strokeWidth="1.5" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: fonts.serif, fontSize: 14, marginBottom: 2 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: COLORS.stone, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.desc}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontFamily: fonts.mono, fontSize: 13, fontWeight: 500, color: COLORS.primary }}>${p.price.toLocaleString()}</div>
                        {p.tag && <span style={{ fontSize: 9, color: COLORS.gold, fontWeight: 600 }}>{p.tag}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  );
}
