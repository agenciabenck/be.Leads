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
        hideSheetsModal: false,
        lastCreditReset: new Date().toISOString(),
        notifications: { email: true, browser: true, weeklyReport: true }
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
            // Load settings from storage
            const loadedSettings = getUserData<UserSettings>(currentUser.id, 'settings', {
                name: 'Usuário',
                email: currentUser.email ?? '',
                avatar: '👨‍💼',
                avatarType: 'emoji',
                avatarColor: '#3b82f6',
                defaultState: 'SP',
                pipelineGoal: 5000,
                pipelineResetDay: 1,
                plan: 'free',
                hideSheetsModal: false,
                lastCreditReset: new Date().toISOString(),
                notifications: { email: true, browser: true, weeklyReport: true }
            });

            // Fetch subscription from DB
            try {
                const { data: sub, error: subError } = await supabase
                    .from('user_subscriptions')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .maybeSingle();

                if (sub) {
                    loadedSettings.plan = sub.plan_id as UserPlan;
                } else {
                    // SILENT INITIALIZATION: If user exists but no subscription record
                    // (e.g. users registered before this migration), create one.
                    console.log('[Auth] No subscription found, initializing free plan...');
                    const now = new Date();
                    const { data: newSub } = await supabase
                        .from('user_subscriptions')
                        .insert({
                            user_id: currentUser.id,
                            plan_id: 'free',
                            leads_used: 0,
                            last_credit_reset: now.toISOString(),
                            status: 'active'
                        })
                        .select()
                        .single();

                    if (newSub) {
                        loadedSettings.plan = 'free';
                    }
                }
            } catch (err) {
                console.error('Error fetching subscription:', err);
            }

            setUserSettings(loadedSettings);
        }
        setAuthLoading(false);
    };

    // Persist settings
    useEffect(() => {
        if (user) {
            setUserData(user.id, 'settings', userSettings);
        }
    }, [userSettings, user]);

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
        setUserSettings
    };
};
