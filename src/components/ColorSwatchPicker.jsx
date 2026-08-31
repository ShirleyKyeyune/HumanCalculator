import React from 'react';
import PropTypes from 'prop-types';

/**
 * Default color presets, styled after the MoSCoW prioritization scheme so
 * folders can be color-coded by how essential their spending is.
 */
export const CATEGORY_COLOR_PRESETS = [
  { name: 'Must Have', value: '#e53e3e' },
  { name: 'Should Have', value: '#dd6b20' },
  { name: 'Could Have', value: '#38a169' },
  { name: "Won't Have", value: '#718096' }
];

/**
 * A small swatch grid for picking a category's color: the MoSCoW presets,
 * a "no color" option, and a native color input for anything custom.
 * Selecting a preset or clearing applies immediately; the custom picker
 * applies on blur (native color inputs fire `change` continuously while
 * dragging, so waiting for blur avoids persisting on every drag frame).
 */
function ColorSwatchPicker({ value, onChange, onDone, onClose }) {
  const isCustom = value && !CATEGORY_COLOR_PRESETS.some(p => p.value === value);

  return (
    <div className="color-swatch-picker">
      <button
        type="button"
        className={`color-swatch color-swatch-none ${!value ? 'selected' : ''}`}
        title="No color"
        aria-label="No color"
        onClick={() => { onChange(null); if (onDone) onDone(); }}
      >
        &times;
      </button>
      {CATEGORY_COLOR_PRESETS.map(preset => (
        <button
          key={preset.value}
          type="button"
          className={`color-swatch ${value === preset.value ? 'selected' : ''}`}
          style={{ backgroundColor: preset.value }}
          title={preset.name}
          aria-label={preset.name}
          onClick={() => { onChange(preset.value); if (onDone) onDone(); }}
        />
      ))}
      <label
        className={`color-swatch color-swatch-custom ${isCustom ? 'selected' : ''}`}
        style={isCustom ? { backgroundColor: value } : undefined}
        title="Custom color"
      >
        <input
          type="color"
          value={isCustom ? value : '#9f7aea'}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => { if (onDone) onDone(); }}
          aria-label="Pick a custom color"
        />
      </label>
      {onClose && (
        <button
          type="button"
          className="color-swatch-picker-close"
          onClick={onClose}
          aria-label="Close color picker"
          title="Close"
        >
          &times;
        </button>
      )}
    </div>
  );
}

ColorSwatchPicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onDone: PropTypes.func,
  onClose: PropTypes.func
};

export default ColorSwatchPicker;
