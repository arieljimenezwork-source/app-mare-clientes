'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

const supabase = supabaseAdmin;

// ─── Types ───

export interface CategoryInput {
    shop_code: string;
    name: string;
    icon?: string;
    sort_order?: number;
    is_active?: boolean;
}

export interface ProductInput {
    shop_code: string;
    category_id?: string;
    name: string;
    description?: string;
    base_price: number;
    image_url?: string;
    tags?: string[];
    is_active?: boolean;
    sort_order?: number;
}

export interface VariantInput {
    product_id: string;
    name: string;
    price_modifier?: number;
    is_default?: boolean;
    sort_order?: number;
}

export interface AddonInput {
    shop_code: string;
    name: string;
    price?: number;
    addon_group?: string;
    is_active?: boolean;
    sort_order?: number;
}

// ═══════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════

export async function getCategories(shopCode: string) {
    const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('shop_code', shopCode)
        .order('sort_order', { ascending: true });

    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, data: data || [] };
}

export async function createCategory(input: CategoryInput) {
    const { data, error } = await supabase
        .from('product_categories')
        .insert(input)
        .select()
        .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

export async function updateCategory(id: string, updates: Partial<CategoryInput>) {
    const { data, error } = await supabase
        .from('product_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

export async function deleteCategory(id: string) {
    const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════

export async function getProducts(shopCode: string) {
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            category:product_categories(id, name, icon),
            variants:product_variants(id, name, price_modifier, is_default, sort_order)
        `)
        .eq('shop_code', shopCode)
        .order('sort_order', { ascending: true });

    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, data: data || [] };
}

export async function createProduct(input: ProductInput) {
    const { data, error } = await supabase
        .from('products')
        .insert(input)
        .select()
        .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

export async function updateProduct(id: string, updates: Partial<ProductInput>) {
    const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

export async function deleteProduct(id: string) {
    // Cascade: variants are deleted automatically via FK
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function toggleProductActive(id: string, isActive: boolean) {
    const { error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// VARIANTS
// ═══════════════════════════════════════════════════════════════

export async function getVariants(productId: string) {
    const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });

    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, data: data || [] };
}

export async function createVariant(input: VariantInput) {
    const { data, error } = await supabase
        .from('product_variants')
        .insert(input)
        .select()
        .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

export async function updateVariant(id: string, updates: Partial<VariantInput>) {
    const { data, error } = await supabase
        .from('product_variants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

export async function deleteVariant(id: string) {
    const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// ADDONS
// ═══════════════════════════════════════════════════════════════

export async function getAddons(shopCode: string) {
    const { data, error } = await supabase
        .from('product_addons')
        .select('*')
        .eq('shop_code', shopCode)
        .order('sort_order', { ascending: true });

    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, data: data || [] };
}

export async function createAddon(input: AddonInput) {
    const { data, error } = await supabase
        .from('product_addons')
        .insert(input)
        .select()
        .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

export async function updateAddon(id: string, updates: Partial<AddonInput>) {
    const { data, error } = await supabase
        .from('product_addons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

export async function deleteAddon(id: string) {
    const { error } = await supabase
        .from('product_addons')
        .delete()
        .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// FAVORITES (Client-side)
// ═══════════════════════════════════════════════════════════════

export async function getFavorites(userId: string) {
    const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', userId);

    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, data: (data || []).map(f => f.product_id) };
}

export async function toggleFavorite(userId: string, productId: string) {
    // Check if exists
    const { data: existing } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

    if (existing) {
        // Remove
        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('id', existing.id);

        if (error) return { success: false, error: error.message };
        return { success: true, isFavorite: false };
    } else {
        // Add
        const { error } = await supabase
            .from('favorites')
            .insert({ user_id: userId, product_id: productId });

        if (error) return { success: false, error: error.message };
        return { success: true, isFavorite: true };
    }
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC MENU — For client-side menu display
// ═══════════════════════════════════════════════════════════════

export async function getPublicMenu(shopCode: string) {
    const [categoriesResult, productsResult] = await Promise.all([
        supabase
            .from('product_categories')
            .select('id, name, icon, sort_order')
            .eq('shop_code', shopCode)
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
        supabase
            .from('products')
            .select(`
                id, name, description, base_price, image_url, tags, category_id, sort_order,
                variants:product_variants(id, name, price_modifier, is_default, sort_order)
            `)
            .eq('shop_code', shopCode)
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
    ]);

    return {
        categories: categoriesResult.data || [],
        products: productsResult.data || [],
    };
}
