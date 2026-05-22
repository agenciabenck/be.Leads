/**
 * Utility to protect against multi-account abuse and disposable emails.
 */

// List of common disposable email domains
const DISPOSABLE_DOMAINS = [
    'mailinator.com',
    'tempmail.com',
    'guerrillamail.com',
    '10minutemail.com',
    'throwawaymail.com',
    'getairmail.com',
    'maildrop.cc',
    'yopmail.com',
    'dispostable.com',
    'sharklasers.com',
    'temp-mail.org',
    'dropmail.me',
    'emlpro.com',
    'emlhub.com',
    'superrito.com',
    'trashmail.com',
    'duck.com',
    'anonaddy.me',
    'proton.me',
    'mohmal.com',
    'temp-mail.org',
    'tempmail.net',
    'generator.email',
    'email-fake.com',
    '10mail.org'
];

/**
 * Checks if an email belongs to a known disposable domain.
 */
export const isDisposableEmail = (email: string): boolean => {
    if (!email || !email.includes('@')) return false;
    const domain = email.split('@')[1].toLowerCase();
    return DISPOSABLE_DOMAINS.includes(domain);
};

/**
 * Generates a basic browser fingerprint to help identify multi-account creators.
 * NOTE: This is a client-side "soft" fingerprint. For production-grade security,
 * consider a library like FingerprintJS.
 */
export const getBrowserFingerprint = (): string => {
    try {
        const components = [
            navigator.userAgent,
            navigator.language,
            screen.colorDepth,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            !!window.indexedDB,
            !!window.sessionStorage,
            !!window.localStorage
        ];
        return btoa(components.join('|'));
    } catch (e) {
        return 'unknown-' + Math.random().toString(36).substring(2, 9);
    }
};
