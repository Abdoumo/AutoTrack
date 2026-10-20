/**
 * AuraTrack — Clean Image Helper (No AI icons, cartoon vector graphics, or badges)
 */

export function getProductImage(product) {
  if (!product) return '';
  const img = product.image || product.image_url || product.img;
  if (img && typeof img === 'string' && !img.startsWith('data:image/svg+xml')) {
    return img;
  }
  return '';
}

export const DEFAULT_PRODUCT_SVG = '';
export const COFFEE_SVG = '';
export const BOTTLE_SVG = '';
export const HONEY_SVG = '';
