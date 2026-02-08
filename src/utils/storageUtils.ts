/**
 * Utilitários para gerenciar localStorage isolado por usuário
 * Garante que cada usuário tenha seus próprios dados separados
 */

/**
 * Retorna a chave de storage prefixada com o user.id
 */
export const getUserStorageKey = (userId: string, key: string): string => {
    return `beleads_${userId}_${key}`;
};

/**
 * Salva dados no localStorage isolado por usuário
 */
export const setUserData = <T>(userId: string, key: string, data: T): void => {
    const storageKey = getUserStorageKey(userId, key);
    localStorage.setItem(storageKey, JSON.stringify(data));
};

/**
 * Recupera dados do localStorage isolado por usuário
 */
export const getUserData = <T>(userId: string, key: string, defaultValue: T): T => {
    try {
        const storageKey = getUserStorageKey(userId, key);
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
        console.error(`Error loading user data for key ${key}:`, error);
        return defaultValue;
    }
};

/**
 * Remove todos os dados de um usuário específico
 */
export const clearUserData = (userId: string): void => {
    const prefix = `beleads_${userId}_`;
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(prefix)) {
            localStorage.removeItem(key);
        }
    });
};
