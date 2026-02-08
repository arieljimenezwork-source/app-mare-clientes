'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, Calendar, Star } from 'lucide-react';

interface NewsItem {
    id: string;
    title: string;
    content: string;
    image_url?: string;
    category?: string;
    created_at: string;
    active: boolean;
}

export default function NewsFeed() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            // In a real implementation this table 'news_feed' would exist
            const { data } = await supabase
                .from('news_feed')
                .select('*')
                .eq('active', true)
                .order('created_at', { ascending: false });

            if (data) setNews(data);
            setLoading(false);
        };
        fetchNews();
    }, []);

    if (loading) return <div className="p-4 text-center opacity-50 text-sm">Cargando novedades...</div>;

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <div className="flex items-center gap-2 px-2">
                <Bell size={16} className="text-amber-600" />
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Novedades y Eventos</h3>
            </div>

            {news.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Star size={24} className="text-amber-500" />
                    </div>
                    <p className="text-gray-500 text-sm">¡Pronto tendremos novedades para ti!</p>
                    <p className="text-gray-400 text-xs mt-1">Promociones, eventos y más.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {news.map((item) => (
                        <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 min-h-[100px]">
                            {item.image_url && (
                                <div className="w-24 h-24 shrink-0 rounded-xl bg-gray-100 overflow-hidden">
                                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                        {item.category || 'Novedad'}
                                    </span>
                                    <span className="text-[10px] text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                                </div>
                                <h4 className="font-bold text-gray-900 leading-tight mb-1">{item.title}</h4>
                                <p className="text-xs text-gray-500 line-clamp-2">{item.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
