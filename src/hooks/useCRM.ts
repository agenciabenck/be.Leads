import { useState, useEffect, useMemo } from 'react';
import { getUserData, setUserData } from '@/utils/storageUtils';
import { Lead, CRMLead, CRMStatus } from '@/types/types';

export const useCRM = (userId: string | undefined) => {
    const [crmLeads, setCrmLeads] = useState<CRMLead[]>([]);
    const [crmSearchQuery, setCrmSearchQuery] = useState('');
    const [globalHistory, setGlobalHistory] = useState<string[]>([]);

    useEffect(() => {
        if (userId) {
            setCrmLeads(getUserData<CRMLead[]>(userId, 'crm', []));
            setGlobalHistory(getUserData<string[]>(userId, 'history', []));
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            setUserData(userId, 'crm', crmLeads);
            setUserData(userId, 'history', globalHistory);
        }
    }, [crmLeads, globalHistory, userId]);

    const addToCRM = (lead: Lead) => {
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
        setCrmLeads(prev => [newCrmLead, ...prev]);
        setGlobalHistory(prev => [...prev, lead.id]);
    };

    const updateLeadStatus = (leadId: string, newStatus: CRMStatus) => {
        setCrmLeads(prev => prev.map(l =>
            l.id === leadId ? { ...l, status: newStatus, updatedAt: new Date().toISOString() } : l
        ));
    };

    const updateLead = (leadId: string, updates: Partial<CRMLead>) => {
        setCrmLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));
    };

    const deleteLead = (leadId: string) => {
        setCrmLeads(prev => prev.filter(l => l.id !== leadId));
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
        monthlyRevenue
    };
};
