import React, { useEffect, useState } from 'react';
import '../../styles/common/StrokeDivider.css';

/**
 * Signature element: A reusable inline SVG single continuous hand-drawn-feeling bezier squiggle.
 * Animates in once on load.
 * 
 * @param {Object} props
 * @param {string} [props.color='var(--brass)'] - The stroke color
 * @param {string} [props.className] - Additional classes
 */
export default function StrokeDivider({ color = 'var(--brass)', className = '' }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animation shortly after mount
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <svg 
      className={`stroke-divider ${animate ? 'animate-in' : ''} ${className}`.trim()} 
      width="220" 
      height="20" 
      viewBox="0 0 220 20"
      aria-hidden="true"
    >
      <path 
        className="stroke-divider-path"
        d="M4 12 C 45 4, 75 16, 115 7 S 175 3, 216 13" 
        stroke={color} 
      />
    </svg>
  );
}
