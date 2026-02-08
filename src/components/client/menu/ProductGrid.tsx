import { Product } from '@/types/menu';

interface ProductGridProps {
    products: Product[];
    onProductClick: (product: Product) => void;
}

export default function ProductGrid({ products, onProductClick }: ProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <p>No hay productos en esta categoría.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-4 p-4 pb-24">
            {products.map((product) => (
                <div
                    key={product.id}
                    onClick={() => onProductClick(product)}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer active:scale-95 duration-200"
                >
                    <div className="aspect-square bg-gray-100 relative">
                        {/* Placeholder if image loading fails or is missing, though we assume good data */}
                        {product.image ? (
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                No Image
                            </div>
                        )}
                    </div>
                    <div className="p-3">
                        <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{product.name}</h3>
                        <p className="text-gray-500 text-xs mt-1 font-medium">
                            ${product.price.toLocaleString('es-CL')}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
