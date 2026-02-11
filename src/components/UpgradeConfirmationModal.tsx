import React from 'react';
import { X, ArrowRight, ShieldCheck } from 'lucide-react';

interface UpgradeConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
    newPlanName: string;
}

export const UpgradeConfirmationModal: React.FC<UpgradeConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    newPlanName
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[32px] shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300 overflow-hidden transform transition-all">

                {/* Header */}
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-success-500" />
                        Confirmar Upgrade
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
                        <div className="w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mb-4 text-3xl">
                            🚀
                        </div>
                        <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                            Mudar para o plano {newPlanName}?
                        </h4>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
                            O plano atual será cancelado e o novo entrará em vigor <strong>agora</strong>.
                        </p>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-700">
                        <div className="flex gap-3">
                            <div className="w-1 bg-success-500 rounded-full shrink-0"></div>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                A sua próxima fatura será ajustada automaticamente com a diferença proporcional do valor.
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
                            <>Processando...</>
                        ) : (
                            <>Confirmar e Pagar <ArrowRight className="w-4 h-4" /></>
                        )}
                    </button>

                    {!isLoading && (
                        <button
                            onClick={onClose}
                            className="w-full py-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-medium text-xs transition-colors"
                        >
                            Deixa pra depois
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
