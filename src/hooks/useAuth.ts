import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { getUserData, setUserData } from '@/utils/storageUtils';
import { UserSettings, UserPlan } from '@/types/types';

export const useAuth = () => {
    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [userSettings, setUserSettingsRaw] = useState<UserSettings>({
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
        billingCycle: 'monthly',
        subscriptionStatus: 'active'
    });

    // Guard: once DB confirms a non-free plan, prevent accidental resets
    const confirmedPlanRef = useRef<UserPlan | null>(null);
    const confirmedNameRef = useRef<string | null>(null);
    const userSettingsRef = useRef<UserSettings>(userSettings);

    // Safe setter that preserves DB-confirmed plan and name
    const setUserSettings = (newSettings: UserSettings | ((prev: UserSettings) => UserSettings)) => {
        setUserSettingsRaw(prev => {
            const next = typeof newSettings === 'function' ? newSettings(prev) : newSettings;
            // Prevent plan downgrade from a confirmed paid plan
            if (confirmedPlanRef.current && confirmedPlanRef.current !== 'free' && next.plan === 'free') {
                next.plan = confirmedPlanRef.current;
            }
            // Prevent name reset to default if we have a confirmed name
            if (confirmedNameRef.current && next.name === 'Usuário') {
                next.name = confirmedNameRef.current;
            }
            userSettingsRef.current = next;
            return next;
        });
    };

    // Direct, side-effect-free credit update — does NOT trigger auth reload or Supabase writes
    const setLeadsUsed = (newTotal: number, userId?: string) => {
        setUserSettingsRaw(prev => {
            const next = { ...prev, leadsUsed: newTotal };
            userSettingsRef.current = next;
            // Persist to localStorage immediately so future reloads use the correct value
            const uid = userId || userSettingsRef.current?.email || '';
            if (uid) {
                try {
                    const key = `beleadly_${uid}_settings`;
                    const stored = JSON.parse(localStorage.getItem(key) || '{}');
                    localStorage.setItem(key, JSON.stringify({ ...stored, leadsUsed: newTotal }));
                } catch { /* ignore */ }
            }
            return next;
        });
    };

    const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(false);
    const skipNextReloadRef = useRef(false);

    useEffect(() => {
        let isMounted = true;
        let isInitializing = false;

        const initializeAuth = async () => {
            if (isInitializing) return;
            isInitializing = true;
            try {
                // Get the initial session manually, but with a timeout to prevent infinite hanging
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise<{ data: { session: null }, error: Error }>((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout fetching session')), 8000)
                );

                const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;

                if (error) {
                    console.warn('[Auth] Initial session error or timeout:', error);
                }

                if (isMounted) {
                    if (session?.user) {
                        await handleUserSession(session.user);
                    } else if (!session) {
                        setAuthLoading(false);
                        setUser(null);
                    }
                }
            } catch (error) {
                console.warn('[Auth] General initialization error:', error);
                if (isMounted) {
                    // Fallback: Check local storage for user data to see if we have an offline session
                    let storedUserStr = localStorage.getItem('beleadly_auth_token');
                    if (!storedUserStr) {
                        try {
                            const projectId = import.meta.env.VITE_SUPABASE_URL ? new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0] : '';
                            storedUserStr = localStorage.getItem(`sb-${projectId}-auth-token`) || localStorage.getItem('supabase.auth.token');
                        } catch (e) {
                            // Ignorar erros de URL
                        }
                    }
                    
                    if (storedUserStr) {
                         try {
                             const parsed = JSON.parse(storedUserStr);
                             if (parsed?.user) {
                                 console.log('[Auth] Offline fallback: Using cached user');
                                 await handleUserSession(parsed.user);
                                 return;
                             }
                         } catch (e) {
                             // Ignore parse errors
                         }
                    }
                    setAuthLoading(false);
                    setUser(null);
                }
            } finally {
                isInitializing = false;
            }
        };

        // Run the initialization
        initializeAuth();

        // Listen for future auth events
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[Auth] onAuthStateChange event:', event);
            if (event === 'PASSWORD_RECOVERY') {
                setPasswordRecoveryMode(true);
            }
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                if (session?.user && !isInitializing) {
                    // Skip reload if we just triggered this event ourselves (e.g. from updateUserSettings)
                    if (event === 'USER_UPDATED' && skipNextReloadRef.current) {
                        console.log('[Auth] Skipping reload — triggered by settings save');
                        skipNextReloadRef.current = false;
                        return;
                    }
                    await handleUserSession(session.user);
                }
            } else if (event === 'TOKEN_REFRESHED') {
                // Token refresh only renews JWT — do NOT reload settings
                // This prevents sidebar from resetting during active searches
                if (session?.user) {
                    setUser((prev: any) => prev?.id === session.user.id ? prev : session.user);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setAuthLoading(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // --- Separate Realtime Subscription Listener ---
    useEffect(() => {
        let realtimeSubscription: any = null;

        if (user?.id) {
            console.log('[Auth] Starting Realtime listener for user:', user.id);
            realtimeSubscription = supabase
                .channel(`subscription_sync_${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'user_subscriptions',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        console.log('[Auth] Realtime update received:', payload);
                        const newData = payload.new as any;
                        if (newData) {
                            setUserSettings(prev => {
                                const updated = { ...prev };
                                // Only update fields that are ACTUALLY present in the payload
                                // This prevents resetting plan to 'free' when only leads_used changes
                                if (newData.plan_id !== undefined && newData.plan_id !== null) {
                                    updated.plan = String(newData.plan_id).toLowerCase() as UserPlan;
                                }
                                if (newData.leads_used !== undefined) {
                                    // Floor protection: don't let Realtime sync reduce the credits (unless it's a reset to 0)
                                    if (newData.leads_used === 0 || newData.leads_used >= prev.leadsUsed) {
                                        updated.leadsUsed = newData.leads_used;
                                    } else {
                                        console.warn(`[Auth] Ignorando leads_used menor do banco (${newData.leads_used} < ${prev.leadsUsed}). Mantendo valor local.`);
                                    }
                                }
                                if (newData.status !== undefined && newData.status !== null) {
                                    updated.subscriptionStatus = newData.status;
                                }
                                if (newData.billing_cycle !== undefined && newData.billing_cycle !== null) {
                                    updated.billingCycle = newData.billing_cycle;
                                }
                                if (newData.pipeline_goal !== undefined) {
                                    updated.pipelineGoal = Number(newData.pipeline_goal) || prev.pipelineGoal;
                                }
                                if (newData.pipeline_reset_day !== undefined) {
                                    updated.pipelineResetDay = newData.pipeline_reset_day || prev.pipelineResetDay;
                                }
                                return updated;
                            });
                        }
                    }
                )
                .subscribe();
        }

        return () => {
            if (realtimeSubscription) {
                supabase.removeChannel(realtimeSubscription);
            }
        };
    }, [user?.id]);

    const handleUserSession = async (currentUser: any) => {
        // Accept user if they have an ID.
        const validUser = currentUser && currentUser.id ? currentUser : null;
        if (!validUser) {
            setUser(null);
            setAuthLoading(false);
            return;
        }

        setUser((prev: any) => prev?.id === validUser.id ? prev : validUser);

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
            billingCycle: 'monthly',
            subscriptionStatus: 'active'
        };

        let loadedSettings = getUserData<UserSettings>(currentUser.id, 'settings', baseSettings);
        loadedSettings.email = currentUser.email ?? '';

        if (metadataName && (loadedSettings.name === 'Usuário' || !loadedSettings.name)) {
            loadedSettings.name = metadataName;
        }

        // --- OFFLINE-FIRST: Apply local settings IMMEDIATELY so the UI can render ---
        setUserSettings(loadedSettings);
        setAuthLoading(false);

        // 2. Fetch subscription from DB (Source of Truth) IN BACKGROUND
        try {
            const { data: sub, error: subError } = await supabase
                .from('user_subscriptions')
                .select('plan_id, leads_used, last_credit_reset, status, billing_cycle, pipeline_goal, pipeline_reset_day')
                .eq('user_id', currentUser.id)
                .maybeSingle();

            if (subError && subError.code !== 'PGRST116') throw subError;

            if (sub) {
                // DB is the Single Source of Truth
                let planValue = String(sub.plan_id || 'free').toLowerCase() as UserPlan;

                console.log(`[Auth] Subscription found: plan=${planValue}, leadsUsed=${sub.leads_used}`);
                loadedSettings.plan = planValue;
                const localCached = getUserData<UserSettings>(currentUser.id, 'settings', baseSettings);
                
                // Floor protection for leadsUsed
                const cachedLeadsUsed = localCached.leadsUsed || 0;
                const dbLeadsUsed = sub.leads_used || 0;
                if (dbLeadsUsed === 0) {
                    loadedSettings.leadsUsed = 0; // Explicit reset
                } else {
                    loadedSettings.leadsUsed = Math.max(dbLeadsUsed, cachedLeadsUsed);
                    if (cachedLeadsUsed > dbLeadsUsed) {
                        console.warn(`[Auth] Floor Protection: Banco defasado (${dbLeadsUsed}). Usando cache local de leadsUsed (${cachedLeadsUsed}).`);
                    }
                }
                
                loadedSettings.subscriptionStatus = sub.status || 'active';
                loadedSettings.billingCycle = sub.billing_cycle || 'monthly';
                loadedSettings.pipelineGoal = Number(sub.pipeline_goal) || 5000;
                loadedSettings.pipelineResetDay = sub.pipeline_reset_day || 1;

                // Aplica as configurações carregadas do banco (ou cache se for maior)
                setUserSettings(loadedSettings);

                // Lock confirmed values — prevents any event from resetting them
                confirmedPlanRef.current = planValue;
                if (loadedSettings.name && loadedSettings.name !== 'Usuário') {
                    confirmedNameRef.current = loadedSettings.name;
                }
            } else {
                console.log('[Auth] No subscription record found, initializing plan via Edge Function...');
                const localCached = getUserData<UserSettings>(currentUser.id, 'settings', baseSettings);
                // Restaurando o comportamento: se o cache diz pago, assume pago (fallback do webhook). Se não, assume free (correção do bug original que dava pro pra todos)
                const targetPlan = (localCached.plan !== 'free' ? localCached.plan : 'free');
                loadedSettings.plan = targetPlan;
                loadedSettings.leadsUsed = 0;
                
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tuysyojdayewvpuvunlu.supabase.co';
                    fetch(`${baseUrl}/functions/v1/test-auth`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${session.access_token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ plan: targetPlan })
                    }).then(res => res.json()).then(data => {
                        console.log('[Auth] Init concluído com sucesso via Edge Function:', data);
                    }).catch(e => console.error('[Auth] Erro ao inicializar Edge Function:', e));
                }
            }
        } catch (err) {
            console.warn('[Auth] Subscription fetch failed (offline or slow network):', err);
            // We already applied local settings, so the app continues working!
        }
    };

    const updateUserSettings = async (newSettings: UserSettings | ((prev: UserSettings) => UserSettings)) => {
        const nextSettings = typeof newSettings === 'function' ? newSettings(userSettingsRef.current) : newSettings;

        // Update local state and storage
        setUserSettings(nextSettings);
        if (user?.id) {
            setUserData(user.id, 'settings', nextSettings);

            // 1. FIRST: Sync pipeline settings to DB (must happen before auth.updateUser
            //    because auth.updateUser triggers USER_UPDATED event which reloads from DB)
            try {
                const { data: updateData, error: updateError } = await supabase
                    .from('user_subscriptions')
                    .update({
                        pipeline_goal: nextSettings.pipelineGoal,
                        pipeline_reset_day: nextSettings.pipelineResetDay,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', user.id)
                    .select();

                if (updateError) {
                    console.error('[Auth] Error updating pipeline_goal:', updateError.message, updateError.details);
                } else if (!updateData || updateData.length === 0) {
                    console.warn('[Auth] Pipeline goal update returned 0 rows — RLS may be blocking. user_id:', user.id);
                } else {
                    console.log('[Auth] Pipeline goal saved successfully:', updateData[0]?.pipeline_goal);
                }
            } catch (err) {
                console.error('[Auth] Error syncing settings to Supabase:', err);
            }

            // 2. THEN: Sync name to Supabase auth metadata
            try {
                const metadataName = nextSettings.name;
                if (metadataName && metadataName !== 'Usuário') {
                    // Set flag to prevent the USER_UPDATED event from reloading old DB values
                    skipNextReloadRef.current = true;
                    await supabase.auth.updateUser({
                        data: { full_name: metadataName }
                    });
                }
            } catch (err) {
                skipNextReloadRef.current = false;
                console.error('[Auth] Error syncing metadata:', err);
            }
        }
    };

    // Remove the automatic persistence effect to avoid loops or unnecessary overwrites
    // during the initial load cycle. The load cycle now handles its own persistence.

    // Dynamic Title
    useEffect(() => {
        if (!user) {
            document.title = 'beleadly';
        } else {
            document.title = `Olá, ${userSettings.name} - beleadly`;
        }
    }, [user, userSettings.name]);

    return {
        user,
        authLoading,
        userSettings,
        passwordRecoveryMode,
        setUserSettings: updateUserSettings,
        setLeadsUsed
    };
};
