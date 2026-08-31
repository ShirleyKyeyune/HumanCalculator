import React, { useRef, useLayoutEffect, useEffect } from 'react';
import PropTypes from 'prop-types';

const SUFFIX_MULTIPLIERS = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };

// A short pause after the user stops typing, before a shorthand suffix
// (10K, 1.2M, 0.5B) auto-expands into the full number - instant expansion
// on the letter keystroke would jump the field to "10,000" while the user
// might still be about to type further.
const SUFFIX_EXPAND_DEBOUNCE_MS = 600;

/**
 * Parse a raw amount string into a number - same as parseFloat for a plain
 * numeric string, but also understands a trailing K/M/B/T shorthand suffix
 * (10K -> 10000, 0.5M -> 500000, 3T -> 3000000000000). Used instead of
 * parseFloat wherever an AmountInput's value gets read, so a value is
 * parsed correctly even if it's submitted before the debounced auto-expand
 * below has had a chance to run (e.g. typing "10K" and hitting Enter
 * immediately) - the debounce is a display nicety, not something callers
 * should have to wait on for correctness.
 */
export const parseAmountValue = (rawValue) => {
  const str = (rawValue ?? '').toString().replace(/,/g, '').trim();
  const match = str.match(/^(\d*\.?\d*)([KMBT])?$/i);
  if (!match) return parseFloat(str);
  const [, numStr, suffixLetter] = match;
  const num = parseFloat(numStr);
  if (!Number.isFinite(num)) return NaN;
  return suffixLetter ? num * SUFFIX_MULTIPLIERS[suffixLetter.toUpperCase()] : num;
};

/** Expand a trailing shorthand suffix into a plain digit string, or return the value unchanged if there isn't one. */
const expandShorthand = (rawValue) => {
  if (!/[KMBT]$/i.test(rawValue || '')) return rawValue;
  const expanded = parseAmountValue(rawValue);
  if (!Number.isFinite(expanded)) return rawValue;
  // Round off float noise from the multiplication (e.g. 1.2 * 1e6 ===
  // 1200000.0000000002) - two decimal places is already finer than any
  // amount in this app needs.
  const rounded = Math.round(expanded * 100) / 100;
  return String(rounded);
};

/** Add thousands separators to the numeric part of a raw value, preserving a trailing decimal part or shorthand suffix (K/M/B/T) as-is. */
const formatWithCommas = (rawValue) => {
  if (!rawValue) return '';
  const suffixMatch = rawValue.match(/[KMBT]$/i);
  const suffix = suffixMatch ? suffixMatch[0].toUpperCase() : '';
  const numericPart = suffix ? rawValue.slice(0, -1) : rawValue;
  const [intPart, decPart] = numericPart.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formattedNumeric = decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
  return formattedNumeric + suffix;
};

/** Strip everything but digits, a single decimal point, and a trailing K/M/B/T shorthand suffix. */
const toRawDigits = (displayValue) => {
  const trailingSuffixMatch = displayValue.match(/([kmbtKMBT])\s*$/);
  const suffix = trailingSuffixMatch ? trailingSuffixMatch[1].toUpperCase() : '';
  const withoutSuffix = suffix ? displayValue.slice(0, trailingSuffixMatch.index) : displayValue;

  let cleaned = withoutSuffix.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
  }
  return cleaned + suffix;
};

/**
 * AmountInput Component
 *
 * A text input for money amounts that shows comma thousands separators
 * while the user types, without HTML's type="number" (which rejects
 * commas outright). Also accepts a shorthand suffix - 10K, 1.2M, 0.5B, 3T -
 * which auto-expands into the full comma-formatted number shortly after the
 * user stops typing. `value`/`onChange` carry the raw, comma-free numeric
 * string (occasionally still holding an unresolved shorthand suffix mid-
 * typing) - callers should read it with parseAmountValue rather than
 * parseFloat so a shorthand value parses correctly even before it's had a
 * chance to auto-expand.
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

  useEffect(() => {
    if (!/[KMBT]$/i.test(value || '')) return undefined;
    const timer = setTimeout(() => {
      const expanded = expandShorthand(value);
      if (expanded !== value) onChange(expanded);
    }, SUFFIX_EXPAND_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, onChange]);

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

  // Resolve any pending shorthand immediately once the user leaves the
  // field, rather than making them wait out the debounce window.
  const handleBlur = () => {
    const expanded = expandShorthand(value);
    if (expanded !== value) onChange(expanded);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={formatWithCommas(value || '')}
      onChange={handleChange}
      onBlur={handleBlur}
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
