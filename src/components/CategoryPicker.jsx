import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { MAX_DEPTH, getChildren, getPath } from '../hooks/useCategories';

/**
 * CategoryPicker Component
 *
 * A cascading chain of selects for assigning a category, one per depth
 * already chosen plus one more empty level to go deeper - capped at
 * MAX_DEPTH levels total. Each level supports creating a new category or
 * subcategory inline. Reports the deepest selected id via onChange
 * whenever the selection changes.
 */
function CategoryPicker({ categories, initialCategoryId, onChange, onAddCategory }) {
  const [selectedPath, setSelectedPath] = useState(
    () => getPath(categories, initialCategoryId).map(node => node.id)
  );
  const [addingAtLevel, setAddingAtLevel] = useState(null);
  const [newNameAtLevel, setNewNameAtLevel] = useState('');

  const updatePath = (nextPath) => {
    setSelectedPath(nextPath);
    onChange(nextPath.length > 0 ? nextPath[nextPath.length - 1] : null);
  };

  const handleLevelChange = (level, value) => {
    if (value === '__add__') {
      setAddingAtLevel(level);
      return;
    }
    if (!value) {
      updatePath(selectedPath.slice(0, level));
      return;
    }
    updatePath([...selectedPath.slice(0, level), value]);
  };

  const handleConfirmAddAtLevel = (level) => {
    const parentId = level === 0 ? null : selectedPath[level - 1];
    const created = onAddCategory(newNameAtLevel, parentId);
    if (created) {
      updatePath([...selectedPath.slice(0, level), created.id]);
    }
    setNewNameAtLevel('');
    setAddingAtLevel(null);
  };

  // One select per depth already chosen, plus one more empty select to go
  // deeper - capped at MAX_DEPTH levels total.
  const levelParentIds = [];
  for (let level = 0; level <= selectedPath.length && level < MAX_DEPTH; level += 1) {
    levelParentIds.push(level === 0 ? null : selectedPath[level - 1]);
  }

  return (
    <>
      {levelParentIds.map((parentId, level) => {
        const options = getChildren(categories, parentId);
        const isAdding = addingAtLevel === level;
        return (
          <div key={parentId || 'root'} className="category-level">
            <div className="category-select-row">
              <select
                value={isAdding ? '__add__' : (selectedPath[level] || '')}
                onChange={(e) => handleLevelChange(level, e.target.value)}
                className="dialog-input category-select"
              >
                <option value="">{level === 0 ? 'No category' : 'No subcategory'}</option>
                {options.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
                <option value="__add__">
                  + Add new {level === 0 ? 'category' : 'subcategory'}...
                </option>
              </select>
            </div>
            {isAdding && (
              <div className="category-add-inline">
                <input
                  type="text"
                  value={newNameAtLevel}
                  onChange={(e) => setNewNameAtLevel(e.target.value)}
                  placeholder={`New ${level === 0 ? 'category' : 'subcategory'} name`}
                  className="dialog-input"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmAddAtLevel(level); }}
                />
                <button
                  type="button"
                  className="category-add-button"
                  onClick={() => handleConfirmAddAtLevel(level)}
                >
                  Add
                </button>
                <button
                  type="button"
                  className="category-cancel-button"
                  onClick={() => { setAddingAtLevel(null); setNewNameAtLevel(''); }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

CategoryPicker.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      parentId: PropTypes.string
    })
  ).isRequired,
  initialCategoryId: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onAddCategory: PropTypes.func.isRequired
};

export default CategoryPicker;
