'use server';


import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Initialize Supabase Client (Service Role needed for mass emailing to avoid RLS issues)
const supabase = supabaseAdmin;

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789'); // Placeholder if missing

/**
 * Generates unsubscribe footer HTML for email campaigns.
 * Uses base64-encoded email as a simple token.
 */
function getUnsubscribeFooter(email: string, baseUrl: string): string {
    const token = Buffer.from(email).toString('base64');
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${token}`;
    return `
        <div style="margin-top: 32px; padding: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 11px; color: #9ca3af; margin: 0;">
                No querés recibir más emails? 
                <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Cancelar suscripción</a>
            </p>
        </div>
    `;
}


export async function saveCampaign(formData: FormData) {
    const id = formData.get('id') as string | null;
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const html = formData.get('html') as string;
    const audience = formData.get('audience') as string;
    const clientCode = formData.get('clientCode') as string || 'mare_cafe'; // Default for now

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    const campaignData = {
        shop_code: clientCode,
        title,
        content,
        html,
        audience,
        status: 'draft',
        updated_at: new Date().toISOString(),
        created_by: user?.id
    };

    let result;
    if (id) {
        // Update existing
        result = await supabase.from('campaigns').update(campaignData).eq('id', id).select().single();
    } else {
        // Create new
        result = await supabase.from('campaigns').insert(campaignData).select().single();
    }

    if (result.error) {
        console.error('Save Campaign Error:', result.error);
        return { success: false, error: result.error.message };
    }

    return { success: true, campaign: result.data };
}

export async function getCampaigns(shopCode: string) {
    const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('shop_code', shopCode)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Get Campaigns Error:', error);
        return [];
    }
    return data;
}

export async function sendCampaign(formData: FormData) {
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const audience = formData.get('audience') as string;
    const testEmail = formData.get('testEmail') as string | null;
    const html = formData.get('html') as string | null;
    const campaignId = formData.get('campaignId') as string | null;
    const clientCode = formData.get('clientCode') as string || 'mare_cafe';

    console.log(`🚀 Starting Campaign: ${title} (ID: ${campaignId || 'New'}) for client: ${clientCode}`);

    try {
        let targets: string[] = [];

        // 1. Determine Targets
        if (testEmail) {
            console.log(`🧪 Test Mode: Sending only to ${testEmail}`);
            targets = [testEmail];
        } else {
            console.log(`👥 Database Mode: Fetching users for audience: ${audience}`);

            let query = supabase.from('profiles').select('email')
                .eq('email_opt_in', true); // Only send to opted-in users

            // Filter by client_code — SECURITY: prevents cross-cafe email sending
            if (clientCode) {
                query = query.or(`client_code.eq.${clientCode},client_code.is.null`);
            }

            // Apply audience filters
            if (audience === 'Nivel 2+ (Frecuentes)') {
                query = query.gte('level', 2);
            } else if (audience === 'Nivel 3+ (VIP)') {
                query = query.gte('level', 3);
            }

            const { data, error } = await query;

            if (error) throw new Error(`DB Error: ${error.message}`);

            targets = data.map(p => p.email).filter(e => e && e.includes('@'));
            console.log(`✅ Found ${targets.length} valid, opted-in targets in Database.`);
        }

        if (targets.length === 0) {
            return { success: false, message: 'No se encontraron destinatarios válidos.' };
        }

        // 2. Create or Update Campaign Record if verified send (not test)
        let activeCampaignId = campaignId;
        if (!testEmail) {
            const campaignData = {
                shop_code: clientCode,
                title,
                content,
                html,
                audience,
                status: 'sent',
                sent_count: targets.length,
                sent_at: new Date().toISOString()
            };

            if (campaignId) {
                await supabase.from('campaigns').update(campaignData).eq('id', campaignId);
            } else {
                const { data: newCamp } = await supabase.from('campaigns').insert(campaignData).select('id').single();
                activeCampaignId = newCamp?.id || null;
            }
        }

        // CHECK IF RESEND KEY IS REAL
        const hasKey = process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('re_123');
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        if (!hasKey) {
            // SIMULATION MODE
            console.log('⚠️ No RESEND_API_KEY found. Simulating delivery.');
            await new Promise(r => setTimeout(r, 1500));
            return {
                success: true,
                message: `[MODO SIMULACIÓN] Campaña procesada exitosamente para ${targets.length} usuarios. (Configura RESEND_API_KEY para envíos reales).`
            };
        }

        // REAL SEND MODE
        const shopName = clientCode === 'mare_cafe' ? 'Mare Cafe' : 'Café';
        const results = [];
        for (const email of targets) {
            const unsubscribeFooter = getUnsubscribeFooter(email, baseUrl);

            let personalizedHtml = html || `
                <div style="font-family: sans-serif; color: #333;">
                    <h1 style="color: #1E3A8A;">${shopName}</h1>
                    <h2>${title}</h2>
                    <p>${content}</p>
                    <br/>
                    <div style="padding: 20px; background-color: #f3f4f6; border-radius: 10px;">
                        <p style="font-size: 12px; color: #888;">Este es un mensaje automático de tu tarjeta de fidelidad.</p>
                    </div>
                </div>
            `;

            // Append unsubscribe footer
            personalizedHtml += unsubscribeFooter;

            if (activeCampaignId) {
                const promoUrl = `${baseUrl}/promo/${activeCampaignId}?user=${encodeURIComponent(email)}`;
                personalizedHtml = personalizedHtml.replace(/{{PROMO_LINK}}/g, promoUrl);
            }

            const result = await resend.emails.send({
                from: `${shopName} <onboarding@resend.dev>`,
                to: email,
                subject: title,
                html: personalizedHtml
            });
            results.push(result);

            // Rate Limit Delay (200ms) - slightly faster
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        const errors = results.filter(r => r.error);
        if (errors.length > 0) {
            console.error('Some emails failed:', errors);
            return { success: true, message: `Enviado a ${targets.length - errors.length} usuarios. (${errors.length} fallidos)` };
        }

        return { success: true, message: `¡Éxito! Enviado a ${targets.length} usuarios.` };

    } catch (error: any) {
        console.error('Campaign Error:', error);
        return { success: false, message: error.message };
    }
}
