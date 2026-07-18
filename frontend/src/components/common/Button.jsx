import React from 'react';
import '../../styles/common/Button.css';

/**
 * Common button component following the Atelier After Hours design system.
 * Renders as a standard brass button, or a red button if variant='danger'.
 * Corner clip-paths can be configured via cornerClip.
 *
 * @param {Object} props
 * @param {string} [props.variant='primary'] - 'primary' or 'danger'
 * @param {string} [props.cornerClip='cut-tr'] - 'cut-tr', 'cut-bl', or ''
 * @param {React.ReactNode} props.children
 * @param {function} [props.onClick]
 * @param {string} [props.className]
 */
export default function Button({ children, onClick, variant = 'primary', className = '', disabled = false, style }) {
  // Use the mockup's .plaque class structure
  const baseClass = variant === 'danger' ? 'plaque plaque-danger' : 'plaque';
  
  return (
    <button 
      className={`${baseClass} ${className}`} 
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}
