/**
 * Formats a given number into Colombian Peso (COP) currency string.
 * @param amount - The numerical value to format.
 * @returns Formatted string, e.g., "$ 50.000"
 */
export const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};
