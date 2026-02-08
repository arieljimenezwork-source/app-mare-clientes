import { useState, useEffect } from "react";

// ─── COFFEINOPIA-INSPIRED REDESIGN PREVIEW ────────────────────
// Interactive preview of all redesigned components

const config = {
  name: "Perezoso Cafe",
  theme: { primaryColor: "#2E2333", secondaryColor: "#FFF5E1", accentColor: "#F5A623" },
  texts: { welcomeTitle: "Perezoso", welcomeSubtitle: "Café para ir con calma 🦥", stampCardTitle: "Tu Tarjeta de Recompensas" },
  rules: { stampsPerReward: 10 },
  assets: { logo: null },
  features: { showNewsFeed: true, menuEnabled: true },
};

function Header({ level, userName }) {
  return (
    <header className="fixed w-full top-0 z-20">
      <div className="px-5 pt-12 pb-4 flex items-center justify-between" style={{ backgroundColor: config.theme.primaryColor }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-lg">🦥</div>
          <div>
            <p className="text-white font-bold text-base leading-tight">{config.name}</p>
            <p className="text-white/50 text-xs">Hola, {userName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {level > 1 && (
            <span className="bg-amber-400/20 text-amber-300 text-[10px] px-2.5 py-1 rounded-full font-bold border border-amber-400/30">
              ★ Lv {level}
            </span>
          )}
          <button className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/60">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

function PromoBanner() {
  return (
    <div className="relative overflow-hidden rounded-[20px] p-5 flex items-center justify-between" style={{ backgroundColor: config.theme.primaryColor }}>
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 50%)" }} />
      <div className="relative z-10 space-y-2">
        <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em]">Coffee Day</p>
        <p className="text-white text-3xl font-black leading-none tracking-tight">OFF 20%</p>
        <button className="mt-2 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95" style={{ backgroundColor: config.theme.accentColor, color: "white" }}>
          Obtener Descuento
          <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px]">→</span>
        </button>
      </div>
      <div className="relative z-10 w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-4xl backdrop-blur-sm">☕</div>
    </div>
  );
}

function StampCard({ stamps, setStamps }) {
  const total = config.rules.stampsPerReward;
  const pct = Math.min((stamps / total) * 100, 100);

  return (
    <div className="bg-white rounded-[24px] p-6" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.05)" }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">{config.texts.stampCardTitle}</h3>
          <p className="text-gray-400 text-xs mt-0.5">
            {stamps >= total ? "¡Premio disponible!" : `${total - stamps} más para tu premio`}
          </p>
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-2xl font-black text-gray-900">{stamps}</span>
          <span className="text-sm text-gray-300 font-semibold">/{total}</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2.5 mb-4">
        {Array.from({ length: total }).map((_, i) => {
          const filled = i < stamps;
          const next = i === stamps;
          const reward = i === total - 1;
          return (
            <button key={i} onClick={() => setStamps(Math.min(i + 1, total))}
              className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 cursor-pointer
                ${filled ? "text-white scale-100 shadow-md" : next ? "border-2 border-dashed animate-pulse" : "bg-gray-100 text-gray-300 hover:bg-gray-200"}
              `}
              style={{
                ...(filled ? { backgroundColor: config.theme.accentColor } : {}),
                ...(next ? { borderColor: config.theme.accentColor, color: config.theme.accentColor } : {}),
              }}
            >
              {reward && !filled ? "🎁" : filled ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              ) : i + 1}
            </button>
          );
        })}
      </div>

      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: config.theme.accentColor }} />
      </div>

      <p className="text-[10px] text-center mt-2 text-gray-400">Toca los sellos para simular progreso</p>
    </div>
  );
}

function NewsFeed() {
  const items = [
    { id: "1", emoji: "☕", cat: "Novedad", title: "Cold Brew de Temporada", desc: "Infusión en frío con notas tropicales" },
    { id: "2", emoji: "🎨", cat: "Evento", title: "Taller de Latte Art", desc: "Aprende arte en tu taza este sábado" },
    { id: "3", emoji: "🌱", cat: "Eco", title: "Descuento Eco-Friendly", desc: "15% OFF con tu vaso reutilizable" },
    { id: "4", emoji: "🧁", cat: "Nuevo", title: "Pastelería Artesanal", desc: "Nuevos croissants de masa madre" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-gray-900 text-sm">Novedades</h3>
        <button className="text-xs font-semibold flex items-center gap-1" style={{ color: config.theme.accentColor }}>Ver Todo →</button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x" style={{ scrollbarWidth: "none" }}>
        {items.map((item) => (
          <div key={item.id} className="min-w-[170px] snap-start bg-white rounded-[20px] overflow-hidden flex-shrink-0 border border-gray-100" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div className="h-24 flex items-center justify-center text-3xl" style={{ backgroundColor: config.theme.primaryColor + "08" }}>
              {item.emoji}
            </div>
            <div className="p-3">
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: config.theme.accentColor + "12", color: config.theme.accentColor }}>
                {item.cat}
              </span>
              <h4 className="font-bold text-gray-900 text-xs mt-1.5 leading-tight">{item.title}</h4>
              <p className="text-gray-400 text-[10px] mt-0.5 leading-snug">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RewardBar({ stamps, onClaim }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 p-4 pb-6" style={{ background: "linear-gradient(to top, white 60%, transparent)" }}>
      <div className="max-w-sm mx-auto flex items-center justify-between p-4 rounded-2xl text-white" style={{ backgroundColor: config.theme.accentColor, boxShadow: "0 8px 32px rgba(245,166,35,0.4)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🎁</div>
          <div>
            <p className="font-bold text-sm">¡Premio Disponible!</p>
            <p className="text-white/70 text-xs">{stamps} sellos acumulados</p>
          </div>
        </div>
        <button onClick={onClaim} className="bg-white text-gray-900 font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform shadow-md">
          Canjear
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ backgroundColor: config.theme.accentColor }}>→</span>
        </button>
      </div>
    </div>
  );
}

function BottomNav({ onQR }) {
  const [active, setActive] = useState("home");
  const items = [
    { id: "home", icon: "🏠", label: "Inicio" },
    { id: "menu", icon: "📋", label: "Menú" },
    { id: "qr", icon: null, label: "QR" },
    { id: "rewards", icon: "🎁", label: "Premios" },
    { id: "profile", icon: "👤", label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 pb-6 pt-2 px-6">
      <div className="max-w-sm mx-auto flex items-center justify-between">
        {items.map((item) =>
          item.id === "qr" ? (
            <button key="qr" onClick={onQR}
              className="w-14 h-14 -mt-8 rounded-2xl flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95"
              style={{ backgroundColor: config.theme.accentColor, boxShadow: `0 6px 24px ${config.theme.accentColor}60` }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/>
                <line x1="21" y1="14" x2="21" y2="21"/><line x1="14" y1="21" x2="21" y2="21"/>
              </svg>
            </button>
          ) : (
            <button key={item.id} onClick={() => setActive(item.id)}
              className="flex flex-col items-center gap-0.5 transition-all"
              style={{ color: active === item.id ? config.theme.accentColor : "#D1D5DB", transform: active === item.id ? "scale(1.1)" : "scale(1)" }}>
              <span className="text-lg">{item.icon}</span>
              <span className="text-[9px] font-bold">{item.label}</span>
            </button>
          )
        )}
      </div>
    </nav>
  );
}

function QRSheet({ open, onClose, isReward }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50" style={{ animation: "slideUp 0.3s ease-out" }}>
        <div className="bg-white rounded-t-[32px] max-w-sm mx-auto w-full px-6 pt-3 pb-10" style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
          <div className="text-center mb-5">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: isReward ? "#FEF3C7" : config.theme.accentColor + "15", color: isReward ? "#92400E" : config.theme.accentColor }}>
              {isReward ? "🎁 ¡Premio listo!" : "☕ Muestra al barista"}
            </span>
          </div>
          <div className="rounded-[24px] p-6 flex items-center justify-center mx-auto max-w-[260px]"
            style={{ backgroundColor: isReward ? config.theme.primaryColor : "#F9FAFB", border: isReward ? "none" : "2px solid #F3F4F6" }}>
            <div className="bg-white p-4 rounded-2xl">
              <div className="w-44 h-44 bg-gray-50 rounded-xl flex items-center justify-center">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <rect x="10" y="10" width="30" height="30" rx="4" fill="#333"/><rect x="15" y="15" width="20" height="20" rx="2" fill="white"/>
                  <rect x="18" y="18" width="14" height="14" rx="1" fill="#333"/>
                  <rect x="80" y="10" width="30" height="30" rx="4" fill="#333"/><rect x="85" y="15" width="20" height="20" rx="2" fill="white"/>
                  <rect x="88" y="18" width="14" height="14" rx="1" fill="#333"/>
                  <rect x="10" y="80" width="30" height="30" rx="4" fill="#333"/><rect x="15" y="85" width="20" height="20" rx="2" fill="white"/>
                  <rect x="18" y="88" width="14" height="14" rx="1" fill="#333"/>
                  <rect x="50" y="10" width="8" height="8" rx="1" fill="#333"/><rect x="50" y="26" width="8" height="8" rx="1" fill="#333"/>
                  <rect x="50" y="50" width="8" height="8" rx="1" fill="#333"/><rect x="66" y="50" width="8" height="8" rx="1" fill="#333"/>
                  <rect x="82" y="50" width="8" height="8" rx="1" fill="#333"/><rect x="50" y="66" width="8" height="8" rx="1" fill="#333"/>
                  <rect x="82" y="82" width="28" height="28" rx="4" fill={config.theme.accentColor} opacity="0.2"/>
                  <rect x="87" y="87" width="18" height="18" rx="2" fill={config.theme.accentColor}/>
                </svg>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-full mt-5 py-3 rounded-2xl font-bold text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">Cerrar</button>
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────
export default function App() {
  const [stamps, setStamps] = useState(5);
  const [showQR, setShowQR] = useState(false);
  const isReward = stamps >= config.rules.stampsPerReward;

  return (
    <div className="bg-gray-50 min-h-screen max-w-sm mx-auto relative overflow-hidden" style={{ fontFamily: "'Fredoka', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <Header level={2} userName="Martín" />

      <div className="pt-28 pb-28 px-4 flex flex-col gap-5">
        <PromoBanner />
        <StampCard stamps={stamps} setStamps={setStamps} />
        <NewsFeed />
      </div>

      {isReward ? (
        <RewardBar stamps={stamps} onClaim={() => setShowQR(true)} />
      ) : (
        <BottomNav onQR={() => setShowQR(true)} />
      )}

      <QRSheet open={showQR} onClose={() => setShowQR(false)} isReward={isReward} />
    </div>
  );
}
