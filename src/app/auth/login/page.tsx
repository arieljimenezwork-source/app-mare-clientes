'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useClientConfig } from '@/context/ClientConfigContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Loader2, Store, User } from 'lucide-react';
import PoweredBy from '@/components/PoweredBy';
import Link from 'next/link';

function AuthContent() {
    const params = useSearchParams();
    const router = useRouter();
    const config = useClientConfig();

    const role = params.get('role') as 'customer' | 'staff' | null;
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [shopPin, setShopPin] = useState(''); // Only for staff registration

    // Validation / Error
    const [error, setError] = useState<string | null>(null);

    // If no role specified, redirect to landing
    useEffect(() => {
        if (!role || !['customer', 'staff'].includes(role)) {
            router.push('/');
        }
    }, [role, router]);

    if (!role) return null;

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                // --- LOGIN FLOW ---
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                // Check if user has the correct role AND correct client
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, client_code') // Fetch client_code
                    .eq('id', data.user.id)
                    .single();

                // 1. Role Check
                if (profile?.role !== role && profile?.role !== 'admin') {
                    throw new Error(`Este usuario no está registrado como ${role === 'customer' ? 'Cliente' : 'Staff'}.`);
                }

                // 2. Client Isolation Check
                // STRICT RULE for Perezoso: Must match exactly.
                if (config.code === 'perezoso_cafe') {
                    if (profile?.client_code !== 'perezoso_cafe' && profile?.role !== 'admin') {
                        throw new Error(`Esta cuenta no está registrada en Perezoso Cafe.`);
                    }
                }
                // LEGACY RULE for Mare: Allow 'mare_cafe' OR null (old users)
                else if (config.code === 'mare_cafe') {
                    if (profile?.client_code && profile.client_code !== 'mare_cafe' && profile?.role !== 'admin') {
                        throw new Error(`Esta cuenta pertenece a otro comercio.`);
                    }
                }
                // GENERIC: fallback
                else {
                    if (profile?.client_code && profile.client_code !== config.code && profile?.role !== 'admin') {
                        throw new Error(`Esta cuenta no pertenece a ${config.name}.`);
                    }
                }

                // If profile has NO client_code, we effectively treat it as "Global" or "Legacy Mare".
                // To force strictness, we could say: if (!profile.client_code && config.code !== 'mare_cafe') throw Error...
                // But let's stick to positive match if present for now to avoid locking out existing dev users.

                // Redirect based on role
                if (role === 'customer') router.push('/client');
                else if (profile?.role === 'admin') router.push('/admin');
                else router.push('/staff');

            } else {
                // --- SIGN UP FLOW ---

                // ... (PIN logic remains same) ...

                // 1. PIN Verification & Role Assignment
                let finalRole: 'customer' | 'staff' | 'admin' | null = role;

                if (role === 'staff') {
                    // SECURE PIN VERIFICATION
                    const { data: verification, error: verifyError } = await supabase
                        .rpc('verify_shop_pin', { input_pin: shopPin, shop_code: config.code });

                    if (verifyError || !verification?.valid) {
                        throw new Error('PIN de tienda inválido.');
                    }

                    finalRole = verification.role === 'admin' ? 'admin' : 'staff';
                }

                // 2. Create Auth User
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            role: finalRole,
                            client_code: config.code, // Save client code in auth metadata too
                        }
                    }
                });

                if (signUpError) throw signUpError;

                // 3. Create Profile Entry manually
                if (data.user) {
                    const { error: profileError } = await supabase.from('profiles').insert({
                        id: data.user.id,
                        email: email,
                        role: finalRole,
                        full_name: fullName,
                        client_code: config.code, // IMPORTANT: Associate user with THIS client
                    });
                    if (profileError) console.error("Profile creation warning:", profileError);
                }

                alert('Registro exitoso. ¡Bienvenido!');
                if (finalRole === 'customer') router.push('/client');
                else if (finalRole === 'admin') router.push('/admin');
                else router.push('/staff');
            }
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const isCustomer = role === 'customer';

    return (
        <div className="flex min-h-screen bg-white">
            {/* Left Panel - Branding (Desktop) */}
            <div className="hidden lg:flex w-1/2 items-center justify-center p-12 relative overflow-hidden"
                style={{ backgroundColor: config.theme.primaryColor }}>
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
                }}></div>

                <div className="text-center text-white space-y-8 z-10 relative">
                    {config.assets?.logo ? (
                        <img
                            src={config.assets.logo}
                            alt={config.name}
                            className="w-64 mx-auto drop-shadow-2xl hover:scale-105 transition duration-700"
                        />
                    ) : (
                        isCustomer ? <User size={100} className="mx-auto" /> : <Store size={100} className="mx-auto" />
                    )}

                    <div className="space-y-4 max-w-lg mx-auto">
                        <h2 className="text-5xl font-playfair font-bold tracking-wide">
                            {isLogin ? 'Bienvenido' : 'Únete a la Familia'}
                        </h2>
                        <p className="text-xl text-blue-100 font-light leading-relaxed">
                            {isCustomer
                                ? 'La excelencia del café de especialidad, ahora premia tu fidelidad.'
                                : 'Plataforma administrativa para el mejor equipo.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex flex-col justify-center p-8 sm:p-20 bg-white relative">
                <div className="absolute inset-0 lg:hidden opacity-5 pointer-events-none" style={{ backgroundColor: config.theme.primaryColor }}></div>

                <div className="max-w-md mx-auto w-full space-y-8 relative z-10">
                    <Link href="/" className="text-slate-400 hover:text-slate-600 flex items-center gap-2 transition group inline-flex mb-4">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium text-sm">Volver al inicio</span>
                    </Link>

                    <div className="text-center lg:text-left space-y-4">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex justify-center mb-6">
                            {config.assets?.logo ? (
                                <img
                                    src={config.assets.logo}
                                    alt={config.name}
                                    className="w-32 drop-shadow-lg"
                                />
                            ) : null}
                        </div>

                        <h1 className="text-4xl font-bold text-slate-900 font-playfair leading-tight">
                            {isCustomer ? (isLogin ? 'Acceso Clientes' : 'Crear Cuenta') : 'Acceso Staff'}
                        </h1>
                        <p className="text-slate-500">
                            {isLogin ? 'Ingresa tus datos para continuar.' : 'Completa el formulario para empezar a sumar puntos.'}
                        </p>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2 animate-in slide-in-from-top-2">
                            <span className="font-bold">Error:</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-5">
                        {!isLogin && (
                            <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. Juan Pérez"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all outline-none"
                                    />
                                </div>
                                {role === 'staff' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">PIN DE ACCESO</label>
                                        <input
                                            type="password"
                                            required
                                            value={shopPin}
                                            placeholder="••••"
                                            onChange={(e) => setShopPin(e.target.value)}
                                            className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all outline-none tracking-widest"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Contraseña</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-xl shadow-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                style={{ backgroundColor: config.theme.primaryColor }}
                            >
                                {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'INGRESAR' : 'CREAR CUENTA')}
                            </button>
                        </div>
                    </form>

                    <div className="text-center pt-4 border-t border-slate-100">
                        <p className="text-slate-500 text-sm mb-3">
                            {isLogin ? '¿Primera vez aquí?' : '¿Ya tienes una cuenta?'}
                        </p>
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm font-bold hover:underline transition-all"
                            style={{ color: config.theme.primaryColor }}
                        >
                            {isLogin ? 'Regístrate Gratis' : 'Inicia Sesión'}
                        </button>
                    </div>
                </div>

                <div className="pb-4 mt-auto">
                    <PoweredBy />
                </div>
            </div >
        </div >

    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
            <AuthContent />
        </Suspense>
    )
}
