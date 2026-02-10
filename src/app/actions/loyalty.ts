'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { nanoid } from 'nanoid';

// ═══════════════════════════════════════════════════════════════
// REFERRAL SYSTEM
// ═══════════════════════════════════════════════════════════════

export async function getReferralCode(userId: string, shopCode: string) {
    const supabase = supabaseAdmin;

    // 1. Check if user already has a code
    const { data: existing } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('shop_code', shopCode)
        .single();

    if (existing) {
        return { success: true, code: existing.code };
    }

    // 2. Generate new code if not
    // Try to use first name + random, or just random
    // Let's use simplified NanoID for readable codes
    const code = nanoid(8).toUpperCase(); // e.g. X7K9P2M4

    const { data: newCode, error } = await supabase
        .from('referral_codes')
        .insert({
            user_id: userId,
            shop_code: shopCode,
            code: code
        })
        .select()
        .single();

    if (error) return { success: false, error: error.message };
    return { success: true, code: newCode.code };
}

export async function validateReferralCode(code: string, shopCode: string) {
    const supabase = supabaseAdmin;

    const { data, error } = await supabase
        .from('referral_codes')
        .select('user_id, code')
        .eq('code', code)
        .eq('shop_code', shopCode)
        .single();

    if (error || !data) return { success: false, valid: false };
    return { success: true, valid: true, referrerId: data.user_id };
}

export async function applyReferral(refereeId: string, code: string, shopCode: string) {
    const supabase = supabaseAdmin;

    // 1. Validate code
    const { success, valid, referrerId } = await validateReferralCode(code, shopCode);
    if (!success || !valid || !referrerId) return { success: false, error: 'Código inválido' };

    // 2. Prevent self-referral
    if (referrerId === refereeId) return { success: false, error: 'No puedes referirte a ti mismo' };

    // 3. Check if already referred
    const { data: existing } = await supabase
        .from('referral_logs')
        .select('id')
        .eq('referee_id', refereeId)
        .eq('shop_code', shopCode)
        .single();

    if (existing) return { success: false, error: 'Ya has sido referido anteriormente' };

    // 4. Create Referral Log
    const { error: logError } = await supabase
        .from('referral_logs')
        .insert({
            referrer_id: referrerId,
            referee_id: refereeId,
            shop_code: shopCode,
            status: 'pending' // Pending until first purchase? Or 'completed' immediately? Let's say pending.
        });

    if (logError) return { success: false, error: logError.message };

    // 5. Update Profile metadata? (optional)
    await supabase.from('profiles').update({ referred_by: referrerId }).eq('id', refereeId);

    // 6. Award points immediately? Or wait for purchase?
    // Policy: Referee gets benefit immediately? Referrer gets benefit on purchase?
    // Let's keep it simple: Just link them for now. Points logic is separate.

    return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// LOYALTY POINTS & REDEMPTION
// ═══════════════════════════════════════════════════════════════

export async function getPoints(userId: string) {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();

    if (error) return { success: false, error: error.message, points: 0 };
    return { success: true, points: data.points || 0 };
}

export async function redeemReward(userId: string, shopCode: string, cost: number, rewardDescription: string) {
    const supabase = supabaseAdmin;

    // 1. Check Balance
    const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();

    if (!profile || (profile.points || 0) < cost) {
        return { success: false, error: 'Puntos insuficientes' };
    }

    // 2. Deduct Points (Transaction)
    // We use a transaction log with negative value? Or just type 'redemption'?
    // The `add_stamp` generic function might complicate things if it only adds.
    // Let's manually deduct points and log it.

    // Start by inserting log
    const { error: logError } = await supabase.from('transaction_logs').insert({
        shop_code: shopCode,
        client_id: userId,
        type: 'redemption',
        description: `Canje: ${rewardDescription}`,
        metadata: { cost: cost }
    });

    if (logError) return { success: false, error: logError.message };

    // Deduct from profile
    const { error: updateError } = await supabase.rpc('decrement_points', {
        user_id: userId,
        amount: cost
    });

    // Note: I need to create `decrement_points` RPC or just do raw update if safe.
    // Raw update is fine since RLS allows service role.
    const { error: rawUpdateError } = await supabase
        .from('profiles')
        .update({ points: (profile.points || 0) - cost })
        .eq('id', userId);

    if (rawUpdateError) return { success: false, error: rawUpdateError.message };

    return { success: true };
}

export async function awardPoints(userId: string, shopCode: string, amount: number, source: string) {
    const supabase = supabaseAdmin;

    // 1. Get current balance
    const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();

    if (!profile) return { success: false, error: 'Usuario no encontrado' };

    const currentPoints = profile.points || 0;
    const newPoints = currentPoints + amount;

    // 2. Update Profile
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: newPoints })
        .eq('id', userId);

    if (updateError) return { success: false, error: updateError.message };

    // 3. Log it
    await supabase.from('transaction_logs').insert({
        shop_code: shopCode,
        client_id: userId,
        type: 'earn_points',
        description: source,
        metadata: { earned: amount, new_balance: newPoints }
    });

    return { success: true, newPoints };
}

// ═══════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════

export async function getReferralStats(referrerId: string) {
    const supabase = supabaseAdmin;

    const { count, error } = await supabase
        .from('referral_logs')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', referrerId);

    if (error) return { success: false, count: 0 };
    return { success: true, count: count || 0 };
}

export async function getLoyaltyMetrics(shopCode: string) {
    const supabase = supabaseAdmin;

    // 1. Total Referrals
    const { count: referralCount } = await supabase
        .from('referral_logs')
        .select('*', { count: 'exact', head: true })
        .eq('shop_code', shopCode);

    // 2. Total Redemptions (from transaction_logs type 'redemption')
    const { count: redemptionCount } = await supabase
        .from('transaction_logs')
        .select('*', { count: 'exact', head: true })
        .eq('shop_code', shopCode)
        .eq('type', 'redemption');

    // 3. Recent Redemptions
    const { data: recentRedemptions } = await supabase
        .from('transaction_logs')
        .select('created_at, description, metadata, profiles:client_id(first_name, last_name, email)')
        .eq('shop_code', shopCode)
        .eq('type', 'redemption')
        .order('created_at', { ascending: false })
        .limit(5);

    // 4. Top Referrers
    // Group by referrer_id? Supabase doesn't support aggregate group by easily in simple select users.
    // We can do it if allow. Or just skip for now.
    // Let's return simple metrics.

    return {
        success: true,
        data: {
            referrals: referralCount || 0,
            redemptions: redemptionCount || 0,
            recentRedemptions: recentRedemptions || []
        }
    };
}
