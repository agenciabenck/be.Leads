import { supabase } from './supabase';

export const createCheckoutSession = async (priceId: string, isAnnual: boolean) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw new Error('Usuário não autenticado. Faça login para continuar.');
        }

        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: { priceId, isAnnual }
        });

        if (error) throw error;

        // Verifica erro retornado no corpo com status 200 (nossa estratégia de debug)
        if (data?.error) {
            throw new Error(`Erro Backend: ${data.error}`);
        }

        if (!data?.url) throw new Error('URL de checkout não retornada');

        // Redireciona para o Stripe
        window.location.href = data.url;
    } catch (error: any) {
        console.error('Erro detalhado checkout:', error);

        // Tenta extrair mensagem de erro da Edge Function se existir
        let msg = error.message || 'Erro desconhecido';
        if (error.context && error.context.statusText) {
            msg = `Erro HTTP: ${error.context.status} - ${error.context.statusText}`;
        }

        throw new Error(`Falha no pagamento: ${msg}`);
    }
};

export const createPortalSession = async (flowType?: 'default' | 'subscription_update', targetPriceId?: string) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Usuário não autenticado.');

        console.log('Iniciando portal session...', { flowType, targetPriceId });

        const { data, error } = await supabase.functions.invoke('create-portal-session', {
            headers: {
                Authorization: `Bearer ${session.access_token}`
            },
            body: {
                returnUrl: window.location.href,
                flowType,
                targetPriceId
            }
        });

        if (error) {
            console.error('Erro no invoke create-portal-session:', error);
            throw error;
        }

        if (data?.error) {
            console.error('Erro retornado pela função:', data.error);
            throw new Error(data.error);
        }

        if (!data?.url) throw new Error('URL do portal não retornada pelo servidor.');

        window.location.href = data.url;
    } catch (error: any) {
        console.error('Erro detalhado portal:', error);
        const detail = error.message || 'Erro desconhecido';
        throw new Error(`Não foi possível abrir o portal de pagamento: ${detail}`);
    }
};

export const updateSubscription = async (targetPriceId: string) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Usuário não autenticado.');

        const { data, error } = await supabase.functions.invoke('update-subscription', {
            body: { targetPriceId }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        return data;
    } catch (error: any) {
        console.error('Erro ao atualizar assinatura:', error);
        throw new Error(error.message || 'Falha ao atualizar plano.');
    }
};

export const getSubscriptionStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') { // Ignora erro "não encontrado"
        console.error('Erro ao buscar assinatura:', error);
    }

    return data;
};
