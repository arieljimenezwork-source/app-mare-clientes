'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useClientConfig } from '@/context/ClientConfigContext';
import { Search, QrCode, Smartphone, Mail, Calendar, User, Download } from 'lucide-react';
import QRCode from 'react-qr-code';

interface ClientProfile {
    id: string;
    email: string;
    full_name?: string;
    phone?: string;
    level?: number;
    created_at: string;
    stamps?: number;
}

export default function ClientsTab() {
    const config = useClientConfig();
    const [clients, setClients] = useState<ClientProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showQR, setShowQR] = useState(false);

    useEffect(() => {
        const fetchClients = async () => {

            let query = supabase
                .from('profiles')
                .select('*, stamps(count)') // select stamps too
                .eq('role', 'customer');

            if (config.code === 'mare_cafe') {
                query = query.or('client_code.eq.mare_cafe,client_code.is.null');
            } else {
                query = query.eq('client_code', config.code);
            }

            const { data } = await query
                .order('created_at', { ascending: false });

            if (data) {
                // Map stamps count cleanly
                const formatted = data.map(c => ({
                    ...c,
                    stamps: c.stamps?.[0]?.count || 0 // Assuming one-to-one or taking first
                }));
                setClients(formatted);
            }
            setLoading(false);
        };
        fetchClients();
    }, [config]);

    const filteredClients = clients.filter(c =>
    (c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm))
    );

    const downloadQR = () => {
        const svg = document.getElementById("registration-qr");
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                const pngFile = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.download = "mare-registro-qr.png";
                downloadLink.href = pngFile;
                downloadLink.click();
            };
            img.src = "data:image/svg+xml;base64," + btoa(svgData);
        }
    };

    const registroUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/login?role=customer` : '';

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">

            {/* Header & QR Action */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 flex-1 w-full">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <User size={24} className="text-blue-600" /> Base de Datos de Clientes
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">
                                {clients.length} clientes registrados en total.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowQR(!showQR)}
                            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-slate-700 transition"
                        >
                            <QrCode size={18} /> {showQR ? 'Ocultar QR' : 'Ver QR de Registro'}
                        </button>
                    </div>

                    {showQR && (
                        <div className="mt-6 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center text-center animate-in fade-in">
                            <h4 className="font-bold text-slate-800 mb-2">QR para Nuevos Clientes</h4>
                            <p className="text-sm text-slate-500 mb-4 max-w-sm">
                                Muestra este código a los clientes para que se registren rápidamente en la app desde sus celulares.
                            </p>
                            <div className="p-4 bg-white rounded-xl shadow-sm mb-4">
                                <QRCode
                                    id="registration-qr"
                                    value={registroUrl}
                                    size={200}
                                    fgColor="#1E3A8A"
                                />
                            </div>
                            {/* <button onClick={downloadQR} className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline">
                        <Download size={14} /> Descargar PNG
                    </button> */}
                            <p className="text-xs text-slate-400 mt-2">{registroUrl}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Search & List */}
            <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Cliente</th>
                                <th className="p-4 font-semibold">Contacto</th>
                                <th className="p-4 font-semibold text-center">Nivel</th>
                                <th className="p-4 font-semibold text-center">Registrado</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-600 text-sm">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center">Cargando datos...</td></tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr key={client.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{client.full_name || 'Sin Nombre'}</div>
                                            <div className="text-xs text-slate-400">ID: {client.id.slice(0, 8)}...</div>
                                        </td>
                                        <td className="p-4 space-y-1">
                                            <div className="flex items-center gap-2 text-xs">
                                                <Mail size={14} className="text-blue-400" /> {client.email}
                                            </div>
                                            {client.phone && (
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Smartphone size={14} className="text-green-500" /> {client.phone}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                                                Lvl {client.level || 1}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center text-xs text-slate-400">
                                            {new Date(client.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                            {!loading && filteredClients.length === 0 && (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-400">No se encontraron clientes.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
