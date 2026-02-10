'use client';

import { useState } from 'react';
import { POSProduct, POSVariant } from './types';
import { Plus, Coffee, X } from 'lucide-react';

interface Props {
    products: POSProduct[];
    onAddToCart: (product: POSProduct, variant?: POSVariant) => void;
}

export default function POSProductGrid({ products, onAddToCart }: Props) {
    const [selectedProduct, setSelectedProduct] = useState<POSProduct | null>(null);

    const handleProductClick = (product: POSProduct) => {
        if (product.variants && product.variants.length > 0) {
            setSelectedProduct(product);
        } else {
            onAddToCart(product);
        }
    };

    const handleVariantSelect = (variant: POSVariant) => {
        if (selectedProduct) {
            onAddToCart(selectedProduct, variant);
            setSelectedProduct(null);
        }
    };

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
                {products.map(product => (
                    <button
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col items-center justify-center text-center gap-2 hover:shadow-md hover:border-blue-200 transition-all active:scale-95 h-32 relative overflow-hidden group"
                    >
                        {product.image_url ? (
                            <img src={product.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:opacity-20 transition-opacity" />
                        ) : (
                            <Coffee className="text-gray-200 absolute -bottom-4 -right-4 w-24 h-24 opacity-20" />
                        )}

                        <span className="font-bold text-gray-800 text-sm relative z-10 leading-tight">
                            {product.name}
                        </span>
                        <div className="text-blue-600 font-bold text-xs bg-blue-50 px-2 py-1 rounded-md relative z-10">
                            ${product.base_price}
                            {product.variants && product.variants.length > 0 && '+'}
                        </div>
                    </button>
                ))}
            </div>

            {/* Variant Selection Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">{selectedProduct.name}</h3>
                            <button onClick={() => setSelectedProduct(null)} className="p-1 hover:bg-gray-200 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 grid gap-2">
                            <p className="text-sm text-gray-500 mb-2">Selecciona una variante:</p>
                            {selectedProduct.variants?.map(variant => (
                                <button
                                    key={variant.id}
                                    onClick={() => handleVariantSelect(variant)}
                                    className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 flex justify-between items-center transition-all"
                                >
                                    <span className="font-medium text-gray-700">{variant.name}</span>
                                    <span className="font-bold text-blue-600">
                                        ${selectedProduct.base_price + variant.price_modifier}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
