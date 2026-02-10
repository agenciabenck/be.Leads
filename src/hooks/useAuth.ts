import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { getUserData, setUserData } from '@/utils/storageUtils';
import { UserSettings, UserPlan } from '@/types/types';

export const useAuth = () => {
    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [userSettings, setUserSettings] = useState<UserSettings>({
        name: 'Usuário',
        email: '',
        avatar: '👨‍💼',
        avatarType: 'emoji',
        avatarColor: '#3b82f6',
        defaultState: 'SP',
        pipelineGoal: 5000,
        pipelineResetDay: 1,
        plan: 'free',
        leadsUsed: 0,
        hideSheetsModal: false,
        lastCreditReset: new Date().toISOString(),
        notifications: { email: true, browser: true, weeklyReport: true },
        billingCycle: 'monthly'
    });

    useEffect(() => {
        const initializeSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            handleUserSession(session?.user);
        };

        initializeSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            handleUserSession(session?.user);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleUserSession = async (currentUser: any) => {
        // Only accept user if they have an email (prevent anonymous/ghost sessions)
        const validUser = currentUser && currentUser.email ? currentUser : null;
        setUser(validUser);

        if (validUser) {
            // Try to extract name from user_metadata with multiple fallback options
            const meta = currentUser.user_metadata || {};
            const metadataName = meta.full_name || meta.name || meta.displayName || meta.first_name || meta.custom_name;


            const baseSettings: UserSettings = {
                name: metadataName || 'Usuário',
                email: currentUser.email ?? '',
                avatar: '👨‍💼',
                avatarType: 'emoji',
                avatarColor: '#3b82f6',
                defaultState: 'SP',
                pipelineGoal: 5000,
                pipelineResetDay: 1,
                plan: 'free',
                leadsUsed: 0,
                hideSheetsModal: false,
                lastCreditReset: new Date().toISOString(),
                notifications: { email: true, browser: true, weeklyReport: true },
                billingCycle: 'monthly'
            };

            const loadedSettings = getUserData<UserSettings>(currentUser.id, 'settings', baseSettings);

            // Sync current email and name fallback
            loadedSettings.email = currentUser.email ?? '';

            // PRIORITY: If metadata has a real name, use it over "Usuário"
            if (metadataName && (loadedSettings.name === 'Usuário' || !loadedSettings.name)) {

                loadedSettings.name = metadataName;
            }

            // 2. Fetch subscription from DB (Source of Truth for Plan)
            try {
                const { data: sub, error: subError } = await supabase
                    .from('user_subscriptions')
                    .select('plan_id, leads_used, last_credit_reset')
                    .eq('user_id', currentUser.id)
                    .maybeSingle();

                if (subError && subError.code !== 'PGRST116') throw subError;

                if (sub) {

                    loadedSettings.plan = (sub.plan_id as UserPlan) || 'free';
                    loadedSettings.leadsUsed = sub.leads_used || 0;
                } else {
                    // SILENT INITIALIZATION: If user exists but no subscription record

                    const now = new Date();
                    await supabase
                        .from('user_subscriptions')
                        .upsert({
                            user_id: currentUser.id,
                            plan_id: 'free',
                            leads_used: 0,
                            last_credit_reset: now.toISOString(),
                            status: 'active'
                        });
                    loadedSettings.plan = 'free';
                }
            } catch (err) {
                console.error('[Auth] Subscription fetch failed:', err);
                loadedSettings.plan = 'free';
            }

            // 3. Final Atomic Update
            // Use a functional update to ensure we don't have partial state
            setUserSettings(loadedSettings);

            // Persist immediately to prevent race conditions on next refresh
            setUserData(currentUser.id, 'settings', loadedSettings);
        }

        // Only set loading to false after everything is ready
        setAuthLoading(false);
    };

    const updateUserSettings = async (newSettings: UserSettings | ((prev: UserSettings) => UserSettings)) => {
        const nextSettings = typeof newSettings === 'function' ? newSettings(userSettings) : newSettings;

        // Update local state and storage
        setUserSettings(nextSettings);
        if (user?.id) {
            setUserData(user.id, 'settings', nextSettings);

            // Sync name to Supabase metadata for cross-device persistence
            try {
                const metadataName = nextSettings.name;
                if (metadataName && metadataName !== 'Usuário') {
                    await supabase.auth.updateUser({
                        data: { full_name: metadataName }
                    });
                }
            } catch (err) {
                console.error('[Auth] Error syncing metadata:', err);
            }
        }
    };

    // Remove the automatic persistence effect to avoid loops or unnecessary overwrites
    // during the initial load cycle. The load cycle now handles its own persistence.

    // Dynamic Title
    useEffect(() => {
        if (!user) {
            document.title = 'be.Leads';
        } else {
            document.title = `Olá, ${userSettings.name} - be.Leads`;
        }
    }, [user, userSettings.name]);

    return {
        user,
        authLoading,
        userSettings,
        setUserSettings: updateUserSettings
    };
};
