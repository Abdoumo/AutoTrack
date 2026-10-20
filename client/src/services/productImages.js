/**
 * AuraTrack — Clean Image Helper (No AI icons or cartoon vector graphics)
 */
import { getRealisticProductPhoto } from './realPhotos.js';

export function getProductImage(product) {
  return getRealisticProductPhoto(product);
}

export const DEFAULT_PRODUCT_SVG = '';
export const COFFEE_SVG = '';
export const BOTTLE_SVG = '';
export const HONEY_SVG = '';
