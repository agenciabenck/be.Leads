import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { Lead, CRMLead, CRMStatus } from '@/types/types';
import { toast } from 'sonner';
import { enrichLead } from '@/services/enrichmentService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Maps a raw Supabase row to a typed CRMLead object.
 * Single source of truth for DB → app mapping.
 */
function mapRowToCRMLead(l: any): CRMLead {
    return {
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
        sortOrder: l.sort_order ?? null,
        contactName: l.contact_name || '',
        gatekeeperName: l.gatekeeper_name || '',
        dmName: l.dm_name || '',
        providerName: l.provider_name || '',
        email: l.email || '',
        cnpj: l.cnpj || undefined,
        socios: l.socios || undefined,
        enrichedAt: l.enriched_at || undefined,
    };
}

/**
 * Appends or replaces enrichment data block in lead notes.
 */
function mergeEnrichmentIntoNotes(currentNotes: string, cnpj?: string, socios?: string[], email?: string): string {
    let notes = currentNotes || '';
    const startTag = '=== DADOS DE ENRIQUECIMENTO ===';
    const endTag = '================================';
    const startIndex = notes.indexOf(startTag);
    if (startIndex !== -1) {
        const endIndex = notes.indexOf(endTag, startIndex);
        if (endIndex !== -1) {
            notes = notes.slice(0, startIndex) + notes.slice(endIndex + endTag.length);
        } else {
            notes = notes.slice(0, startIndex);
        }
        notes = notes.trim();
    }
    const items: string[] = [];
    if (cnpj) items.push(`CNPJ: ${cnpj}`);
    if (email) items.push(`E-mail: ${email}`);
    if (socios && socios.length > 0) items.push(`Sócios: ${socios.join(', ')}`);
    if (items.length > 0) {
        const block = `\n\n${startTag}\n${items.join('\n')}\n${endTag}`;
        return (notes ? notes.trim() + block : block.trim());
    }
    return notes;
}

/**
 * Retry helper with exponential backoff for transient network errors.
 */
async function withRetry<T>(fn: () => Promise<T> | PromiseLike<T>, maxRetries = 3, baseDelayMs = 600): Promise<T> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastErr = err;
            if (attempt < maxRetries - 1) {
                const delay = baseDelayMs * Math.pow(2, attempt);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
    throw lastErr;
}

