import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { MAX_DEPTH, getChildren, getDepth, getDescendantIds, flattenTree } from '../hooks/useCategories';
import ActionMenu from './ActionMenu';
import ColorSwatchPicker from './ColorSwatchPicker';
import CategoryLimitEditor from './CategoryLimitEditor';
import WorkbookQuickView from './WorkbookQuickView';

const UNCATEGORIZED_ID = '__uncategorized__';

/**
 * A workbook row inside a category folder: draggable, offers a "Move to"
 * select as the non-drag fallback for reassigning it, and a quick-view
 * button to peek at its content without leaving this panel.
 */
function WorkbookRow({ workbook, moveOptions, onMoveWorkbook, onQuickView }) {
  return (
    <li
      className="category-tree-workbook-row"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', workbook.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      <span className="category-tree-workbook-name">{workbook.name}</span>
      <span className="category-tree-workbook-date">{workbook.displayDate}</span>
      <button
        type="button"
        className="workbook-quick-view-trigger"
        onClick={() => onQuickView(workbook)}
        title="Quick view"
        aria-label={`Quick view ${workbook.name}`}
      >
        &#128065;
      </button>
      <select
        value={workbook.categoryId || ''}
        onChange={(e) => onMoveWorkbook(workbook.id, e.target.value || null)}
        className="category-tree-workbook-move-select"
        aria-label={`Move ${workbook.name} to a different category`}
      >
        <option value="">Uncategorized</option>
        {moveOptions.map(opt => (
          <option key={opt.id} value={opt.id}>
            {'› '.repeat(opt.depth)}{opt.name}
          </option>
        ))}
      </select>
    </li>
  );
}

/**
 * One folder in the category tree: its own workbooks (if expanded), plus
 * its children rendered recursively. Acts as a drop target for workbooks
 * dragged from anywhere in the panel.
 */
