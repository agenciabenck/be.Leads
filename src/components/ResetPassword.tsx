import React, { useState } from 'react';
import { supabase } from '@/services/supabase';
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { translateAuthError } from '@/utils/authUtils';

export const ResetPassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            setSuccess(true);

            // Redirecionar após 3 segundos
            setTimeout(() => {
                // Limpar hash e recarregar para ir ao login/home
                window.location.hash = '';
                window.location.reload();
            }, 3000);

        } catch (err: any) {
            console.error('Password reset error:', err);
            setError(translateAuthError(err.message));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen w-full bg-[#030712] flex flex-col items-center justify-center p-4 relative">
                <div className="relative z-10 w-full max-w-[440px] text-center animate-fade-in-up">
                    <div className="inline-flex items-center justify-center p-4 mb-6 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                        <CheckCircle className="w-12 h-12 text-emerald-500" />
                    </div>

                    <h1 className="text-3xl font-black text-white mb-4">
                        Senha Atualizada! 🔒
                    </h1>

                    <p className="text-zinc-400 text-lg mb-8">
                        Sua senha foi alterada com sucesso. <br />
                        Redirecionando você...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#030712] flex flex-col items-center justify-center p-4 relative py-12">
            {/* Mesh Gradients Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-600/20 blur-[120px] rounded-full opacity-60"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full opacity-60"></div>
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

                {/* Card */}
                <div className="bg-white border border-white/20 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full animate-fade-in-up overflow-hidden">
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">
                                Redefinir Senha
                            </h1>
                            <p className="text-zinc-500 text-sm font-medium">
                                Digite sua nova senha abaixo
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                                    Nova Senha
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Nova senha segura"
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

                            {/* Confirm Password */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                                    Confirme a Senha
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repita a nova senha"
                                        className="block w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-500 transition-all duration-300"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium">{error}</div>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 mt-4"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Atualizar Senha'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
