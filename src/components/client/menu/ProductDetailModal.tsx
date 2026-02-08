import { Product } from '@/types/menu';
import { X, MapPin, Droplets, AlertTriangle, Ruler } from 'lucide-react';

interface ProductDetailModalProps {
    product: Product | null;
    onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
    if (!product) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="bg-white w-full max-w-md h-[85vh] sm:h-auto sm:max-h-[90vh] sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-y-auto pointer-events-auto relative animate-in slide-in-from-bottom duration-300">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-white/50 backdrop-blur-md p-2 rounded-full text-black hover:bg-white transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Image Header */}
                <div className="h-64 sm:h-72 bg-gray-100 w-full relative">
                    {product.image && (
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                        <span className="bg-amber-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded mb-2 inline-block">
                            {product.category}
                        </span>
                        <h2 className="text-2xl font-bold">{product.name}</h2>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Price & Description */}
                    <div>
                        <p className="text-3xl font-bold text-gray-900 mb-2">
                            ${product.price.toLocaleString('es-CL')}
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            {product.description}
                        </p>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Attributes Grid */}
                    <div className="grid grid-cols-1 gap-4">

                        {product.attributes?.origin && (
                            <div className="bg-amber-50 p-4 rounded-xl flex items-start gap-3">
                                <MapPin className="text-amber-600 shrink-0" size={20} />
                                <div>
                                    <h4 className="font-bold text-amber-900 text-sm">Origen</h4>
                                    <p className="text-amber-800 text-sm">{product.attributes.origin}</p>
                                </div>
                            </div>
                        )}

                        {product.attributes?.tastingNotes && product.attributes.tastingNotes.length > 0 && (
                            <div className="bg-stone-50 p-4 rounded-xl flex items-start gap-3">
                                <Droplets className="text-stone-600 shrink-0" size={20} />
                                <div>
                                    <h4 className="font-bold text-stone-900 text-sm">Notas de Cata</h4>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {product.attributes.tastingNotes.map(note => (
                                            <span key={note} className="bg-stone-200 text-stone-700 text-xs px-2 py-1 rounded-md font-medium">
                                                {note}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {product.attributes?.sizes && (
                            <div className="flex items-center gap-3 p-2 text-gray-500 text-sm">
                                <Ruler size={16} />
                                <span>Disponible en: {product.attributes.sizes.join(', ')}</span>
                            </div>
                        )}

                        {product.attributes?.allergens && (
                            <div className="flex items-center gap-3 p-2 text-red-500 text-sm bg-red-50 rounded-lg">
                                <AlertTriangle size={16} />
                                <span>Contiene: {product.attributes.allergens.join(', ')}</span>
                            </div>
                        )}

                    </div>

                    <div className="h-12"></div> {/* Spacer */}
                </div>

                {/* Sticky Footer Button (Just Close) */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-black text-white font-bold rounded-2xl hover:bg-gray-800 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>

            </div>
        </div>
    );
}
