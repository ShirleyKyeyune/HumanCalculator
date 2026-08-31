import React, { useState } from 'react';
import PropTypes from 'prop-types';
import AmountInput from './AmountInput';

/**
 * Small inline form for setting (or clearing) a category's own budget
 * limit - a spending cap that belongs to the category itself, independent
 * of any top-level Budget entity that might separately track it.
 */
function CategoryLimitEditor({ value, onChange, onClose }) {
  const [amount, setAmount] = useState(value != null ? String(value) : '');

  const handleSave = () => {
    const parsed = parseFloat(amount);
    if (Number.isFinite(parsed) && parsed >= 0) {
      onChange(parsed);
      onClose();
    }
  };

  const handleClear = () => {
    onChange(null);
    onClose();
  };

  return (
    <div className="category-limit-editor">
      <AmountInput
        value={amount}
        onChange={setAmount}
        placeholder="Set a budget limit"
        className="dialog-input"
        autoFocus
      />
      <div className="category-limit-editor-actions">
        <button type="button" className="category-add-button" onClick={handleSave}>
          Save
        </button>
        {value != null && (
          <button type="button" className="budget-folder-action-button delete" onClick={handleClear}>
            Clear
          </button>
        )}
        <button type="button" className="category-cancel-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

CategoryLimitEditor.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default CategoryLimitEditor;
