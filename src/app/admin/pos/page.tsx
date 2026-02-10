'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useClientConfig } from '@/context/ClientConfigContext';
import { getProducts, getCategories, getPublicMenu } from '@/app/actions/catalog';
import { POSProduct, POSVariant, CartItem } from '@/components/admin/pos/types';
import POSProductGrid from '@/components/admin/pos/POSProductGrid';
import POSCart from '@/components/admin/pos/POSCart';
import POSCheckoutModal from '@/components/admin/pos/POSCheckoutModal';
import { LayoutDashboard, LogOut } from 'lucide-react';
import Link from 'next/link';

// Helper for UUIDs
const generateUUID = () => crypto.randomUUID();

export default function POSPage() {
    const router = useRouter();
    const config = useClientConfig();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<POSProduct[]>([]);
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [client, setClient] = useState<any>(null); // Uses Client type from selector

    // UI State
    const [showCheckout, setShowCheckout] = useState(false);

    // Initial Load
    useEffect(() => {
        async function loadData() {
            try {
                // Reuse catalog actions
                const [prods, cats] = await Promise.all([
                    getProducts(config.code),
                    getCategories(config.code)
                ]);

                if (prods.success) setProducts(prods.data as POSProduct[]);
                if (cats.success) setCategories(cats.data as any[]);
            } catch (err) {
                console.error('Error loading POS data:', err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [config.code]);

    // Cart Actions
    const addToCart = (product: POSProduct, variant?: POSVariant) => {
        const price = variant ? product.base_price + variant.price_modifier : product.base_price;

        // Check if item exists (same product + same variant)
        const existingItemIndex = cart.findIndex(item =>
            item.product.id === product.id && item.variant?.id === variant?.id
        );

        if (existingItemIndex >= 0) {
            // Update quantity
            const newCart = [...cart];
            newCart[existingItemIndex].quantity += 1;
            newCart[existingItemIndex].total_price = newCart[existingItemIndex].quantity * newCart[existingItemIndex].unit_price;
            setCart(newCart);
        } else {
            // Add new
            const newItem: CartItem = {
                uuid: generateUUID(),
                product,
                variant,
                quantity: 1,
                unit_price: price,
                total_price: price,
            };
            setCart([...cart, newItem]);
        }
    };

    const updateQuantity = (uuid: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.uuid === uuid) {
                const newQty = Math.max(1, item.quantity + delta);
                return {
                    ...item,
                    quantity: newQty,
                    total_price: newQty * item.unit_price
                };
            }
            return item;
        }));
    };

    const removeItem = (uuid: string) => {
        setCart(prev => prev.filter(item => item.uuid !== uuid));
    };

    const clearCart = () => {
        setCart([]);
        setClient(null);
        setShowCheckout(false);
    };

    const total = useMemo(() => cart.reduce((acc, item) => acc + item.total_price, 0), [cart]);

    const filteredProducts = selectedCategory === 'all'
        ? products
        : products.filter(p => p.category_id === selectedCategory);

    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-gray-50 text-gray-400">Cargando POS...</div>;

    return (
        <div className="h-screen w-full bg-gray-100 flex overflow-hidden">
            {/* Left: Product Selection */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-800 transition-colors">
                            <LayoutDashboard size={20} />
                        </Link>
                        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Punto de Venta</h1>
                    </div>
                </header>

                {/* Category Tags */}
                <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-2 overflow-x-auto no-scrollbar shrink-0">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === 'all'
                                ? 'bg-black text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Todos
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat.id
                                    ? 'bg-black text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Product Grid (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
                    <POSProductGrid products={filteredProducts} onAddToCart={addToCart} />
                    <div className="h-24"></div> {/* Spacer */}
                </div>
            </div>

            {/* Right: Cart (Sidebar) */}
            <div className="w-[400px] shrink-0 h-full border-l border-gray-200 bg-white shadow-xl z-20">
                <POSCart
                    items={cart}
                    client={client}
                    onSetClient={setClient}
                    onUpdateQuantity={updateQuantity}
                    onRemoveItem={removeItem}
                    onCheckout={() => setShowCheckout(true)}
                    total={total}
                />
            </div>

            {/* Modals */}
            {showCheckout && (
                <POSCheckoutModal
                    isOpen={showCheckout}
                    onClose={() => setShowCheckout(false)}
                    items={cart}
                    total={total}
                    client={client}
                    shopCode={config.code}
                    onOrderComplete={clearCart}
                />
            )}
        </div>
    );
}
