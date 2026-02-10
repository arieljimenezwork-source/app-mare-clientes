'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, User } from 'lucide-react';
import { searchClientsPOS } from '@/app/actions/pos';

interface Client {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    client_code: string;
}

interface Props {
    onSelect: (client: Client | null) => void;
    selectedClient: Client | null;
}

export default function POSClientSelector({ onSelect, selectedClient }: Props) {
    const [open, setOpen] = useState(false);
    const [term, setTerm] = useState('');
    const [results, setResults] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!term.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            const { data } = await searchClientsPOS(term);
            setResults(data as Client[]);
            setLoading(false);
        }, 300);
    }, [term]);

    if (selectedClient) {
        return (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-xl mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                        {selectedClient.first_name[0]}
                    </div>
                    <div>
                        <p className="font-bold text-sm text-blue-900 leading-tight">
                            {selectedClient.first_name} {selectedClient.last_name}
                        </p>
                        <p className="text-xs text-blue-600">{selectedClient.email}</p>
                    </div>
                </div>
                <button
                    onClick={() => onSelect(null)}
                    className="text-blue-400 hover:text-blue-700 p-1"
                >
                    <X size={18} />
                </button>
            </div>
        );
    }

    return (
        <div className="relative mb-4">
            {!open ? (
                <button
                    onClick={() => setOpen(true)}
                    className="w-full flex items-center gap-2 text-left p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:bg-white hover:border-gray-300 transition-all font-medium text-sm"
                >
                    <User size={18} />
                    Asignar Cliente (Opcional)
                </button>
            ) : (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="flex items-center border-b border-gray-100 p-2 gap-2">
                        <Search size={18} className="text-gray-400 ml-2" />
                        <input
                            autoFocus
                            className="flex-1 outline-none text-sm p-2"
                            placeholder="Buscar por nombre o email..."
                            value={term}
                            onChange={(e) => setTerm(e.target.value)}
                        />
                        <button onClick={() => { setOpen(false); setTerm(''); }} className="p-2 text-gray-400 hover:text-gray-700">
                            <X size={18} />
                        </button>
                    </div>
                    {(results.length > 0 || loading) && (
                        <div className="max-h-48 overflow-y-auto">
                            {results.map(client => (
                                <button
                                    key={client.id}
                                    onClick={() => { onSelect(client); setOpen(false); setTerm(''); }}
                                    className="w-full text-left p-3 hover:bg-blue-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                                        {client.first_name[0]}{client.last_name[0]}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-gray-800">{client.first_name} {client.last_name}</p>
                                        <p className="text-xs text-gray-500">{client.email}</p>
                                    </div>
                                </button>
                            ))}
                            {loading && <div className="p-3 text-center text-xs text-gray-400">Buscando...</div>}
                        </div>
                    )}
                    {term && !loading && results.length === 0 && (
                        <div className="p-4 text-center text-sm text-gray-400">No se encontraron clientes.</div>
                    )}
                </div>
            )}
        </div>
    );
}
