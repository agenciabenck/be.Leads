/**
 * Formats a numeric string into a BRL currency format (e.g., "1.234,56").
 */
export const formatCurrency = (val: string) => {
    let clean = val.replace(/\D/g, '');
    let num = parseInt(clean) || 0;
    return (num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
};

/**
 * Formats a numeric string into a Brazilian phone format (e.g., "(11) 98765-4321").
 */
export const formatPhone = (val: string) => {
    let clean = val.replace(/\D/g, '');
    if (clean.length > 11) clean = clean.slice(0, 11);
    if (clean.length === 11) return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    if (clean.length === 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    if (clean.length > 2) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    return clean;
};

/**
 * Normalizes a string by removing accents and converting to lowercase.
 */
export const normalizeString = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};
