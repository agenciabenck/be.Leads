import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/services/supabase';

const RegisterSession: React.FC = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // UI states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!sessionId) {
            navigate('/');
        }
    }, [sessionId, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            console.log('[RegisterSession] Iniciando ativação via fetch direto para a Edge Function...');
            const baseUrl = import.meta.env.VITE_SUPABASE_URL;
            const functionUrl = `${baseUrl}/functions/v1/complete-checkout-activation`;
            const fetchRes = await fetch(functionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, password, name })
            });

            if (!fetchRes.ok) {
                let errText = await fetchRes.text();
                try {
                    const jsonErr = JSON.parse(errText);
                    errText = jsonErr.error || errText;
                } catch (e) {}
                throw new Error(errText);
            }

            const data = await fetchRes.json();
            if (data?.error) throw new Error(data.error);

            const userEmail = data.email;

            // Password created successfully, log the user in
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: userEmail,
                password: password
            });

            if (signInError) throw signInError;

            setSuccess(true);
            setTimeout(() => {
                navigate('/app');
            }, 2500);

        } catch (err: any) {
            console.error('Activation Error:', err);
            setError(err.message || 'Erro ao processar ativação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4 font-sans relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -z-10 translate-y-1/2 -translate-x-1/2" />

                <div className="w-full max-w-md text-center animate-fade-in-up">
                    <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center justify-center mb-6">
                        <CheckCircle2 size={40} className="text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-4">Conta Ativa! 🎉</h2>
                    <p className="text-slate-300 text-lg">
                        Bora escalar suas vendas. Carregando painel...
                    </p>
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mt-8" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4 font-sans relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] -z-10 -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10 translate-y-1/2 -translate-x-1/3" />

            <div className="w-full max-w-[440px] bg-white border border-white/20 rounded-[32px] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 mb-6 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">
                        Pagamento Aprovado!
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium">
                        Crie uma senha de acesso seguro para entrar na sua nova conta imediatamente.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5 text-left">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                            Nome Completo
                        </label>
                        <div className="relative group">
                            <input
                                type="text"
                                required
                                autoFocus
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Como devemos te chamar?"
                                className="block w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-500 transition-all duration-300 disabled:opacity-50"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 text-left">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                            Nova Senha
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Crie uma senha forte"
                                className="block w-full pl-11 pr-12 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-500 transition-all duration-300 disabled:opacity-50"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5 text-left">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                            Repita a Senha
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repita a senha"
                                className="block w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-500 transition-all duration-300 disabled:opacity-50"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium text-left leading-relaxed flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !password || !confirmPassword || !name.trim()}
                        className="group relative w-full overflow-hidden rounded-2xl p-px transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 mt-6 bg-[#0066ff] shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40"
                    >
                        <div className="relative h-full w-full py-4 px-6 flex items-center justify-center gap-2 text-white">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    <span className="font-extrabold text-sm tracking-widest uppercase">Começar a Prospectar</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="w-full mt-4 text-xs font-bold text-zinc-400 hover:text-blue-500 transition-colors py-2"
                        disabled={loading}
                    >
                        Já possuo uma conta (Fazer Login)
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegisterSession;
