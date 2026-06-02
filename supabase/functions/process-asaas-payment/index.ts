import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { PLAN_HIERARCHY } from "../../../src/constants/appConstants.ts" // We can't import this directly due to path in Deno. Wait, let me just hardcode or define local.

// Definição manual para a Edge Function
const PRICES = {
    start: 97.00,
    pro: 147.00,
    elite: 297.00
};

const PRICES_ANNUAL = {
    start: 77.60 * 12,
    pro: 117.60 * 12,
    elite: 237.60 * 12
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function safeJson(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('[safeJson] Failed to parse JSON:', text);
    throw new Error(text || 'Erro de formato na resposta do gateway.');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      authHeader ? { global: { headers: { Authorization: authHeader } } } : undefined
    )

    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Tenta pegar o usuário autenticado, mas aceita anônimo se mandar email/nome
    const { data: { user } } = await supabaseClient.auth.getUser()
    const body = await req.json();

    // BACKEND RECONCILIATION FALLBACK
    if (body.action === 'verify_payment') {
        const { userId, paymentId } = body;
        if (!userId) throw new Error('userId obrigatório para verificação');
        
        console.log(`[process-asaas-payment] Verificação em tempo real iniciada para userId: ${userId}, paymentId: ${paymentId || 'não informado'}`);
        
        // 1. Busca a assinatura do usuário no Supabase
        const { data: subData, error: subError } = await supabaseAdmin
            .from('user_subscriptions')
            .select('asaas_subscription_id, plan_id, status, asaas_customer_id')
            .eq('user_id', userId)
            .maybeSingle();
            
        if (subError) throw subError;
        
        if (subData?.status === 'active') {
            console.log(`[process-asaas-payment] Assinatura já está ativa no DB.`);
            return new Response(JSON.stringify({ success: true, status: 'active', planId: subData.plan_id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
        }
        
        const subscriptionId = subData?.asaas_subscription_id;
        const customerId = subData?.asaas_customer_id;
        const asaasKey = Deno.env.get('ASAAS_API_KEY');
        const asaasUrl = Deno.env.get('ASAAS_API_URL') || 'https://sandbox.asaas.com/api/v3';

        // Se passarmos um paymentId específico (fluxo de Pix avulso rápido), verificamos essa cobrança diretamente!
        if (paymentId) {
            console.log(`[process-asaas-payment] Verificando cobrança de Pix avulsa específica: ${paymentId}`);
            const paymentReq = await fetch(`${asaasUrl}/payments/${paymentId}`, {
                headers: { 'access_token': asaasKey ?? '' }
            });
            if (paymentReq.ok) {
                const paymentRes = await safeJson(paymentReq);
                if (paymentRes.status === 'RECEIVED' || paymentRes.status === 'CONFIRMED') {
                    console.log(`[process-asaas-payment] Cobrança Pix avulsa paga! Ativando no DB.`);
                    
                    let planId = 'pro';
                    const ref = paymentRes.externalReference;
                    if (ref) {
                        const parts = ref.split('_');
                        if (parts[0] && ['start', 'pro', 'elite'].includes(parts[0].toLowerCase())) {
                            planId = parts[0].toLowerCase();
                        }
                    }
                    
                    await supabaseAdmin
                        .from('user_subscriptions')
                        .upsert({
                            user_id: userId,
                            status: 'active',
                            plan_id: planId,
                            asaas_customer_id: customerId || paymentRes.customer,
                            asaas_subscription_id: subscriptionId || subData?.asaas_subscription_id || null,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id' });
                        
                    return new Response(JSON.stringify({ success: true, status: 'active', planId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
                }
            }
        }
        
        if (!subscriptionId) {
            console.log(`[process-asaas-payment] Nenhuma assinatura Asaas vinculada ao usuário no DB.`);
            return new Response(JSON.stringify({ success: false, status: 'no_subscription' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
        }
        
        // 2. Consulta as cobranças da assinatura no Asaas
        console.log(`[process-asaas-payment] Consultando cobranças da assinatura ${subscriptionId} no Asaas...`);
        const paymentsReq = await fetch(`${asaasUrl}/payments?subscription=${subscriptionId}`, {
            headers: { 'access_token': asaasKey ?? '' }
        });
        
        if (!paymentsReq.ok) {
            throw new Error(`Erro ao consultar pagamentos no Asaas: ${paymentsReq.status}`);
        }
        
        const paymentsRes = await safeJson(paymentsReq);
        const payments = paymentsRes.data || [];
        
        // Verifica se alguma cobrança está paga (RECEIVED ou CONFIRMED)
        let paidPayment = payments.find((p: any) => p.status === 'RECEIVED' || p.status === 'CONFIRMED');
        
        // TEMPORARIAMENTE DESATIVADO PARA TESTES: Ignora pagamentos antigos do cliente para que você possa pagar o novo Pix do zero!
        /*
        if (!paidPayment && customerId) {
            console.log(`[process-asaas-payment] Nenhuma cobrança paga na assinatura. Verificando todas as cobranças do cliente ${customerId}...`);
            const custPaymentsReq = await fetch(`${asaasUrl}/payments?customer=${customerId}`, {
                headers: { 'access_token': asaasKey ?? '' }
            });
            if (custPaymentsReq.ok) {
                const custPaymentsRes = await safeJson(custPaymentsReq);
                const custPayments = custPaymentsRes.data || [];
                paidPayment = custPayments.find((p: any) => p.status === 'RECEIVED' || p.status === 'CONFIRMED');
            }
        }
        */
        
        if (paidPayment) {
            console.log(`[process-asaas-payment] Cobrança paga encontrada! ID: ${paidPayment.id}, Status: ${paidPayment.status}`);
            
            // Detecta o plano
            let planId = 'pro'; // Default seguro se falhar
            const ref = paidPayment.externalReference;
            if (ref) {
                const parts = ref.split('_');
                if (parts[0] && ['start', 'pro', 'elite'].includes(parts[0].toLowerCase())) {
                    planId = parts[0].toLowerCase();
                }
            } else if (paidPayment.description) {
                const desc = paidPayment.description.toLowerCase();
                if (desc.includes('elite')) planId = 'elite';
                else if (desc.includes('pro')) planId = 'pro';
                else if (desc.includes('start')) planId = 'start';
            }
            
            // Ativa no Supabase
            console.log(`[process-asaas-payment] Ativando plano ${planId} para userId ${userId}`);
            await supabaseAdmin
                .from('user_subscriptions')
                .upsert({
                    user_id: userId,
                    status: 'active',
                    plan_id: planId,
                    asaas_customer_id: customerId,
                    asaas_subscription_id: paidPayment.subscription || subscriptionId,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
                
            return new Response(JSON.stringify({ success: true, status: 'active', planId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
        } else {
            console.log(`[process-asaas-payment] Nenhuma cobrança paga localizada. Cobranças pendentes: ${payments.length}`);
            return new Response(JSON.stringify({ success: false, status: 'pending' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
        }
    }

    const { 
        planName, 
        isAnnual, 
        paymentMethod, // 'PIX' ou 'CREDIT_CARD'
        customerData, // { name, email, cpfCnpj, phone, postalCode, addressNumber }
        creditCard, // se CREDIT_CARD: { holderName, number, expiryMonth, expiryYear, ccv }
        couponCode,
        affiliateRef, // UUID do afiliado que indicou (vem do localStorage no front)
        clientOrigin
    } = body;

    if (!planName || !paymentMethod || !customerData?.email || !customerData?.cpfCnpj || !customerData?.name) {
        throw new Error('Dados incompletos para checkout.');
    }

    const asaasKey = Deno.env.get('ASAAS_API_KEY');
    const asaasUrl = Deno.env.get('ASAAS_API_URL') || 'https://sandbox.asaas.com/api/v3';

    if (!asaasKey) throw new Error('Asaas API key not configured');

    const valueOrig = isAnnual ? PRICES_ANNUAL[planName.toLowerCase() as keyof typeof PRICES_ANNUAL] : PRICES[planName.toLowerCase() as keyof typeof PRICES];
    const cycle = isAnnual ? 'YEARLY' : 'MONTHLY';
    const description = `Assinatura Beleadly - Plano ${planName} (${isAnnual ? 'Anual' : 'Mensal'})`;
    
    let finalValue = valueOrig;
    let appliedCoupon = null;

    if (couponCode) {
        const uppercaseCoupon = couponCode.toUpperCase();
        
        // 1. Tenta buscar no banco de dados primeiro
        let couponData = null;
        try {
            const { data, error } = await supabaseAdmin
                .from('coupons')
                .select('*')
                .eq('code', uppercaseCoupon)
                .eq('active', true)
                .single();
            if (!error && data) {
                couponData = data;
            }
        } catch (e) {
            console.error('[process-asaas-payment] Erro ao buscar cupom no DB:', e);
        }

        // 2. Se não encontrou no banco, mas é um cupom válido de bypass local (PRO100OFF ou PRO95OFF)
        if (!couponData && (uppercaseCoupon === 'PRO100OFF' || uppercaseCoupon === 'PRO95OFF')) {
            if (planName.toLowerCase() !== 'pro') {
                throw new Error('Este cupom é exclusivo para o plano Pro.');
            }
            
            console.log(`[process-asaas-payment] Cupom bypass ativo: ${uppercaseCoupon}`);
            couponData = {
                code: uppercaseCoupon,
                discount_percent: uppercaseCoupon === 'PRO100OFF' ? 100 : 95,
                active: true,
                max_uses: null,
                uses: 0
            };

            // Tenta salvar/seedar em background para futuras consultas sem bloquear a transação atual
            try {
                const { data: check } = await supabaseAdmin
                    .from('coupons')
                    .select('id')
                    .eq('code', uppercaseCoupon)
                    .maybeSingle();
                if (!check) {
                    await supabaseAdmin.from('coupons').insert({
                        code: uppercaseCoupon,
                        discount_percent: uppercaseCoupon === 'PRO100OFF' ? 100 : 95,
                        active: true,
                        max_uses: null,
                        uses: 0
                    });
                }
            } catch (err) {
                console.error('[process-asaas-payment] Erro ao seedar cupom:', err);
            }
        }

        // 3. Aplica o cupom se válido
        if (couponData && (couponData.max_uses === null || couponData.uses < couponData.max_uses)) {
            finalValue = valueOrig * (1 - (couponData.discount_percent / 100));
            appliedCoupon = couponData;
        } else {
            throw new Error('Cupom inválido ou expirado.');
        }
    }

    // 1. Identificar ou Criar Usuário no Supabase
    let userId = user?.id;
    if (!userId) {
        console.log('[process-asaas-payment] Checkout anônimo para:', customerData.email);
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = usersData?.users?.find(u => u.email === customerData.email);
        
        if (existingUser) {
            userId = existingUser.id;
        } else {
            const tempPassword = crypto.randomUUID() + 'A1@';
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: customerData.email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: { full_name: customerData.name }
            });
            if (createError) throw new Error('Erro ao criar conta de usuário: ' + createError.message);
            userId = newUser?.user?.id;

            // Determinar a URL base de redirecionamento de forma robusta
            const originHeader = req.headers.get('origin') || req.headers.get('referer');
            let resolvedOrigin = clientOrigin || originHeader || Deno.env.get('SITE_URL') || 'https://beleadly.com';
            try {
                const urlObj = new URL(resolvedOrigin);
                resolvedOrigin = urlObj.origin;
            } catch (_) {}
            
            const redirectUrl = `${resolvedOrigin.replace(/\/$/, '')}/update-password`;
            console.log(`[process-asaas-payment] Enviando redefinição de senha com redirect: ${redirectUrl}`);

            supabaseAdmin.auth.resetPasswordForEmail(customerData.email, {
                redirectTo: redirectUrl
            }).catch(console.error);
        }
    }

    // LOGICA DE 100% OFF (Conta Grátis Mágica)
    if (finalValue <= 0) {
        console.log('[process-asaas-payment] Cupom de 100% OFF aplicado. Ativando conta direto no Supabase.');
        
        // Incrementa uso do cupom
        if (appliedCoupon) {
            await supabaseAdmin.from('coupons').update({ uses: appliedCoupon.uses + 1 }).eq('id', appliedCoupon.id);
        }

        // Ativa direto no Supabase
        await supabaseAdmin.from('user_subscriptions').upsert({
            user_id: userId,
            plan_id: planName.toLowerCase(),
            status: 'active',
            updated_at: new Date().toISOString()
        });

        return new Response(JSON.stringify({ success: true, method: 'FREE', subscriptionId: 'free_sub' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // CONTINUA O FLUXO NORMAL DO ASAAS SE NÃO FOR 100% OFF...
    // 2. Identificar ou Criar Customer no Asaas
    const { data: subData } = await supabaseAdmin
        .from('user_subscriptions')
        .select('asaas_customer_id, status, affiliate_ref')
        .eq('user_id', userId)
        .maybeSingle();

    // Se o affiliateRef não veio no corpo da requisição (ex: localStorage limpo/diferente browser),
    // tenta usar o affiliate_ref já salvo na assinatura do usuário no Supabase (se houver).
    const finalAffiliateRef = affiliateRef || subData?.affiliate_ref || null;

    let asaasCustomerId = subData?.asaas_customer_id;

    if (asaasCustomerId) {
        // Tenta atualizar o cliente existente
        console.log('[process-asaas-payment] Tentando atualizar customer no Asaas:', asaasCustomerId);
        const updateReq = await fetch(`${asaasUrl}/customers/${asaasCustomerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'access_token': asaasKey },
            body: JSON.stringify({
                name: customerData.name,
                email: customerData.email,
                cpfCnpj: customerData.cpfCnpj.replace(/\D/g, ''),
                phone: customerData.phone ? customerData.phone.replace(/\D/g, '') : undefined,
                postalCode: customerData.postalCode ? customerData.postalCode.replace(/\D/g, '') : undefined,
                addressNumber: customerData.addressNumber
            })
        });

        if (updateReq.status === 404) {
            console.warn(`[process-asaas-payment] Customer ID ${asaasCustomerId} não encontrado no Asaas (comum na migração Sandbox -> Produção). Limpando ID e buscando por e-mail...`);
            asaasCustomerId = null;
        } else {
            const updateRes = await safeJson(updateReq);
            if (!updateReq.ok) {
                console.error('[process-asaas-payment] Erro ao atualizar cliente no Asaas:', updateRes);
                throw new Error(`Erro ao atualizar cliente no Asaas: ${updateRes.errors?.[0]?.description || 'Erro'}`);
            }
        }
    }

    if (!asaasCustomerId) {
        // Busca se já existe no Asaas por email (para evitar duplicidade cadastral)
        console.log('[process-asaas-payment] Buscando se já existe cliente com o email:', customerData.email);
        const getCustomerReq = await fetch(`${asaasUrl}/customers?email=${encodeURIComponent(customerData.email)}`, {
            headers: { 'access_token': asaasKey }
        });
        const getCustomerRes = await safeJson(getCustomerReq);
        
        if (getCustomerReq.ok && getCustomerRes.data && getCustomerRes.data.length > 0) {
            asaasCustomerId = getCustomerRes.data[0].id;
            console.log('[process-asaas-payment] Cliente encontrado por email no Asaas:', asaasCustomerId);
            
            // Atualiza os dados dele no Asaas
            const updateReq = await fetch(`${asaasUrl}/customers/${asaasCustomerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'access_token': asaasKey },
                body: JSON.stringify({
                    name: customerData.name,
                    email: customerData.email,
                    cpfCnpj: customerData.cpfCnpj.replace(/\D/g, ''),
                    phone: customerData.phone ? customerData.phone.replace(/\D/g, '') : undefined,
                    postalCode: customerData.postalCode ? customerData.postalCode.replace(/\D/g, '') : undefined,
                    addressNumber: customerData.addressNumber
                })
            });
            const updateRes = await safeJson(updateReq);
            if (!updateReq.ok) {
                console.error('[process-asaas-payment] Erro ao atualizar cliente encontrado por email:', updateRes);
            }
        }
    }

    if (!asaasCustomerId) {
        // Cria novo customer no Asaas
        console.log('[process-asaas-payment] Criando novo customer no Asaas:', customerData.email);
        const customerReq = await fetch(`${asaasUrl}/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'access_token': asaasKey },
            body: JSON.stringify({
                name: customerData.name,
                email: customerData.email,
                cpfCnpj: customerData.cpfCnpj.replace(/\D/g, ''),
                phone: customerData.phone ? customerData.phone.replace(/\D/g, '') : undefined,
                postalCode: customerData.postalCode ? customerData.postalCode.replace(/\D/g, '') : undefined,
                addressNumber: customerData.addressNumber,
                externalReference: userId
            })
        });
        const customerRes = await safeJson(customerReq);
        if (!customerReq.ok) throw new Error(`Falha ao criar cliente no Asaas: ${customerRes.errors?.[0]?.description || 'Erro'}`);
        asaasCustomerId = customerRes.id;
    }

    // Salva APENAS o asaas_customer_id no DB — NÃO altera o plan_id.
    // O plano só é ativado após confirmação de pagamento pelo webhook.
    await supabaseAdmin.from('user_subscriptions').upsert(
        { user_id: userId, asaas_customer_id: asaasCustomerId, updated_at: new Date().toISOString() },
        { onConflict: 'user_id', ignoreDuplicates: false }
    );

    // Opcionalmente limpa cobranças/assinaturas PENDING anteriores para evitar lixo e duplicados no Asaas
    try {
        console.log('[process-asaas-payment] Limpando assinaturas PENDING/ACTIVE anteriores para evitar duplicados:', asaasCustomerId);
        const prevSubsReq = await fetch(`${asaasUrl}/subscriptions?customer=${asaasCustomerId}&limit=20`, {
            headers: { 'access_token': asaasKey }
        });
        if (prevSubsReq.ok) {
            const prevSubs = await prevSubsReq.json();
            for (const sub of (prevSubs?.data ?? [])) {
                if (sub.status === 'ACTIVE' || sub.status === 'PENDING') {
                    console.log('[process-asaas-payment] Cancelando assinatura anterior ativa/pendente:', sub.id);
                    await fetch(`${asaasUrl}/subscriptions/${sub.id}`, {
                        method: 'DELETE',
                        headers: { 'access_token': asaasKey }
                    });
                }
            }
        }
        
        console.log('[process-asaas-payment] Limpando cobranças PENDING anteriores para evitar duplicados:', asaasCustomerId);
        const prevPaymentsReq = await fetch(`${asaasUrl}/payments?customer=${asaasCustomerId}&status=PENDING&limit=20`, {
            headers: { 'access_token': asaasKey }
        });
        if (prevPaymentsReq.ok) {
            const prevPayments = await prevPaymentsReq.json();
            for (const pay of (prevPayments?.data ?? [])) {
                console.log('[process-asaas-payment] Cancelando cobrança pendente anterior:', pay.id);
                await fetch(`${asaasUrl}/payments/${pay.id}`, {
                    method: 'DELETE',
                    headers: { 'access_token': asaasKey }
                });
            }
        }
    } catch (cleanupErr) {
        console.error('[process-asaas-payment] Erro durante limpeza preventiva de cobranças anteriores:', cleanupErr);
    }

    // 3. Criar a Assinatura (Subscription)
    const today = new Date();
    let subRes: any = null;
    let singlePaymentId: string | null = null;
    let pixDataResult: any = null;

    if (paymentMethod === 'PIX') {
        const todayStr = today.toISOString().split('T')[0];

        // Build externalReference: plan_userId[_affiliateRef]
        const extRef = finalAffiliateRef ? `${planName.toLowerCase()}_${userId}_${finalAffiliateRef}` : `${planName.toLowerCase()}_${userId}`;

        const subscriptionPayload = {
            customer: asaasCustomerId,
            billingType: 'PIX',
            value: finalValue,
            nextDueDate: todayStr,
            cycle: cycle,
            description: description,
            externalReference: extRef
        };

        console.log('[process-asaas-payment] Criando assinatura Pix para hoje:', todayStr);
        const subReq = await fetch(`${asaasUrl}/subscriptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'access_token': asaasKey },
            body: JSON.stringify(subscriptionPayload)
        });
        subRes = await safeJson(subReq);
        if (!subReq.ok) {
            console.error('Erro ao criar assinatura Pix no Asaas:', subRes);
            throw new Error(`Recusado pelo Asaas: ${subRes.errors?.[0]?.description || 'Erro na assinatura.'}`);
        }

        // Buscar a cobrança avulsa gerada para esta assinatura
        console.log('[process-asaas-payment] Buscando cobrança gerada para a assinatura...');
        const paymentsReq = await fetch(`${asaasUrl}/payments?subscription=${subRes.id}`, {
            headers: { 'access_token': asaasKey }
        });
        const paymentsRes = await safeJson(paymentsReq);
        if (paymentsRes.data && paymentsRes.data.length > 0) {
            singlePaymentId = paymentsRes.data[0].id;
        } else {
            console.error('Falha ao encontrar cobrança para assinatura Pix:', paymentsRes);
            throw new Error('Asaas não gerou a cobrança Pix da assinatura.');
        }

        // Obter QR Code da cobrança Pix
        console.log('[process-asaas-payment] Buscando QR Code do Pix:', singlePaymentId);
        const qrReq = await fetch(`${asaasUrl}/payments/${singlePaymentId}/pixQrCode`, {
            headers: { 'access_token': asaasKey }
        });
        const qrRes = await safeJson(qrReq);
        if (qrRes.payload && qrRes.encodedImage) {
            pixDataResult = {
                payload: qrRes.payload,
                encodedImage: qrRes.encodedImage,
                expirationDate: qrRes.expirationDate
            };
        } else {
            console.error('Falha ao obter QR Code do Pix:', qrRes);
        }

    } else {
        // Fluxo padrão para CREDIT_CARD
        const nextDueDate = today.toISOString().split('T')[0];
        const extRef = finalAffiliateRef ? `${planName.toLowerCase()}_${userId}_${finalAffiliateRef}` : `${planName.toLowerCase()}_${userId}`;

        const subscriptionPayload: any = {
            customer: asaasCustomerId,
            billingType: 'CREDIT_CARD',
            value: finalValue,
            nextDueDate: nextDueDate,
            cycle: cycle,
            description: description,
            externalReference: extRef
        };

        if (!creditCard || !customerData.postalCode || !customerData.addressNumber) {
            throw new Error('Para cartão de crédito, informe os dados do cartão, CEP e Número.');
        }
        subscriptionPayload.creditCard = {
            holderName: creditCard.holderName,
            number: creditCard.number.replace(/\D/g, ''),
            expiryMonth: creditCard.expiryMonth,
            expiryYear: creditCard.expiryYear,
            ccv: creditCard.ccv
        };
        subscriptionPayload.creditCardHolderInfo = {
            name: customerData.name,
            email: customerData.email,
            cpfCnpj: customerData.cpfCnpj.replace(/\D/g, ''),
            postalCode: customerData.postalCode.replace(/\D/g, ''),
            addressNumber: customerData.addressNumber,
            phone: customerData.phone ? customerData.phone.replace(/\D/g, '') : '11999999999'
        };

        console.log('[process-asaas-payment] Criando assinatura Cartão...');
        const subReq = await fetch(`${asaasUrl}/subscriptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'access_token': asaasKey },
            body: JSON.stringify(subscriptionPayload)
        });
        subRes = await safeJson(subReq);
        if (!subReq.ok) {
            console.error('Erro ao criar assinatura Cartão no Asaas:', subRes);
            throw new Error(`Recusado pelo Asaas: ${subRes.errors?.[0]?.description || 'Erro no cartão.'}`);
        }
    }

    // Salva asaas_subscription_id no DB.
    // Para PIX: NÃO ativa o plano agora. O webhook asaas-webhook ou polling ativa após PAYMENT_RECEIVED.
    // Para CREDIT_CARD: ativa SOMENTE se o Asaas já confirmou (status ACTIVE na resposta).
    const asaasSubStatus = subRes.status?.toUpperCase(); // 'ACTIVE', 'PENDING', etc.
    const isCardApprovedNow = paymentMethod === 'CREDIT_CARD' && asaasSubStatus === 'ACTIVE';

    const dbUpdate: Record<string, any> = {
        user_id: userId,
        asaas_customer_id: asaasCustomerId,
        asaas_subscription_id: subRes.id,
        // Persiste o affiliate_ref se veio do front ou já existia (para o webhook pegar depois)
        ...(finalAffiliateRef ? { affiliate_ref: finalAffiliateRef } : {}),
        updated_at: new Date().toISOString()
    };

    if (isCardApprovedNow) {
        dbUpdate.plan_id = planName.toLowerCase();
        dbUpdate.status = 'active';
        console.log(`[process-asaas-payment] Cartão aprovado. Ativando plano ${planName} para userId ${userId}`);
    } else {
        // Se já era active, não faça downgrade para incomplete. O webhook que ativará a nova assinatura
        if (subData?.status !== 'active') {
            dbUpdate.status = 'incomplete';
        }
        console.log(`[process-asaas-payment] Checkout ${paymentMethod} finalizado. Aguardando pagamento.`);
    }

    await supabaseAdmin.from('user_subscriptions').upsert(dbUpdate, { onConflict: 'user_id' });

    // 4. Retornar resposta apropriada (PIX QR Code ou Sucesso Cartão)
    let responseData: any = { 
        success: true, 
        method: paymentMethod, 
        subscriptionId: subRes.id,
        paymentId: singlePaymentId 
    };

    if (paymentMethod === 'PIX' && pixDataResult) {
        responseData.pixData = pixDataResult;
    }

    return new Response(JSON.stringify(responseData), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error: any) {
    console.error('Error no process-asaas-payment:', error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
})
