import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';

const UpdatePassword: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Form fields
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Tokens cache to ensure session persistence across re-renders
    const cachedTokensRef = React.useRef<{ accessToken: string; refreshToken: string } | null>(null);

    // States
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true); // Always verify first!
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Type of operation
    const type = searchParams.get('type') || 'recovery';
    const isInvite = type === 'invite';

    useEffect(() => {
        let mounted = true;

        const checkAuth = async () => {
            // 1. Check for URL errors immediately (e.g. Supabase "Token expired" redirect)
            const hashStr = window.location.hash.replace(/^#\/?/, '');
            const hashParams = new URLSearchParams(hashStr);
            const urlError = searchParams.get('error_description') || hashParams.get('error_description');

            if (urlError) {
                if (mounted) {
                    setError('O link de ativação já foi utilizado ou expirou. Por motivos de segurança, você precisa gerar um novo.');
                    setVerifying(false);
                }
                return;
            }

            const access_token = searchParams.get('access_token') || hashParams.get('access_token');
            const refresh_token = searchParams.get('refresh_token') || hashParams.get('refresh_token');

            if (access_token && refresh_token) {
                cachedTokensRef.current = { accessToken: access_token, refreshToken: refresh_token };
            }

            // Agendar timeout de segurança IMEDIATAMENTE antes de qualquer promise do Supabase
            // para garantir que a tela sempre abra mesmo se o getSession() travar no lock
            const timer = setTimeout(async () => {
                if (!mounted) return;

                if (cachedTokensRef.current) {
                    try {
                        await supabase.auth.setSession({ 
                            access_token: cachedTokensRef.current.accessToken, 
                            refresh_token: cachedTokensRef.current.refreshToken 
                        });
                    } catch(e) {}
                }

                if (mounted) {
                    setVerifying(false);
                }
            }, 1500);

            try {
                // 2. Wait for session to be established by the URL tokens
                const { data: { session } } = await supabase.auth.getSession();
                if (session && mounted) {
                    clearTimeout(timer);
                    setVerifying(false);
                }
            } catch(e) {
                if (mounted) setVerifying(false);
            }
        };

        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            if (session && mounted) {
                setVerifying(false);
                setError('');
            }
        });

        checkAuth();

        return () => {
            mounted = false;
            listener.subscription.unsubscribe();
        };
    }, [searchParams]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            setLoading(false);
            return;
        }

        try {
            // Garantir que a sessão está ativa reaplicando os tokens caso o SDK tenha limpado da memória
            if (cachedTokensRef.current) {
                try {
                    await supabase.auth.setSession({
                        access_token: cachedTokensRef.current.accessToken,
                        refresh_token: cachedTokensRef.current.refreshToken
                    });
                } catch(e) {}
            }

            const { error: updateErr } = await supabase.auth.updateUser({ password });
            if (updateErr) throw updateErr;

            setSuccess(true);
            setTimeout(() => {
                navigate('/app');
            }, 2500);

        } catch (err: any) {
            console.error('Update error:', err);

            let msg = 'Erro ao definir a senha. Se você já criou sua senha na tela pós-pagamento, sua conta já está ativa! Clique em "Fazer Login" abaixo.';
            if (err.message?.includes('Auth session missing') || err.message?.includes('User not logged in') || err.message?.toLowerCase().includes('session')) {
                msg = 'O link de convite expirou ou sua sessão expirou por inatividade. Volte ao login e gere um novo link.';
            } else if (err.message?.includes('weak password')) {
                msg = 'A senha é muito fraca. Escolha uma senha mais forte.';
            } else if (err.message?.toLowerCase().includes('same as old')) {
                msg = 'A nova senha deve ser diferente da atual.';
            }

            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen w-full bg-[#030712] flex flex-col items-center justify-center p-4 relative">
                <div className="relative z-10 flex flex-col items-center animate-pulse">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                    <p className="text-zinc-400 text-sm font-medium tracking-wide">Verificando segurança do link...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen w-full bg-[#030712] flex flex-col items-center justify-center p-4 relative">
                <div className="relative z-10 w-full max-w-[440px] text-center animate-fade-in-up">
                    <div className="inline-flex items-center justify-center p-4 mb-6 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                        <CheckCircle className="w-12 h-12 text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-4">
                        Conta Ativada! 🎉
                    </h2>
                    <p className="text-zinc-400 text-lg mb-8">
                        Sua senha foi definida com sucesso. <br />
                        Você será direcionado para o painel em instantes.
                    </p>
                </div>
            </div>
        );
    }

    const uiTitle = isInvite ? 'Finalizar Cadastro' : 'Redefinir Senha';
    const uiSubtitle = isInvite ? 'Crie uma senha de acesso para sua conta' : 'Escolha uma nova senha para sua conta';
    const uiButton = isInvite ? 'ENTRAR NA PLATAFORMA' : 'SALVAR E ENTRAR';

    // If there is an error initially (link expired), show just the error state, no password form
    if (error && !password && !confirmPassword) {
        return (
            <div className="min-h-screen w-full bg-[#030712] flex flex-col items-center justify-center p-4 relative py-12">
                <div className="relative z-10 w-full max-w-[440px]">
                    <div className="bg-white border border-white/20 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full animate-fade-in-up overflow-hidden p-8 text-center">
                        <div className="inline-flex items-center justify-center p-4 mb-6 bg-red-500/10 rounded-full border border-red-500/20">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-black text-zinc-900 tracking-tight mb-4">Link Expirado</h2>
                        <p className="text-zinc-500 text-sm font-medium mb-8 leading-relaxed">
                            {error}
                        </p>
                        <button
                            onClick={() => navigate('/login?mode=recovery')}
                            className="w-full py-3.5 px-6 bg-blue-600 text-white font-extrabold text-sm tracking-widest rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                        >
                            GERAR NOVO LINK
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full mt-4 py-3 px-6 bg-white border border-zinc-200 text-zinc-600 font-bold text-sm rounded-2xl hover:bg-zinc-50 transition-colors"
                        >
                            VOLTAR PARA LOGIN
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Default Password Form
    return (
        <div className="min-h-screen w-full bg-[#030712] flex flex-col items-center justify-center p-4 relative py-12">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-600/20 blur-[120px] rounded-full opacity-60"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full opacity-60"></div>
            </div>

            <div className="relative z-10 w-full max-w-[440px]">
                <div className="text-center mb-8 animate-fade-in-up">
                    <img
                        src="/beleadly_logo_h1.png"
                        alt="beleadly"
                        className="h-10 md:h-12 w-auto mx-auto object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    />
                </div>

                <div className="bg-white border border-white/20 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full animate-fade-in-up overflow-hidden">
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">
                                {uiTitle}
                            </h2>
                            <p className="text-zinc-500 text-sm font-medium">
                                {uiSubtitle}
                            </p>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-4">
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
                                        autoFocus
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Crie uma senha segura"
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
                                <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium text-left leading-relaxed">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full overflow-hidden rounded-2xl p-px transition-all duration-300 active:scale-[0.98] disabled:opacity-50 mt-6 bg-blue-600 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30"
                            >
                                <div className="relative h-full w-full py-3.5 px-6 flex items-center justify-center gap-2 text-white">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            <span className="font-extrabold text-sm tracking-widest">{uiButton}</span>
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </div>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdatePassword;
