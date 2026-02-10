import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Unsubscribe endpoint for email marketing opt-out.
 * 
 * GET /api/unsubscribe?token=<base64_encoded_email>
 * 
 * Sets email_opt_in = false for the profile matching the decoded email.
 * Returns a simple HTML page confirming the unsubscription.
 */
export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
        return new NextResponse(renderHTML('Error', 'Token inválido.'), {
            status: 400,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    }

    try {
        const email = Buffer.from(token, 'base64').toString('utf-8');

        if (!email || !email.includes('@')) {
            return new NextResponse(renderHTML('Error', 'Email inválido.'), {
                status: 400,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
        }

        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ email_opt_in: false })
            .eq('email', email);

        if (error) {
            console.error('Unsubscribe error:', error);
            return new NextResponse(renderHTML('Error', 'No pudimos procesar tu solicitud. Intenta de nuevo más tarde.'), {
                status: 500,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
        }

        return new NextResponse(
            renderHTML(
                '¡Listo!',
                'Te has dado de baja exitosamente. No recibirás más emails de marketing. Si fue un error, contactanos.'
            ),
            { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
    } catch {
        return new NextResponse(renderHTML('Error', 'Ocurrió un error inesperado.'), {
            status: 500,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    }
}

function renderHTML(title: string, message: string): string {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
                background: #FAF8F4;
                color: #2A2A2E;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
            }
            .card {
                background: white;
                border-radius: 20px;
                padding: 40px;
                max-width: 420px;
                text-align: center;
                box-shadow: 0 2px 12px rgba(0,0,0,0.06);
                border: 1px solid #E5E1D9;
            }
            h1 {
                color: #1A3278;
                font-size: 24px;
                margin-bottom: 12px;
            }
            p {
                font-size: 15px;
                color: #8C8B88;
                line-height: 1.6;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>${title}</h1>
            <p>${message}</p>
        </div>
    </body>
    </html>
    `;
}
