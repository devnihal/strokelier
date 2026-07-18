import React from 'react';

/**
 * Common Logo component rendering the brand mark.
 * Based on the mockup, this uses text rather than the SVG since the SVG is black/rastered.
 *
 * @param {Object} props
 * @param {string} [props.className] - Optional extra class names
 */
export default function Logo({ className = '' }) {
  return (
    <h1 
      className={className} 
      style={{
        fontFamily: 'var(--font-heading)',
        fontWeight: 600,
        fontSize: '52px',
        margin: 0,
        letterSpacing: '-0.02em',
        color: 'var(--brass)',
        textAlign: 'center'
      }}
    >
      strokelier
    </h1>
  );
}
