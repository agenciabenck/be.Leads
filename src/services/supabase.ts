import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL e/ou Anon Key não configurados no .env.local');
}

// Migração automática do token antigo para o novo padrão para evitar que usuários sejam deslogados
try {
    if (typeof window !== 'undefined' && supabaseUrl) {
        const projectId = new URL(supabaseUrl).hostname.split('.')[0];
        const oldKey = `sb-${projectId}-auth-token`;
        const newKey = 'beleadly_auth_token';
        
        const oldToken = localStorage.getItem(oldKey);
        const newToken = localStorage.getItem(newKey);
        
        if (oldToken && !newToken) {
            localStorage.setItem(newKey, oldToken);
            console.log('[Auth] Sessão antiga migrada com sucesso para o novo padrão de token.');
        }
    }
} catch (e) {
    console.warn('[Auth] Erro ao tentar migrar o token antigo:', e);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storageKey: 'beleadly_auth_token',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

import { CRMActivity, CRMActivityType } from '../types/types';

export const crmActivitiesService = {
    async logActivity(leadId: string, type: CRMActivityType, metadata: Record<string, any> = {}, notes?: string): Promise<CRMActivity | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const newActivity: CRMActivity = {
                id: crypto.randomUUID(),
                user_id: user?.id || 'local_user',
                lead_id: leadId,
                activity_type: type,
                notes: notes || null,
                metadata: metadata || {},
                created_at: new Date().toISOString()
            };

            // Salva no localStorage imediatamente (Local-First)
            const localKey = `beleadly_crm_activities_${leadId}`;
            const existingLocal = JSON.parse(localStorage.getItem(localKey) || '[]');
            existingLocal.unshift(newActivity);
            localStorage.setItem(localKey, JSON.stringify(existingLocal));

            // Tenta inserir no Supabase em background
            if (user) {
                supabase
                    .from('crm_activities')
                    .insert({
                        id: newActivity.id,
                        user_id: user.id,
                        lead_id: leadId,
                        activity_type: type,
                        notes,
                        metadata
                    })
                    .then(({ error }) => {
                        if (error) console.warn('[Supabase Sync] Não foi possível sincronizar atividade no banco, mantida no localStorage:', error.message);
                    });
            }

            return newActivity;
        } catch (err) {
            console.error('Erro ao registrar atividade:', err);
            return null;
        }
    },

    async getActivitiesForLead(leadId: string): Promise<CRMActivity[]> {
        try {
            const localKey = `beleadly_crm_activities_${leadId}`;
            const localActivities: CRMActivity[] = JSON.parse(localStorage.getItem(localKey) || '[]');

            const { data, error } = await supabase
                .from('crm_activities')
                .select('*')
                .eq('lead_id', leadId)
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('[Supabase Sync] Falha ao ler do banco, retornando atividades locais:', error.message);
                return localActivities;
            }

            // Mescla e desduplica
            const mergedMap = new Map<string, CRMActivity>();
            localActivities.forEach(a => mergedMap.set(a.id, a));
            if (data) {
                data.forEach(a => mergedMap.set(a.id, a));
            }

            const mergedArray = Array.from(mergedMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            
            // Auto-cura do cache local: garante que o localStorage tem a versão mais rica (combinada)
            localStorage.setItem(localKey, JSON.stringify(mergedArray));

            return mergedArray;
        } catch (err) {
            console.error('Erro ao buscar atividades:', err);
            const localKey = `beleadly_crm_activities_${leadId}`;
            return JSON.parse(localStorage.getItem(localKey) || '[]');
        }
    },

    async resetActivitiesForLead(leadId: string): Promise<boolean> {
        try {
            const localKey = `beleadly_crm_activities_${leadId}`;
            localStorage.removeItem(localKey);

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('crm_activities')
                    .delete()
                    .eq('lead_id', leadId)
                    .eq('user_id', user.id);
            }

            return true;
        } catch (err) {
            console.error('Erro ao resetar atividades:', err);
            const localKey = `beleadly_crm_activities_${leadId}`;
            localStorage.removeItem(localKey);
            return true;
        }
    }
};
