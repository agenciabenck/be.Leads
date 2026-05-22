
import { supabase } from './supabase';

export const createCheckoutSession = async (priceId: string, isAnnual: boolean, planName?: string) => {
    try {
        let accessToken = '';

        // 1. Tenta ler direto do localStorage para evitar que o lock do supabase-js trave a requisição
        try {
            const storedAuth = localStorage.getItem('beleadly_auth_token');
            if (storedAuth) {
                const parsedAuth = JSON.parse(storedAuth);
                if (parsedAuth?.access_token) {
                    accessToken = parsedAuth.access_token;
                    console.log('[Payment] Token lido com sucesso direto do localStorage.');
                }
            }
        } catch (e) {
            console.warn('[Payment] Erro ao ler beleadly_auth_token do localStorage:', e);
        }

        // 2. Tenta o getSession do SDK, mas se travar/abortar, ignoramos
        if (!accessToken) {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    accessToken = session.access_token;
                }
            } catch (authErr: any) {
                console.warn('[Payment] getSession do Supabase SDK abortado/falhou. Usando modo anônimo/contingência.', authErr?.message);
            }
        }

        const headers: any = {};
        if (accessToken) {
            headers.Authorization = `Bearer ${accessToken}`;
        }

        const affiliateRef = localStorage.getItem('affiliate_ref');

        let data, error;

        // 3. Tenta o invoke do Supabase
        try {
            const res = await supabase.functions.invoke('create-checkout-session', {
                body: { priceId, isAnnual, affiliate_ref: affiliateRef, planName },
                headers
            });
            data = res.data;
            error = res.error;
        } catch (err: any) {
            error = err;
        }

        // 4. Se o invoke falhar, sofrer abort ou timeout, faz fetch HTTP direto para a API, ignorando o SDK!
        if (error || !data) {
            console.log('[Payment] Supabase SDK falhou ou abortou. Fazendo fallback HTTP direto para a Edge Function...');
            const baseUrl = import.meta.env.VITE_SUPABASE_URL; // URL limpa do projeto
            const functionUrl = `${baseUrl}/functions/v1/create-checkout-session`;
            
            const fetchRes = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: JSON.stringify({ priceId, isAnnual, affiliate_ref: affiliateRef, planName })
            });

            if (!fetchRes.ok) {
                const errText = await fetchRes.text();
                throw new Error(`Erro na API (${fetchRes.status}): ${errText}`);
            }

            data = await fetchRes.json();
            error = null;
        }

        if (error) throw error;

        // Verifica erro retornado no corpo com status 200 (nossa estratégia de debug)
        if (data?.error) {
            throw new Error(`${data.error}`);
        }

        if (!data?.url) throw new Error('URL de checkout não retornada pelo servidor.');

        // Redireciona para o Stripe
        window.location.href = data.url;
    } catch (error: any) {
        console.error('Erro detalhado checkout:', error);

        // Tenta extrair mensagem de erro da Edge Function se existir
        let msg = error.message || 'Erro desconhecido';

        // Se for um erro da função (non-2xx), tentamos ler o corpo da resposta
        if (error.context && typeof error.context.json === 'function') {
            try {
                const errorBody = await error.context.json();
                if (errorBody && errorBody.error) {
                    msg = errorBody.error;
                }
            } catch (e) {
                console.warn('Não foi possível ler o corpo do erro da função:', e);
            }
        } else if (error.context && error.context.statusText) {
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

        const payload = {
            returnUrl: window.location.href,
            flowType,
            targetPriceId
        };
        console.log('Enviando payload para Portal Session:', payload);

        const token = session.access_token;
        console.log('Token check:', {
            exists: !!token,
            length: token?.length,
            preview: token?.substring(0, 10),
            expires_at: session.expires_at
        });

        const { data, error } = await supabase.functions.invoke('create-portal-session', {
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: payload
        });

        if (error) {
            console.error('Erro no invoke create-portal-session:', error);
            let msg = 'Erro ao processar requisição no servidor.';
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const errorBody = await error.context.json();
                    if (errorBody && errorBody.error) msg = errorBody.error;
                } catch (e) {
                    console.warn('Não foi possível ler o corpo do erro da função:', e);
                }
            }
            throw new Error(msg);
        }

        if (data?.error) {
            console.error('Erro lógico retornado pela função:', data);
            const msg = data.error || 'Erro inesperado';
            const sug = data.suggestion ? `\n\n📌 ${data.suggestion}` : '';
            throw new Error(`${msg}${sug}`);
        }

        if (!data?.url) throw new Error('URL do portal não retornada pelo servidor.');

        window.location.href = data.url;
    } catch (error: any) {
        console.error('Erro detalhado portal:', error);
        const detail = error.message || 'Erro desconhecido';
        // Remove prefix repeating if it's already structured
        if (detail.includes('Não foi possível abrir o portal')) {
            throw error;
        }
        throw new Error(`Não foi possível abrir o portal de pagamento: ${detail}`);
    }
};


export const updateSubscription = async (targetPriceId: string, coupon?: string) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Usuário não autenticado.');

        console.log('Iniciando upgrade direto...', { targetPriceId, coupon });

        const { data, error } = await supabase.functions.invoke('update-subscription', {
            headers: {
                Authorization: `Bearer ${session.access_token}`
            },
            body: { targetPriceId, coupon }
        });

        // Some versions of invoke return the error in the error object, 
        // others return a status code and we need to check data.
        if (error) {
            console.error('Erro no invoke update-subscription:', error);
            // Try to extract body from error if possible (some SDK versions)
            throw error;
        }

        if (data?.error) {
            console.error('Erro retornado pela função update-subscription:', data.error);
            throw new Error(data.error);
        }

        return data;
    } catch (error: any) {
        console.error('Erro detalhado upgrade:', error);

        // If it's a supabase function error, it might have a generic message
        let detail = error.message || 'Erro desconhecido';

        // Improve "non-2xx" message with potential context if we can find it
        if (detail.includes('non-2xx')) {
            detail = 'Erro na validação do pagamento ou cupom inválido. Verifique os dados e tente novamente.';
        }

        throw new Error(`Não foi possível realizar o upgrade: ${detail} `);
    }
};


export const validateCoupon = async (code: string) => {
    try {
        const { data, error } = await supabase.functions.invoke('validate-coupon', {
            body: { code }
        });

        if (error) throw error;
        return data;
    } catch (error: any) {
        console.error('Erro ao validar cupom:', error);
        throw new Error('Não foi possível validar o cupom.');
    }
};


export const getSubscriptionStatus = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('[Payment] Erro ao buscar assinatura:', error);
        }

        return data;
    } catch (err) {
        console.error('[Payment] Unexpected error fetching subscription:', err);
        return null;
    }
};
