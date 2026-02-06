import React, { useState } from 'react';
import { supabase } from '@/services/supabase';
import { LogIn, UserPlus, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, User } from 'lucide-react';

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
            'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada',
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

                if (data.user) {
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

    return (
        <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-900/20 via-transparent to-transparent opacity-50"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent opacity-30"></div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8 animate-fade-in-up">
                    <img
                        src="https://i.postimg.cc/0jF5PGV8/logo-beleads-h1-1.png"
                        alt="be.leads"
                        className="h-10 w-auto mx-auto mb-4"
                    />
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {mode === 'login' ? 'Bem-vindo de volta!' : mode === 'signup' ? 'Criar sua conta' : 'Recuperar senha'}
                    </h1>
                    <p className="text-slate-400 text-sm">
                        {mode === 'login'
                            ? 'Entre na sua conta para continuar'
                            : mode === 'signup'
                                ? 'Comece a extrair leads inteligentes hoje'
                                : 'Informe o seu email para receber o link'}
                    </p>
                </div>

                {/* Auth Card */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    {/* Toggle Tabs */}
                    {mode !== 'forgot-password' && (
                        <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
                            <button
                                onClick={() => {
                                    setMode('login');
                                    setError('');
                                    setMessage('');
                                    setName('');
                                }}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${mode === 'login'
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <LogIn className="w-4 h-4 inline mr-2" />
                                Entrar na conta
                            </button>
                            <button
                                onClick={() => {
                                    setMode('signup');
                                    setError('');
                                    setMessage('');
                                }}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${mode === 'signup'
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <UserPlus className="w-4 h-4 inline mr-2" />
                                Cadastro
                            </button>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={mode === 'forgot-password' ? handleForgotPassword : handleSubmit} className="space-y-4">
                        {/* Name (SignUp only) */}
                        {mode === 'signup' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
                                    Como você se chama?
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Seu nome"
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        {mode !== 'forgot-password' && (
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
                                    Senha
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-12 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Confirm Password (SignUp only) */}
                        {mode === 'signup' && (
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
                                    Confirmar Senha
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        {/* Success Message */}
                        {message && (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-2">
                                {message}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md shadow-primary-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    {mode === 'login' ? 'Entrar na conta' : mode === 'signup' ? 'Criar Conta' : 'Enviar Link'}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer Actions */}
                    <div className="mt-6 text-center space-y-3">
                        {mode === 'login' && (
                            <button
                                onClick={() => {
                                    setMode('forgot-password');
                                    setError('');
                                    setMessage('');
                                }}
                                className="text-sm text-slate-500 hover:text-primary-600 transition-colors font-medium border-b border-transparent hover:border-primary-600"
                            >
                                Esqueci minha senha
                            </button>
                        )}
                        {mode === 'forgot-password' && (
                            <button
                                onClick={() => {
                                    setMode('login');
                                    setError('');
                                    setMessage('');
                                }}
                                className="text-sm text-primary-600 hover:text-primary-700 transition-colors font-bold flex items-center justify-center gap-1 mx-auto"
                            >
                                Voltar para Entrar
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer Text */}
                <p className="text-center text-slate-500 text-xs mt-8">
                    Ao continuar, você concorda com nossos <br />
                    <span className="font-semibold text-slate-400 cursor-pointer">Termos de Uso</span> e <span className="font-semibold text-slate-500 cursor-pointer">Política de Privacidade</span>
                </p>
            </div>
        </div>
    );
};
