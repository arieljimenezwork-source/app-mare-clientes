'use client';

import { useState, useEffect } from 'react';
import { useClientConfig } from '@/context/ClientConfigContext';
import { getLoyaltyMetrics, redeemReward, getPoints } from '@/app/actions/loyalty';
import { searchClientsPOS } from '@/app/actions/pos';
import { Gift, Users, Award, Search, AlertCircle, CheckCircle } from 'lucide-react';

// ─── Design Tokens (matches MareDashboard) ───
const MARE = {
    primary: '#1A3278',
    primaryHover: '#243D8A',
    blueSoft: '#4A6BB5',
    surface: '#F2EDE3',
    canvas: '#FAF8F4',
    gold: '#C8A96E',
    goldLight: '#E8D5A0',
    ink: '#2A2A2E',
    stone: '#8C8B88',
    mist: '#E5E1D9',
    sage: '#5B8C6A',
    terracotta: '#C0574A',
} as const;

const FONTS = {
    serif: 'var(--font-dm-serif), Georgia, serif',
    sans: 'var(--font-jakarta), system-ui, sans-serif',
    mono: 'var(--font-jetbrains), monospace',
} as const;

export default function LoyaltyTab() {
    const config = useClientConfig();
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<any>(null);

    // Redemption State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userPoints, setUserPoints] = useState(0);
    const [cost, setCost] = useState(1);
    const [description, setDescription] = useState('');
    const [redeemStatus, setRedeemStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [redeemMessage, setRedeemMessage] = useState('');

    useEffect(() => {
        loadMetrics();
    }, [config.code]);

    async function loadMetrics() {
        const result = await getLoyaltyMetrics(config.code);
        if (result.success) {
            setMetrics(result.data);
        }
        setLoading(false);
    }

    async function handleSearch() {
        if (!searchTerm) return;
        const res = await searchClientsPOS(searchTerm); // Reuse POS search
        if (res.success) {
            setSearchResults(res.data as any[]);
        }
    }

    async function handleSelectUser(user: any) {
        setSelectedUser(user);
        setSearchResults([]);
        setSearchTerm('');

        // Fetch points
        const pts = await getPoints(user.id);
        if (pts.success) setUserPoints(pts.points);
    }

    async function handleRedeem() {
        if (!selectedUser || cost <= 0 || !description) return;

        setRedeemStatus('processing');
        const res = await redeemReward(selectedUser.id, config.code, cost, description);

        if (res.success) {
            setRedeemStatus('success');
            setRedeemMessage('Canje realizado con éxito');
            setUserPoints(prev => prev - cost);
            loadMetrics(); // Refresh stats
            setTimeout(() => {
                setRedeemStatus('idle');
                setDescription('');
                setCost(1);
                setSelectedUser(null);
            }, 3000);
        } else {
            setRedeemStatus('error');
            setRedeemMessage(res.error || 'Error al canjear');
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-400">Cargando métricas...</div>;

    return (
        <div className="flex flex-col gap-6 mare-fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: FONTS.serif, fontSize: 20, color: MARE.primary, margin: 0, letterSpacing: '-0.02em' }}>
                    Fidelización y Referidos
                </h3>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Referidos Totales</p>
                        <p className="text-2xl font-bold text-gray-800">{metrics?.referrals || 0}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-pink-50 rounded-xl text-pink-600">
                        <Gift size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Canjes Totales</p>
                        <p className="text-2xl font-bold text-gray-800">{metrics?.redemptions || 0}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                        <Award size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Configuración</p>
                        <p className="text-sm font-bold text-gray-800">{config.rules.stampsPerReward} Sellos/Premio</p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Manual Redemption */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Gift size={18} className="text-gray-400" />
                        Canje Manual
                    </h4>

                    {!selectedUser ? (
                        <div className="relative">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Nombre o email del cliente..."
                                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-colors"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                />
                                <button onClick={handleSearch} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                                    <Search size={20} />
                                </button>
                            </div>
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white shadow-xl rounded-xl border border-gray-100 z-10 max-h-48 overflow-y-auto">
                                    {searchResults.map((user: any) => (
                                        <button
                                            key={user.id}
                                            onClick={() => handleSelectUser(user)}
                                            className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                                        >
                                            <p className="font-bold text-sm text-gray-800">{user.first_name} {user.last_name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-blue-900">{selectedUser.first_name} {selectedUser.last_name}</p>
                                    <p className="text-xs text-blue-600">{selectedUser.email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-blue-600 uppercase font-bold">Balance</p>
                                    <p className="text-2xl font-bold text-blue-800">{userPoints} pts</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Costo (Puntos)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                        value={cost}
                                        onChange={e => setCost(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Descripción</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Café Gratis"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleRedeem}
                                    disabled={redeemStatus === 'processing' || userPoints < cost}
                                    className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {redeemStatus === 'processing' ? 'Procesando...' : 'Canjear Reward'}
                                </button>
                            </div>

                            {redeemStatus === 'success' && (
                                <div className="p-3 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 text-sm font-medium">
                                    <CheckCircle size={16} />
                                    {redeemMessage}
                                </div>
                            )}
                            {redeemStatus === 'error' && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm font-medium">
                                    <AlertCircle size={16} />
                                    {redeemMessage}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Recent Redemptions */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Award size={18} className="text-gray-400" />
                        Canjes Recientes
                    </h4>
                    <div className="space-y-4">
                        {metrics?.recentRedemptions?.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-4">No hay canjes recientes.</p>
                        ) : (
                            metrics?.recentRedemptions?.map((log: any, i: number) => (
                                <div key={i} className="flex justify-between items-start border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium text-gray-800 text-sm">{log.description}</p>
                                        <p className="text-xs text-gray-500">
                                            {log.profiles?.first_name} {log.profiles?.last_name}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-red-500 text-sm">-{log.metadata?.cost} pts</p>
                                        <p className="text-[10px] text-gray-400">{new Date(log.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
