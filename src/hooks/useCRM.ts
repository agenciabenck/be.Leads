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
                        instagram: l.instagram || ''
                    }));
                    setCrmLeads(mappedLeads);
                    setGlobalHistory(mappedLeads.map(l => l.id));
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

        // UI Update
        setCrmLeads(prev => prev.map(l =>
            l.id === leadId ? { ...l, status: newStatus, updatedAt: new Date().toISOString() } : l
        ));

        // DB Update
        try {
            await supabase
                .from('crm_leads')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', leadId)
                .eq('user_id', userId);
        } catch (err) {
            console.error('Error updating status in Supabase:', err);
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
