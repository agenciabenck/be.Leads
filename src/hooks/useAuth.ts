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
        setUser(currentUser ?? null);
        if (currentUser) {
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
                const { data: sub } = await supabase
                    .from('user_subscriptions')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .single();

                if (sub) {
                    loadedSettings.plan = sub.plan_id as UserPlan;
                    // We'll store credits in a way useSearch can access, 
                    // or just rely on useAuth providing the latest settings.
                    // For now, let's ensure the plan is synced.
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
