'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClientConfig } from '@/context/ClientConfigContext';
import { Product, Category } from '@/types/menu';
import { FileText, Utensils, Coffee, Tags, BookOpen } from 'lucide-react';
import { getPublicMenu } from '@/app/actions/catalog';

import MenuHeader from '@/components/client/menu/MenuHeader';
import CategoryTabs from '@/components/client/menu/CategoryTabs';
import ProductGrid from '@/components/client/menu/ProductGrid';
import ProductDetailModal from '@/components/client/menu/ProductDetailModal';
import MenuGalleryModal from '@/components/client/menu/MenuGalleryModal';

// ─── Tag label mapping for product detail display ───
const TAG_LABELS: Record<string, string> = {
    vegano: '🌱 Vegano',
    sin_gluten: '🌾 Sin Gluten',
    nuevo: '✨ Nuevo',
    popular: '🔥 Popular',
    sin_lactosa: '🥛 Sin Lactosa',
    especial: '⭐ Especial',
};

export default function MenuPage() {
    const router = useRouter();
    const config = useClientConfig();
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);

    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        if (!config.features.menuEnabled) {
            router.replace('/client');
            return;
        }

        async function loadMenu() {
            try {
                const menu = await getPublicMenu(config.code);

                // Map DB categories → frontend Category type
                const mappedCategories: Category[] = menu.categories.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                }));

                // Map DB products → frontend Product type
                const mappedProducts: Product[] = menu.products.map((p: any) => {
                    const cat = menu.categories.find((c: any) => c.id === p.category_id);
                    return {
                        id: p.id,
                        name: p.name,
                        description: p.description || '',
                        price: p.base_price,
                        image: p.image_url || '',
                        category: p.category_id || 'uncategorized',
                        attributes: {
                            sizes: p.variants?.map((v: any) => v.name) || undefined,
                            allergens: p.tags
                                ?.filter((t: string) => ['sin_gluten', 'sin_lactosa'].includes(t))
                                .map((t: string) => TAG_LABELS[t] || t) || undefined,
                        },
                    };
                });

                setCategories(mappedCategories);
                setProducts(mappedProducts);
            } catch (err) {
                console.error('Error loading menu from DB:', err);
            } finally {
                setLoading(false);
            }
        }

        loadMenu();
    }, [router, config]);

    const handleOpenGallery = (index: number = 0) => {
        setGalleryInitialIndex(index);
        setIsGalleryOpen(true);
    };

    const filteredProducts = selectedCategory === 'all'
        ? products
        : products.filter(p => p.category === selectedCategory);

    if (loading) return <div className="min-h-screen bg-white flex items-center justify-center">Cargando menú...</div>;

    const menuGallery = config.assets.menuGallery || [];

    return (
        <div className="min-h-screen bg-gray-50 pb-12 pt-16">
            <MenuHeader title="Nuestro Menú" />

            {/* Menu Gallery Section */}
            {menuGallery.length > 0 && (
                <div className="max-w-2xl mx-auto px-4 mt-6">
                    <button
                        onClick={() => handleOpenGallery(0)}
                        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-[#1A3278] text-[#1A3278] py-4 rounded-2xl font-bold shadow-sm hover:bg-gray-50 transition-all group"
                    >
                        <BookOpen className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        VER NUESTRA CARTA COMPLETA
                    </button>

                    <div className="grid grid-cols-3 gap-3 mt-4">
                        {menuGallery.map((item, index) => (
                            <button
                                key={item.label}
                                onClick={() => handleOpenGallery(index)}
                                className="flex flex-col items-center justify-center gap-2 bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 border border-gray-100"
                            >
                                <div className="p-3 bg-gray-50 rounded-full text-[#1A3278]">
                                    {item.label === 'Comidas' && <Utensils size={24} />}
                                    {item.label === 'Bebidas' && <Coffee size={24} />}
                                    {item.label === 'Promociones' && <Tags size={24} />}
                                    {!['Comidas', 'Bebidas', 'Promociones'].includes(item.label) && <FileText size={24} />}
                                </div>
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-8">
                <CategoryTabs
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelect={setSelectedCategory}
                />
            </div>

            <main className="max-w-2xl mx-auto mt-4 px-4">
                {products.length === 0 && !loading ? (
                    <div className="text-center py-16 text-gray-400">
                        <Coffee size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Menú en preparación</p>
                        <p className="text-sm mt-1">Pronto encontrarás aquí nuestros productos.</p>
                    </div>
                ) : (
                    <ProductGrid
                        products={filteredProducts}
                        onProductClick={setSelectedProduct}
                    />
                )}
            </main>

            <ProductDetailModal
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />

            <MenuGalleryModal
                isOpen={isGalleryOpen}
                onClose={() => setIsGalleryOpen(false)}
                images={menuGallery}
                initialIndex={galleryInitialIndex}
            />
        </div>
    );
}
