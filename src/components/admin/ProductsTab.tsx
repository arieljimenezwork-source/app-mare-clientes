'use client';

/**
 * ProductsTab — Admin panel tab for managing the product catalog.
 * 
 * Features:
 * - Category management (inline add/edit/delete)
 * - Product grid with filter by category
 * - Add/Edit product modal with variants
 * - Toggle product active/inactive
 * - Visual tags (vegano, sin gluten, nuevo, popular)
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Package, Plus, Pencil, Trash2, X, ChevronDown, Tag, Check, ToggleLeft, ToggleRight,
    Coffee, Layers, GripVertical, Image as ImageIcon
} from 'lucide-react';
import {
    getCategories, getProducts, createCategory, updateCategory, deleteCategory,
    createProduct, updateProduct, deleteProduct, toggleProductActive,
    createVariant, deleteVariant
} from '@/app/actions/catalog';

// ─── Design Tokens (matches MareDashboard) ───
const MARE = {
    primary: '#1A3278',
    primaryHover: '#243D8A',
    blueSoft: '#4A6BB5',
    surface: '#F2EDE3',
    canvas: '#FAF8F4',
    gold: '#C8A96E',
    goldLight: '#E8D5A0',
    ink: '#2A2A2E',
    stone: '#8C8B88',
    mist: '#E5E1D9',
    sage: '#5B8C6A',
    terracotta: '#C0574A',
} as const;

const FONTS = {
    serif: 'var(--font-dm-serif), Georgia, serif',
    sans: 'var(--font-jakarta), system-ui, sans-serif',
    mono: 'var(--font-jetbrains), monospace',
} as const;

// ─── Tag colors ───
const TAG_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    vegano: { bg: '#DEF7E5', text: '#166534', label: '🌱 Vegano' },
    sin_gluten: { bg: '#FEF3C7', text: '#92400E', label: '🌾 Sin Gluten' },
    nuevo: { bg: '#DBEAFE', text: '#1E40AF', label: '✨ Nuevo' },
    popular: { bg: '#FDE5D8', text: '#C0574A', label: '🔥 Popular' },
    sin_lactosa: { bg: '#F3E8FF', text: '#6B21A8', label: '🥛 Sin Lactosa' },
    especial: { bg: '#FCE7F3', text: '#9D174D', label: '⭐ Especial' },
};

const ALL_TAGS = Object.keys(TAG_COLORS);

// ─── Types ───
interface Category {
    id: string;
    name: string;
    icon?: string;
    sort_order: number;
    is_active: boolean;
}

interface Variant {
    id: string;
    name: string;
    price_modifier: number;
    is_default: boolean;
    sort_order: number;
}

interface Product {
    id: string;
    name: string;
    description?: string;
    base_price: number;
    image_url?: string;
    tags: string[];
    category_id?: string;
    category?: { id: string; name: string; icon?: string };
    variants?: Variant[];
    is_active: boolean;
    sort_order: number;
}

interface ProductForm {
    name: string;
    description: string;
    base_price: string;
    image_url: string;
    category_id: string;
    tags: string[];
    variants: { name: string; price_modifier: string; is_default: boolean }[];
}

const EMPTY_FORM: ProductForm = {
    name: '', description: '', base_price: '', image_url: '',
    category_id: '', tags: [], variants: [],
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function ProductsTab({ shopCode }: { shopCode: string }) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    // Category management
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // ─── Data Loading ───
    const loadData = useCallback(async () => {
        setLoading(true);
        const [catResult, prodResult] = await Promise.all([
            getCategories(shopCode),
            getProducts(shopCode),
        ]);
        if (catResult.success) setCategories(catResult.data as Category[]);
        if (prodResult.success) setProducts(prodResult.data as Product[]);
        setLoading(false);
    }, [shopCode]);

    useEffect(() => { loadData(); }, [loadData]);

    // ─── Category Handlers ───
    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        const result = await createCategory({
            shop_code: shopCode,
            name: newCategoryName.trim(),
            sort_order: categories.length,
        });
        if (result.success) {
            setNewCategoryName('');
            loadData();
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory) return;
        await updateCategory(editingCategory.id, { name: editingCategory.name });
        setEditingCategory(null);
        loadData();
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('¿Eliminar esta categoría? Los productos se quedarán sin categoría.')) return;
        await deleteCategory(id);
        loadData();
    };

    // ─── Product Handlers ───
    const openNewProduct = () => {
        setEditingProduct(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const openEditProduct = (product: Product) => {
        setEditingProduct(product);
        setForm({
            name: product.name,
            description: product.description || '',
            base_price: String(product.base_price),
            image_url: product.image_url || '',
            category_id: product.category_id || '',
            tags: product.tags || [],
            variants: (product.variants || []).map(v => ({
                name: v.name,
                price_modifier: String(v.price_modifier),
                is_default: v.is_default,
            })),
        });
        setShowModal(true);
    };

    const handleSaveProduct = async () => {
        if (!form.name.trim() || !form.base_price) return;
        setSaving(true);
        try {
            const productData = {
                shop_code: shopCode,
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                base_price: parseFloat(form.base_price),
                image_url: form.image_url.trim() || undefined,
                category_id: form.category_id || undefined,
                tags: form.tags,
            };

            let productId: string;

            if (editingProduct) {
                const result = await updateProduct(editingProduct.id, productData);
                if (!result.success) throw new Error(result.error);
                productId = editingProduct.id;

                // Delete old variants and recreate
                if (editingProduct.variants) {
                    for (const v of editingProduct.variants) {
                        await deleteVariant(v.id);
                    }
                }
            } else {
                const result = await createProduct(productData);
                if (!result.success) throw new Error(result.error);
                productId = result.data.id;
            }

            // Create variants
            for (let i = 0; i < form.variants.length; i++) {
                const v = form.variants[i];
                if (v.name.trim()) {
                    await createVariant({
                        product_id: productId,
                        name: v.name.trim(),
                        price_modifier: parseFloat(v.price_modifier) || 0,
                        is_default: v.is_default,
                        sort_order: i,
                    });
                }
            }

            setShowModal(false);
            loadData();
        } catch (e: any) {
            alert('Error: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
        await deleteProduct(id);
        loadData();
    };

    const handleToggleActive = async (product: Product) => {
        await toggleProductActive(product.id, !product.is_active);
        loadData();
    };

    // ─── Form helpers ───
    const toggleTag = (tag: string) => {
        setForm(f => ({
            ...f,
            tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
        }));
    };

    const addVariant = () => {
        setForm(f => ({
            ...f,
            variants: [...f.variants, { name: '', price_modifier: '0', is_default: false }],
        }));
    };

    const removeVariant = (idx: number) => {
        setForm(f => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }));
    };

    const updateVariantField = (idx: number, field: string, value: any) => {
        setForm(f => ({
            ...f,
            variants: f.variants.map((v, i) => i === idx ? { ...v, [field]: value } : v),
        }));
    };

    // ─── Filtered products ───
    const filteredProducts = selectedCategory === 'all'
        ? products
        : products.filter(p => p.category_id === selectedCategory);

    // ═══ RENDER ═══

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 40, color: MARE.stone }}>
                <Coffee size={32} style={{ margin: '0 auto 12px', opacity: 0.4, animation: 'spin 2s linear infinite' }} />
                <p style={{ fontSize: 14 }}>Cargando catálogo...</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="mare-fade-up">

            {/* ─── Header ─── */}
            <div style={{
                background: '#fff', borderRadius: 20, padding: 20, border: `1px solid ${MARE.mist}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
            }}>
                <div>
                    <h3 style={{ fontFamily: FONTS.serif, fontSize: 20, color: MARE.primary, margin: 0, letterSpacing: '-0.02em' }}>
                        Catálogo de Productos
                    </h3>
                    <p style={{ fontSize: 13, color: MARE.stone, margin: '4px 0 0' }}>
                        {products.length} productos • {categories.length} categorías
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowCategoryManager(s => !s)} style={{
                        padding: '10px 16px', borderRadius: 12, border: `1.5px solid ${MARE.mist}`,
                        background: 'transparent', color: MARE.primary,
                        fontFamily: FONTS.sans, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <Layers size={16} /> Categorías
                    </button>
                    <button onClick={openNewProduct} style={{
                        padding: '10px 16px', borderRadius: 12, border: 'none',
                        background: MARE.primary, color: MARE.surface,
                        fontFamily: FONTS.sans, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <Plus size={16} /> Nuevo Producto
                    </button>
                </div>
            </div>

            {/* ─── Category Manager (collapsible) ─── */}
            {showCategoryManager && (
                <div style={{
                    background: '#fff', borderRadius: 20, padding: 20, border: `1px solid ${MARE.mist}`,
                }}>
                    <h4 style={{ fontFamily: FONTS.sans, fontSize: 15, fontWeight: 700, color: MARE.ink, marginBottom: 16 }}>
                        Gestión de Categorías
                    </h4>
                    {categories.map(cat => (
                        <div key={cat.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                            borderBottom: `0.5px solid ${MARE.mist}`,
                        }}>
                            <GripVertical size={14} style={{ color: MARE.mist, cursor: 'grab' }} />
                            {editingCategory?.id === cat.id ? (
                                <>
                                    <input
                                        value={editingCategory.name}
                                        onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                        style={{
                                            flex: 1, padding: '6px 10px', borderRadius: 8,
                                            border: `1.5px solid ${MARE.primary}`, fontSize: 14, outline: 'none',
                                        }}
                                        autoFocus
                                        onKeyDown={e => e.key === 'Enter' && handleUpdateCategory()}
                                    />
                                    <button onClick={handleUpdateCategory} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MARE.sage }}>
                                        <Check size={18} />
                                    </button>
                                    <button onClick={() => setEditingCategory(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MARE.stone }}>
                                        <X size={18} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span style={{ flex: 1, fontSize: 14, color: MARE.ink }}>{cat.icon || '📂'} {cat.name}</span>
                                    <button onClick={() => setEditingCategory(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MARE.stone }}>
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => handleDeleteCategory(cat.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MARE.terracotta }}>
                                        <Trash2 size={14} />
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                        <input
                            placeholder="Nueva categoría..."
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                            style={{
                                flex: 1, padding: '8px 12px', borderRadius: 10,
                                border: `1.5px solid ${MARE.mist}`, fontSize: 13, outline: 'none',
                            }}
                        />
                        <button onClick={handleAddCategory} style={{
                            padding: '8px 14px', borderRadius: 10, border: 'none',
                            background: MARE.sage, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}>
                            Agregar
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Category Filter Tabs ─── */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                <button
                    onClick={() => setSelectedCategory('all')}
                    style={{
                        padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        fontSize: 12, fontWeight: 600, fontFamily: FONTS.sans, whiteSpace: 'nowrap',
                        background: selectedCategory === 'all' ? MARE.primary : '#fff',
                        color: selectedCategory === 'all' ? MARE.surface : MARE.stone,
                        transition: 'all 200ms ease',
                    }}
                >
                    Todos ({products.length})
                </button>
                {categories.map(cat => {
                    const count = products.filter(p => p.category_id === cat.id).length;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            style={{
                                padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                fontSize: 12, fontWeight: 600, fontFamily: FONTS.sans, whiteSpace: 'nowrap',
                                background: selectedCategory === cat.id ? MARE.primary : '#fff',
                                color: selectedCategory === cat.id ? MARE.surface : MARE.stone,
                                transition: 'all 200ms ease',
                            }}
                        >
                            {cat.icon || ''} {cat.name} ({count})
                        </button>
                    );
                })}
                {/* uncategorized */}
                {products.some(p => !p.category_id) && (
                    <button
                        onClick={() => setSelectedCategory('uncategorized')}
                        style={{
                            padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                            fontSize: 12, fontWeight: 600, fontFamily: FONTS.sans, whiteSpace: 'nowrap',
                            background: selectedCategory === 'uncategorized' ? MARE.primary : '#fff',
                            color: selectedCategory === 'uncategorized' ? MARE.surface : MARE.stone,
                        }}
                    >
                        Sin Categoría ({products.filter(p => !p.category_id).length})
                    </button>
                )}
            </div>

            {/* ─── Products Grid ─── */}
            {filteredProducts.length === 0 ? (
                <div style={{
                    background: '#fff', borderRadius: 20, padding: 40, border: `1px solid ${MARE.mist}`,
                    textAlign: 'center', color: MARE.stone,
                }}>
                    <Package size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p style={{ fontSize: 14, marginBottom: 12 }}>No hay productos en esta categoría.</p>
                    <button onClick={openNewProduct} style={{
                        padding: '10px 20px', borderRadius: 12, border: 'none',
                        background: MARE.primary, color: MARE.surface,
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>
                        <Plus size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Agregar Producto
                    </button>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 14,
                }}>
                    {filteredProducts.map(product => (
                        <div key={product.id} style={{
                            background: '#fff', borderRadius: 16, border: `1px solid ${MARE.mist}`,
                            overflow: 'hidden', opacity: product.is_active ? 1 : 0.55,
                            transition: 'all 200ms ease',
                        }}>
                            {/* Image */}
                            <div style={{
                                height: 140, background: `linear-gradient(135deg, ${MARE.canvas}, ${MARE.mist})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', position: 'relative',
                            }}>
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} style={{
                                        width: '100%', height: '100%', objectFit: 'cover',
                                    }} />
                                ) : (
                                    <Coffee size={32} style={{ color: MARE.mist }} />
                                )}
                                {!product.is_active && (
                                    <div style={{
                                        position: 'absolute', top: 8, right: 8,
                                        background: 'rgba(0,0,0,0.6)', color: '#fff',
                                        padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                                    }}>
                                        INACTIVO
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div style={{ padding: '14px 16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                    <h4 style={{ fontSize: 14, fontWeight: 700, color: MARE.ink, margin: 0, lineHeight: 1.3 }}>
                                        {product.name}
                                    </h4>
                                    <span style={{
                                        fontSize: 15, fontWeight: 700, color: MARE.primary,
                                        fontFamily: FONTS.mono, whiteSpace: 'nowrap', marginLeft: 8,
                                    }}>
                                        ${product.base_price}
                                    </span>
                                </div>

                                {product.description && (
                                    <p style={{ fontSize: 12, color: MARE.stone, margin: '4px 0 0', lineHeight: 1.4 }}>
                                        {product.description.length > 60 ? product.description.slice(0, 60) + '...' : product.description}
                                    </p>
                                )}

                                {/* Category badge */}
                                {product.category && (
                                    <span style={{
                                        display: 'inline-block', marginTop: 8,
                                        fontSize: 10, fontWeight: 600, color: MARE.stone,
                                        background: MARE.canvas, padding: '3px 8px', borderRadius: 6,
                                    }}>
                                        {product.category.icon || '📂'} {product.category.name}
                                    </span>
                                )}

                                {/* Tags */}
                                {product.tags && product.tags.length > 0 && (
                                    <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                                        {product.tags.map(tag => {
                                            const tc = TAG_COLORS[tag];
                                            if (!tc) return null;
                                            return (
                                                <span key={tag} style={{
                                                    fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 5,
                                                    background: tc.bg, color: tc.text,
                                                }}>
                                                    {tc.label}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Variants */}
                                {product.variants && product.variants.length > 0 && (
                                    <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                        {product.variants.map(v => (
                                            <span key={v.id} style={{
                                                fontSize: 10, padding: '2px 6px', borderRadius: 5,
                                                border: `1px solid ${MARE.mist}`, color: MARE.stone,
                                            }}>
                                                {v.name} {v.price_modifier > 0 ? `+$${v.price_modifier}` : ''}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 6, marginTop: 12, borderTop: `0.5px solid ${MARE.mist}`, paddingTop: 12 }}>
                                    <button onClick={() => openEditProduct(product)} style={{
                                        flex: 1, padding: '7px 0', borderRadius: 8, border: `1px solid ${MARE.mist}`,
                                        background: 'transparent', color: MARE.primary,
                                        fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                    }}>
                                        <Pencil size={12} /> Editar
                                    </button>
                                    <button onClick={() => handleToggleActive(product)} style={{
                                        padding: '7px 10px', borderRadius: 8, border: `1px solid ${MARE.mist}`,
                                        background: 'transparent', color: product.is_active ? MARE.sage : MARE.stone,
                                        fontSize: 12, cursor: 'pointer',
                                    }} title={product.is_active ? 'Desactivar' : 'Activar'}>
                                        {product.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                    </button>
                                    <button onClick={() => handleDeleteProduct(product.id)} style={{
                                        padding: '7px 10px', borderRadius: 8, border: `1px solid ${MARE.mist}`,
                                        background: 'transparent', color: MARE.terracotta,
                                        fontSize: 12, cursor: 'pointer',
                                    }} title="Eliminar">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ═══ Product Modal ═══ */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(26,50,120,0.3)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    padding: '40px 20px', overflowY: 'auto',
                }} onClick={() => setShowModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: '#fff', borderRadius: 24, padding: 32, maxWidth: 540, width: '100%',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, color: MARE.primary, margin: 0 }}>
                                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                            </h3>
                            <button onClick={() => setShowModal(false)} style={{
                                background: 'none', border: 'none', cursor: 'pointer', color: MARE.stone,
                            }}>
                                <X size={22} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Name */}
                            <div>
                                <label style={labelStyle}>Nombre *</label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Ej: Cappuccino Clásico"
                                    style={inputStyle}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label style={labelStyle}>Descripción</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Descripción breve del producto..."
                                    rows={2}
                                    style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
                                />
                            </div>

                            {/* Price + Category row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={labelStyle}>Precio Base *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.base_price}
                                        onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))}
                                        placeholder="0.00"
                                        style={{ ...inputStyle, fontFamily: FONTS.mono, fontWeight: 700 }}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Categoría</label>
                                    <select
                                        value={form.category_id}
                                        onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                                        style={{ ...inputStyle, cursor: 'pointer' }}
                                    >
                                        <option value="">Sin categoría</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.icon || ''} {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Image URL */}
                            <div>
                                <label style={labelStyle}>URL de Imagen</label>
                                <input
                                    value={form.image_url}
                                    onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                                    placeholder="https://..."
                                    style={inputStyle}
                                />
                                {form.image_url && (
                                    <div style={{ marginTop: 8, borderRadius: 10, overflow: 'hidden', height: 100 }}>
                                        <img src={form.image_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                            </div>

                            {/* Tags */}
                            <div>
                                <label style={labelStyle}>Etiquetas</label>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {ALL_TAGS.map(tag => {
                                        const tc = TAG_COLORS[tag];
                                        const isSelected = form.tags.includes(tag);
                                        return (
                                            <button
                                                key={tag}
                                                onClick={() => toggleTag(tag)}
                                                style={{
                                                    padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                                                    fontSize: 12, fontWeight: 600, transition: 'all 150ms ease',
                                                    background: isSelected ? tc.bg : '#f9f9f8',
                                                    color: isSelected ? tc.text : MARE.stone,
                                                    border: isSelected ? `1.5px solid ${tc.text}30` : `1px solid ${MARE.mist}`,
                                                }}
                                            >
                                                {tc.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Variants */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <label style={labelStyle}>Variantes (tamaños, etc.)</label>
                                    <button onClick={addVariant} style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: MARE.primary, fontSize: 12, fontWeight: 600,
                                        display: 'flex', alignItems: 'center', gap: 4,
                                    }}>
                                        <Plus size={14} /> Agregar
                                    </button>
                                </div>
                                {form.variants.map((v, idx) => (
                                    <div key={idx} style={{
                                        display: 'grid', gridTemplateColumns: '2fr 1fr auto auto', gap: 8,
                                        alignItems: 'center', marginBottom: 8,
                                    }}>
                                        <input
                                            value={v.name}
                                            onChange={e => updateVariantField(idx, 'name', e.target.value)}
                                            placeholder="Ej: Grande"
                                            style={{ ...inputStyle, padding: '8px 10px', fontSize: 13 }}
                                        />
                                        <input
                                            type="number"
                                            value={v.price_modifier}
                                            onChange={e => updateVariantField(idx, 'price_modifier', e.target.value)}
                                            placeholder="+$"
                                            style={{ ...inputStyle, padding: '8px 10px', fontSize: 13, fontFamily: FONTS.mono }}
                                        />
                                        <button
                                            onClick={() => updateVariantField(idx, 'is_default', !v.is_default)}
                                            title="Variante por defecto"
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: v.is_default ? MARE.sage : MARE.mist,
                                            }}
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button onClick={() => removeVariant(idx)} style={{
                                            background: 'none', border: 'none', cursor: 'pointer', color: MARE.terracotta,
                                        }}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                                {form.variants.length === 0 && (
                                    <p style={{ fontSize: 12, color: MARE.stone, fontStyle: 'italic' }}>
                                        Sin variantes. El producto se venderá al precio base.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                            <button onClick={() => setShowModal(false)} style={{
                                flex: 1, padding: '14px 0', borderRadius: 12, border: `1px solid ${MARE.mist}`,
                                background: 'transparent', color: MARE.stone, fontSize: 14, fontWeight: 600,
                                cursor: 'pointer', fontFamily: FONTS.sans,
                            }}>
                                Cancelar
                            </button>
                            <button onClick={handleSaveProduct} disabled={saving || !form.name.trim() || !form.base_price} style={{
                                flex: 1, padding: '14px 0', borderRadius: 12, border: 'none',
                                background: MARE.primary, color: MARE.surface, fontSize: 14, fontWeight: 600,
                                cursor: 'pointer', fontFamily: FONTS.sans,
                                opacity: saving || !form.name.trim() || !form.base_price ? 0.5 : 1,
                            }}>
                                {saving ? 'Guardando...' : editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Shared styles ───
const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: '#8C8B88', display: 'block', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 12,
    border: '1.5px solid #E5E1D9', fontSize: 14, outline: 'none',
    fontFamily: 'var(--font-jakarta), system-ui, sans-serif',
    boxSizing: 'border-box',
    transition: 'border-color 150ms ease',
};
