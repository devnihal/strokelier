import React from 'react';
import '../../styles/common/Input.css';

/**
 * Common text input field.
 *
 * @param {Object} props
 * @param {string} [props.className]
 */
export default function Input({ className = '', ...rest }) {
  return (
    <input 
      className={`input-field ${className}`.trim()} 
      {...rest}
    />
  );
}
