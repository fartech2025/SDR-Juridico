export const formatCurrency = (value, locale = 'pt-BR', currency = 'BRL') => new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
}).format(value);
export const formatNumber = (value, locale = 'pt-BR') => new Intl.NumberFormat(locale).format(value);
export const formatDate = (value, locale = 'pt-BR') => {
    const date = typeof value === 'string' ? new Date(value) : value;
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
};
export const formatDateTime = (value, locale = 'pt-BR') => {
    const date = typeof value === 'string' ? new Date(value) : value;
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};
export const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '').slice(-11);
    if (digits.length < 10)
        return value;
    const ddd = digits.slice(0, 2);
    const mid = digits.length === 11 ? digits.slice(2, 7) : digits.slice(2, 6);
    const end = digits.length === 11 ? digits.slice(7) : digits.slice(6);
    return `(${ddd}) ${mid}-${end}`;
};
