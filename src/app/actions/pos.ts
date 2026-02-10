'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { awardPoints } from './loyalty';

// ─── Types ───

export interface OrderInput {
    shop_code: string;
    client_id?: string; // Optional (anonymous order)
    status: 'pending' | 'completed' | 'cancelled';
    payment_method: 'cash' | 'card' | 'transfer' | 'other';
    total_amount: number;
    discount_amount?: number;
    notes?: string;
    items: OrderItemInput[];
}

export interface OrderItemInput {
    product_id: string;
    variant_id?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    notes?: string;
    addons?: any; // JSONb for selected addons
}

// ═══════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════

export async function createOrder(input: OrderInput) {
    const supabase = supabaseAdmin;

    // 1. Create Order parent
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            shop_code: input.shop_code,
            client_id: input.client_id || null,
            status: input.status,
            payment_method: input.payment_method,
            total_amount: input.total_amount,
            discount_amount: input.discount_amount || 0,
            notes: input.notes,
        })
        .select()
        .single();

    if (orderError) return { success: false, error: 'Error creating order: ' + orderError.message };

    // 2. Create Order Items
    const itemsData = input.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        notes: item.notes,
        addons: item.addons,
    }));

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsData);

    if (itemsError) {
        // Rollback (delete order) - basic cleanup
        await supabase.from('orders').delete().eq('id', order.id);
        return { success: false, error: 'Error creating items: ' + itemsError.message };
    }

    // 3. Log Transaction & Add Stamps (if client exists)
    if (input.client_id) {
        // Calculate stamps based on total purchase logic? 
        // Or per-product? Assuming 1 stamp per order for now, OR rely on a separate 'addStamps' call.
        // For Mare Cafe, simplified logic: 1 stamp per drink/item usually.
        // Let's count items that are "stampable" (e.g. coffee).
        // Since we don't have 'is_stampable' on products yet, we might need to assume 1 stamp per X amount or manually Add.
        // **DECISION**: Auto-add transaction log for record keeping, but maybe leave 'Stamps' to explicit user action or auto-calculate based on item count.
        // Let's add a log entry for the purchase itself.

        await supabase.from('transaction_logs').insert({
            shop_code: input.shop_code,
            client_id: input.client_id,
            admin_id: null, // System / POS
            type: 'purchase', // New type? Or reuse 'add_stamps'? Let's perform 'purchase'.
            description: `Compra POS - Orden #${order.id.slice(0, 8)}`,
            metadata: { order_id: order.id, total: input.total_amount }
        });

        // Award stamps (1 per item quantity for now)
        const totalStamps = input.items.reduce((acc, item) => acc + item.quantity, 0);
        if (totalStamps > 0) {
            await awardPoints(input.client_id, input.shop_code, totalStamps, `Compra POS #${order.id.slice(0, 8)}`);
        }
    }

    return { success: true, data: order };
}

// ═══════════════════════════════════════════════════════════════
// SEARCH CLIENTS (Optimized for POS)
// ═══════════════════════════════════════════════════════════════

export async function searchClientsPOS(term: string) {
    const supabase = supabaseAdmin;
    // Search by name, email, or phone (if available)
    // Using ILIKE for partial match
    const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, client_code')
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(10); // Quick results

    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, data: data || [] };
}
