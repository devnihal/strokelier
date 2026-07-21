/**
 * Generates a deterministic rotation angle (0-359) from a hex color string.
 * This ensures that the same color always gets the same random-looking rotation,
 * making color blobs look unique but consistent across the application.
 * 
 * @param {string} color - The hex color string (e.g., "#D94132")
 * @returns {number} The rotation angle in degrees
 */
export const getRotationForColor = (color) => {
  if (!color) return 0;
  
  let hash = 0;
  for (let i = 0; i < color.length; i++) {
    hash = Math.imul(31, hash) + color.charCodeAt(i) | 0;
  }
  
  /** Strong integer mixing to fiercely disperse the angles */
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 2246822507);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 3266489909);
  hash ^= hash >>> 16;
  
  return Math.abs(hash) % 360;
};
