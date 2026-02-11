import React, { useState } from 'react';
import { supabase } from '@/services/supabase';
import { LogIn, UserPlus, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, User, X } from 'lucide-react';

interface AuthProps {
    onAuthSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>('signup');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Tradutor de erros do Supabase para Português
    const translateAuthError = (errorMessage: string): string => {
        const errorTranslations: Record<string, string> = {
            'Invalid login credentials': 'Email ou senha incorretos',
            'User already registered': 'Este email já está cadastrado',
            'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada ou spam.',
            'Invalid email': 'Email inválido',
            'Password should be at least 6 characters': 'A senha deve ter no mínimo 6 caracteres',
            'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos',
            'Signup disabled': 'Cadastro temporariamente desabilitado',
            'User not found': 'Usuário não encontrado',
            'Invalid credentials': 'Credenciais inválidas',
            'Email link is invalid or has expired': 'Link de email inválido ou expirado',
        };

        if (errorTranslations[errorMessage]) return errorTranslations[errorMessage];

        for (const [key, value] of Object.entries(errorTranslations)) {
            if (errorMessage.toLowerCase().includes(key.toLowerCase())) return value;
        }

        return 'Erro ao processar sua solicitação. Tente novamente';
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consensus',
                    },
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(translateAuthError(err.message));
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError('Por favor, informe seu email');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (resetError) throw resetError;
            setMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
        } catch (err: any) {
            setError(translateAuthError(err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!email || !password) {
            setError('Preencha todos os campos');
            return;
        }

        if (mode === 'signup') {
            if (!name.trim()) {
                setError('Por favor, informe seu nome');
                return;
            }
            if (password !== confirmPassword) {
                setError('As senhas não coincidem');
                return;
            }
            if (password.length < 6) {
                setError('A senha deve ter no mínimo 6 caracteres');
                return;
            }
        }

        setLoading(true);

        try {
            if (mode === 'login') {
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                if (data.user) {
                    setMessage('Login realizado com sucesso!');
                    setTimeout(() => onAuthSuccess(), 500);
                }
            } else if (mode === 'signup') {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                        }
                    }
                });

                if (signUpError) throw signUpError;

                if (data.user && !data.session) {
                    setIsRegistrationSuccess(true);
                } else if (data.user) {
                    setMessage('Conta criada com sucesso! Você já pode fazer login.');
                    setTimeout(() => {
                        setMode('login');
                        setPassword('');
                        setConfirmPassword('');
                    }, 1500);
                }
            }
        } catch (err: any) {
            console.error('Auth error:', err);
            const translatedError = translateAuthError(err.message || 'Erro desconhecido');
            setError(translatedError);
        } finally {
            setLoading(false);
        }
    };

    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);

    if (isRegistrationSuccess) {
        return (
            <div className="min-h-screen w-full bg-[#030712] flex flex-col items-center justify-center p-4 relative py-12">
                {/* Mesh Gradients Background */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-600/20 blur-[120px] rounded-full opacity-60"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full opacity-60"></div>
                    <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-indigo-600/10 blur-[100px] rounded-full opacity-60"></div>
                </div>

                <div className="relative z-10 w-full max-w-[440px] text-center animate-fade-in-up">
                    <div className="inline-flex items-center justify-center p-4 mb-6 bg-white/5 rounded-full backdrop-blur-sm border border-white/10 shadow-2xl">
                        <Mail className="w-12 h-12 text-blue-500" />
                    </div>

                    <h1 className="text-3xl font-black text-white tracking-tight mb-4">
                        Verifique seu e-mail! 📨
                    </h1>

                    <p className="text-zinc-400 text-lg font-medium leading-relaxed mb-8">
                        Enviamos um link de confirmação para <br />
                        <span className="text-white font-bold">{email}</span>
                    </p>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 mb-8 text-left">
                        <div className="flex gap-3">
                            <div className="mt-1">
                                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">!</div>
                            </div>
                            <div>
                                <h3 className="text-blue-400 font-bold mb-1">Importante:</h3>
                                <p className="text-blue-300/80 text-sm leading-relaxed">
                                    Se não encontrar na caixa de entrada, verifique sua pasta de <strong>Spam</strong> ou <strong>Lixo Eletrônico</strong>.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setIsRegistrationSuccess(false);
                            setMode('login');
                            setPassword('');
                            setConfirmPassword('');
                            setMessage('');
                        }}
                        className="w-full py-4 px-6 bg-white text-zinc-900 font-bold rounded-2xl hover:bg-zinc-100 transition-all active:scale-[0.98] shadow-xl shadow-white/10"
                    >
                        Voltar para o Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#030712] flex flex-col items-center justify-start p-4 relative py-12">
            {/* Mesh Gradients Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-600/20 blur-[120px] rounded-full opacity-60"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full opacity-60"></div>
                <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-indigo-600/10 blur-[100px] rounded-full opacity-60"></div>
            </div>

            <div className="relative z-10 w-full max-w-[440px]">
                {/* Logo Section */}
                <div className="text-center mb-8 animate-fade-in-up">
                    <div className="inline-flex items-center justify-center p-2 mb-4">
                        <img
                            src="https://i.postimg.cc/0jF5PGV8/logo-beleads-h1-1.png"
                            alt="be.leads"
                            className="h-8 w-auto drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                        />
                    </div>
                </div>

                {/* Light Theme Auth Card */}
                <div className="bg-white border border-white/20 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full animate-fade-in-up overflow-hidden" style={{ animationDelay: '100ms' }}>
                    <div className="p-5 pb-7">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-black text-zinc-900 tracking-tight mb-1">
                                {mode === 'login' ? 'Bem-vindo de volta!' : mode === 'signup' ? 'Crie sua conta' : 'Recuperar senha'}
                            </h1>
                            <p className="text-zinc-500 text-sm font-medium">
                                {mode === 'login'
                                    ? 'Acesse sua conta para continuar'
                                    : mode === 'signup'
                                        ? 'Comece a extrair leads inteligentes agora'
                                        : 'Informe seu e-mail para receber o link'}
                            </p>
                        </div>

                        {/* Pill Switcher */}
                        {mode !== 'forgot-password' && (
                            <div className="flex p-1 bg-zinc-100 rounded-2xl mb-6 border border-zinc-200/50">
                                <button
                                    onClick={() => {
                                        setMode('login');
                                        setError('');
                                        setMessage('');
                                        setName('');
                                    }}
                                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'login'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-700'
                                        }`}
                                >
                                    Fazer login
                                </button>
                                <button
                                    onClick={() => {
                                        setMode('signup');
                                        setError('');
                                        setMessage('');
                                    }}
                                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'signup'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-700'
                                        }`}
                                >
                                    Criar conta
                                </button>
                            </div>
                        )}

                        {/* Form Container */}
                        <div>
                            <form onSubmit={mode === 'forgot-password' ? handleForgotPassword : handleSubmit} className="space-y-3.5">
                                {/* Name (SignUp only) */}
                                {mode === 'signup' && (
                                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                                            Seu Nome
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <User className="h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Ex: João Silva"
                                                className="block w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-500 transition-all duration-300"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                                        E-mail profissional
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="seu@exemplo.com"
                                            className="block w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-500 transition-all duration-300"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                {mode !== 'forgot-password' && (
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                                Sua Senha
                                            </label>
                                            {mode === 'login' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setMode('forgot-password')}
                                                    className="text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-colors"
                                                >
                                                    Esqueceu?
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="block w-full pl-11 pr-12 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-500 transition-all duration-300"
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
                                )}

                                {/* Confirm Password (SignUp only) */}
                                {mode === 'signup' && (
                                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                                            Repita a Senha
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="block w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-500 transition-all duration-300"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Error/Success Messages omitted for brevity, keeping same logic */}
                                {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium">{error}</div>}
                                {message && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-xs font-medium">{message}</div>}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full overflow-hidden rounded-2xl p-px bg-blue-600 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
                                >
                                    <div className="relative h-full w-full py-3.5 px-6 flex items-center justify-center gap-2 text-white">
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <span className="font-extrabold text-sm tracking-widest">
                                                    {mode === 'login' ? 'ENTRAR AGORA' : mode === 'signup' ? 'CRIAR MINHA CONTA' : 'ENVIAR LINK'}
                                                </span>
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </div>
                                </button>
                            </form>
                        </div>

                        {mode === 'forgot-password' && (
                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => setMode('login')}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    Voltar para o Login
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Updated Footer */}
                <div className="mt-8 text-center space-y-4">
                    <p className="text-[11px] font-bold text-zinc-500 leading-relaxed uppercase tracking-wider">
                        2026 © Todos os direitos reservados.
                    </p>
                    <p className="text-[11px] font-medium text-zinc-600">
                        Feito com 🧡 por <span className="font-bold">Agência Benck.</span>
                    </p>
                    <div className="flex items-center justify-center gap-4 pt-2">
                        <button onClick={() => setShowTerms(true)} className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors">TERMOS</button>
                        <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
                        <button onClick={() => setShowPrivacy(true)} className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors">PRIVACIDADE</button>
                    </div>
                </div>
            </div>

            {/* Legal Modals */}
            {(showTerms || showPrivacy) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                            <h2 className="text-xl font-black text-zinc-900">
                                {showTerms ? 'Termos de Uso' : 'Políticas de Privacidade'}
                            </h2>
                            <button onClick={() => { setShowTerms(false); setShowPrivacy(false); }} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                                <X className="w-5 h-5 text-zinc-500" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto custom-scrollbar prose prose-sm prose-zinc">
                            {showTerms ? (
                                <div className="space-y-4 text-zinc-600">
                                    <p>Ao utilizar os serviços da be.Leads, você concorda com os seguintes termos:</p>
                                    <h3 className="text-zinc-900 font-bold">1. Uso do Serviço</h3>
                                    <p>Nossa plataforma é destinada à extração de leads públicos para fins comerciais legítimos. O uso indevido para spam ou atividades ilegais resultará em banimento imediato.</p>
                                    <h3 className="text-zinc-900 font-bold">2. Responsabilidade pelos Dados</h3>
                                    <p>A be.Leads facilita o acesso a informações públicas. A responsabilidade pelo tratamento desses dados após a extração é inteiramente do usuário.</p>
                                    <h3 className="text-zinc-900 font-bold">3. Assinaturas e Reembolsos</h3>
                                    <p>Todos os planos são recorrentes. O cancelamento pode ser feito a qualquer momento através do painel de configurações.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 text-zinc-600">
                                    <p>Sua privacidade é nossa prioridade. Entenda como tratamos seus dados:</p>
                                    <h3 className="text-zinc-900 font-bold">1. Coleta de Informações</h3>
                                    <p>Coletamos apenas o necessário para seu login e funcionamento das buscas (e-mail, nome e histórico de pesquisas).</p>
                                    <h3 className="text-zinc-900 font-bold">2. Segurança</h3>
                                    <p>Utilizamos infraestrutura Supabase para garantir que suas credenciais e dados de pagamento (via Stripe) estejam sempre criptografados.</p>
                                    <h3 className="text-zinc-900 font-bold">3. Compartilhamento</h3>
                                    <p>Não vendemos ou compartilhamos seus dados pessoais com terceiros. Seus leads extraídos são privados e pertencem apenas à sua conta.</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex justify-end">
                            <button
                                onClick={() => { setShowTerms(false); setShowPrivacy(false); }}
                                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d4d4d8; }

                /* Ocultar barra de rolagem global na página de autenticação */
                html {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                html::-webkit-scrollbar {
                    display: none;
                }
            `}} />
        </div>
    );
};
