'use server';


import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Initialize Supabase Client (Service Role needed for mass emailing to avoid RLS issues)
const supabase = supabaseAdmin;

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789'); // Placeholder if missing

export async function sendCampaign(formData: FormData) {
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const audience = formData.get('audience') as string;
    const testEmail = formData.get('testEmail') as string | null;
    const html = formData.get('html') as string | null;
    const campaignId = formData.get('campaignId') as string | null;

    console.log(`🚀 Starting Campaign: ${title} (ID: ${campaignId || 'None'})`);

    try {
        let targets: string[] = [];

        // 1. Determine Targets
        if (testEmail) {
            console.log(`🧪 Test Mode: Sending only to ${testEmail}`);
            targets = [testEmail];
        } else {
            console.log(`👥 Database Mode: Fetching users for audience: ${audience}`);

            let query = supabase.from('profiles').select('email');

            // Apply Filters
            if (audience === 'Nivel 2+ (Frecuentes)') {
                query = query.gte('level', 2);
            } else if (audience === 'Nivel 3+ (VIP)') {
                query = query.gte('level', 3);
            }
            // 'Todos' gets everyone

            const { data, error } = await query;

            if (error) throw new Error(`DB Error: ${error.message}`);

            targets = data.map(p => p.email).filter(e => e && e.includes('@')); // Simple validation
            console.log(`✅ Found ${targets.length} valid targets in Database.`);
        }

        if (targets.length === 0) {
            return { success: false, message: 'No se encontraron destinatarios válidos.' };
        }

        // 2. Send Emails (Batching or Loop)
        // For MVP, we loop. Resend has batch API too.

        // CHECK IF RESEND KEY IS REAL
        const hasKey = process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('re_123');
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'; // Define this in env vars

        if (!hasKey) {
            // SIMULATION MODE
            console.log('⚠️ No RESEND_API_KEY found. Simulating delivery.');
            await new Promise(r => setTimeout(r, 1500)); // Fake delay
            return {
                success: true,
                message: `[MODO SIMULACIÓN] Campaña procesada exitosamente para ${targets.length} usuarios. (Configura RESEND_API_KEY para envíos reales).`
            };
        }

        // REAL SEND MODE
        const results = [];
        for (const email of targets) {
            // Generate Personalized Content
            let personalizedHtml = html || `
                <div style="font-family: sans-serif; color: #333;">
                    <h1 style="color: #1E3A8A;">Mare Cafe</h1>
                    <h2>${title}</h2>
                    <p>${content}</p>
                    <br/>
                    <div style="padding: 20px; background-color: #f3f4f6; border-radius: 10px;">
                        <p style="font-size: 12px; color: #888;">Este es un mensaje automático de tu tarjeta de fidelidad.</p>
                    </div>
                </div>
            `;

            if (campaignId) {
                const promoUrl = `${baseUrl}/promo/${campaignId}?user=${encodeURIComponent(email)}`;
                personalizedHtml = personalizedHtml.replace(/{{PROMO_LINK}}/g, promoUrl);
            }

            const result = await resend.emails.send({
                from: 'Mare Cafe <onboarding@resend.dev>', // Default Resend Testing Domain
                to: email,
                subject: title,
                html: personalizedHtml
            });
            results.push(result);

            // Rate Limit Delay (500ms)
            await new Promise(resolve => setTimeout(resolve, 500));
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
