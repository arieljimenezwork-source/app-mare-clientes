'use client';

import { CartItem, POSProduct, POSVariant } from './types';
import { Plus, Minus, Trash2, CreditCard, ShoppingBag, User } from 'lucide-react';
import POSClientSelector from './POSClientSelector';

interface Client {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    client_code: string;
}

interface Props {
    items: CartItem[];
    client: Client | null;
    onSetClient: (client: Client | null) => void;
    onUpdateQuantity: (uuid: string, delta: number) => void;
    onRemoveItem: (uuid: string) => void;
    onCheckout: () => void;
    total: number;
}

export default function POSCart({
    items, client, onSetClient, onUpdateQuantity, onRemoveItem, onCheckout, total
}: Props) {
    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200 shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2 text-gray-800 font-bold text-lg">
                    <ShoppingBag className="text-blue-600" />
                    <span>Orden Actual</span>
                </div>
                <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded-full text-xs font-bold">
                    {items.length} ítems
                </span>
            </div>

            {/* Client Selector (Top of Cart) */}
            <div className="p-4 border-b border-gray-100 bg-white">
                <POSClientSelector selectedClient={client} onSelect={onSetClient} />
            </div>

            {/* Cart Items (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                        <ShoppingBag size={48} className="mb-2" />
                        <p>Carrito vacío</p>
                    </div>
                ) : (
                    items.map(item => (
                        <div key={item.uuid} className="flex gap-3 bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                            {/* Qty Controls */}
                            <div className="flex flex-col items-center justify-between bg-gray-50 rounded-lg p-1 w-8">
                                <button
                                    onClick={() => onUpdateQuantity(item.uuid, 1)}
                                    className="p-1 hover:bg-white rounded-md text-blue-600 transition-colors"
                                >
                                    <Plus size={14} />
                                </button>
                                <span className="text-xs font-bold text-gray-700">{item.quantity}</span>
                                <button
                                    onClick={() => onUpdateQuantity(item.uuid, -1)}
                                    className="p-1 hover:bg-white rounded-md text-red-500 transition-colors"
                                >
                                    <Minus size={14} />
                                </button>
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm leading-tight">{item.product.name}</p>
                                        {item.variant && (
                                            <p className="text-xs text-gray-500 mt-0.5">{item.variant.name}</p>
                                        )}
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm">
                                        ${(item.total_price).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs text-gray-400">
                                        ${item.unit_price} x {item.quantity}
                                    </p>
                                    <button
                                        onClick={() => onRemoveItem(item.uuid)}
                                        className="text-red-400 hover:text-red-600 p-1 rounded-md transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer / Totals */}
            <div className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-gray-500 text-sm">
                        <span>Subtotal</span>
                        <span>${total.toLocaleString()}</span>
                    </div>
                    {/* Discount logic can go here later */}
                    <div className="flex justify-between text-gray-900 font-bold text-xl pt-2 border-t border-gray-200/50">
                        <span>Total</span>
                        <span>${total.toLocaleString()}</span>
                    </div>
                </div>

                <button
                    onClick={onCheckout}
                    disabled={items.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <CreditCard size={20} />
                    COBRAR ${total.toLocaleString()}
                </button>
            </div>
        </div>
    );
}