export const useCRM = (userId: string | undefined, onCreditsUsed?: (newTotal: number) => void, recycleDays: number = 45, isAuthLoading: boolean = false) => {
    const queryClient = useQueryClient();
    const [crmSearchQuery, setCrmSearchQuery] = useState('');
    const [enrichingCrmLeadIds, setEnrichingCrmLeadIds] = useState<Set<string>>(new Set());
    const [failedEnrichmentAttempts, setFailedEnrichmentAttempts] = useState<Record<string, number>>({});

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

    // ─── 1. QUERY PRINCIPAL ─────────────────────────────────────────────────────
    // refetchOnWindowFocus disabled to prevent data flashing when user switches tabs
    // retry=false: avoids cascading refetches on transient Supabase errors
    const { data: crmLeads = [], isLoading } = useQuery({
        queryKey: ['crm_leads', userId],
        queryFn: async () => {
            if (!userId) {
                const anonStr = localStorage.getItem('beleadly_crm_leads_anonymous');
                return anonStr ? (JSON.parse(anonStr) as CRMLead[]) : [];
            }

            const { data, error } = await supabase
                .from('crm_leads')
                .select('*')
                .eq('user_id', userId)
                .order('sort_order', { ascending: true, nullsFirst: false })
                .order('added_at', { ascending: false });

            if (error) {
                console.error('[CRM] ❌ Erro ao buscar leads no Supabase:', error);
                throw error;
            }

            return (data || []).map(mapRowToCRMLead);
        },
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: false,
        enabled: !isAuthLoading,
    });

    const { data: leadsWithMeetings = new Set<string>() } = useQuery({
        queryKey: ['leads_meetings', userId],
        queryFn: async () => {
            if (!userId) return new Set<string>();
            const { data, error } = await supabase
                .from('crm_activities')
                .select('lead_id')
                .eq('user_id', userId)
                .eq('activity_type', 'meeting_scheduled');
            if (error) return new Set<string>();
            return new Set(data.map(d => d.lead_id));
        },
        staleTime: 1000 * 60 * 2,
        refetchOnWindowFocus: false,
        enabled: !isAuthLoading,
    });

    const setCrmLeads = useCallback((_value: any) => {
        console.warn('[CRM] setCrmLeads chamado diretamente. Use as funções de mutação.');
    }, []);

    // ─── 2. REALTIME ────────────────────────────────────────────────────────────
    // Only invalidates cache when there are NO active local mutations.
    // Debounce extended to 5s: fast sequential mutations (drag-drop, batch updates)
    // need time to fully settle before a Realtime-triggered refetch could overwrite
    // the optimistic cache with stale server data.
    useEffect(() => {
        if (!userId) return;

        let debounceTimer: NodeJS.Timeout;
        let lastMutationEndTime = 0;

        const channel = supabase.channel(`crm_leads_${userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'crm_leads',
                filter: `user_id=eq.${userId}`
            }, () => {
                // Skip if mutations are actively in-flight
                if (queryClient.isMutating() > 0) {
                    lastMutationEndTime = Date.now();
                    return;
                }
                // Also skip if a mutation JUST finished (within 3s) to prevent
                // Realtime events triggered BY our own mutations from causing a refetch
                if (Date.now() - lastMutationEndTime < 3000) return;

                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    // Double-check no mutations started during debounce window
                    if (queryClient.isMutating() === 0) {
                        queryClient.invalidateQueries({ queryKey: ['crm_leads', userId] });
                    }
                }, 5000);
            })
            .subscribe();

        return () => {
            clearTimeout(debounceTimer);
            supabase.removeChannel(channel);
        };
    }, [userId, queryClient]);

    // ─── 3. HELPER: update a single lead in cache from returned DB row ──────────
    const updateLeadInCache = useCallback((updatedRow: any) => {
        if (!updatedRow) return;
        const mapped = mapRowToCRMLead(updatedRow);
        queryClient.setQueryData<CRMLead[]>(['crm_leads', userId], prev =>
            (prev || []).map(l => l.id === mapped.id ? mapped : l)
        );
    }, [queryClient, userId]);

    // ─── 4. MUTATIONS ────────────────────────────────────────────────────────────

    // Add lead from scraper
    const addMutation = useMutation({
        mutationFn: async (lead: Lead) => {
            if (!userId) {
                const anonStr = localStorage.getItem('beleadly_crm_leads_anonymous');
                const anonLeads: CRMLead[] = anonStr ? JSON.parse(anonStr) : [];
                const optimisticLead: CRMLead = {
                    ...lead,
                    category: lead.category === 'Lead' ? '' : lead.category,
                    status: 'prospecting',
                    priority: 'medium',
                    tags: ['Manual'],
                    notes: lead.notes || '',
                    addedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    potentialValue: 0
                };
                const exists = anonLeads.some(l => l.id === lead.id);
                if (!exists) {
                    anonLeads.unshift(optimisticLead);
                    localStorage.setItem('beleadly_crm_leads_anonymous', JSON.stringify(anonLeads));
                }
                queryClient.setQueryData<CRMLead[]>(['crm_leads', undefined], anonLeads);
                return optimisticLead;
            }

            const { data: existingData } = await withRetry(() =>
                supabase
                    .from('crm_leads')
                    .select('id, cnpj, email, socios')
                    .eq('id', lead.id)
                    .eq('user_id', userId)
                    .single()
                    .then(r => {
                        if (r.error && r.error.code !== 'PGRST116') throw r.error;
                        return r;
                    })
            );

            if (existingData) {
                const hasNewEnrichment = (lead.cnpj && !existingData.cnpj) || (lead.email && !existingData.email) || (lead.socios && !existingData.socios);
                if (!hasNewEnrichment) return existingData;
                const { data, error } = await withRetry(() =>
                    supabase.from('crm_leads').update({
                        cnpj: lead.cnpj || existingData.cnpj || null,
                        socios: lead.socios || existingData.socios || null,
                        email: lead.email || existingData.email || null,
                        enriched_at: lead.enrichedAt || null,
                        updated_at: new Date().toISOString()
                    }).eq('id', lead.id).eq('user_id', userId).select().then(r => {
                        if (r.error) throw r.error;
                        return r;
                    })
                );
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

            const { data, error } = await withRetry(() =>
                supabase.from('crm_leads').insert(dbPayload).select().then(r => {
                    if (r.error) throw r.error;
                    return r;
                })
            );
            if (error) throw error;
            return data[0];
        },
        onMutate: async (newLead) => {
            await queryClient.cancelQueries({ queryKey: ['crm_leads', userId] });
            const previousLeads = queryClient.getQueryData<CRMLead[]>(['crm_leads', userId]) || [];
            const isExisting = previousLeads.some(l => l.id === newLead.id);
            if (!isExisting) {
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
        onSuccess: (data) => {
            // Surgically update the single lead from DB response — no full refetch
            // Full refetch after onSuccess causes the optimistic lead to "flash" (disappear then reappear)
            if (data && data.id) {
                updateLeadInCache(data);
            }
        },
        onError: (err: any, _newLead, context) => {
            if (context?.previousLeads) queryClient.setQueryData(['crm_leads', userId], context.previousLeads);
            if (err.message !== 'Offline') {
                console.error('[CRM] Erro ao adicionar lead:', err);
                toast.error('Erro ao adicionar lead.');
            } else {
                toast.warning('Salvo localmente! O lead foi adicionado ao seu CRM offline.');
            }
        },
    });

    const addCrmLeadMutation = useMutation({
        mutationFn: async (crmLead: CRMLead) => {
            if (!userId) {
                const anonStr = localStorage.getItem('beleadly_crm_leads_anonymous');
                const anonLeads: CRMLead[] = anonStr ? JSON.parse(anonStr) : [];
                const exists = anonLeads.some(l => l.id === crmLead.id);
                if (!exists) {
                    anonLeads.unshift(crmLead);
                    localStorage.setItem('beleadly_crm_leads_anonymous', JSON.stringify(anonLeads));
                }
                queryClient.setQueryData<CRMLead[]>(['crm_leads', undefined], anonLeads);
                return crmLead;
            }

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

            const { data, error } = await withRetry(() =>
                supabase.from('crm_leads')
                    .upsert(dbPayload, { onConflict: 'id,user_id' })
                    .select()
                    .then(r => {
                        if (r.error) throw r.error;
                        return r;
                    })
            );
            if (error) throw error;
            return data[0];
        },
        onMutate: async (newLead) => {
            await queryClient.cancelQueries({ queryKey: ['crm_leads', userId] });
            const previousLeads = queryClient.getQueryData<CRMLead[]>(['crm_leads', userId]) || [];
            queryClient.setQueryData<CRMLead[]>(['crm_leads', userId], [newLead, ...previousLeads]);
            updateGlobalHistory(prev => [...prev, newLead.id]);
            return { previousLeads };
        },
        onSuccess: (data) => {
            // Surgically update the single lead from DB response — no full refetch
            if (data && data.id) updateLeadInCache(data);
        },
        onError: (err: any, _variables, context) => {
            if (context?.previousLeads) queryClient.setQueryData(['crm_leads', userId], context.previousLeads);
            if (err.message === 'Offline') toast.warning('Salvo localmente!');
            else toast.error('Erro ao salvar lead.');
        },
    });

    // ─── UPDATE STATUS ────────────────────────────────────────────────────────
    const updateStatusMutation = useMutation({
        mutationFn: async ({ leadId, newStatus }: { leadId: string, newStatus: CRMStatus }) => {
            if (!userId) throw new Error('Offline');

            let recycleAt: string | null = null;
            if (newStatus === 'lost') {
                const date = new Date();
                date.setDate(date.getDate() + recycleDays);
                recycleAt = date.toISOString();
            }

            const { data, error } = await withRetry(() =>
                supabase.from('crm_leads')
                    .update({
                        status: newStatus,
                        updated_at: new Date().toISOString(),
                        recycle_at: recycleAt
                    })
                    .eq('id', leadId)
                    .eq('user_id', userId)
                    .select()
                    .then(r => {
                        if (r.error) throw r.error;
                        return r;
                    })
            );

            if (error) throw error;
            if (!data || data.length === 0) throw new Error('No data returned from status update');
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
        onSuccess: (data) => {
            // Update cache directly from DB response — no refetch needed
            if (data) updateLeadInCache(data);
        },
        onError: (err: any, _vars, context) => {
            // Roll back the optimistic update
            if (context?.previousLeads) {
                queryClient.setQueryData(['crm_leads', userId], context.previousLeads);
            }
            if (err?.message === 'Offline') {
                toast.warning('Sem conexão. Reconecte e mova o card novamente.');
            } else {
                console.error('[CRM] Falha ao salvar status após retries:', err);
                toast.error('Não foi possível mover o card. Tente novamente.');
            }
        },
    });

    // ─── UPDATE LEAD (fields) ─────────────────────────────────────────────────
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
            if (updates.googleMapsLink !== undefined) dbUpdates.google_maps_link = updates.googleMapsLink || null;
            if (updates.notifyAt !== undefined) dbUpdates.notify_at = updates.notifyAt || null;
            if (updates.contactName !== undefined) dbUpdates.contact_name = updates.contactName || null;
            if (updates.gatekeeperName !== undefined) dbUpdates.gatekeeper_name = updates.gatekeeperName || null;
            if (updates.dmName !== undefined) dbUpdates.dm_name = updates.dmName || null;
            if (updates.providerName !== undefined) dbUpdates.provider_name = updates.providerName || null;
            if (updates.cnpj !== undefined) dbUpdates.cnpj = updates.cnpj || null;
            if (updates.socios !== undefined) dbUpdates.socios = updates.socios || null;
            if (updates.enrichedAt !== undefined) dbUpdates.enriched_at = updates.enrichedAt || null;
            if (updates.email !== undefined) dbUpdates.email = updates.email || null;
            if (updates.recycleAt !== undefined) dbUpdates.recycle_at = updates.recycleAt || null;
            dbUpdates.updated_at = updates.updatedAt || new Date().toISOString();

            const { data, error } = await withRetry(() =>
                supabase.from('crm_leads')
                    .update(dbUpdates)
                    .eq('id', leadId)
                    .eq('user_id', userId)
                    .select()
                    .then(r => {
                        if (r.error) throw r.error;
                        return r;
                    })
            );

            if (error) {
                if (error.code === '42703') toast.error('Erro de schema no DB.');
                throw error;
            }
            if (!data || data.length === 0) throw new Error('No data returned from lead update');
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
        onSuccess: (data) => {
            // Update cache directly from DB response — prevents stale data
            if (data) updateLeadInCache(data);
        },
        onError: (err: any, _vars, context) => {
            if (context?.previousLeads) {
                queryClient.setQueryData(['crm_leads', userId], context.previousLeads);
            }
            queryClient.invalidateQueries({ queryKey: ['crm_leads', userId] });
            if (err?.message === 'Offline') {
                toast.warning('Sem conexão. As alterações não foram salvas.');
            } else {
                console.error('[CRM] Falha ao salvar lead após retries:', err);
                toast.error('Não foi possível salvar as alterações. Tente novamente.');
            }
        },
    });

    // ─── DELETE ───────────────────────────────────────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: async (leadId: string) => {
            if (!userId) throw new Error('Offline');
            await supabase.from('crm_activities').delete().eq('lead_id', leadId).eq('user_id', userId);
            const { error } = await withRetry(() =>
                supabase.from('crm_leads')
                    .delete()
                    .eq('id', leadId)
                    .eq('user_id', userId)
                    .then(r => {
                        if (r.error) throw r.error;
                        return r;
                    })
            );
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
        onSuccess: () => {
            // No refetch needed — item was removed from cache in onMutate
        },
        onError: (err: any, leadId, context) => {
            if (context?.previousLeads) {
                queryClient.setQueryData(['crm_leads', userId], context.previousLeads);
            }
            queryClient.invalidateQueries({ queryKey: ['crm_leads', userId] });
            if (err?.message === 'Offline') {
                toast.warning('Sem conexão. O lead não foi excluído.');
            } else {
                console.error('[CRM] Falha ao excluir lead após retries:', err);
                toast.error('Não foi possível excluir o lead. Tente novamente.');
            }
        },
    });

    const resetAllMutation = useMutation({
        mutationFn: async () => {
            if (!userId) return;
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
        onError: (err, _vars, context) => {
            if (context?.previousLeads) queryClient.setQueryData(['crm_leads', userId], context.previousLeads);
            queryClient.invalidateQueries({ queryKey: ['crm_leads', userId] });
            toast.error('Erro ao resetar CRM.');
        },
        onSuccess: () => {
            toast.success('CRM resetado com sucesso!');
        },
    });

    // ─── UPDATE LEAD ORDER (Kanban drag & drop + status) ─────────────────────
    // CRITICAL: This mutation updates sort_order AND status atomically.
    // We update the cache directly from the DB response to prevent F5 regressions.
    const updateLeadOrderMutation = useMutation({
        mutationFn: async (updates: Array<{ leadId: string; sortOrder: number; status?: CRMStatus }>) => {
            if (!userId) return [];

            // Sequential writes to avoid DB conflicts on high-frequency drops
            const results: any[] = [];
            for (const { leadId, sortOrder, status } of updates) {
                const payload: any = {
                    sort_order: sortOrder,
                    updated_at: new Date().toISOString()
                };
                if (status !== undefined) {
                    payload.status = status;
                    if (status === 'lost') {
                        const date = new Date();
                        date.setDate(date.getDate() + recycleDays);
                        payload.recycle_at = date.toISOString();
                    } else {
                        payload.recycle_at = null;
                    }
                }

                const { data, error } = await withRetry(() =>
                    supabase
                        .from('crm_leads')
                        .update(payload)
                        .eq('id', leadId)
                        .eq('user_id', userId)
                        .select()
                        .then(r => {
                            if (r.error) throw r.error;
                            return r;
                        })
                );

                if (error) throw error;
                if (data && data[0]) results.push(data[0]);
            }
            return results;
        },
        onMutate: async (updates) => {
            await queryClient.cancelQueries({ queryKey: ['crm_leads', userId] });
            const previousLeads = queryClient.getQueryData<CRMLead[]>(['crm_leads', userId]);
            if (previousLeads) {
                const updateMap = new Map(updates.map(u => [u.leadId, u]));
                queryClient.setQueryData<CRMLead[]>(['crm_leads', userId], prev =>
                    (prev || []).map(l => {
                        const upd = updateMap.get(l.id);
                        if (upd) {
                            return {
                                ...l,
                                sortOrder: upd.sortOrder,
                                status: upd.status !== undefined ? upd.status : l.status,
                                recycleAt: upd.status === 'lost'
                                    ? new Date(Date.now() + recycleDays * 86400000).toISOString()
                                    : (upd.status !== undefined ? undefined : l.recycleAt),
                                updatedAt: new Date().toISOString()
                            };
                        }
                        return l;
                    })
                );
            }
            return { previousLeads };
        },
        onSuccess: (results) => {
            // Update cache from actual DB values — this is the source of truth after a move
            if (results && results.length > 0) {
                queryClient.setQueryData<CRMLead[]>(['crm_leads', userId], prev => {
                    if (!prev) return prev;
                    const updatedMap = new Map(results.map((r: any) => [r.id, mapRowToCRMLead(r)]));
                    return prev.map(l => updatedMap.has(l.id) ? updatedMap.get(l.id)! : l);
                });
            }
        },
        onError: (err: any, _vars, context) => {
            if (context?.previousLeads) queryClient.setQueryData(['crm_leads', userId], context.previousLeads);
            // Refetch to get true state from DB after failure
            queryClient.invalidateQueries({ queryKey: ['crm_leads', userId] });
            console.error('[CRM] Erro ao salvar ordem dos cards após retries:', err);
            toast.error('Não foi possível salvar a posição do card. Tente novamente.');
        },
    });

    const updateLeadOrder = (updates: Array<{ leadId: string; sortOrder: number; status?: CRMStatus }>) => {
        if (updates.length === 0) return;
        updateLeadOrderMutation.mutate(updates);
    };

    // ─── SMART RECYCLE ────────────────────────────────────────────────────────
    // CRITICAL: updateLeadMutation is intentionally excluded from deps.
    // useMutation returns a NEW object on every render — including it causes
    // this effect to run on every render, creating an infinite loop.
    // The mutation object is stable enough to call directly inside the effect.
    const updateLeadMutationRef = useRef(updateLeadMutation);
    updateLeadMutationRef.current = updateLeadMutation;

    useEffect(() => {
        if (!crmLeads.length) return;
        const now = new Date();
        const leadsToRestore = crmLeads.filter(l => l.recycleAt && new Date(l.recycleAt) <= now);
        if (leadsToRestore.length > 0) {
            leadsToRestore.forEach(l => {
                const notes = (l.notes || '') + '\n\n[Sistema] ♻️ Lead reciclado automaticamente da lixeira.';
                updateLeadMutationRef.current.mutate({ leadId: l.id, updates: { status: 'prospecting', recycleAt: undefined, notes } });
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [crmLeads]);

    // ─── ENRICHMENT ───────────────────────────────────────────────────────────
    // CRITICAL: updateLeadMutation excluded from deps (see recycle comment).
    // Using the ref instead to always access the current mutation without
    // recreating enrichCrmLead on every render.
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

            updateLeadMutationRef.current.mutate({
                leadId,
                updates: {
                    cnpj: enrichResult.cnpj,
                    socios: enrichResult.socios,
                    email: enrichResult.email || lead.email || '',
                    notes: notesWithEnrichment,
                    enrichedAt
                }
            });

            toast.success(enrichResult.socios?.length
                ? `Lead enriquecido! CNPJ e ${enrichResult.socios.length} sócio(s) encontrado(s).`
                : 'Lead enriquecido! CNPJ adicionado.',
                { id: `enrich-${leadId}` }
            );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [crmLeads, userId, onCreditsUsed]);

    // ─── COMPUTED PROPERTIES ─────────────────────────────────────────────────
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
        setCrmLeads,
        crmSearchQuery,
        setCrmSearchQuery,
        globalHistory,
        setGlobalHistory: updateGlobalHistory,
        addToCRM: addMutation.mutateAsync,
        addCrmLead: addCrmLeadMutation.mutateAsync,
        updateLeadStatus: (leadId: string, status: CRMStatus) => updateStatusMutation.mutateAsync({ leadId, newStatus: status }),
        updateLead: (leadId: string, updates: Partial<CRMLead>) => updateLeadMutation.mutateAsync({ leadId, updates }),
        updateLeadOrder,
        deleteLead: deleteMutation.mutateAsync,
        resetAllLeads: resetAllMutation.mutateAsync,
        enrichCrmLead,
        enrichingCrmLeadIds,
        failedEnrichmentAttempts,
        setFailedEnrichmentAttempts,
        filteredLeads,
        monthlyRevenue,
        leadsWithMeetings,
        isLoading
    };
};
