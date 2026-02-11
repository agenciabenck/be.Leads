import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface UpgradeConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
    newPlanName: string;
    userName: string;
}

export const UpgradeConfirmationModal: React.FC<UpgradeConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    newPlanName,
    userName
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[32px] shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300 overflow-hidden transform transition-all relative">

                {/* Header */}
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-success-500 fill-success-500" />
                        Upgrade Selecionado
                    </h3>
                    {!isLoading && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-success-100 to-success-50 dark:from-success-900/30 dark:to-success-800/20 rounded-full flex items-center justify-center mb-4 text-3xl shadow-inner border border-success-200 dark:border-success-800">
                            🚀
                        </div>
                        <h4 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
                            Excelente escolha, {userName}!
                        </h4>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
                            Acesse os recursos exclusivos do <strong>{newPlanName}</strong> e leve sua prospecção para o próximo nível agora mesmo.
                        </p>
                    </div>

                    <div className="bg-success-50/50 dark:bg-success-900/10 rounded-2xl p-4 border border-success-100 dark:border-success-800/30">
                        <div className="flex gap-3">
                            <ShieldCheck className="w-5 h-5 text-success-600 dark:text-success-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed text-left">
                                Fique tranquilo: sua assinatura será atualizada automaticamente e o valor será ajustado proporcionalmente.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="w-full py-4 bg-success-600 hover:bg-success-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-success-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>Processando pagamento...</>
                        ) : (
                            <>Confirmar alteração de plano <ArrowRight className="w-4 h-4 ml-1" /></>
                        )}
                    </button>

                    {!isLoading && (
                        <button
                            onClick={onClose}
                            className="w-full py-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-medium text-xs transition-colors"
                        >
                            Decidir depois
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
