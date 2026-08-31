import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { MAX_DEPTH, getChildren, getDepth, getDescendantIds } from '../hooks/useCategories';

/**
 * One row in the category tree, plus its children rendered recursively.
 */
function CategoryTreeNode({
  node,
  depth,
  categories,
  workbooks,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');

  const children = getChildren(categories, node.id);
  const canAddChild = getDepth(categories, node.id) < MAX_DEPTH - 1;

  const handleSaveRename = () => {
    if (editName.trim()) {
      onRenameCategory(node.id, editName);
    }
    setIsEditing(false);
  };

  const handleConfirmAddChild = () => {
    if (newChildName.trim()) {
      onAddCategory(newChildName, node.id);
    }
    setNewChildName('');
    setIsAddingChild(false);
  };

  const handleDelete = () => {
    const removedIds = getDescendantIds(categories, node.id);
    const affectedCount = workbooks.filter(wb => wb.categoryId && removedIds.includes(wb.categoryId)).length;
    const descendantCount = removedIds.length - 1;

    let message = `Delete "${node.name}"?`;
    if (descendantCount > 0) {
      message += ` This also deletes ${descendantCount} subcategor${descendantCount === 1 ? 'y' : 'ies'} under it.`;
    }
    if (affectedCount > 0) {
      message += ` ${affectedCount} workbook${affectedCount === 1 ? '' : 's'} using ${descendantCount > 0 ? 'these categories' : 'this category'} will become uncategorized.`;
    }

    if (window.confirm(message)) {
      onDeleteCategory(node.id);
    }
  };

  return (
    <li className="category-tree-item">
      <div className="category-tree-row" style={{ paddingLeft: `${depth * 1.25}rem` }}>
        {isEditing ? (
          <div className="category-tree-edit-row">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="dialog-input"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(); }}
            />
            <button type="button" className="category-add-button" onClick={handleSaveRename}>Save</button>
            <button
              type="button"
              className="category-cancel-button"
              onClick={() => { setIsEditing(false); setEditName(node.name); }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <span className="category-tree-name">{node.name}</span>
            <div className="category-tree-actions">
              {canAddChild && (
                <button
                  type="button"
                  className="category-tree-action-button add"
                  onClick={() => setIsAddingChild(prev => !prev)}
                >
                  + Add Child
                </button>
              )}
              <button
                type="button"
                className="category-tree-action-button edit"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
              <button
                type="button"
                className="category-tree-action-button delete"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {isAddingChild && (
        <div className="category-add-inline category-tree-add-child" style={{ marginLeft: `${(depth + 1) * 1.25}rem` }}>
          <input
            type="text"
            value={newChildName}
            onChange={(e) => setNewChildName(e.target.value)}
            placeholder="New subcategory name"
            className="dialog-input"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmAddChild(); }}
          />
          <button type="button" className="category-add-button" onClick={handleConfirmAddChild}>Add</button>
          <button
            type="button"
            className="category-cancel-button"
            onClick={() => { setIsAddingChild(false); setNewChildName(''); }}
          >
            Cancel
          </button>
        </div>
      )}

      {children.length > 0 && (
        <ul className="category-tree-children">
          {children.map(child => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              categories={categories}
              workbooks={workbooks}
              onAddCategory={onAddCategory}
              onRenameCategory={onRenameCategory}
              onDeleteCategory={onDeleteCategory}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * CategoryManagerDialog Component
 *
 * Full CRUD for the expense category tree: add root categories, add child
 * categories up to MAX_DEPTH levels down, rename any node, and delete a
 * node (cascading to its descendants and un-categorizing any workbook that
 * referenced them).
 */
function CategoryManagerDialog({
  isVisible,
  onClose,
  categories,
  workbooks,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory
}) {
  const [newRootName, setNewRootName] = useState('');

  if (!isVisible) return null;

  const rootCategories = getChildren(categories, null);

  const handleAddRoot = () => {
    if (newRootName.trim()) {
      onAddCategory(newRootName, null);
      setNewRootName('');
    }
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog category-manager-dialog">
        <div className="spending-summary-header">
          <h3>Manage Categories</h3>
          <button
            className="close-panel-button"
            onClick={onClose}
            aria-label="Close category manager"
          >
            &times;
          </button>
        </div>

        <div className="category-manager-content">
          {rootCategories.length > 0 ? (
            <ul className="category-tree-children category-tree-root">
              {rootCategories.map(node => (
                <CategoryTreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  categories={categories}
                  workbooks={workbooks}
                  onAddCategory={onAddCategory}
                  onRenameCategory={onRenameCategory}
                  onDeleteCategory={onDeleteCategory}
                />
              ))}
            </ul>
          ) : (
            <p className="no-spending-data">No categories yet. Add your first one below.</p>
          )}
        </div>

        <div className="category-add-inline category-manager-add-root">
          <input
            type="text"
            value={newRootName}
            onChange={(e) => setNewRootName(e.target.value)}
            placeholder="New category name"
            className="dialog-input"
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddRoot(); }}
          />
          <button type="button" className="category-add-button" onClick={handleAddRoot}>
            Add Category
          </button>
        </div>

        <div className="dialog-buttons">
          <button onClick={onClose} className="dialog-button cancel">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const categoryShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  parentId: PropTypes.string
});

CategoryTreeNode.propTypes = {
  node: categoryShape.isRequired,
  depth: PropTypes.number.isRequired,
  categories: PropTypes.arrayOf(categoryShape).isRequired,
  workbooks: PropTypes.array.isRequired,
  onAddCategory: PropTypes.func.isRequired,
  onRenameCategory: PropTypes.func.isRequired,
  onDeleteCategory: PropTypes.func.isRequired
};

CategoryManagerDialog.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(categoryShape).isRequired,
  workbooks: PropTypes.array.isRequired,
  onAddCategory: PropTypes.func.isRequired,
  onRenameCategory: PropTypes.func.isRequired,
  onDeleteCategory: PropTypes.func.isRequired
};

export default CategoryManagerDialog;
