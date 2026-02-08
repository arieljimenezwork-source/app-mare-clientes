'use client';

import { ClientConfig } from "@/config/types";
import { ArrowRight } from "lucide-react";

interface NewsFeedProps {
    config: ClientConfig;
}

export default function NewsFeed({ config }: NewsFeedProps) {
    // TODO: Fetch from DB later. Using mock data for now as per plan.
    const items = [
        { id: "1", emoji: "☕", cat: "Novedad", title: "Cold Brew de Temporada", desc: "Infusión en frío con notas tropicales" },
        { id: "2", emoji: "🎨", cat: "Evento", title: "Taller de Latte Art", desc: "Aprende arte en tu taza este sábado" },
        { id: "3", emoji: "🌱", cat: "Eco", title: "Descuento Eco-Friendly", desc: "15% OFF con tu vaso reutilizable" },
        { id: "4", emoji: "🧁", cat: "Nuevo", title: "Pastelería Artesanal", desc: "Nuevos croissants de masa madre" },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-gray-900 text-sm">Novedades</h3>
                <button
                    className="text-xs font-semibold flex items-center gap-1 transition-colors hover:opacity-80"
                    style={{ color: config.theme.accentColor }}
                >
                    Ver Todo <ArrowRight size={12} />
                </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x scrollbar-hide">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="min-w-[180px] snap-start bg-white rounded-[20px] overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
                    >
                        <div
                            className="h-28 flex items-center justify-center text-5xl"
                            style={{ backgroundColor: `${config.theme.primaryColor}08` }}
                        >
                            {item.emoji}
                        </div>
                        <div className="p-4">
                            <span
                                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: `${config.theme.accentColor}15`, color: config.theme.accentColor }}
                            >
                                {item.cat}
                            </span>
                            <h4 className="font-bold text-gray-900 text-xs mt-2 leading-tight">
                                {item.title}
                            </h4>
                            <p className="text-gray-400 text-[10px] mt-1 leading-relaxed">
                                {item.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
