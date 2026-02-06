import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white p-8">
                    <div className="max-w-2xl w-full bg-zinc-800 rounded-xl p-8 border border-red-500/20 shadow-2xl">
                        <h1 className="text-3xl font-bold text-red-500 mb-4">Algo deu errado...</h1>
                        <p className="text-zinc-300 mb-6">A aplicação encontrou um erro crítico e não pôde ser carregada.</p>

                        <div className="bg-black/50 rounded-lg p-4 font-mono text-sm overflow-auto max-h-64 mb-6 border border-zinc-700">
                            <div className="text-red-400 font-bold mb-2">{this.state.error?.name}: {this.state.error?.message}</div>
                            <div className="text-zinc-500 whitespace-pre-wrap">{this.state.error?.stack}</div>
                        </div>

                        <button
                            onClick={() => {
                                localStorage.clear();
                                window.location.reload();
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full"
                        >
                            Limpar Cache e Tentar Novamente
                        </button>
                        <p className="text-center text-xs text-zinc-500 mt-4">Isso limpará o LocalStorage, que frequentemente é a causa de erros.</p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
