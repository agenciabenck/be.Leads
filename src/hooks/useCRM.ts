import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { Lead, CRMLead, CRMStatus } from '@/types/types';
import { toast } from 'sonner';
import { enrichLead } from '@/services/enrichmentService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Beautiful helper to cleanly format and append enrichment details to lead notes.
 * Removes any pre-existing block to avoid duplicates.
 */
function mergeEnrichmentIntoNotes(currentNotes: string, cnpj?: string, socios?: string[], email?: string): string {
    return currentNotes || '';
}

export const useCRM = (userId: string | undefined, onCreditsUsed?: (newTotal: number) => void) => {
    const queryClient = useQueryClient();
    const [crmSearchQuery, setCrmSearchQuery] = useState('');
    const [enrichingCrmLeadIds, setEnrichingCrmLeadIds] = useState<Set<string>>(new Set());
    const [failedEnrichmentAttempts, setFailedEnrichmentAttempts] = useState<Record<string, number>>({});
    
    // Global History (Cache Local Simples para pesquisas - não conflita com CRM Leads)
    const [globalHistory, setGlobalHistory] = useState<string[]>(() => {
        try {
            const hist = localStorage.getItem(`beleadly_global_history_${userId || 'anonymous'}`);
            return hist ? JSON.parse(hist) : [];
        } catch { return []; }
    });

    const updateGlobalHistory = useCallback((next: string[] | ((prev: string[]) => string[])) => {
        setGlobalHistory(prev => {
            const nextValue = typeof next === 'function' ? next(prev) : next;
            try { localStorage.setItem(`beleadly_global_history_${userId || 'anonymous'}`, JSON.stringify(nextValue)); } catch {}
            return nextValue;
        });
    }, [userId]);

    // 1. QUERY PRINCIPAL (React Query) - A Única Fonte da Verdade
    const { data: crmLeads = [], isLoading } = useQuery({
        queryKey: ['crm_leads', userId],
        queryFn: async () => {
            if (!userId) {
                // Modo Offline / Visitante
                const anonStr = localStorage.getItem('beleadly_crm_leads_anonymous');
                return anonStr ? (JSON.parse(anonStr) as CRMLead[]) : [];
            }

            const { data, error } = await supabase
                .from('crm_leads')
                .select('*')
                .eq('user_id', userId)
                .order('added_at', { ascending: false });

            if (error) {
                console.error('[CRM] ❌ Erro ao buscar leads no Supabase:', error);
                throw error;
            }

            // Map Snake Case to Camel Case
            return (data || []).map(l => ({
                id: l.id,
                name: l.name,
                category: l.category || '',
                address: l.address || '',
                phone: l.phone || '',
                website: l.website || '',
                rating: Number(l.rating) || 0,
                reviews: l.reviews || 0,
                status: (l.status as CRMStatus) || 'prospecting',
                priority: l.priority || 'medium',
                tags: l.tags || [],
                addedAt: l.added_at,
                updatedAt: l.updated_at,
                potentialValue: Number(l.potential_value) || 0,
                notes: l.notes || '',
                googleMapsLink: l.google_maps_link || '',
                instagram: l.instagram || '',
                recycleAt: l.recycle_at,
                notifyAt: l.notify_at,
                contactName: l.contact_name || '',
                gatekeeperName: l.gatekeeper_name || '',
                dmName: l.dm_name || '',
                providerName: l.provider_name || '',
                email: l.email || '',
                cnpj: l.cnpj || undefined,
                socios: l.socios || undefined,
                enrichedAt: l.enriched_at || undefined,
            })) as CRMLead[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutos sem refetch automático
    });

    // Mock de setCrmLeads para não quebrar componentes legados que o esperavam (como Settings)
    // ATENÇÃO: Nenhum componente deve usar isso para mutar o estado real agora. Use as mutations!
    const setCrmLeads = useCallback((value: any) => {
        console.warn('setCrmLeads chamado diretamente. Use as funções de mutação (addCrmLead, updateLead, etc) em vez disso.');
    }, []);

    // 2. MIGRAÇÃO DE LEADS ANÔNIMOS (Quando loga a primeira vez)
    useEffect(() => {
        if (!userId) return;
        const syncAnon = async () => {
            try {
                // 1. Migra leads anônimos
                const anonStr = localStorage.getItem('beleadly_crm_leads_anonymous');
                let leadsToMigrate: any[] = [];
                
                if (anonStr) {
                    const anonLeads = JSON.parse(anonStr);
                    if (Array.isArray(anonLeads)) {
                        leadsToMigrate = [...leadsToMigrate, ...anonLeads];
                    }
                }

                // 2. Restaura leads locais antigos que não subiram pro banco (Falha antiga do CRM)
                const localStr = localStorage.getItem(`beleadly_crm_leads_${userId}`);
                if (localStr) {
                    const localLeads = JSON.parse(localStr);
                    if (Array.isArray(localLeads)) {
                        // Filtramos leads válidos
                        leadsToMigrate = [...leadsToMigrate, ...localLeads];
                    }
                }

                // Remove duplicatas baseadas no ID
                leadsToMigrate = Array.from(new Map(leadsToMigrate.map(item => [item.id, item])).values());

                if (leadsToMigrate.length > 0) {
                    const dbPayloads = leadsToMigrate.map((l: any) => ({
                        id: l.id,
                        user_id: userId,
                        name: l.name,
                        category: l.category === 'Lead' ? '' : l.category,
                        address: l.address || '',
                        phone: l.phone || '',
                        website: l.website || '',
                        rating: Number(l.rating) || 0,
                        reviews: Number(l.reviews) || 0,
                        google_maps_link: l.googleMapsLink || '',
                        instagram: l.instagram || '',
                        status: l.status || 'prospecting',
                        priority: l.priority || 'medium',
                        notes: l.notes || null,
                        contact_name: l.contactName || '',
                        gatekeeper_name: l.gatekeeperName || '',
                        dm_name: l.dmName || '',
                        provider_name: l.providerName || '',
                        cnpj: l.cnpj || null,
                        socios: l.socios || null,
                        email: l.email || null,
                        enriched_at: l.enrichedAt || null,
                        added_at: l.addedAt || new Date().toISOString(),
                        updated_at: l.updatedAt || new Date().toISOString(),
                        potential_value: Number(l.potentialValue) || 0
                    }));
                    
                    console.log(`[CRM] Restaurando ${dbPayloads.length} leads do cache local para o banco...`);
                    const { error } = await supabase.from('crm_leads').upsert(dbPayloads, { onConflict: 'id,user_id' });
                    
                    if (!error) {
                        console.log('[CRM] Restauração concluída com sucesso!');
                        toast.success(`Restaurados ${dbPayloads.length} leads do cache para o banco de dados.`);
                        localStorage.removeItem('beleadly_crm_leads_anonymous');
                        // Não removemos o cache local do usuário por segurança imediata, mas o React Query já vai ser a source of truth
                        queryClient.invalidateQueries({ queryKey: ['crm_leads', userId] });
                    } else {
                        console.error('[CRM] Erro ao restaurar leads no banco:', error);
                        toast.error(`Falha ao restaurar leads antigos: ${error.message}`);
                    }
                }
            } catch (e: any) {
                console.error('[CRM] Erro ao migrar leads anônimos/locais:', e);
                toast.error(`Erro interno ao tentar migrar leads: ${e.message || 'Erro desconhecido'}`);
            }
        };
        syncAnon();
    }, [userId, queryClient]);

    // 3. SUPABASE REALTIME (WebSockets) - A Mágica de Sincronização Instantânea
    useEffect(() => {
        if (!userId) return;

        console.log('[CRM] 🟢 Conectando ao Supabase Realtime...');
        const channel = supabase.channel(`crm_leads_${userId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'crm_leads', 
                filter: `user_id=eq.${userId}` 
            }, (payload) => {
                console.log('[CRM] ⚡ Realtime Update:', payload);
                // Invalida o cache para o React Query buscar a versão mais recente do banco
                queryClient.invalidateQueries({ queryKey: ['crm_leads', userId] });
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[CRM] 🟢 Conectado ao Supabase Realtime com sucesso!');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, queryClient]);


    // 4. MUTATIONS (Adicionar, Atualizar, Deletar)
    
    // Add to CRM (From Scraper)
    const addMutation = useMutation({
        mutationFn: async (lead: Lead) => {
            if (!userId) throw new Error('Offline'); // Tratamento offline simulado
            
            const existingLead = crmLeads.find(l => l.id === lead.id);
            if (existingLead) {
                const hasNewEnrichment = (lead.cnpj && !existingLead.cnpj) || (lead.email && !existingLead.email) || (lead.socios && !existingLead.socios);
                if (!hasNewEnrichment) return existingLead;

                const { data, error } = await supabase.from('crm_leads').update({
                    cnpj: lead.cnpj || existingLead.cnpj || null,
                    socios: lead.socios || existingLead.socios || null,
                    email: lead.email || existingLead.email || null,
                    enriched_at: lead.enrichedAt || existingLead.enrichedAt || null,
                    updated_at: new Date().toISOString()
                }).eq('id', lead.id).eq('user_id', userId).select();
                if (error) throw error;
                return data[0];
            }

            const notesWithEnrichment = mergeEnrichmentIntoNotes(lead.notes || '', lead.cnpj, lead.socios, lead.email);
            
            const dbPayload = {
                id: lead.id,
                user_id: userId,
                name: lead.name,
                category: lead.category === 'Lead' ? '' : lead.category,
                address: lead.address,
                phone: lead.phone,
                website: lead.website,
                rating: Number(lead.rating) || 0,
                reviews: Number(lead.reviews) || 0,
                google_maps_link: lead.googleMapsLink,
                instagram: lead.instagram,
                status: 'prospecting',
                priority: 'medium',
                notes: notesWithEnrichment || null,
                contact_name: lead.contactName || '',
                gatekeeper_name: lead.gatekeeperName || '',
                dm_name: lead.dmName || '',
                provider_name: lead.providerName || '',
                cnpj: lead.cnpj || null,
                socios: lead.socios || null,
                email: lead.email || null,
                enriched_at: lead.enrichedAt || null,
                added_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                potential_value: 0
            };

            const { data, error } = await supabase.from('crm_leads').upsert(dbPayload, { onConflict: 'id,user_id' }).select();
            if (error) throw error;
            return data[0];
        },
        onMutate: async (newLead) => {
            // Optimistic Update
            await queryClient.cancelQueries({ queryKey: ['crm_leads', userId] });
            const previousLeads = queryClient.getQueryData<CRMLead[]>(['crm_leads', userId]);
            
            const isExisting = previousLeads?.some(l => l.id === newLead.id);
            if (!isExisting && previousLeads) {
                const optimisticLead: CRMLead = {
                    ...newLead,
                    category: newLead.category === 'Lead' ? '' : newLead.category,
                    status: 'prospecting',
                    priority: 'medium',
                    tags: [],
                    notes: newLead.notes || '',
                    addedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    potentialValue: 0
                };
                queryClient.setQueryData<CRMLead[]>(['crm_leads', userId], [optimisticLead, ...previousLeads]);
                updateGlobalHistory(prev => [...prev, newLead.id]);
            }
            return { previousLeads };
        },
        onError: (err, newLead, context) => {
            if (err.message !== 'Offline') {
                console.error('[CRM] Erro ao adicionar lead:', err);
                toast.error('Erro ao adicionar lead.');
            } else {
                // Lógica Offline manual se não tiver logado (Fallback)
                toast.warning(`Salvo localmente! O lead foi adicionado ao seu CRM offline.`);
            }
            if (context?.previousLeads) queryClient.setQueryData(['crm_leads', userId], context.previousLeads);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_leads', userId] });
        }
    });

    const addCrmLeadMutation = useMutation({
        mutationFn: async (crmLead: CRMLead) => {
            if (!userId) throw new Error('Offline');
            
            const dbPayload = {
                id: crmLead.id,
                user_id: userId,
                name: crmLead.name,
                category: crmLead.category,
                address: crmLead.address,
                phone: crmLead.phone,
                website: crmLead.website,
                rating: Number(crmLead.rating) || 0,
                reviews: Number(crmLead.reviews) || 0,
                google_maps_link: crmLead.googleMapsLink,
                instagram: crmLead.instagram,
                status: crmLead.status,
                priority: crmLead.priority,
                potential_value: Number(crmLead.potentialValue) || 0,
                notes: crmLead.notes || null,
                contact_name: crmLead.contactName,
                gatekeeper_name: crmLead.gatekeeperName,
                dm_name: crmLead.dmName,
                provider_name: crmLead.providerName,
                email: crmLead.email,
                cnpj: crmLead.cnpj || null,
                socios: crmLead.socios || null,
                enriched_at: crmLead.enrichedAt || null,
                added_at: crmLead.addedAt || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase.from('crm_leads').upsert(dbPayload, { onConflict: 'id,user_id' }).select();
            if (error) throw error;
            return data[0];
        },
        onMutate: async (newLead) => {
            await queryClient.cancelQueries({ queryKey: ['crm_leads', userId] });
            const previousLeads = queryClient.getQueryData<CRMLead[]>(['crm_leads', userId]);
            if (previousLeads) {
                queryClient.setQueryData<CRMLead[]>(['crm_leads', userId], [newLead, ...previousLeads]);
                updateGlobalHistory(prev => [...prev, newLead.id]);
            }
            return { previousLeads };
        },
        onError: (err, variables, context) => {
            if (context?.previousLeads) queryClient.setQueryData(['crm_leads', userId], context.previousLeads);
            if (err.message === 'Offline') toast.warning(`Salvo localmente!`);
            else toast.error('Erro ao salvar lead.');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['crm_leads', userId] });
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ leadId, newStatus }: { leadId: string, newStatus: CRMStatus }) => {
            if (!userId) throw new Error('Offline');
            
            let recycleAt: string | null = null;
            if (newStatus === 'lost') {
                const date = new Date();
                date.setDate(date.getDate() + 45); // 45 days retention
                recycleAt = date.toISOString();
            }

            const { data, error } = await supabase.from('crm_leads')
                .update({ status: newStatus, updated_at: new Date().toISOString(), recycle_at: recycleAt })
                .eq('id', leadId).eq('user_id', userId).select();

            if (error) throw error;
            return data[0];
        },
        onMutate: async ({ leadId, newStatus }) => {
            await queryClient.cancelQueries({ queryKey: ['crm_leads', userId] });
            const previousLeads = queryClient.getQueryData<CRMLead[]>(['crm_leads', userId]);
            if (previousLeads) {
                queryClient.setQueryData<CRMLead[]>(['crm_leads', userId], prev => 
                    (prev || []).map(l => l.id === leadId ? { ...l, status: newStatus, updatedAt: new Date().toISOString() } : l)
                );
            }
            return { previousLeads };
        },
        onError: (err, variables, context) => {
            if (context?.previousLeads) queryClient.setQueryData(['crm_leads', userId], context.previousLeads);
            toast.error('Erro ao atualizar status.');
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['crm_leads', userId] })
    });

    const updateLeadMutation = useMutation({
        mutationFn: async ({ leadId, updates }: { leadId: string, updates: Partial<CRMLead> }) => {
            if (!userId) throw new Error('Offline');
            
            const dbUpdates: any = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.category !== undefined) dbUpdates.category = updates.category || null;
            if (updates.address !== undefined) dbUpdates.address = updates.address || null;
            if (updates.phone !== undefined) dbUpdates.phone = updates.phone || null;
            if (updates.website !== undefined) dbUpdates.website = updates.website || null;
            if (updates.status !== undefined) dbUpdates.status = updates.status;
            if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
            if (updates.potentialValue !== undefined) dbUpdates.potential_value = Number(updates.potentialValue) || 0;
            if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
            if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
            if (updates.instagram !== undefined) dbUpdates.instagram = updates.instagram || null;
            
            if (updates.notifyAt !== undefined) dbUpdates.notify_at = updates.notifyAt || null;
            if (updates.contactName !== undefined) dbUpdates.contact_name = updates.contactName || null;
            if (updates.gatekeeperName !== undefined) dbUpdates.gatekeeper_name = updates.gatekeeperName || null;
            if (updates.dmName !== undefined) dbUpdates.dm_name = updates.dmName || null;
            if (updates.providerName !== undefined) dbUpdates.provider_name = updates.providerName || null;
            if (updates.cnpj !== undefined) dbUpdates.cnpj = updates.cnpj || null;
            if (updates.socios !== undefined) dbUpdates.socios = updates.socios || null;
            if (updates.enrichedAt !== undefined) dbUpdates.enriched_at = updates.enrichedAt || null;
            if (updates.email !== undefined) dbUpdates.email = updates.email || null;

            dbUpdates.updated_at = updates.updatedAt || new Date().toISOString();

            const { data, error } = await supabase.from('crm_leads').update(dbUpdates).eq('id', leadId).eq('user_id', userId).select();
            if (error) {
                if (error.code === '42703') toast.error('Erro de schema no DB. Rode a migration 009.');
                throw error;
            }
            return data[0];
        },
        onMutate: async ({ leadId, updates }) => {
            await queryClient.cancelQueries({ queryKey: ['crm_leads', userId] });
            const previousLeads = queryClient.getQueryData<CRMLead[]>(['crm_leads', userId]);
            if (previousLeads) {
                queryClient.setQueryData<CRMLead[]>(['crm_leads', userId], prev => 
                    (prev || []).map(l => l.id === leadId ? { ...l, ...updates, updatedAt: updates.updatedAt || new Date().toISOString() } : l)
                );
            }
            return { previousLeads };
        },
        onError: (err, variables, context) => {
            if (context?.previousLeads) queryClient.setQueryData(['crm_leads', userId], context.previousLeads);
            toast.error('Erro ao atualizar lead.');
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['crm_leads', userId] })
    });

    const deleteMutation = useMutation({
        mutationFn: async (leadId: string) => {
            if (!userId) throw new Error('Offline');
            const { error } = await supabase.from('crm_leads').delete().eq('id', leadId).eq('user_id', userId);
            if (error) throw error;
            return leadId;
        },
        onMutate: async (leadId) => {
            await queryClient.cancelQueries({ queryKey: ['crm_leads', userId] });
            const previousLeads = queryClient.getQueryData<CRMLead[]>(['crm_leads', userId]);
            if (previousLeads) {
                queryClient.setQueryData<CRMLead[]>(['crm_leads', userId], prev => (prev || []).filter(l => l.id !== leadId));
                updateGlobalHistory(prev => prev.filter(id => id !== leadId));
            }
            return { previousLeads };
        },
        onError: (err, leadId, context) => {
            if (context?.previousLeads) queryClient.setQueryData(['crm_leads', userId], context.previousLeads);
            toast.error('Erro ao deletar lead.');
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['crm_leads', userId] })
    });

    const resetAllMutation = useMutation({
        mutationFn: async () => {
            if (!userId) return;
            // Tenta deletar atividades primeiro (pode dar erro se não existir ou RLs, ignora)
            await supabase.from('crm_activities').delete().eq('user_id', userId);
            const { error } = await supabase.from('crm_leads').delete().eq('user_id', userId);
            if (error) throw error;
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['crm_leads', userId] });
            const previousLeads = queryClient.getQueryData<CRMLead[]>(['crm_leads', userId]);
            if (previousLeads) {
                queryClient.setQueryData<CRMLead[]>(['crm_leads', userId], []);
                setGlobalHistory([]);
            }
            return { previousLeads };
        },
        onError: (err, vars, context) => {
            if (context?.previousLeads) queryClient.setQueryData(['crm_leads', userId], context.previousLeads);
            toast.error('Erro ao resetar CRM.');
        },
        onSuccess: () => {
            toast.success('CRM resetado com sucesso!');
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['crm_leads', userId] })
    });

    // Smart Recycle Logic (Roda toda vez que dados são carregados e tem algum na lixeira vencido)
    useEffect(() => {
        if (!crmLeads.length) return;
        const now = new Date();
        const leadsToRestore = crmLeads.filter(l => l.recycleAt && new Date(l.recycleAt) <= now);
        
        if (leadsToRestore.length > 0) {
            leadsToRestore.forEach(l => {
                const notes = (l.notes || '') + '\n\n[Sistema] ♻️ Lead reciclado automaticamente da lixeira.';
                updateLeadMutation.mutate({ leadId: l.id, updates: { status: 'prospecting', recycleAt: undefined, notes } });
            });
            console.log(`[CRM] ♻️ Smart Recycle: ${leadsToRestore.length} leads restaurados.`);
        }
    }, [crmLeads, updateLeadMutation]);

    // Enrichment Logic
    const enrichCrmLead = useCallback(async (leadId: string) => {
        const lead = crmLeads.find(l => l.id === leadId);
        if (!lead) return;

        setEnrichingCrmLeadIds(prev => new Set(prev).add(leadId));

        try {
            toast.loading('Buscando CNPJ e sócios...', { id: `enrich-${leadId}` });
            const enrichResult = await enrichLead(lead);

            if (!enrichResult.found) {
                setFailedEnrichmentAttempts(prev => ({ ...prev, [leadId]: (prev[leadId] || 0) + 1 }));
                toast.error('CNPJ não encontrado para esta empresa. Nenhum crédito foi cobrado.', { id: `enrich-${leadId}` });
                return;
            }

            if (userId) {
                const { data: creditResult, error: creditError } = await supabase.rpc('consume_credits', { amount: 1 });
                if (creditError) throw creditError;
                
                const result = creditResult as any;
                if (!result?.success) {
                    toast.error(`Enriquecimento bloqueado: ${result?.message || 'Créditos insuficientes'}`, { id: `enrich-${leadId}` });
                    return;
                }
                if (onCreditsUsed && result.new_usage !== undefined) {
                    onCreditsUsed(result.new_usage);
                }
            }

            const enrichedAt = new Date().toISOString();
            const notesWithEnrichment = mergeEnrichmentIntoNotes(lead.notes || '', enrichResult.cnpj, enrichResult.socios, enrichResult.email || lead.email || '');

            updateLeadMutation.mutate({
                leadId,
                updates: {
                    cnpj: enrichResult.cnpj,
                    socios: enrichResult.socios,
                    email: enrichResult.email || lead.email || '',
                    notes: notesWithEnrichment,
                    enrichedAt
                }
            });

            toast.success(enrichResult.socios?.length ? `Lead enriquecido! CNPJ e ${enrichResult.socios.length} sócio(s) encontrado(s).` : 'Lead enriquecido! CNPJ adicionado.', { id: `enrich-${leadId}` });
        } catch (err: any) {
            console.error('[CRM] enrichCrmLead: Erro:', err);
            toast.error(`Erro ao enriquecer: ${err.message || 'Falha inesperada'}`, { id: `enrich-${leadId}` });
        } finally {
            setEnrichingCrmLeadIds(prev => {
                const next = new Set(prev);
                next.delete(leadId);
                return next;
            });
        }
    }, [crmLeads, userId, updateLeadMutation, onCreditsUsed]);

    // Computed Properties
    const filteredLeads = useMemo(() => {
        if (!crmSearchQuery) return crmLeads;
        const q = crmSearchQuery.toLowerCase();
        return crmLeads.filter(l =>
            l.name.toLowerCase().includes(q) ||
            l.category.toLowerCase().includes(q) ||
            (l.phone && l.phone.includes(q))
        );
    }, [crmLeads, crmSearchQuery]);

    const monthlyRevenue = useMemo(() => {
        return crmLeads.filter(l => l.status === 'won').reduce((acc, l) => acc + (l.potentialValue || 0), 0);
    }, [crmLeads]);

    return {
        crmLeads, 
        setCrmLeads, // Mocked pra retrocompatibilidade
        crmSearchQuery, 
        setCrmSearchQuery,
        globalHistory, 
        setGlobalHistory: updateGlobalHistory,
        addToCRM: addMutation.mutateAsync,
        addCrmLead: addCrmLeadMutation.mutateAsync,
        updateLeadStatus: (leadId: string, status: CRMStatus) => updateStatusMutation.mutateAsync({ leadId, newStatus: status }),
        updateLead: (leadId: string, updates: Partial<CRMLead>) => updateLeadMutation.mutateAsync({ leadId, updates }),
        deleteLead: deleteMutation.mutateAsync,
        resetAllLeads: resetAllMutation.mutateAsync,
        enrichCrmLead,
        enrichingCrmLeadIds,
        failedEnrichmentAttempts,
        setFailedEnrichmentAttempts,
        filteredLeads,
        monthlyRevenue,
        isLoading
    };
};
