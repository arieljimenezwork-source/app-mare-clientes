'use client';

import { useState } from 'react';
import { X, CreditCard, Banknote, Smartphone, CheckCircle } from 'lucide-react';
import { createOrder } from '@/app/actions/pos';
import { CartItem } from './types';

interface Client {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    client_code: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    items: CartItem[];
    total: number;
    client: Client | null;
    shopCode: string;
    onOrderComplete: () => void;
}

export default function POSCheckoutModal({
    isOpen, onClose, items, total, client, shopCode, onOrderComplete
}: Props) {
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setProcessing(true);
        setError('');

        try {
            const orderInput = {
                shop_code: shopCode,
                client_id: client?.id,
                status: 'completed' as const,
                payment_method: paymentMethod,
                total_amount: total,
                items: items.map(item => ({
                    product_id: item.product.id,
                    variant_id: item.variant?.id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total_price: item.total_price,
                    notes: item.notes,
                })),
            };

            const result = await createOrder(orderInput);

            if (!result.success) {
                throw new Error(result.error);
            }

            // Success!
            onOrderComplete();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al procesar el pedido');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Confirmar Pago</h2>
                    <button onClick={onClose} disabled={processing} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Summary */}
                    <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                        <span className="text-blue-800 font-medium">Total a Pagar</span>
                        <span className="text-2xl font-bold text-blue-900">${total.toLocaleString()}</span>
                    </div>

                    {client && (
                        <div className="mb-6 flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="font-bold text-gray-800">Cliente:</span>
                            {client.first_name} {client.last_name} ({client.email})
                        </div>
                    )}

                    {/* Payment Method */}
                    <p className="text-sm font-bold text-gray-700 mb-3">Método de Pago</p>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <button
                            onClick={() => setPaymentMethod('cash')}
                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'cash'
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-blue-200 text-gray-600'
                                }`}
                        >
                            <Banknote size={24} />
                            <span className="text-xs font-bold">Efectivo</span>
                        </button>
                        <button
                            onClick={() => setPaymentMethod('card')}
                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'card'
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-blue-200 text-gray-600'
                                }`}
                        >
                            <CreditCard size={24} />
                            <span className="text-xs font-bold">Tarjeta</span>
                        </button>
                        <button
                            onClick={() => setPaymentMethod('transfer')}
                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'transfer'
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-blue-200 text-gray-600'
                                }`}
                        >
                            <Smartphone size={24} />
                            <span className="text-xs font-bold">Transferencia</span>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        onClick={handleConfirm}
                        disabled={processing}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold shadow-lg shadow-green-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
                    >
                        {processing ? (
                            'Procesando...'
                        ) : (
                            <>
                                <CheckCircle size={24} />
                                CONFIRMAR PAGO
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
