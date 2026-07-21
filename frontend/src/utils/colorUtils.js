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
    hash = color.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert hash to a positive degree between 0 and 359
  return Math.abs(hash) % 360;
};
