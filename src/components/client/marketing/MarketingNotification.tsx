'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X } from 'lucide-react';

interface MarketingNotificationProps {
    userLevel: number;
    clientCode: string;
}

export default function MarketingNotification({ userLevel, clientCode }: MarketingNotificationProps) {
    const [campaign, setCampaign] = useState<any | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                // 1. Fetch active campaigns
                const { data: campaigns, error } = await supabase
                    .from('campaigns')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                if (error || !campaigns) return;

                // 2. Filter by Client Code (Metadata) & Audience
                const validCampaign = campaigns.find(c => {
                    // Check Client Isolation
                    const metadata = c.metadata || {};
                    if (metadata.client_code && metadata.client_code !== clientCode) return false;

                    // Check Audience Filters
                    if (c.audience === 'Todos') return true;
                    if (c.audience === 'Nivel 2+ (Frecuentes)' && userLevel >= 2) return true;
                    if (c.audience === 'Nivel 3+ (VIP)' && userLevel >= 3) return true;

                    return false;
                });

                if (validCampaign) {
                    // 3. Check LocalStorage (Don't show same campaign twice)
                    const seenKey = `mare_campaign_seen_${validCampaign.id}`;
                    const hasSeen = localStorage.getItem(seenKey);

                    if (!hasSeen) {
                        setCampaign(validCampaign);
                        setIsVisible(true);
                    }
                }

            } catch (err) {
                console.error('Error fetching marketing campaigns:', err);
            }
        };

        // Delay slighty to not block initial render
        const timer = setTimeout(fetchCampaigns, 2000);
        return () => clearTimeout(timer);
    }, [userLevel, clientCode]);

    const handleClose = () => {
        setIsVisible(false);
        if (campaign) {
            localStorage.setItem(`mare_campaign_seen_${campaign.id}`, 'true');
        }
    };

    if (!isVisible || !campaign) return null;

    const imageUrl = campaign.metadata?.imageUrl;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors backdrop-blur-md"
                >
                    <X size={20} />
                </button>

                {/* Content */}
                <div className="flex flex-col">
                    {imageUrl && (
                        <div className="w-full aspect-[3/4] relative bg-gray-100">
                            <img
                                src={imageUrl}
                                alt={campaign.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {!imageUrl && (
                        <div className="p-8 text-center bg-[#1A3278] text-white">
                            <h3 className="text-xl font-serif mb-2">{campaign.title}</h3>
                            <p className="text-sm opacity-80">{campaign.content}</p>
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        onClick={handleClose}
                        className="w-full py-4 bg-white text-[#1A3278] font-bold text-sm uppercase tracking-wider hover:bg-gray-50 transition-colors border-t border-gray-100"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
}
