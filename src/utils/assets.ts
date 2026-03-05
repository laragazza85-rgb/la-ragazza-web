// src/utils/assets.ts

// Esta URL cambiará a tu dominio real de Cloudflare R2 en producción
// ej: [https://cdn.laragazza.com/images/](https://cdn.laragazza.com/images/)
const R2_BASE_URL = '[https://ragazza-cdn-placeholder.local/images/](https://ragazza-cdn-placeholder.local/images/)';

/**
 * Retorna la URL completa de la imagen en la CDN.
 * @param imageName Nombre del archivo (ej. "provolone.webp")
 */
export const getImageUrl = (imageName: string): string => {
    if (!imageName) return '';
    return `${R2_BASE_URL}${imageName}`;
};