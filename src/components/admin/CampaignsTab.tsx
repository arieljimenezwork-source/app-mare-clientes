'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Send, FileEdit, Trash2, BarChart2 } from 'lucide-react';
import EmailEditor from './EmailEditor';
import { saveCampaign, getCampaigns, sendCampaign } from '@/app/actions/marketing';
import { useClientConfig } from '@/context/ClientConfigContext';

// Define the Campaign type locally based on our DB schema
type Campaign = {
    id: string;
    title: string;
    content: string;
    status: 'draft' | 'scheduled' | 'sent' | 'failed';
    sent_count: number;
    open_count: number;
    click_count: number;
    audience: string;
    created_at: string;
    html?: string;
    // We can store extra fields in a JSON column or just infer them, 
    // for now we'll keep it simple or assume we parse them if needed.
    // In a real app, we might store 'config' jsonb column for specific design tweaks.
};

export default function CampaignsTab() {
    const config = useClientConfig();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Partial<Campaign> | null>(null);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = async () => {
        setLoading(true);
        const data = await getCampaigns(config.code || 'mare_cafe');
        setCampaigns(data as Campaign[]);
        setLoading(false);
    };

    const handleNewCampaign = () => {
        setEditingCampaign({
            title: '',
            content: '',
            audience: 'all'
        });
        setShowEditor(true);
    };

    const handleEdit = (camp: Campaign) => {
        setEditingCampaign(camp);
        setShowEditor(true);
    };

    const handleSave = async (data: any) => {
        const formData = new FormData();
        if (data.id) formData.append('id', data.id);
        formData.append('title', data.title);
        formData.append('content', data.content);
        formData.append('html', data.html); // The generated HTML
        formData.append('audience', data.audience);
        formData.append('clientCode', config.code);

        // Append extra design fields if we want to persist them (requires DB change or JSONB)
        // For now, valid MVP is title/content/audience

        const res = await saveCampaign(formData);
        if (res.success) {
            await loadCampaigns();
            // Don't close editor automatically on save, just notify?
            // Or maybe close if it's "Save & Close". Let's keep it open or close.
            setShowEditor(false); // Close for MVP simplicity
        } else {
            alert('Error al guardar: ' + res.error);
        }
    };

    const handleSend = async (data: any) => {
        if (!confirm(`¿Estás seguro de enviar esta campaña a ${data.audience}?`)) return;

        setIsSending(true);
        const formData = new FormData();
        if (data.id) formData.append('campaignId', data.id); // Important
        formData.append('title', data.title);
        formData.append('content', data.content);
        formData.append('html', data.html);
        formData.append('audience', data.audience);
        formData.append('clientCode', config.code);

        const res = await sendCampaign(formData);
        setIsSending(false);

        if (res.success) {
            alert(res.message);
            setShowEditor(false);
            loadCampaigns();
        } else {
            alert('Error al enviar: ' + res.message);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Campañas de Marketing</h1>
                    <p className="text-slate-500">Gestiona tus comunicaciones y fideliza a tus clientes.</p>
                </div>
                <button
                    onClick={handleNewCampaign}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition shadow-lg shadow-blue-200"
                >
                    <Plus size={20} /> Nueva Campaña
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">Cargando campañas...</div>
                ) : campaigns.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Send size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Sin campañas aún</h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                            Crea tu primera campaña para anunciar ofertas, nuevos productos o simplemente saludar a tus clientes.
                        </p>
                        <button
                            onClick={handleNewCampaign}
                            className="text-blue-600 font-bold hover:underline"
                        >
                            Crear ahora
                        </button>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="p-4">Campaña</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4">Audiencia</th>
                                <th className="p-4 text-center">Enviados</th>
                                <th className="p-4 text-center">Aperturas</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {campaigns.map(camp => (
                                <tr key={camp.id} className="hover:bg-slate-50 transition group">
                                    <td className="p-4">
                                        <p className="font-bold text-slate-800">{camp.title}</p>
                                        <p className="text-sm text-slate-400 truncate max-w-xs">{camp.content}</p>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${camp.status === 'sent' ? 'bg-green-100 text-green-800' :
                                            camp.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {camp.status === 'sent' ? 'Enviado' :
                                                camp.status === 'draft' ? 'Borrador' : camp.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">{camp.audience}</td>
                                    <td className="p-4 text-center font-mono text-sm">{camp.sent_count || '-'}</td>
                                    <td className="p-4 text-center font-mono text-sm">{camp.open_count || '-'}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {camp.status === 'draft' && (
                                                <button
                                                    onClick={() => handleEdit(camp)}
                                                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                                                    title="Editar"
                                                >
                                                    <FileEdit size={18} />
                                                </button>
                                            )}
                                            {/* Future: Duplicate, Delete */}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Editor Modal */}
            {showEditor && editingCampaign && (
                <EmailEditor
                    initialData={{
                        id: editingCampaign.id,
                        title: editingCampaign.title || '',
                        content: editingCampaign.content || '',
                        // Add other fields if mapping exists
                    }}
                    audience={editingCampaign.audience || 'all'}
                    onClose={() => setShowEditor(false)}
                    onSave={handleSave}
                    onSend={handleSend}
                    isSending={isSending}
                />
            )}
        </div>
    );
}
