import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { processTransparentCheckout, verifyAsaasPayment, checkPixStatus } from '@/services/checkout';
import { 
    CreditCard, 
    ShieldCheck, 
    Lock, 
    Loader2, 
    CheckCircle2, 
    Copy, 
    Tag, 
    ArrowLeft, 
    Check, 
    ChevronRight,
    Info,
    X
} from 'lucide-react';
import { supabase } from '@/services/supabase';
import Modal from '@/components/landing/ui/Modal';

const PRICES = {
    free: 0.00,
    start: 97.00,
    pro: 147.00,
    elite: 297.00
};

const PRICES_ANNUAL = {
    start: 77.60 * 12,
    pro: 117.60 * 12,
    elite: 237.60 * 12
};

const Checkout: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const planParam = searchParams.get('plan') || '';
    const isAnnualParam = searchParams.get('annual') === 'true';
    const [selectedPlan, setSelectedPlan] = useState<string>(planParam);

    // If not logged in, force showing the plans selector to send them to free registration
    const activePlan = user ? selectedPlan : '';

    const planName = activePlan ? activePlan.charAt(0).toUpperCase() + activePlan.slice(1) : '';
    const originalPrice = activePlan && isAnnualParam
        ? PRICES_ANNUAL[activePlan as keyof typeof PRICES_ANNUAL]
        : activePlan
            ? PRICES[activePlan as keyof typeof PRICES]
            : 0;

    
    // States
    const [step, setStep] = useState<1 | 2>(1);
    const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'PIX'>('CREDIT_CARD');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [pixData, setPixData] = useState<{ payload: string; encodedImage: string; expirationDate: string } | null>(null);
    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [pixTimer, setPixTimer] = useState(30 * 60); // 30 min in seconds
    const [manualChecking, setManualChecking] = useState(false);
    const [showReturnButton, setShowReturnButton] = useState(false);
    
    // Documents, country code & modal states
    const [docType, setDocType] = useState<'CPF' | 'CNPJ'>('CPF');
    const [countryCode, setCountryCode] = useState('+55');
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);

    // Coupon states
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_percent: number } | null>(null);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [isCouponFocused, setIsCouponFocused] = useState(false);

    // Calculated Price
    const finalPrice = appliedCoupon ? originalPrice * (1 - (appliedCoupon.discount_percent / 100)) : originalPrice;
    const isFree = finalPrice <= 0;

    // Form states
    const [formData, setFormData] = useState({
        name: user?.user_metadata?.full_name || '',
        email: user?.email || '',
        cpfCnpj: '',
        phone: '',
        postalCode: '',
        addressNumber: '',
        cardNumber: '',
        cardExpiry: '',
        cardCcv: '',
        cardHolder: ''
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: prev.name || user.user_metadata?.full_name || '',
                email: prev.email || user.email || ''
            }));
        }
    }, [user]);

    // Listen for payment confirmation when Pix QR Code is displayed (Realtime + Polling Local DB)
    useEffect(() => {
        let isMounted = true;
        let intervalId: any = null;
        let realtimeChannel: any = null;
        let isChecking = false; // Prevent overlapping calls

        const confirmSuccess = () => {
            if (isMounted) {
                clearInterval(intervalId);
                setSuccess(true);
            }
        };

        const checkPixDirect = async () => {
            // Gate: não sobrepõe chamadas simultâneas nem continua se já confirmou
            if (isChecking || !isMounted) return;
            if (!subscriptionId || !user?.id) return;

            isChecking = true;
            try {
                // Checa no próprio banco de dados do Supabase em vez de sobrecarregar a API do Asaas
                const { data, error } = await supabase
                    .from('user_subscriptions')
                    .select('status, asaas_subscription_id')
                    .eq('user_id', user.id)
                    .single();
                
                if (data && data.status === 'active' && data.asaas_subscription_id === subscriptionId) {
                    console.log('[Checkout] ✅ Pix confirmado via polling seguro do banco!');
                    confirmSuccess();
                }
            } catch (err) {
                // Silencia erros de rede — próximo tick tentará novamente
            } finally {
                isChecking = false;
            }
        };

        if (pixData && user?.id && subscriptionId) {
            // Caminho 1: Realtime — detecta imediatamente quando o webhook atualiza o DB
            console.log('[Checkout] Iniciando listener Realtime + polling 3s para Pix, user:', user.id);
            realtimeChannel = supabase
                .channel(`checkout_pix_${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'user_subscriptions',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        const newData = payload.new as any;
                        if (newData?.status === 'active' && newData?.asaas_subscription_id === subscriptionId) {
                            console.log('[Checkout] ✅ Pix confirmado via Realtime (nova assinatura)!');
                            confirmSuccess();
                        }
                    }
                )
                .subscribe();

            // Caminho 2: Polling a cada 3 segundos no banco local. 
            // Elimina limite de requisições da Asaas API.
            checkPixDirect(); 
            intervalId = setInterval(checkPixDirect, 3000);
        }

        return () => {
            isMounted = false;
            if (intervalId) clearInterval(intervalId);
            if (realtimeChannel) supabase.removeChannel(realtimeChannel);
        };
    }, [pixData, user?.id, subscriptionId]);

    // Countdown timer for PIX (30 min)
    useEffect(() => {
        if (!pixData) return;
        setPixTimer(30 * 60);
        const countdown = setInterval(() => {
            setPixTimer(prev => {
                if (prev <= 1) { clearInterval(countdown); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(countdown);
    }, [pixData]);

    // Auto redirect on success
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => navigate('/app'), 8000);
            return () => clearTimeout(timer);
        }
    }, [success, navigate]);

    // Show Return Button after 40 seconds of PIX generation
    useEffect(() => {
        if (pixData) {
            setShowReturnButton(false);
            const timer = setTimeout(() => {
                setShowReturnButton(true);
            }, 40000); // 40 seconds
            return () => clearTimeout(timer);
        } else {
            setShowReturnButton(false);
        }
    }, [pixData]);

    const formatPixTimer = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleManualCheck = async () => {
        if (!user?.id) return;
        setManualChecking(true);
        try {
            const { data } = await supabase
                .from('user_subscriptions')
                .select('status')
                .eq('user_id', user.id)
                .single();
            if (data?.status === 'active') {
                setSuccess(true);
            } else {
                // toast-like inline feedback handled below
            }
        } catch {}
        setManualChecking(false);
    };

    // Live Formatting Masks
    const formatCPF = (val: string) => {
        const numeric = val.replace(/\D/g, '').slice(0, 11);
        return numeric
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    };

    const formatCNPJ = (val: string) => {
        const numeric = val.replace(/\D/g, '').slice(0, 14);
        return numeric
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'cpfCnpj') {
            formattedValue = docType === 'CPF' ? formatCPF(value) : formatCNPJ(value);
        } else if (name === 'phone') {
            const numeric = value.replace(/\D/g, '').slice(0, 11);
            if (numeric.length <= 10) {
                formattedValue = numeric
                    .replace(/(\d{2})(\d)/, '($1) $2')
                    .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
            } else {
                formattedValue = numeric
                    .replace(/(\d{2})(\d)/, '($1) $2')
                    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
            }
        } else if (name === 'cardNumber') {
            const numeric = value.replace(/\D/g, '').slice(0, 16);
            formattedValue = numeric.replace(/(\d{4})(?=\d)/g, '$1 ');
        } else if (name === 'cardExpiry') {
            const numeric = value.replace(/\D/g, '').slice(0, 4);
            formattedValue = numeric.replace(/(\d{2})(?=\d)/g, '$1/');
        } else if (name === 'cardCcv') {
            formattedValue = value.replace(/\D/g, '').slice(0, 4);
        } else if (name === 'postalCode') {
            const numeric = value.replace(/\D/g, '').slice(0, 8);
            formattedValue = numeric.replace(/(\d{5})(\d)/, '$1-$2');
        }

        setFormData(prev => ({ ...prev, [name]: formattedValue }));
    };

    const handleDocTypeChange = (type: 'CPF' | 'CNPJ') => {
        setDocType(type);
        setFormData(prev => ({ ...prev, cpfCnpj: '' }));
        setError(null);
    };

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;
        setValidatingCoupon(true);
        setCouponError(null);
        try {
            const codeUpper = couponInput.toUpperCase();
            
            // Bulletproof local bypass for PRO100OFF and PRO95OFF
            if (codeUpper === 'PRO100OFF' || codeUpper === 'PRO95OFF') {
                if (activePlan.toLowerCase() !== 'pro') {
                    throw new Error('Este cupom é exclusivo para o plano Pro.');
                }
                setAppliedCoupon({
                    code: codeUpper,
                    discount_percent: codeUpper === 'PRO100OFF' ? 100 : 95
                });
                setCouponInput('');
                return;
            }

            const { data, error: err } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', codeUpper)
                .eq('active', true)
                .single();
                
            if (err || !data) throw new Error('Cupom inválido ou expirado.');
            if (data.max_uses !== null && data.uses >= data.max_uses) throw new Error('Este cupom esgotou.');
            
            setAppliedCoupon(data);
            setCouponInput('');
        } catch (err: any) {
            setCouponError(err.message);
        } finally {
            setValidatingCoupon(false);
        }
    };

    const handleCopyPix = () => {
        if (pixData?.payload) {
            navigator.clipboard.writeText(pixData.payload);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const nextStep = () => {
        if (!formData.name.trim() || !formData.email.trim() || !formData.cpfCnpj.trim() || !formData.phone.trim()) {
            setError('Por favor, preencha todos os dados obrigatórios de identificação.');
            return;
        }
        setError(null);
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation for step 2 (Credit Card specific)
        if (paymentMethod === 'CREDIT_CARD' && !isFree) {
            if (!formData.postalCode.trim() || !formData.addressNumber.trim() || 
                !formData.cardNumber.trim() || !formData.cardHolder.trim() || 
                !formData.cardExpiry.trim() || !formData.cardCcv.trim()) {
                setError('Preencha os dados do cartão de crédito e endereço de cobrança obrigatórios.');
                return;
            }
        }

        setLoading(true);

        try {
            const [expiryMonth, expiryYear] = formData.cardExpiry.split('/');
            
            // Clean phone representation before sending.
            // Asaas natively requires DDD + phone (10 or 11 digits) for Brazil (+55).
            // Prepending 55 to Deno will result in 13 digits which Asaas strictly rejects with validation errors.
            const cleanPhone = countryCode === '+55' 
                ? formData.phone 
                : `${countryCode} ${formData.phone}`;

            const payload = {
                planName: activePlan,
                isAnnual: isAnnualParam,
                paymentMethod,
                couponCode: appliedCoupon?.code,
                affiliateRef: localStorage.getItem('affiliate_ref') || undefined,
                clientOrigin: window.location.origin,
                customerData: {
                    name: formData.name,
                    email: formData.email,
                    cpfCnpj: formData.cpfCnpj,
                    phone: cleanPhone,
                    postalCode: paymentMethod === 'CREDIT_CARD' ? formData.postalCode : '00000-000',
                    addressNumber: paymentMethod === 'CREDIT_CARD' ? formData.addressNumber : 'SN'
                },
                creditCard: (paymentMethod === 'CREDIT_CARD' && !isFree) ? {
                    holderName: formData.cardHolder,
                    number: formData.cardNumber.replace(/\s+/g, ''),
                    expiryMonth: expiryMonth?.trim(),
                    expiryYear: expiryYear?.trim() ? `20${expiryYear.trim().slice(-2)}` : '',
                    ccv: formData.cardCcv.trim()
                } : undefined
            };


            const response = await processTransparentCheckout(payload);

            if (response.method === 'PIX' && response.pixData) {
                if (response.paymentId) {
                    setPaymentId(response.paymentId);
                }
                if (response.subscriptionId) {
                    setSubscriptionId(response.subscriptionId);
                }
                setPixData(response.pixData);
            } else if (response.success || response.method === 'FREE') {
                setSuccess(true);
            }

        } catch (err: any) {
            let friendlyMessage = err.message || 'Ocorreu um erro ao processar seu pagamento. Por favor, tente novamente.';
            
            // Check method specifically so we NEVER output Credit Card decline messages when paying via Pix
            if (paymentMethod === 'CREDIT_CARD') {
                if (friendlyMessage.toLowerCase().includes('declined') || friendlyMessage.toLowerCase().includes('recusado')) {
                    friendlyMessage = 'Não conseguimos aprovar este cartão. Verifique os dados inseridos ou selecione outro meio de pagamento.';
                }
            } else {
                // For PIX, strip Asaas prefix and output the exact validation reason directly
                friendlyMessage = friendlyMessage.replace(/^recusado pelo asaas:\s*/i, '');
                friendlyMessage = friendlyMessage.replace(/^erro:\s*/i, '');
            }
            setError(friendlyMessage);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Plan features list
    const getPlanFeatures = (plan: string) => {
        switch (plan.toLowerCase()) {
            case 'start':
                return [
                    '500 créditos de pesquisa por mês',
                    'Extração do Google Maps e Instagram',
                    'Filtros de busca avançados',
                    'Exportações ilimitadas (Excel/CSV)',
                    'Suporte prioritário por e-mail'
                ];
            case 'elite':
                return [
                    '3.200 créditos de pesquisa por mês',
                    'Tudo do plano Pro + Recursos Elite',
                    'Prioridade máxima em novas funcionalidades',
                    'Enriquecimento avançado de leads',
                    'Integração direta via API externa',
                    'Gerente de contas dedicado WhatsApp'
                ];
            case 'pro':
            default:
                return [
                    '1.100 créditos de pesquisa por mês',
                    'Google Maps + Instagram + LinkedIn',
                    'Acesso completo ao CRM de Leads',
                    'Exportações ilimitadas (Excel/CSV)',
                    'Enriquecimento inteligente de dados',
                    'Chat IA integrado para prospecção',
                    'Suporte VIP via WhatsApp'
                ];
        }
    };

    if (success) {
        localStorage.removeItem('beleadly_plan_intention');
        localStorage.removeItem('beleadly_plan_cycle');

        return (
            <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-6 font-sans">
                <div className="bg-white border border-slate-100 rounded-2xl p-10 max-w-lg w-full text-center shadow-sm">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Assinatura Ativada com Sucesso!</h2>
                    <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                        Parabéns! Seu acesso ao **beleadly {planName}** foi liberado e todas as ferramentas premium já estão prontas para impulsionar suas vendas.
                    </p>
                    <div className="bg-slate-50 border border-slate-100/80 p-4 rounded-xl mb-8 text-xs text-slate-500 flex items-center gap-3 text-left">
                        <Info className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Você será redirecionado para o painel em instantes. Caso não aconteça automaticamente, clique no botão abaixo.</span>
                    </div>
                    <div className="w-full">
                        <button 
                            className="w-full h-12 bg-[#0066ff] hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                            onClick={() => navigate('/app')}
                        >
                            Acessar o beleadly
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F4F7FB] text-slate-800 flex flex-col min-w-full font-sans antialiased">
            
            {/* Boxed SVG Header (No wrapper white card block - raw image aligned to container width) */}
            <div className="w-full max-w-[1200px] mx-auto px-4 mt-6 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <button 
                        type="button"
                        onClick={() => navigate(user ? '/app' : '/')}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl shadow-sm cursor-pointer"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                        <span>{user ? 'Voltar ao painel' : 'Voltar para o site'}</span>
                    </button>
                </div>
                <img 
                    src="/header_checkout_beleadly.svg" 
                    alt="Finalize seu Cadastro beleadly" 
                    className="w-full h-auto block rounded-2xl" 
                />
            </div>

            {/* Main Checkout Area */}
            <div className="max-w-[1200px] mx-auto w-full px-4 py-8 md:py-10 flex-grow">
                
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl mb-8 text-sm flex items-start gap-3 shadow-sm font-medium">
                        <span className="bg-red-600 text-white font-bold text-xs px-2 py-0.5 rounded shrink-0">ERRO</span>
                        <div>{error}</div>
                    </div>
                )}

                {!activePlan ? (
                    /* ── Seleção de Plano (Largura Total com 4 Cards) ── */
                    <div className="w-full bg-white border border-slate-100 rounded-3xl shadow-sm p-8 md:p-10 mb-8">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Escolha seu Plano</h2>
                            <p className="text-sm text-slate-500">Selecione o plano ideal para a sua escala de prospecção.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                            {[
                                {
                                    id: 'free',
                                    name: 'Free',
                                    headline: 'Para quem quer testar o poder da plataforma.',
                                    price: 0,
                                    features: ['60 créditos/mês', 'Acesso ao Maps', 'Busca Instagram'],
                                    missing: ['CSV', 'LinkedIn', 'CRM Completo', 'Enriquecimento de Leads', 'Busca por Chat IA'],
                                },
                                {
                                    id: 'start',
                                    name: 'Start',
                                    headline: 'Ideal para freelancers e pequenos negócios.',
                                    price: 97,
                                    features: ['500 créditos/mês', 'Acesso ao Maps', 'Busca Instagram', 'Exportação CSV'],
                                    missing: ['LinkedIn', 'CRM Completo', 'Enriquecimento de Leads', 'Busca por Chat IA'],
                                },
                                {
                                    id: 'pro',
                                    name: 'Pro',
                                    headline: 'A escolha de agências e times comerciais.',
                                    price: 147,
                                    features: ['1100 créditos/mês', 'Acesso Maps e Instagram', 'Busca LinkedIn', 'CRM Completo', 'Exportação Excel e Sheets', 'Enriquecimento de Leads', 'Busca por Chat IA', 'Suporte VIP'],
                                    missing: [],
                                    popular: true,
                                },
                                {
                                    id: 'elite',
                                    name: 'Elite',
                                    headline: 'Para operações em alta escala.',
                                    price: 297,
                                    features: ['3200 créditos/mês', 'Acesso Maps, Instagram e LinkedIn', 'CRM Multi-pipeline', 'Exportação avançada', 'Enriquecimento de Leads', 'Busca por Chat IA', 'Todos os recursos liberados', 'Prioridade total no suporte'],
                                    missing: [],
                                }
                            ].map(plan => {
                                const showPopular = plan.popular;
                                const cardStyle = showPopular
                                    ? 'border-[#0066ff] ring-2 ring-blue-500/20 scale-[1.02] shadow-xl z-10'
                                    : 'border-slate-200 hover:border-[#0066ff] hover:shadow-md';
                                
                                return (
                                    <div key={plan.id} className={`relative rounded-3xl p-6 border bg-white flex flex-col transition-all ${cardStyle}`}>
                                        {showPopular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0066ff] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-blue-500/30 uppercase tracking-wider">
                                                Mais popular
                                            </div>
                                        )}
                                        <div className="flex flex-col mb-4">
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{plan.name}</h3>
                                            <p className="text-[11px] text-slate-400 mt-1 min-h-[32px] font-medium leading-relaxed">{plan.headline}</p>
                                        </div>
                                        
                                        <div className="mb-4">
                                            <div className="flex items-baseline gap-0.5">
                                                <span className="text-sm font-bold text-slate-950">R$</span>
                                                <span className="text-3xl font-black text-slate-950 tracking-tight">
                                                    {plan.price.toFixed(2).replace('.', ',')}
                                                </span>
                                                <span className="text-xs text-slate-400 font-medium">/mês</span>
                                            </div>
                                        </div>
                                        
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (user) {
                                                    setSelectedPlan(plan.id);
                                                } else {
                                                    // Salvar intenção do plano escolhido no LocalStorage
                                                    localStorage.setItem('beleadly_plan_intention', plan.id);
                                                    localStorage.setItem('beleadly_plan_cycle', isAnnualParam ? 'annual' : 'monthly');
                                                    navigate('/login?mode=signup');
                                                }
                                            }}
                                            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all select-none active:scale-95 mb-4 ${
                                                showPopular 
                                                    ? 'bg-[#0066ff] text-white hover:bg-blue-700 shadow-md shadow-blue-500/10' 
                                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                                            }`}
                                        >
                                            Começar grátis
                                        </button>
                                        
                                        <div className="border-b border-slate-100 my-4" />
                                        
                                        <ul className="space-y-2 mb-6 flex-grow">
                                            {plan.features.map(feat => (
                                                <li key={feat} className="flex items-start gap-2 text-xs text-slate-600">
                                                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span>{feat}</span>
                                                </li>
                                            ))}
                                            {plan.missing?.map(feat => (
                                                <li key={feat} className="flex items-start gap-2 text-xs text-slate-300 line-through">
                                                    <X className="w-3.5 h-3.5 text-slate-200 shrink-0 mt-0.5" />
                                                    <span>{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <p className="text-xs text-slate-400 mt-8 text-center font-medium">
                            Sem fidelidade. Cancele quando quiser.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        
                        {/* Left Column: Flow Forms */}
                        <div className="lg:col-span-8 space-y-6">

                        {activePlan && pixData ? (
                            /* ─── PIX UX Melhorado ────────────────────────────── */
                            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">

                                {/* Header Verde */}
                                <div className="bg-emerald-50 border-b border-emerald-100 px-8 pt-7 pb-5 text-center">
                                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs uppercase tracking-wider font-extrabold px-3 py-1 rounded-lg mb-4">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        PIX Gerado com Sucesso
                                    </span>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">Finalize sua Assinatura</h3>
                                    <p className="text-slate-500 text-sm">Escaneie o QR Code ou copie o código PIX no seu app do banco.</p>
                                </div>

                                <div className="p-7 md:p-9 space-y-7">

                                    {/* QR Code + Copiar */}
                                    <div className="flex flex-col md:flex-row gap-6 items-center">
                                        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex-shrink-0">
                                            <img
                                                src={`data:image/jpeg;base64,${pixData.encodedImage}`}
                                                alt="QR Code PIX"
                                                className="w-[180px] h-[180px] object-contain"
                                            />
                                        </div>

                                        <div className="flex-1 w-full space-y-4">
                                            {/* Código Copia e Cola */}
                                            <div>
                                                <p className="text-slate-600 font-bold text-xs uppercase tracking-wider mb-1.5">Código Copia e Cola</p>
                                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 pl-3">
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={pixData.payload}
                                                        className="bg-transparent flex-grow text-slate-500 text-xs font-mono focus:outline-none truncate select-all"
                                                    />
                                                    <button
                                                        onClick={handleCopyPix}
                                                        className="bg-emerald-500 hover:bg-emerald-600 transition-colors px-4 py-2 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0"
                                                    >
                                                        {copied ? <><Check className="w-3.5 h-3.5" />Copiado!</> : <><Copy className="w-3.5 h-3.5" />Copiar</>}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Timer */}
                                            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold ${
                                                pixTimer > 300 
                                                    ? 'bg-blue-50 border-blue-100 text-blue-700' 
                                                    : pixTimer > 0 
                                                        ? 'bg-amber-50 border-amber-100 text-amber-700 animate-pulse' 
                                                        : 'bg-red-50 border-red-100 text-red-700'
                                            }`}>
                                                <Loader2 className={`w-4 h-4 ${pixTimer > 0 ? 'animate-spin' : ''}`} />
                                                {pixTimer > 0 
                                                    ? <span>Expira em <strong>{formatPixTimer(pixTimer)}</strong> — aguardando seu pagamento...</span>
                                                    : <span>QR Code expirado — recarregue a página para gerar um novo.</span>
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    {/* Passo a Passo */}
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Como pagar via PIX</p>
                                        <div className="space-y-2.5">
                                            {[
                                                'Abra o aplicativo do seu banco',
                                                'Acesse a área de PIX',
                                                'Escolha "Copia e Cola" ou "QR Code"',
                                                'Cole o código ou escaneie o QR e confirme o valor',
                                                'O acesso é liberado automaticamente após a confirmação'
                                            ].map((step, i) => (
                                                <div key={i} className="flex items-start gap-3">
                                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center mt-0.5">
                                                        {i + 1}
                                                    </span>
                                                    <p className="text-xs text-slate-600 leading-relaxed">{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {showReturnButton && (
                                        <button
                                            type="button"
                                            onClick={() => navigate(user ? '/app' : '/')}
                                            className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 font-bold text-sm py-3.5 rounded-xl transition-all shadow-sm active:scale-95"
                                        >
                                            <ArrowLeft className="w-4 h-4 text-slate-500" />
                                            {user ? 'Voltar para o Painel da Ferramenta' : 'Voltar para o site'}
                                        </button>
                                    )}

                                    {/* Botão "Já paguei" */}
                                    {user?.id && (
                                        <button
                                            onClick={handleManualCheck}
                                            disabled={manualChecking || pixTimer === 0}
                                            className="w-full flex items-center justify-center gap-2 border-2 border-emerald-500 text-emerald-700 font-bold text-sm py-3 rounded-xl hover:bg-emerald-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {manualChecking
                                                ? <><Loader2 className="w-4 h-4 animate-spin" />Verificando pagamento...</>
                                                : <><CheckCircle2 className="w-4 h-4" />Já paguei — verificar agora</>
                                            }
                                        </button>
                                    )}

                                    <div className="pt-2 border-t border-slate-100 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => setPixData(null)}
                                            className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-semibold flex items-center gap-1 cursor-pointer"
                                        >
                                            <ArrowLeft className="w-3.5 h-3.5" />
                                            Alterar dados ou forma de pagamento
                                        </button>
                                    </div>
                                </div>
                            </div>

                        ) : activePlan ? (
                            /* Regular Checkout Steps Form */
                            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm">
                                
                                {/* Step Indicator */}
                                <div className="flex border-b border-slate-100 text-sm">
                                    <button 
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className={`flex-1 py-4 text-center font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                                            step === 1 
                                                ? 'border-[#0066ff] text-[#0066ff] bg-blue-50/30' 
                                                : 'border-transparent text-slate-400 hover:text-slate-600 bg-slate-50/50'
                                        }`}
                                    >
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                                            step === 1 ? 'bg-[#0066ff] text-white' : 'bg-slate-200 text-slate-500'
                                        }`}>1</span>
                                        Identificação
                                    </button>
                                    <div 
                                        className={`flex-grow-0 flex items-center justify-center text-slate-200 bg-slate-50/50 px-2`}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                    <button
                                        type="button"
                                        disabled={step === 1}
                                        className={`flex-1 py-4 text-center font-bold border-b-2 transition-all flex items-center justify-center gap-2 cursor-default ${
                                            step === 2 
                                                ? 'border-[#0066ff] text-[#0066ff] bg-blue-50/30' 
                                                : 'border-transparent text-slate-400 bg-slate-50/50'
                                        }`}
                                    >
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                                            step === 2 ? 'bg-[#0066ff] text-white' : 'bg-slate-200 text-slate-500'
                                        }`}>2</span>
                                        Pagamento
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8"> {/* Increased internal field spacing */}
                                    
                                    {/* Step 1: Personal Data */}
                                    {step === 1 && (
                                        <div className="space-y-6"> {/* Increased gap spacing */}
                                            <div>
                                                <h2 className="text-lg font-bold text-slate-900 mb-1 tracking-tight">Dados de Acesso e Contato</h2>
                                                <p className="text-xs text-slate-400">Informe seus dados para ativarmos sua assinatura com segurança.</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-y-6 gap-x-5"> {/* Increased spacing */}
                                                <div className="md:col-span-12">
                                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nome Completo</label>
                                                    <input 
                                                        required 
                                                        name="name" 
                                                        value={formData.name} 
                                                        onChange={handleInputChange} 
                                                        type="text" 
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff] focus:outline-none transition-all placeholder-slate-400 font-medium" 
                                                        placeholder="Ex: João da Silva" 
                                                    />
                                                </div>
                                                <div className="md:col-span-12">
                                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">E-mail de Cadastro</label>
                                                    <input 
                                                        required 
                                                        name="email" 
                                                        value={formData.email} 
                                                        onChange={handleInputChange} 
                                                        type="email" 
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff] focus:outline-none transition-all placeholder-slate-400 font-medium" 
                                                        placeholder="Ex: joao@empresa.com.br" 
                                                    />
                                                </div>
                                                
                                                {/* Left-aligned switch toggle without "Documento:" word, slightly larger */}
                                                <div className="md:col-span-5">
                                                    <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/60 shrink-0 w-fit mb-2 select-none">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleDocTypeChange('CPF')}
                                                            className={`px-5 py-1.5 text-xs font-extrabold rounded-lg transition-all uppercase ${docType === 'CPF' ? 'bg-[#0066ff] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                                        >
                                                            CPF
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleDocTypeChange('CNPJ')}
                                                            className={`px-5 py-1.5 text-xs font-extrabold rounded-lg transition-all uppercase ${docType === 'CNPJ' ? 'bg-[#0066ff] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                                        >
                                                            CNPJ
                                                        </button>
                                                    </div>
                                                    <input 
                                                        required 
                                                        name="cpfCnpj" 
                                                        value={formData.cpfCnpj} 
                                                        onChange={handleInputChange} 
                                                        type="text" 
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff] focus:outline-none transition-all placeholder-slate-400 font-medium font-mono" 
                                                        placeholder={docType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'} 
                                                    />
                                                </div>

                                                {/* WhatsApp Unique Phone input with Country Selector (Only search-supported countries) */}
                                                <div className="md:col-span-7">
                                                    <div className="h-[34px] flex items-center mb-2">
                                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">WhatsApp</label>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <div className="relative shrink-0 w-28">
                                                            <select 
                                                                value={countryCode} 
                                                                onChange={(e) => setCountryCode(e.target.value)}
                                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-3 pr-7 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff] focus:outline-none transition-all font-bold appearance-none cursor-pointer"
                                                            >
                                                                <option value="+55">BR (+55)</option>
                                                                <option value="+1">US (+1)</option>
                                                                <option value="+351">PT (+351)</option>
                                                                <option value="+1">CA (+1)</option>
                                                                <option value="+54">AR (+54)</option>
                                                                <option value="+52">MX (+52)</option>
                                                                <option value="+595">PY (+595)</option>
                                                            </select>
                                                            <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-slate-400">
                                                                <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <input 
                                                            required
                                                            name="phone" 
                                                            value={formData.phone} 
                                                            onChange={handleInputChange} 
                                                            type="text" 
                                                            className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff] focus:outline-none transition-all placeholder-slate-400 font-medium font-mono" 
                                                            placeholder="(11) 99999-9999" 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <button 
                                                type="button" 
                                                onClick={nextStep}
                                                className="w-full h-12 bg-[#0066ff] hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 mt-8"
                                            >
                                                <span>Continuar para Pagamento</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Step 2: Payment and Custom Fields */}
                                    {step === 2 && (
                                        <div className="space-y-6 animate-in fade-in duration-200">
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                                <div>
                                                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Forma de Pagamento</h2>
                                                    <p className="text-xs text-slate-400">Escolha como deseja ativar sua assinatura.</p>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setStep(1)} 
                                                    className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 border border-slate-200 rounded-lg px-2.5 py-1"
                                                >
                                                    <ArrowLeft className="w-3.5 h-3.5" />
                                                    <span>Alterar Dados</span>
                                                </button>
                                            </div>

                                            {isFree ? (
                                                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 text-center">
                                                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        {activePlan === 'free' ? (
                                                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                                        ) : (
                                                            <Tag className="w-6 h-6 text-emerald-600" />
                                                        )}
                                                    </div>
                                                    <h3 className="text-md font-bold text-emerald-800 mb-1">
                                                        {activePlan === 'free' ? 'Plano Gratuito Ativo!' : 'Acesso gratuito disponível!'}
                                                    </h3>
                                                    <p className="text-xs text-emerald-600 leading-relaxed max-w-sm mx-auto">
                                                        {activePlan === 'free' 
                                                            ? 'Você está assinando nosso plano gratuito. Basta preencher as informações de cadastro e clicar em concluir para acessar a plataforma.' 
                                                            : 'Seu cupom de 100% OFF cobre o valor total deste ciclo de assinatura. Clique em concluir abaixo para liberar a conta sem custos.'
                                                        }
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {/* Method selector with pix-logo.svg integration */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <button 
                                                            type="button"
                                                            onClick={() => setPaymentMethod('CREDIT_CARD')}
                                                            className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                                                                paymentMethod === 'CREDIT_CARD' 
                                                                    ? 'border-[#0066ff] bg-blue-50/20 ring-1 ring-[#0066ff]' 
                                                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                                            }`}
                                                        >
                                                            <div className={`p-2 rounded-lg ${paymentMethod === 'CREDIT_CARD' ? 'bg-[#0066ff] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                                <CreditCard className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <span className="block text-xs font-bold text-slate-900">Cartão de Crédito</span>
                                                                <span className="text-[10px] text-slate-400 font-medium">Cobrança automática</span>
                                                            </div>
                                                        </button>

                                                        <button 
                                                            type="button"
                                                            onClick={() => setPaymentMethod('PIX')}
                                                            className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                                                                paymentMethod === 'PIX' 
                                                                    ? 'border-[#0066ff] bg-blue-50/20 ring-1 ring-[#0066ff]' 
                                                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                                            }`}
                                                        >
                                                            <div className="p-1 rounded-lg shrink-0">
                                                                <img 
                                                                    src="/pix-logo.svg" 
                                                                    alt="Pix Logo" 
                                                                    className="w-7 h-7 object-contain" 
                                                                />
                                                            </div>
                                                            <div>
                                                                <span className="block text-xs font-bold text-slate-900">Pix</span>
                                                                <span className="text-[10px] text-slate-400 font-medium">Liberação imediata</span>
                                                            </div>
                                                        </button>
                                                    </div>

                                                    {/* Pix Informational display prior to generation */}
                                                    {paymentMethod === 'PIX' && (
                                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 animate-in slide-in-from-top-4 duration-300">
                                                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                                                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                                                                <span>Informações sobre o pagamento via Pix</span>
                                                            </h4>
                                                            <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4 leading-relaxed font-medium">
                                                                <li>O pagamento é rápido, seguro e processado instantaneamente.</li>
                                                                <li>Ao clicar em gerar, um QR Code e uma Chave Copia e Cola serão exibidos na tela.</li>
                                                                <li>Sua assinatura premium será ativada automaticamente no momento em que o Pix for compensado.</li>
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Credit Card Dynamically Collapsed Section */}
                                                    {paymentMethod === 'CREDIT_CARD' && (
                                                        <div className="space-y-4 bg-slate-50 border border-slate-100 p-5 rounded-xl animate-in slide-in-from-top-4 duration-300">
                                                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/50 pb-2 mb-3">
                                                                Dados do Cartão
                                                            </h3>

                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Número do Cartão</label>
                                                                <div className="relative">
                                                                    <input 
                                                                        required 
                                                                        name="cardNumber" 
                                                                        value={formData.cardNumber} 
                                                                        onChange={handleInputChange} 
                                                                        type="text" 
                                                                        className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff] focus:outline-none transition-all tracking-wider font-mono font-bold" 
                                                                        placeholder="0000 0000 0000 0000" 
                                                                    />
                                                                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nome no Cartão</label>
                                                                <input 
                                                                    required 
                                                                    name="cardHolder" 
                                                                    value={formData.cardHolder} 
                                                                    onChange={handleInputChange} 
                                                                    type="text" 
                                                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff] focus:outline-none transition-all placeholder-slate-400 uppercase font-medium" 
                                                                    placeholder="COMO IMPRESSO NO CARTÃO" 
                                                                />
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Validade (MM/YY)</label>
                                                                    <input 
                                                                        required 
                                                                        name="cardExpiry" 
                                                                        value={formData.cardExpiry} 
                                                                        onChange={handleInputChange} 
                                                                        type="text" 
                                                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff] focus:outline-none transition-all placeholder-slate-400 font-bold font-mono" 
                                                                        placeholder="Ex: 08/29" 
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Cód. Segurança (CVV)</label>
                                                                    <input 
                                                                        required 
                                                                        name="cardCcv" 
                                                                        value={formData.cardCcv} 
                                                                        onChange={handleInputChange} 
                                                                        type="text" 
                                                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff] focus:outline-none transition-all placeholder-slate-400 font-bold font-mono" 
                                                                        placeholder="Ex: 123" 
                                                                    />
                                                                </div>
                                                            </div>

                                                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/50 pb-2 pt-4 mb-3">
                                                                Endereço de Cobrança
                                                            </h3>

                                                            <div className="grid grid-cols-3 gap-4">
                                                                <div className="col-span-2">
                                                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">CEP</label>
                                                                    <input 
                                                                        required={paymentMethod === 'CREDIT_CARD'}
                                                                        name="postalCode" 
                                                                        value={formData.postalCode} 
                                                                        onChange={handleInputChange} 
                                                                        type="text" 
                                                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff] focus:outline-none transition-all placeholder-slate-400 font-bold font-mono" 
                                                                        placeholder="00000-000" 
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Número</label>
                                                                    <input 
                                                                        required={paymentMethod === 'CREDIT_CARD'}
                                                                        name="addressNumber" 
                                                                        value={formData.addressNumber} 
                                                                        onChange={handleInputChange} 
                                                                        type="text" 
                                                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff] focus:outline-none transition-all placeholder-slate-400 font-medium" 
                                                                        placeholder="Ex: 123" 
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <button 
                                                type="submit" 
                                                className="w-full h-12 bg-[#0066ff] hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>Processando...</span>
                                                    </>
                                                ) : isFree ? (
                                                    'Acessar Plataforma'
                                                ) : paymentMethod === 'PIX' ? (
                                                    'Gerar QR Code'
                                                ) : (
                                                    'Concluir Assinatura'
                                                )}
                                            </button>

                                            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
                                                <Lock className="w-3.5 h-3.5" />
                                                <span>Transação protegida por criptografia de segurança.</span>
                                            </div>
                                        </div>
                                    )}
                                </form>
                            </div>
                        ) : null}

                    </div>

                    {/* Right Column: Order Summary (SaaS style) */}
                    <div className="lg:col-span-4 space-y-6">
                        {activePlan ? (
                            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="bg-[#00a868] text-white py-3.5 px-4 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 select-none">
                                <ShieldCheck className="w-5 h-5 text-white" />
                                <span>COMPRA 100% SEGURA</span>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                                    <h3 className="text-sm font-extrabold text-slate-900 tracking-wider uppercase">
                                        Plano {activePlan.toUpperCase()}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedPlan('');
                                            setStep(1);
                                            setAppliedCoupon(null);
                                        }}
                                        className="text-[10px] font-extrabold text-[#0066ff] hover:text-white hover:bg-[#0066ff] uppercase tracking-wider cursor-pointer border border-[#0066ff] rounded-lg px-2.5 py-1.5 transition-all duration-300 active:scale-95"
                                    >
                                        Alterar plano
                                    </button>
                                </div>

                                {/* Plan Benefits (Dynamic per plan type) */}
                                <div className="my-6 space-y-2 pb-1">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold mb-3">Incluso nesta assinatura:</p>
                                    {getPlanFeatures(activePlan).map((feat, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Coupon Activation Section (Repositioned here before total) */}
                                <div className="relative mt-8 mb-6 border-t border-slate-100 pt-6">
                                    <div className="relative">
                                        <span 
                                            className={`absolute left-4 transition-all duration-200 pointer-events-none select-none ${
                                                isCouponFocused || couponInput.length > 0 || appliedCoupon !== null
                                                    ? '-top-2 text-[9px] bg-[#f0f2f5] text-slate-500 px-2 py-0.5 rounded-full font-bold border border-slate-200' 
                                                    : 'top-3 text-xs font-semibold text-slate-400'
                                            }`}
                                        >
                                            Possui um cupom?
                                        </span>
                                        <div className="flex bg-slate-50 border border-slate-200 focus-within:border-[#0066ff] focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10 rounded-xl overflow-hidden transition-all pl-4 pr-3 py-1 items-center">
                                            <input 
                                                type="text" 
                                                value={couponInput}
                                                onFocus={() => setIsCouponFocused(true)}
                                                onBlur={() => setIsCouponFocused(false)}
                                                onChange={(e) => setCouponInput(e.target.value)}
                                                className="flex-grow bg-transparent text-xs font-bold text-slate-900 uppercase focus:outline-none placeholder-transparent py-1.5"
                                            />
                                            <button 
                                                type="button"
                                                onClick={handleApplyCoupon}
                                                disabled={validatingCoupon || !couponInput.trim()}
                                                className="text-slate-800 hover:text-slate-950 disabled:opacity-40 text-xs font-bold transition-all shrink-0 uppercase tracking-wider pl-3 py-1 cursor-pointer"
                                            >
                                                {validatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Aplicar'}
                                            </button>
                                        </div>
                                    </div>
                                    {couponError && <p className="text-[10px] text-red-500 font-medium mt-1.5">{couponError}</p>}
                                </div>

                                {/* Applied Coupon Banner */}
                                {appliedCoupon && (
                                    <div className="flex justify-between items-center mb-5 text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-100 p-3 rounded-xl animate-in fade-in duration-200">
                                        <span className="flex items-center gap-1.5">
                                            <Tag className="w-3.5 h-3.5" />
                                            Cupom {appliedCoupon.code} Ativo
                                        </span>
                                        <span>-{appliedCoupon.discount_percent}%</span>
                                    </div>
                                )}

                                {/* Total Pricing Area */}
                                <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-700 font-bold">Total mensal</span>
                                        <div className="text-right">
                                            {appliedCoupon && (
                                                <div className="text-xs text-slate-400 line-through mb-0.5">
                                                    {formatCurrency(originalPrice)}
                                                </div>
                                            )}
                                            <span className="text-2xl font-black text-[#0066ff] tracking-tight">
                                                {formatCurrency(finalPrice)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium leading-relaxed">
                                        Faturamento recorrente. Cancele quando quiser.
                                    </div>
                                </div>

                                {/* Trust Badges (No title block) */}
                                <div className="mt-8 pt-6 border-t border-slate-100/80">
                                    <div className="grid grid-cols-2 gap-2.5 text-center">
                                        <div className="flex flex-col items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                            <Lock className="w-4 h-4 text-slate-400 mb-1 shrink-0" />
                                            <span className="text-[9px] text-slate-700 font-bold block">SSL Protegido</span>
                                            <span className="text-[7.5px] text-slate-400 font-medium mt-0.5 leading-tight">Dados 100% criptografados</span>
                                        </div>
                                        <div className="flex flex-col items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500 mb-1 shrink-0" />
                                            <span className="text-[9px] text-slate-700 font-bold block">Gateway ASAAS</span>
                                            <span className="text-[7.5px] text-slate-400 font-medium mt-0.5 leading-tight">Processamento homologado</span>
                                        </div>
                                        <div className="flex flex-col items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                            <CheckCircle2 className="w-4 h-4 text-[#0066ff] mb-1 shrink-0" />
                                            <span className="text-[9px] text-slate-700 font-bold block">Acesso Imediato</span>
                                            <span className="text-[7.5px] text-slate-400 font-medium mt-0.5 leading-tight">Liberação imediata no PIX</span>
                                        </div>
                                        <div className="flex flex-col items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                            <ShieldCheck className="w-4 h-4 text-amber-500 mb-1 shrink-0" />
                                            <span className="text-[9px] text-slate-700 font-bold block">Garantia 7 Dias</span>
                                            <span className="text-[7.5px] text-slate-400 font-medium mt-0.5 leading-tight">Satisfação ou reembolso</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>

            {/* Bottom Symmetrical Header-aligned Footer (No wrapper white card block - raw image aligned to container width) */}
            <div className="w-full max-w-[1200px] mx-auto px-4 mb-12">
                <img 
                    src="/footer_checkout_beleadly.svg" 
                    alt="beleadly Segurança" 
                    className="w-full h-auto block rounded-2xl" 
                />
                
                <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-medium px-4">
                    <p>© {new Date().getFullYear()} beleadly. Todos os direitos reservados.</p>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setShowTerms(true)}
                            className="hover:text-[#0066ff] transition-colors cursor-pointer"
                        >
                            Termos de Uso
                        </button>
                        <span>•</span>
                        <button 
                            onClick={() => setShowPrivacy(true)}
                            className="hover:text-[#0066ff] transition-colors cursor-pointer"
                        >
                            Política de Privacidade
                        </button>
                        <span>•</span>
                        <a href="mailto:suporte@beleadly.com" className="hover:text-[#0066ff] transition-colors">
                            Suporte
                        </a>
                    </div>
                </div>
            </div>

            {/* --- ACTIVE FUNCTIONAL LEGAL MODALS --- */}
            
            {/* Termos de Uso */}
            <Modal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Termos de Uso">
                <p className="font-normal"><strong>Última atualização: Janeiro de 2026</strong></p>
                <p className="font-normal">Bem-vindo ao beleadly. Ao acessar nossa plataforma, você concorda com estes termos.</p>

                <h4 className="text-white font-bold mt-4">1. Uso Aceitável</h4>
                <p className="font-normal">Você concorda em usar nossa ferramenta apenas para fins legais e comerciais legítimos. É estritamente proibido usar os dados extraídos para spam, assédio ou qualquer atividade que viole as leis de proteção de dados vigentes (como LGPD e GDPR).</p>

                <h4 className="text-white font-bold mt-4">2. Licença de Software</h4>
                <p className="font-normal">Concedemos a você uma licença limitada, não exclusiva e revogável para usar o software beleadly conforme seu plano de assinatura. A engenharia reversa, redistribuição ou revenda do software é proibida.</p>

                <h4 className="text-white font-bold mt-4">3. Responsabilidade sobre Dados</h4>
                <p className="font-normal">O beleadly atua como um facilitador de busca de dados públicos. Não somos responsáveis pela precisão, atualidade ou qualidade dos dados encontrados no Google Maps, nem pelo uso que você fará deles.</p>

                <h4 className="text-white font-bold mt-4">4. Cancelamento</h4>
                <p className="font-normal">Você pode cancelar sua assinatura a qualquer momento. O acesso permanecerá ativo até o fim do ciclo de faturamento pago.</p>
            </Modal>

            {/* Política de Privacidade */}
            <Modal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="Política de Privacidade">
                <p className="font-normal"><strong>Vigência: 2026</strong></p>
                <p className="font-normal">Sua privacidade é nossa prioridade. Esta política descreve como tratamos seus dados.</p>

                <h4 className="text-white font-bold mt-4">1. Coleta de Dados</h4>
                <p className="font-normal">Coletamos apenas as informações necessárias para o funcionamento da sua conta (nome, e-mail e dados de pagamento via processador seguro). Não armazenamos os dados dos seus cartões de crédito.</p>

                <h4 className="text-white font-bold mt-4">2. Dados Extraídos</h4>
                <p className="font-normal">Os leads que você extrai através da nossa ferramenta são processados de forma privada. Nós não vendemos, compartilhamos ou utilizamos as suas listas de leads extraídas. Elas pertencem exclusivamente a você.</p>

                <h4 className="text-white font-bold mt-4">3. Cookies e Rastreamento</h4>
                <p className="font-normal">Utilizamos cookies essenciais para manter sua sessão active e ferramentas de análise anônima para melhorar a performance da plataforma.</p>

                <h4 className="text-white font-bold mt-4">4. Segurança</h4>
                <p className="font-normal">Implementamos criptografia de ponta a ponta e seguimos os padrões da indústria para proteger suas credenciais e informações de conta.</p>
            </Modal>
        </div>
    );
};

export default Checkout;