function CategoryTreeNode({
  node,
  depth,
  categories,
  workbooks,
  workbooksByCategory,
  moveOptions,
  expandedIds,
  onToggleExpand,
  dragOverId,
  onDragOverNode,
  onDragLeaveNode,
  onDropOnNode,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onSetColor,
  onSetLimit,
  onMoveWorkbook,
  onQuickView,
  formatWithCommas
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [isSettingLimit, setIsSettingLimit] = useState(false);

  const children = getChildren(categories, node.id);
  const canAddChild = getDepth(categories, node.id) < MAX_DEPTH - 1;
  const directWorkbooks = workbooksByCategory.get(node.id) || [];
  const isExpanded = expandedIds.has(node.id);
  const isDragOver = dragOverId === node.id;

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
      <div
        className={`category-tree-row ${isDragOver ? 'drag-over' : ''}`}
        style={{ paddingLeft: `${depth * 1.25}rem` }}
        onDragOver={(e) => { e.preventDefault(); onDragOverNode(node.id); }}
        onDragLeave={() => onDragLeaveNode(node.id)}
        onDrop={(e) => { e.preventDefault(); onDropOnNode(node.id, e); }}
      >
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
            <div className="category-tree-name-group">
              <button
                type="button"
                className="category-tree-expand-button"
                onClick={() => onToggleExpand(node.id)}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
              >
                <span className={`spending-expand-caret ${isExpanded ? 'expanded' : ''}`}>&#9656;</span>
              </button>
              <span
                className={`category-color-dot ${node.color ? '' : 'none'}`}
                style={node.color ? { backgroundColor: node.color } : undefined}
                aria-hidden="true"
              />
              <span className="category-tree-name">{node.name}</span>
              {directWorkbooks.length > 0 && (
                <span className="category-tree-count-badge">{directWorkbooks.length}</span>
              )}
              {node.limit != null && (
                <span className="category-limit-badge">Limit: {formatWithCommas(node.limit)}</span>
              )}
            </div>
            <ActionMenu
              label={`Actions for ${node.name}`}
              items={[
                canAddChild && {
                  key: 'add-child',
                  label: '+ Add Child',
                  onClick: () => setIsAddingChild(prev => !prev)
                },
                {
                  key: 'color',
                  label: 'Set Color',
                  onClick: () => setIsPickingColor(prev => !prev)
                },
                {
                  key: 'limit',
                  label: node.limit != null ? 'Edit Limit' : 'Set Limit',
                  onClick: () => setIsSettingLimit(prev => !prev)
                },
                {
                  key: 'edit',
                  label: 'Edit',
                  onClick: () => setIsEditing(true)
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  danger: true,
                  onClick: handleDelete
                }
              ]}
            />
          </>
        )}
      </div>

      {isPickingColor && (
        <div className="category-color-picker-row" style={{ marginLeft: `${(depth + 1) * 1.25}rem` }}>
          <ColorSwatchPicker
            value={node.color || null}
            onChange={(color) => onSetColor(node.id, color)}
            onClose={() => setIsPickingColor(false)}
          />
        </div>
      )}

      {isSettingLimit && (
        <div className="category-limit-editor-row" style={{ marginLeft: `${(depth + 1) * 1.25}rem` }}>
          <CategoryLimitEditor
            value={node.limit ?? null}
            onChange={(limit) => onSetLimit(node.id, limit)}
            onClose={() => setIsSettingLimit(false)}
          />
        </div>
      )}

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

      {isExpanded && (
        <>
          {directWorkbooks.length > 0 && (
            <ul className="category-tree-workbook-list" style={{ marginLeft: `${(depth + 1) * 1.25}rem` }}>
              {directWorkbooks.map(wb => (
                <WorkbookRow
                  key={wb.id}
                  workbook={wb}
                  moveOptions={moveOptions}
                  onMoveWorkbook={onMoveWorkbook}
                  onQuickView={onQuickView}
                />
              ))}
            </ul>
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
                  workbooksByCategory={workbooksByCategory}
                  moveOptions={moveOptions}
                  expandedIds={expandedIds}
                  onToggleExpand={onToggleExpand}
                  dragOverId={dragOverId}
                  onDragOverNode={onDragOverNode}
                  onDragLeaveNode={onDragLeaveNode}
                  onDropOnNode={onDropOnNode}
                  onAddCategory={onAddCategory}
                  onRenameCategory={onRenameCategory}
                  onDeleteCategory={onDeleteCategory}
                  onSetColor={onSetColor}
                  onSetLimit={onSetLimit}
                  onMoveWorkbook={onMoveWorkbook}
                  onQuickView={onQuickView}
                  formatWithCommas={formatWithCommas}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </li>
  );
}

/**
 * CategoryManagerDialog Component
 *
 * A folder browser for the expense category tree, opened as a large
 * right-docked panel for room to work: add root categories, add child
 * categories up to MAX_DEPTH levels down, rename or delete any node
 * (cascading to descendants and un-categorizing any workbook that
 * referenced them), and browse the workbooks filed under each folder -
 * moving one to a different category either via its "Move to" select or by
 * dragging it onto another folder.
 */
function CategoryManagerDialog({
  isVisible,
  onClose,
  categories,
  workbooks,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onSetCategoryColor,
  onSetCategoryLimit,
  onMoveWorkbook,
  onOpenWorkbook,
  formatWithCommas
}) {
  const [newRootName, setNewRootName] = useState('');
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [dragOverId, setDragOverId] = useState(null);
  const [quickViewWorkbook, setQuickViewWorkbook] = useState(null);

  const rootCategories = getChildren(categories, null);

  // Only recompute these when categories/workbooks actually change, not on
  // every render this (always-mounted, for the slide animation) panel
  // happens to pick up from unrelated state elsewhere.
  const moveOptions = useMemo(() => flattenTree(categories), [categories]);
  const workbooksByCategory = useMemo(() => {
    const map = new Map();
    workbooks.forEach(wb => {
      const key = wb.categoryId || null;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(wb);
    });
    return map;
  }, [workbooks]);

  const uncategorizedWorkbooks = workbooksByCategory.get(null) || [];
  const isUncategorizedExpanded = expandedIds.has(UNCATEGORIZED_ID);
  const isUncategorizedDragOver = dragOverId === UNCATEGORIZED_ID;

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleDragOverNode = (id) => setDragOverId(id);
  const handleDragLeaveNode = (id) => setDragOverId(prev => (prev === id ? null : prev));
  const handleDropOnNode = (id, e) => {
    // Read the dragged workbook id straight off the drop event rather than
    // from state set during dragstart - state updates from that earlier
    // event may not have flushed yet by the time drop fires.
    const workbookId = e.dataTransfer.getData('text/plain');
    if (workbookId) {
      onMoveWorkbook(workbookId, id === UNCATEGORIZED_ID ? null : id);
    }
    setDragOverId(null);
  };

  const handleAddRoot = () => {
    if (newRootName.trim()) {
      onAddCategory(newRootName, null);
      setNewRootName('');
    }
  };

  const handleOpenFromQuickView = () => {
    if (quickViewWorkbook) onOpenWorkbook(quickViewWorkbook);
    setQuickViewWorkbook(null);
    onClose();
  };

  return (
    <div className={`category-manager-panel ${isVisible ? 'show' : ''}`}>
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

      <div className="spending-summary-panel-body">
        {uncategorizedWorkbooks.length > 0 && (
          <ul className="category-tree-children category-tree-root">
            <li className="category-tree-item">
              <div
                className={`category-tree-row ${isUncategorizedDragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); handleDragOverNode(UNCATEGORIZED_ID); }}
                onDragLeave={() => handleDragLeaveNode(UNCATEGORIZED_ID)}
                onDrop={(e) => { e.preventDefault(); handleDropOnNode(UNCATEGORIZED_ID, e); }}
              >
                <div className="category-tree-name-group">
                  <button
                    type="button"
                    className="category-tree-expand-button"
                    onClick={() => toggleExpand(UNCATEGORIZED_ID)}
                    aria-expanded={isUncategorizedExpanded}
                    aria-label={isUncategorizedExpanded ? 'Collapse folder' : 'Expand folder'}
                  >
                    <span className={`spending-expand-caret ${isUncategorizedExpanded ? 'expanded' : ''}`}>&#9656;</span>
                  </button>
                  <span className="category-tree-name">Uncategorized</span>
                  <span className="category-tree-count-badge">{uncategorizedWorkbooks.length}</span>
                </div>
              </div>
              {isUncategorizedExpanded && (
                <ul className="category-tree-workbook-list" style={{ marginLeft: '1.25rem' }}>
                  {uncategorizedWorkbooks.map(wb => (
                    <WorkbookRow
                      key={wb.id}
                      workbook={wb}
                      moveOptions={moveOptions}
                      onMoveWorkbook={onMoveWorkbook}
                      onQuickView={setQuickViewWorkbook}
                    />
                  ))}
                </ul>
              )}
            </li>
          </ul>
        )}

        {rootCategories.length > 0 ? (
          <ul className="category-tree-children category-tree-root">
            {rootCategories.map(node => (
              <CategoryTreeNode
                key={node.id}
                node={node}
                depth={0}
                categories={categories}
                workbooks={workbooks}
                workbooksByCategory={workbooksByCategory}
                moveOptions={moveOptions}
                expandedIds={expandedIds}
                onToggleExpand={toggleExpand}
                dragOverId={dragOverId}
                onDragOverNode={handleDragOverNode}
                onDragLeaveNode={handleDragLeaveNode}
                onDropOnNode={handleDropOnNode}
                onAddCategory={onAddCategory}
                onRenameCategory={onRenameCategory}
                onSetColor={onSetCategoryColor}
                onSetLimit={onSetCategoryLimit}
                onQuickView={setQuickViewWorkbook}
                onDeleteCategory={onDeleteCategory}
                onMoveWorkbook={onMoveWorkbook}
                formatWithCommas={formatWithCommas}
              />
            ))}
          </ul>
        ) : (
          uncategorizedWorkbooks.length === 0 && (
            <p className="no-spending-data">No categories yet. Add your first one below.</p>
          )
        )}

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
      </div>

      {quickViewWorkbook && (
        <WorkbookQuickView
          workbook={quickViewWorkbook}
          formatWithCommas={formatWithCommas}
          onClose={() => setQuickViewWorkbook(null)}
          onOpenFull={handleOpenFromQuickView}
        />
      )}
    </div>
  );
}

const categoryShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  parentId: PropTypes.string,
  color: PropTypes.string,
  limit: PropTypes.number
});

const workbookShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
  content: PropTypes.string,
  displayDate: PropTypes.string,
  categoryId: PropTypes.string,
  isPaid: PropTypes.bool,
  amountPaid: PropTypes.number,
  paidAtDisplay: PropTypes.string
});

WorkbookRow.propTypes = {
  workbook: workbookShape.isRequired,
  moveOptions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    depth: PropTypes.number.isRequired
  })).isRequired,
  onMoveWorkbook: PropTypes.func.isRequired,
  onQuickView: PropTypes.func.isRequired
};

CategoryTreeNode.propTypes = {
  node: categoryShape.isRequired,
  depth: PropTypes.number.isRequired,
  categories: PropTypes.arrayOf(categoryShape).isRequired,
  workbooks: PropTypes.arrayOf(workbookShape).isRequired,
  workbooksByCategory: PropTypes.instanceOf(Map).isRequired,
  moveOptions: PropTypes.array.isRequired,
  expandedIds: PropTypes.instanceOf(Set).isRequired,
  onToggleExpand: PropTypes.func.isRequired,
  dragOverId: PropTypes.string,
  onDragOverNode: PropTypes.func.isRequired,
  onDragLeaveNode: PropTypes.func.isRequired,
  onDropOnNode: PropTypes.func.isRequired,
  onAddCategory: PropTypes.func.isRequired,
  onRenameCategory: PropTypes.func.isRequired,
  onDeleteCategory: PropTypes.func.isRequired,
  onSetColor: PropTypes.func.isRequired,
  onSetLimit: PropTypes.func.isRequired,
  onMoveWorkbook: PropTypes.func.isRequired,
  onQuickView: PropTypes.func.isRequired,
  formatWithCommas: PropTypes.func.isRequired
};

CategoryManagerDialog.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(categoryShape).isRequired,
  workbooks: PropTypes.arrayOf(workbookShape).isRequired,
  onAddCategory: PropTypes.func.isRequired,
  onRenameCategory: PropTypes.func.isRequired,
  onDeleteCategory: PropTypes.func.isRequired,
  onSetCategoryColor: PropTypes.func.isRequired,
  onSetCategoryLimit: PropTypes.func.isRequired,
  onMoveWorkbook: PropTypes.func.isRequired,
  onOpenWorkbook: PropTypes.func.isRequired,
  formatWithCommas: PropTypes.func.isRequired
};

// Memoized: this panel stays mounted for its slide-in/out animation even
// while closed, so it must skip re-rendering when unrelated state changes
// elsewhere in the app (e.g. every keystroke in the calculator textarea).
export default React.memo(CategoryManagerDialog);
