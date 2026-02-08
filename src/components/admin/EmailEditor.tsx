'use client';

import { useState, useEffect } from 'react';
import { X, Layout, Type, Image as ImageIcon, Send, Smartphone, Monitor, Palette } from 'lucide-react';

interface EmailEditorProps {
    initialData: {
        title: string;
        content: string;
        imageUrl?: string;
        offer?: string;
    };
    onClose: () => void;
    onSend: (data: { title: string; content: string; html: string; audience: string }) => Promise<void>;
    audience: string;
    isSending: boolean;
}

export default function EmailEditor({ initialData, onClose, onSend, audience, isSending }: EmailEditorProps) {
    const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
    const [formData, setFormData] = useState({
        title: initialData.title || '¡Tenemos novedades!',
        content: initialData.content || 'Hola, tenemos algo especial para ti...',
        offer: initialData.offer || '',
        imageUrl: initialData.imageUrl || '',
        primaryColor: '#1E3A8A',
        buttonText: 'Canjear Ahora',
        buttonUrl: '{{PROMO_LINK}}'
    });

    const generateEmailHtml = (data: typeof formData) => {
        return `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#F3F4F6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <!-- Header Image -->
        ${data.imageUrl ? `
        <div style="width: 100%; height: 300px; background-image: url('${data.imageUrl}'); background-size: cover; background-position: center; position: relative;">
            <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.6));"></div>
        </div>
        ` : ''}
        
        <!-- Content -->
        <div style="padding: 40px 30px; text-align: center;">
            <h1 style="color: ${data.primaryColor}; font-size: 28px; font-weight: 800; margin-bottom: 16px; margin-top: 0;">${data.title}</h1>
            
            ${data.offer ? `
            <div style="background-color: #EFF6FF; border: 2px dashed ${data.primaryColor}; padding: 15px; border-radius: 12px; margin: 20px 0; display: inline-block;">
                <span style="font-size: 24px; font-weight: bold; color: ${data.primaryColor};">${data.offer}</span>
            </div>
            ` : ''}

            <p style="color: #4B5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                ${data.content.replace(/\n/g, '<br/>')}
            </p>

            <a href="${data.buttonUrl}" style="background-color: ${data.primaryColor}; color: #ffffff; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px 0 rgba(0,0,0,0.39);">
                ${data.buttonText}
            </a>
        </div>

        <!-- Footer -->
        <div style="background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
            <p style="color: #9CA3AF; font-size: 12px;">
                Mare Cafe - Programa de Fidelidad<br/>
                Sigue disfrutando de tu café favorito.
            </p>
            <div style="margin-top: 10px;">
                <a href="#" style="color: #9CA3AF; font-size: 12px; text-decoration: underline;">Darse de baja</a>
            </div>
        </div>
    </div>
</body>
</html>
        `;
    };

    const htmlPreview = generateEmailHtml(formData);

    const handleSubmit = async () => {
        await onSend({
            title: formData.title,
            content: formData.content,
            html: htmlPreview,
            audience
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-6xl h-[90vh] flex overflow-hidden shadow-2xl">

                {/* Visual Editor Sidebar */}
                <div className="w-1/3 border-r border-slate-100 bg-slate-50 flex flex-col">
                    <div className="p-6 border-b border-slate-200 bg-white">
                        <div className="flex justify-between items-center">
                            <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                                <Palette size={20} className="text-blue-600" /> Editor
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Image Section */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <ImageIcon size={14} /> Imagen de Cabecera
                            </label>
                            <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-slate-200 group bg-slate-100">
                                {formData.imageUrl ? (
                                    <img src={formData.imageUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400 text-xs text-center p-4">
                                        Sin imagen seleccionada
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all gap-2">
                                    <label className="cursor-pointer bg-white text-xs font-bold px-4 py-2 rounded-full hover:bg-blue-50 transition">
                                        Cambiar
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (e) => setFormData(p => ({ ...p, imageUrl: e.target?.result as string }));
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </label>
                                    <button
                                        onClick={() => setFormData(p => ({ ...p, imageUrl: '' }))}
                                        className="text-white text-xs hover:text-red-300"
                                    >
                                        Quitar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Título Principal</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ej: ¡Oferta Especial!"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Oferta Destacada (Opcional)</label>
                                <input
                                    type="text"
                                    value={formData.offer}
                                    onChange={e => setFormData(p => ({ ...p, offer: e.target.value }))}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600 bg-blue-50"
                                    placeholder="Ej: 2x1 en Lattes"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Contenido del Mensaje</label>
                                <textarea
                                    rows={5}
                                    value={formData.content}
                                    onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    placeholder="Escribe tu mensaje aquí..."
                                ></textarea>
                            </div>
                        </div>

                        {/* Branding */}
                        <div className="space-y-4 pt-4 border-t border-slate-200">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Color Primario</label>
                                <div className="flex gap-2">
                                    {['#1E3A8A', '#DC2626', '#059669', '#7C3AED', '#DB2777'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setFormData(p => ({ ...p, primaryColor: color }))}
                                            className={`w-8 h-8 rounded-full border-2 transition-transform ${formData.primaryColor === color ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    <input
                                        type="color"
                                        value={formData.primaryColor}
                                        onChange={e => setFormData(p => ({ ...p, primaryColor: e.target.value }))}
                                        className="w-8 h-8 rounded-full overflow-hidden border-0 p-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Texto del Botón</label>
                                <input
                                    type="text"
                                    value={formData.buttonText}
                                    onChange={e => setFormData(p => ({ ...p, buttonText: e.target.value }))}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-200 bg-white">
                        <button
                            onClick={handleSubmit}
                            disabled={isSending}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Send size={20} />
                            {isSending ? 'Enviando...' : `Enviar a ${audience}`}
                        </button>
                    </div>
                </div>

                {/* Live Preview Area */}
                <div className="flex-1 bg-slate-200 flex flex-col relative">
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-full shadow-sm flex gap-1 z-10 border border-slate-200">
                        <button
                            onClick={() => setViewMode('mobile')}
                            className={`p-2 rounded-full transition ${viewMode === 'mobile' ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:bg-slate-100'}`}
                        >
                            <Smartphone size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('desktop')}
                            className={`p-2 rounded-full transition ${viewMode === 'desktop' ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:bg-slate-100'}`}
                        >
                            <Monitor size={20} />
                        </button>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                        <div
                            className={`bg-white shadow-2xl transition-all duration-500 overflow-hidden ${viewMode === 'mobile'
                                ? 'w-[375px] h-[750px] rounded-[40px] border-[8px] border-slate-900'
                                : 'w-[800px] h-[600px] rounded-xl border border-slate-300'
                                }`}
                        >
                            <iframe
                                srcDoc={htmlPreview}
                                className="w-full h-full border-0 bg-white"
                                title="Email Preview"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
