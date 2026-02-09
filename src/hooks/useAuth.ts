import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { getUserData, setUserData } from '@/utils/storageUtils';
import { UserSettings } from '@/types/types';

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

    const handleUserSession = (currentUser: any) => {
        setUser(currentUser ?? null);
        if (currentUser) {
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
                notifications: { email: true, browser: true, weeklyReport: true }
            });
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
