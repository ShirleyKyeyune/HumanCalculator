import React, { useRef, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';

/** Add thousands separators to a raw numeric string, preserving a trailing decimal part as-is. */
const formatWithCommas = (rawValue) => {
  if (!rawValue) return '';
  const [intPart, decPart] = rawValue.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
};

/** Strip everything but digits and a single decimal point. */
const toRawDigits = (displayValue) => {
  let cleaned = displayValue.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
  }
  return cleaned;
};

/**
 * AmountInput Component
 *
 * A text input for money amounts that shows comma thousands separators
 * while the user types, without HTML's type="number" (which rejects
 * commas outright). `value`/`onChange` carry the raw, comma-free numeric
 * string - callers can keep using parseFloat on it exactly as before.
 */
function AmountInput({ value, onChange, placeholder, className, autoFocus }) {
  const inputRef = useRef(null);
  const pendingCursorRef = useRef(null);

  // Runs synchronously right after the DOM commits the newly-formatted
  // value (before paint) - far more reliable than requestAnimationFrame,
  // which can be delayed or skipped while the tab isn't focused.
  useLayoutEffect(() => {
    if (pendingCursorRef.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(pendingCursorRef.current, pendingCursorRef.current);
      pendingCursorRef.current = null;
    }
  });

  const handleChange = (e) => {
    const input = e.target;
    const cursorPos = input.selectionStart ?? input.value.length;
    const digitsBeforeCursor = input.value.slice(0, cursorPos).replace(/[^0-9.]/g, '').length;

    const raw = toRawDigits(input.value);
    const formatted = formatWithCommas(raw);

    // Find the caret position in the newly-formatted string that sits
    // after the same number of digits it followed before formatting.
    let count = 0;
    let pos = formatted.length;
    for (let i = 0; i < formatted.length; i += 1) {
      if (/[0-9.]/.test(formatted[i])) count += 1;
      if (count === digitsBeforeCursor) {
        pos = i + 1;
        break;
      }
    }
    pendingCursorRef.current = pos;

    onChange(raw);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={formatWithCommas(value || '')}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      autoFocus={autoFocus}
    />
  );
}

AmountInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  autoFocus: PropTypes.bool
};

AmountInput.defaultProps = {
  value: '',
  placeholder: '',
  className: '',
  autoFocus: false
};

export default AmountInput;
