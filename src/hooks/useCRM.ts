import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/services/supabase';
import { Lead, CRMLead, CRMStatus } from '@/types/types';

export const useCRM = (userId: string | undefined) => {
    const [crmLeads, setCrmLeads] = useState<CRMLead[]>([]);
    const [crmSearchQuery, setCrmSearchQuery] = useState('');
    const [globalHistory, setGlobalHistory] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Initial Load
    useEffect(() => {
        const loadLeads = async () => {
            if (!userId) {
                setCrmLeads([]);
                setGlobalHistory([]);
                return;
            }

            setIsLoading(true);
            try {
                // Fetch Leads from Supabase
                const { data, error } = await supabase
                    .from('crm_leads')
                    .select('*')
                    .eq('user_id', userId)
                    .order('added_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    // Map from Snake Case (DB) to Camel Case (UI)
                    const mappedLeads: CRMLead[] = data.map(l => ({
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
                        recycleAt: l.recycle_at
                    }));

                    // Smart Recycle Logic: Auto-restore leads
                    const now = new Date();
                    const leadsToRestore = mappedLeads.filter(l => l.recycleAt && new Date(l.recycleAt) <= now);

                    if (leadsToRestore.length > 0) {
                        const restoredIds = leadsToRestore.map(l => l.id);

                        // Optimistic update
                        const updatedLeads = mappedLeads.map(l => {
                            if (restoredIds.includes(l.id)) {
                                return {
                                    ...l,
                                    status: 'prospecting' as CRMStatus,
                                    recycleAt: undefined,
                                    notes: (l.notes || '') + '\n\n[Sistema] ♻️ Lead reciclado automaticamente da lixeira.'
                                };
                            }
                            return l;
                        });

                        setCrmLeads(updatedLeads);
                        setGlobalHistory(updatedLeads.map(l => l.id));

                        // Background update
                        Promise.all(leadsToRestore.map(l =>
                            supabase.from('crm_leads').update({
                                status: 'prospecting',
                                recycle_at: null,
                                notes: (l.notes || '') + '\n\n[Sistema] ♻️ Lead reciclado automaticamente da lixeira.'
                            }).eq('id', l.id)
                        )).then(() => {
                            console.log(`♻️ Smart Recycle: ${leadsToRestore.length} leads restored.`);
                        });
                    } else {
                        setCrmLeads(mappedLeads);
                        setGlobalHistory(mappedLeads.map(l => l.id));
                    }
                }
            } catch (err) {
                console.error('Error loading leads from Supabase:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadLeads();
    }, [userId]);

    const addToCRM = async (lead: Lead) => {
        if (!userId) return;
        if (crmLeads.some(l => l.id === lead.id)) return;

        const newCrmLead: CRMLead = {
            ...lead,
            category: lead.category === 'Lead' ? '' : lead.category,
            status: 'prospecting',
            priority: 'medium',
            tags: [],
            addedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            potentialValue: 0
        };

        // UI Optimistic Update
        setCrmLeads(prev => [newCrmLead, ...prev]);
        setGlobalHistory(prev => [...prev, lead.id]);

        // DB Update
        try {
            const { error } = await supabase
                .from('crm_leads')
                .insert({
                    id: lead.id,
                    user_id: userId,
                    name: lead.name,
                    category: lead.category === 'Lead' ? '' : lead.category,
                    address: lead.address,
                    phone: lead.phone,
                    website: lead.website,
                    rating: lead.rating,
                    reviews: lead.reviews,
                    google_maps_link: lead.googleMapsLink,
                    instagram: lead.instagram,
                    status: 'prospecting',
                    priority: 'medium'
                });
            if (error) throw error;
        } catch (err) {
            console.error('Error saving lead to Supabase:', err);
        }
    };

    const updateLeadStatus = async (leadId: string, newStatus: CRMStatus) => {
        if (!userId) return;

        // UI Update (Optimistic)
        const lead = crmLeads.find(l => l.id === leadId);
        const oldStatus = lead?.status;

        let recycleAt: string | null = null;

        // Schedule recycle if moving to 'lost'
        if (newStatus === 'lost') {
            const date = new Date();
            date.setDate(date.getDate() + 45); // 45 days retention (Smart Recycle)
            recycleAt = date.toISOString();
        }

        setCrmLeads(prev => prev.map(l =>
            l.id === leadId ? { ...l, status: newStatus, recycleAt: recycleAt || undefined, updatedAt: new Date().toISOString() } : l
        ));

        // DB Update
        try {
            const { error } = await supabase
                .from('crm_leads')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString(),
                    recycle_at: recycleAt
                })
                .eq('id', leadId)
                .eq('user_id', userId);

            if (error) throw error;
        } catch (err) {
            console.error('Error updating status in Supabase:', err);
            // Revert
            if (oldStatus) {
                setCrmLeads(prev => prev.map(l =>
                    l.id === leadId ? { ...l, status: oldStatus, recycleAt: lead?.recycleAt } : l
                ));
            }
        }
    };

    const updateLead = async (leadId: string, updates: Partial<CRMLead>) => {
        if (!userId) return;

        // UI Update
        setCrmLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));

        // DB Update
        try {
            // Map keys for DB
            const dbUpdates: any = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.category !== undefined) dbUpdates.category = updates.category;
            if (updates.address !== undefined) dbUpdates.address = updates.address;
            if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
            if (updates.website !== undefined) dbUpdates.website = updates.website;
            if (updates.status !== undefined) dbUpdates.status = updates.status;
            if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
            if (updates.potentialValue !== undefined) dbUpdates.potential_value = updates.potentialValue;
            if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
            if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
            if (updates.instagram !== undefined) dbUpdates.instagram = updates.instagram;

            dbUpdates.updated_at = new Date().toISOString();

            await supabase
                .from('crm_leads')
                .update(dbUpdates)
                .eq('id', leadId)
                .eq('user_id', userId);
        } catch (err) {
            console.error('Error updating lead in Supabase:', err);
        }
    };

    const deleteLead = async (leadId: string) => {
        if (!userId) return;

        // UI Update
        setCrmLeads(prev => prev.filter(l => l.id !== leadId));
        setGlobalHistory(prev => prev.filter(id => id !== leadId));

        // DB Update
        try {
            await supabase
                .from('crm_leads')
                .delete()
                .eq('id', leadId)
                .eq('user_id', userId);
        } catch (err) {
            console.error('Error deleting lead from Supabase:', err);
        }
    }

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
        return crmLeads
            .filter(l => l.status === 'won')
            .reduce((acc, l) => acc + (l.potentialValue || 0), 0);
    }, [crmLeads]);

    return {
        crmLeads, setCrmLeads,
        crmSearchQuery, setCrmSearchQuery,
        globalHistory, setGlobalHistory,
        addToCRM,
        updateLeadStatus,
        updateLead,
        deleteLead,
        filteredLeads,
        monthlyRevenue,
        isLoading
    };
};
