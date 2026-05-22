/**
 * Translates Supabase authentication error messages to Portuguese (pt-BR).
 */
export const translateAuthError = (errorMessage: string): string => {
    const errorTranslations: Record<string, string> = {
        'Invalid login credentials': 'Email ou senha incorretos',
        'User already registered': 'Este email já está cadastrado',
        'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada ou spam.',
        'Invalid email': 'Email inválido',
        'Password should be at least 6 characters': 'A senha deve ter no mínimo 6 caracteres',
        'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos',
        'Signup disabled': 'Cadastro temporariamente desabilitado',
        'User not found': 'Usuário não encontrado',
        'Invalid credentials': 'Credenciais inválidas',
        'Email link is invalid or has expired': 'Link de email inválido ou expirado',
        'New password should be different from the old password': 'A nova senha deve ser diferente da antiga.',
        'Password should be different from the old password': 'A nova senha deve ser diferente da antiga.',
        'For security purposes, please enter your password to continue': 'Por segurança, informe sua senha para continuar.',
        'Auth session missing!': 'Sessão de autenticação não encontrada.',
        'Recovery link expired': 'O link de recuperação expirou. Solicite um novo.'
    };

    // 1. Direct match
    if (errorMessage in errorTranslations) return errorTranslations[errorMessage];

    // 2. Dynamic translations (Regex)
    if (errorMessage.includes('security purposes, you can only request this after')) {
        const seconds = errorMessage.match(/\d+/)?.[0] || 'alguns';
        return `Por segurança, aguarde ${seconds} segundos antes de tentar novamente.`;
    }

    if (errorMessage.includes('rate limit exceeded')) {
        return 'Muitas tentativas. Aguarde um momento.';
    }

    // 3. Partial match (case insensitive check against keys)
    for (const key of Object.keys(errorTranslations)) {
        if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
            return errorTranslations[key];
        }
    }

    return errorMessage; // Retorna original se não encontrar tradução
};
