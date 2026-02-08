'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClientConfig } from '@/context/ClientConfigContext';
import { CATEGORIES, PRODUCTS } from '@/data/menu-data';
import { Product } from '@/types/menu';

import MenuHeader from '@/components/client/menu/MenuHeader';
import CategoryTabs from '@/components/client/menu/CategoryTabs';
import ProductGrid from '@/components/client/menu/ProductGrid';
import ProductDetailModal from '@/components/client/menu/ProductDetailModal';

export default function MenuPage() {
    const router = useRouter();
    const config = useClientConfig();
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    useEffect(() => {
        if (!config.features.menuEnabled) {
            router.replace('/client'); // Redirect if disabled
            return;
        }
        setLoading(false);
    }, [router, config]);

    const filteredProducts = selectedCategory === 'all'
        ? PRODUCTS
        : PRODUCTS.filter(p => p.category === selectedCategory);

    if (loading) return <div className="min-h-screen bg-white flex items-center justify-center">Cargando menú...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <MenuHeader title="Nuestro Menú" />

            <CategoryTabs
                categories={CATEGORIES}
                selectedCategory={selectedCategory}
                onSelect={setSelectedCategory}
            />

            <main className="max-w-2xl mx-auto mt-4">
                <ProductGrid
                    products={filteredProducts}
                    onProductClick={setSelectedProduct}
                />
            </main>

            <ProductDetailModal
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />
        </div>
    );
}
