import React, { useState, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { flattenTree, getChildren, getDescendantIds, getDepth, MAX_DEPTH } from '../hooks/useCategories';
import { computeBudgetSpent } from '../hooks/useBudgets';
import { getPaymentStatus } from '../utils/workbookTotal';
import AmountInput, { parseAmountValue } from './AmountInput';
import ActionMenu from './ActionMenu';
import ColorSwatchPicker from './ColorSwatchPicker';
import CategoryLimitEditor from './CategoryLimitEditor';
import WorkbookQuickView from './WorkbookQuickView';

const UNCATEGORIZED_ID = '__uncategorized__';

const RECENT_WORKBOOK_DAYS = 5;
const RECENT_WORKBOOK_WINDOW_MS = RECENT_WORKBOOK_DAYS * 24 * 60 * 60 * 1000;

/**
 * Small inline "pick an existing workbook" search list, used by the
 * "+ Add Workbook" action at every folder level in the budget detail view.
 *
 * Workbook counts can grow very large, so before any text search happens
 * this narrows down to recently modified workbooks only - keeping the list
 * (and every keystroke's filter pass) cheap regardless of total volume.
 */
function InlineWorkbookPicker({ workbooks, excludeIds, onSelect, onCancel, onCreateNew, isAdding }) {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();

  const recentWorkbooks = useMemo(() => {
    const cutoff = Date.now() - RECENT_WORKBOOK_WINDOW_MS;
    return workbooks
      .filter(wb => !excludeIds.has(wb.id) && new Date(wb.date).getTime() >= cutoff)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [workbooks, excludeIds]);

  const options = q
    ? recentWorkbooks.filter(wb => wb.name.toLowerCase().includes(q))
    : recentWorkbooks;

  return (
    <div className="budget-add-workbook-picker">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search workbooks by name..."
        className="dialog-input"
        autoFocus
        disabled={isAdding}
      />
      <div className="budget-checklist">
        {options.length > 0 ? (
          options.map(wb => (
            <button
              key={wb.id}
              type="button"
              className="budget-checklist-item budget-checklist-pick"
              onClick={() => onSelect(wb)}
              disabled={isAdding}
            >
              <span className="budget-checklist-workbook-name">{wb.name}</span>
              <span className="budget-checklist-workbook-meta">
                {isAdding ? 'Adding...' : wb.displayDate}
              </span>
            </button>
          ))
        ) : (
          <p className="budget-checklist-empty">
            {recentWorkbooks.length === 0
              ? `No workbooks modified in the last ${RECENT_WORKBOOK_DAYS} days.`
              : 'No matching workbooks.'}
          </p>
        )}
      </div>
      <div className="budget-add-workbook-picker-actions">
        <button type="button" className="budget-create-workbook-button" onClick={onCreateNew} disabled={isAdding}>
          + Create New Workbook
        </button>
        <button type="button" className="category-cancel-button" onClick={onCancel} disabled={isAdding}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * Small inline "pick another budget to import" list, used by the
 * "+ Import Budget" action in Budget Detail. Importing clones the source
 * budget's tracked categories (fresh, isolated copies - the same mechanism
 * used when checking a category in the budget form) into the currently open
 * budget; it never touches the source budget, and never shares a live
 * category record between the two. Workbooks aren't carried over - this
 * brings in the category structure as a template, not the source budget's
 * actual filed items.
 */
function InlineBudgetPicker({ budgets, onSelect, onCancel, isImporting }) {
  return (
    <div className="budget-add-workbook-picker">
      <div className="budget-checklist">
        {budgets.length > 0 ? (
          budgets.map(b => (
            <button
              key={b.id}
              type="button"
              className="budget-checklist-item budget-checklist-pick"
              onClick={() => onSelect(b)}
              disabled={isImporting}
            >
              <span className="budget-checklist-workbook-name">{b.name}</span>
              <span className="budget-checklist-workbook-meta">
                {isImporting
                  ? 'Importing...'
                  : `${(b.categoryIds || []).length} categor${(b.categoryIds || []).length === 1 ? 'y' : 'ies'}`}
              </span>
            </button>
          ))
        ) : (
          <p className="budget-checklist-empty">No other budgets to import from.</p>
        )}
      </div>
      <div className="budget-add-workbook-picker-actions">
        <button type="button" className="category-cancel-button" onClick={onCancel} disabled={isImporting}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * Every workbook that belongs to a budget - explicitly attached, or filed
 * under one of the budget's categories (rolled up through subcategories) -
 * regardless of paid status. Unlike computeBudgetSpent (which only counts
 * paid items toward the limit), this is for browsing everything filed under
 * the budget, paid or not.
 */
const getBudgetWorkbooks = (budget, workbooks, categories) => {
  const scopeIds = new Set();
  (budget.categoryIds || []).forEach(catId => {
    getDescendantIds(categories, catId).forEach(id => scopeIds.add(id));
  });

  return (workbooks || []).filter(wb => {
    const explicitlyIncluded = (budget.workbookIds || []).includes(wb.id);
    const categoryIncluded = wb.categoryId && scopeIds.has(wb.categoryId);
    return explicitlyIncluded || categoryIncluded;
  });
};

/**
 * One category folder in the budget detail tree: its own paid/unpaid items,
 * plus recursively-rendered children with their own rolled-up totals.
 * Supports adding a child folder, adding an existing workbook straight into
 * this folder, deleting the folder, and per-item unlink actions - all
 * without leaving the budget.
 */
function BudgetCategoryNode({
  node,
  depth,
  categories,
  workbooks,
  budget,
  expandedIds,
  onToggle,
  onOpenWorkbook,
  onAddCategory,
  onDeleteCategory,
  onSetWorkbookCategory,
  onSetCategoryColor,
  onSetCategoryLimit,
  onRenameCategory,
  onUpdateBudget,
  onCreateWorkbook,
  onQuickView,
  onMarkPaid,
  formatWithCommas
}) {
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [isAddingWorkbook, setIsAddingWorkbook] = useState(false);
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [isSettingLimit, setIsSettingLimit] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(node.name);
  // Attaching/unlinking a workbook touches both the category record and the
  // budget's own workbookIds list - guard against a rapid double-click
  // firing it twice, and hold a brief visible "busy" state on the row so
  // the action doesn't look like it silently did nothing.
  const [isAddWorkbookPending, setIsAddWorkbookPending] = useState(false);
  const [pendingWorkbookId, setPendingWorkbookId] = useState(null);

  const isExpanded = expandedIds.has(node.id);
  const isUncategorized = node.id === UNCATEGORIZED_ID;
  const canAddChild = !isUncategorized && getDepth(categories, node.id) < MAX_DEPTH - 1;
  // What counts against this folder's own limit: paid + still-pending spend
  // filed here, mirroring how a top-level Budget weighs both together.
  const limitUsed = node.paidTotal + node.unpaidTotal;

  const handleConfirmAddChild = () => {
    if (newChildName.trim()) {
      onAddCategory(newChildName, node.id);
    }
    setNewChildName('');
    setIsAddingChild(false);
  };

  // Renaming here only ever touches this budget's own copy of the category
  // (see useCategories.cloneCategoriesAsEmpty) - it can never affect any
  // other budget's folder, even one that started out with the same name.
  const handleSaveRename = () => {
    if (editName.trim()) {
      onRenameCategory(node.id, editName);
    }
    setIsEditingName(false);
  };

  const handleDeleteFolder = () => {
    const removedIds = getDescendantIds(categories, node.id);
    const descendantCount = removedIds.length - 1;
    let message = `Delete "${node.name}"?`;
    if (descendantCount > 0) {
      message += ` This also deletes ${descendantCount} subcategor${descendantCount === 1 ? 'y' : 'ies'} under it.`;
    }
    message += ' Workbooks filed here will become uncategorized.';
    if (window.confirm(message)) {
      onDeleteCategory(node.id);
    }
  };

  const handleUnlinkCategory = (wb) => {
    if (pendingWorkbookId) return;
    setPendingWorkbookId(wb.id);
    onSetWorkbookCategory(wb.id, null);
    setTimeout(() => setPendingWorkbookId(null), 400);
  };

  const isExplicitlyAttached = (wb) => (budget.workbookIds || []).includes(wb.id);

  const handleUnlinkBudget = (wb) => {
    if (pendingWorkbookId) return;
    setPendingWorkbookId(wb.id);
    const nextIds = (budget.workbookIds || []).filter(id => id !== wb.id);
    onUpdateBudget(budget.id, { workbookIds: nextIds });
    setTimeout(() => setPendingWorkbookId(null), 400);
  };

  const handleAddWorkbook = (wb) => {
    if (isAddWorkbookPending) return;
    setIsAddWorkbookPending(true);
    if (!isUncategorized) {
      onSetWorkbookCategory(wb.id, node.id);
    }
    const currentIds = budget.workbookIds || [];
    if (!currentIds.includes(wb.id)) {
      onUpdateBudget(budget.id, { workbookIds: [...currentIds, wb.id] });
    }
    setTimeout(() => {
      setIsAddWorkbookPending(false);
      setIsAddingWorkbook(false);
    }, 400);
  };

  const excludeIds = useMemo(() => new Set(node.directItems.map(wb => wb.id)), [node.directItems]);
  const indent = `${depth * 1.25}rem`;

  return (
    <li className="spending-category-item" style={depth > 0 ? { marginLeft: '0.5rem' } : undefined}>
      <div className={`budget-category-header-row ${isExpanded ? 'expanded' : ''}`}>
        {isEditingName ? (
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
              onClick={() => { setIsEditingName(false); setEditName(node.name); }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="spending-category-header"
              onClick={() => onToggle(node.id)}
              aria-expanded={isExpanded}
            >
              <span className="spending-category-name">
                <span className={`spending-expand-caret ${isExpanded ? 'expanded' : ''}`}>&#9656;</span>
                {!isUncategorized && (
                  <span
                    className={`category-color-dot ${node.color ? '' : 'none'}`}
                    style={node.color ? { backgroundColor: node.color } : undefined}
                    aria-hidden="true"
                  />
                )}
                {node.name}
              </span>
              <span className="budget-node-totals">
                <span className="budget-node-paid-total">{formatWithCommas(node.paidTotal)} paid</span>
                {node.unpaidTotal > 0 && (
                  <span className="budget-node-pending-total">{formatWithCommas(node.unpaidTotal)} pending</span>
                )}
              </span>
            </button>
            <ActionMenu
              label={`Actions for ${node.name}`}
              items={[
                canAddChild && {
                  key: 'add-child',
                  label: '+ Add Child',
                  onClick: () => { setIsAddingChild(v => !v); setIsAddingWorkbook(false); }
                },
                {
                  key: 'add-workbook',
                  label: '+ Add Workbook',
                  onClick: () => { setIsAddingWorkbook(v => !v); setIsAddingChild(false); }
                },
                !isUncategorized && {
                  key: 'color',
                  label: 'Set Color',
                  onClick: () => setIsPickingColor(v => !v)
                },
                !isUncategorized && {
                  key: 'limit',
                  label: node.limit != null ? 'Edit Limit' : 'Set Limit',
                  onClick: () => setIsSettingLimit(v => !v)
                },
                !isUncategorized && {
                  key: 'rename',
                  label: 'Rename',
                  onClick: () => { setEditName(node.name); setIsEditingName(true); }
                },
                !isUncategorized && {
                  key: 'delete',
                  label: 'Delete',
                  danger: true,
                  onClick: handleDeleteFolder
                }
              ]}
            />
          </>
        )}
      </div>
      <div className="spending-category-meta">
        <span>{node.paidCount} paid · {node.unpaidCount} unpaid</span>
      </div>

      {node.limit != null && (
        <div className="category-limit-progress">
          <div className="spending-category-bar-track">
            <div
              className={`spending-category-bar-fill ${limitUsed > node.limit ? 'over-budget' : ''}`}
              style={{ width: `${Math.min(100, (limitUsed / node.limit) * 100)}%` }}
            />
          </div>
          <div className="spending-category-meta">
            <span>{formatWithCommas(limitUsed)} of {formatWithCommas(node.limit)} limit</span>
            <span className={limitUsed > node.limit ? 'budget-available-over' : 'budget-available-ok'}>
              {limitUsed > node.limit
                ? `${formatWithCommas(limitUsed - node.limit)} over`
                : `${formatWithCommas(node.limit - limitUsed)} left`}
            </span>
          </div>
        </div>
      )}

      {isPickingColor && (
        <div className="category-color-picker-row" style={{ marginLeft: indent }}>
          <ColorSwatchPicker
            value={node.color || null}
            onChange={(color) => onSetCategoryColor(node.id, color)}
            onClose={() => setIsPickingColor(false)}
          />
        </div>
      )}

      {isSettingLimit && (
        <div className="category-limit-editor-row" style={{ marginLeft: indent }}>
          <CategoryLimitEditor
            value={node.limit ?? null}
            onChange={(limit) => onSetCategoryLimit(node.id, limit)}
            onClose={() => setIsSettingLimit(false)}
          />
        </div>
      )}

      {isAddingChild && (
        <div className="category-add-inline" style={{ marginLeft: indent }}>
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
          <button type="button" className="category-cancel-button" onClick={() => setIsAddingChild(false)}>Cancel</button>
        </div>
      )}

      {isAddingWorkbook && (
        <div style={{ marginLeft: indent, marginTop: '0.375rem' }}>
          <InlineWorkbookPicker
            workbooks={workbooks}
            excludeIds={excludeIds}
            onSelect={handleAddWorkbook}
            onCancel={() => setIsAddingWorkbook(false)}
            onCreateNew={onCreateWorkbook}
            isAdding={isAddWorkbookPending}
          />
        </div>
      )}

      {isExpanded && (
        <div className="spending-subcategory-groups">
          {node.directItems.length > 0 && (
            <ul className="spending-workbook-list">
              {node.directItems.map(wb => {
                const { paid, remaining, status } = getPaymentStatus(wb);
                const isBusy = pendingWorkbookId === wb.id;
                return (
                  <li
                    key={wb.id}
                    className={`spending-workbook-row clickable ${isBusy ? 'busy' : ''}`}
                    onClick={() => { if (!isBusy) onQuickView(wb); }}
                  >
                    <div className="spending-workbook-info">
                      <span className="spending-workbook-name">{wb.name}</span>
                      <span className="spending-workbook-date">{wb.paidAtDisplay || wb.displayDate}</span>
                    </div>
                    {status === 'paid' ? (
                      <span className="workbook-paid-badge paid">{formatWithCommas(paid)}</span>
                    ) : status === 'partial' ? (
                      <span className="workbook-paid-badge partial">
                        Partial &middot; {formatWithCommas(paid)} of {formatWithCommas(paid + remaining)}
                      </span>
                    ) : (
                      <span className="workbook-paid-badge unpaid">
                        Unpaid &middot; {formatWithCommas(remaining)}
                      </span>
                    )}
                    {isBusy ? (
                      <span className="row-busy-spinner" role="status" aria-label="Updating..." />
                    ) : (
                      <>
                        <button
                          type="button"
                          className="workbook-quick-view-trigger"
                          onClick={(e) => { e.stopPropagation(); onQuickView(wb); }}
                          title="Quick view"
                          aria-label={`Quick view ${wb.name}`}
                        >
                          &#128065;
                        </button>
                        <ActionMenu
                          label={`Actions for ${wb.name}`}
                          items={[
                            {
                              key: 'open',
                              label: 'Open',
                              onClick: () => onOpenWorkbook(wb)
                            },
                            {
                              key: 'mark-paid',
                              label: status === 'paid' ? 'Edit Payment' : status === 'partial' ? 'Record Payment' : 'Mark as Paid',
                              onClick: () => onMarkPaid(wb)
                            },
                            !isUncategorized && {
                              key: 'untag',
                              label: 'Untag (remove from category)',
                              onClick: () => handleUnlinkCategory(wb)
                            },
                            isExplicitlyAttached(wb) && {
                              key: 'unlink',
                              label: 'Unlink (remove from budget)',
                              danger: true,
                              onClick: () => handleUnlinkBudget(wb)
                            }
                          ]}
                        />
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {node.children.length > 0 && (
            <ul className="spending-category-list spending-category-list-nested">
              {node.children.map(child => (
                <BudgetCategoryNode
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  categories={categories}
                  workbooks={workbooks}
                  budget={budget}
                  expandedIds={expandedIds}
                  onToggle={onToggle}
                  onOpenWorkbook={onOpenWorkbook}
                  onAddCategory={onAddCategory}
                  onDeleteCategory={onDeleteCategory}
                  onSetWorkbookCategory={onSetWorkbookCategory}
                  onSetCategoryColor={onSetCategoryColor}
                  onSetCategoryLimit={onSetCategoryLimit}
                  onRenameCategory={onRenameCategory}
                  onUpdateBudget={onUpdateBudget}
                  onCreateWorkbook={onCreateWorkbook}
                  onQuickView={onQuickView}
                  onMarkPaid={onMarkPaid}
                  formatWithCommas={formatWithCommas}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Full drill-down view for a single budget: paid and unpaid items filed
 * under it, grouped by category and subcategory (however deep), each
 * openable directly from here.
 */
function BudgetDetail({
  budget,
  budgets,
  workbooks,
  categories,
  onOpenWorkbook,
  onBack,
  onAddCategory,
  onDeleteCategory,
  onSetWorkbookCategory,
  onSetCategoryColor,
  onSetCategoryLimit,
  onRenameCategory,
  onUpdateBudget,
  onCloneCategories,
  onCreateWorkbook,
  onMarkPaid,
  formatWithCommas
}) {
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [isAddingRootCategory, setIsAddingRootCategory] = useState(false);
  const [newRootCategoryName, setNewRootCategoryName] = useState('');
  const [isAddingWorkbook, setIsAddingWorkbook] = useState(false);
  // Guard + brief visible "busy" state so attaching a workbook doesn't look
  // like it silently did nothing, and a rapid double-click can't attach it
  // twice.
  const [isAddWorkbookPending, setIsAddWorkbookPending] = useState(false);
  const [isImportingBudget, setIsImportingBudget] = useState(false);
  // Cloning a whole category subtree can mean several localStorage writes
  // in a row - guard + disable the picker while it runs so a rapid
  // double-click on the same source budget can't import it twice.
  const [isImporting, setIsImporting] = useState(false);
  const [quickViewWorkbook, setQuickViewWorkbook] = useState(null);

  const otherBudgets = useMemo(
    () => budgets.filter(b => b.id !== budget.id),
    [budgets, budget.id]
  );

  const unfiledExcludeIds = useMemo(
    () => new Set(budget.workbookIds || []),
    [budget.workbookIds]
  );

  const matchedWorkbooks = useMemo(
    () => getBudgetWorkbooks(budget, workbooks, categories),
    [budget, workbooks, categories]
  );

  const { spent, count: paidCount, pending, pendingCount, availableBalance } = useMemo(
    () => computeBudgetSpent(budget, workbooks, categories),
    [budget, workbooks, categories]
  );

  const roots = useMemo(() => {
    const buildNode = (nodeId, nodeName, nodeColor, nodeLimit) => {
      const directItems = matchedWorkbooks
        .filter(wb => (wb.categoryId || null) === nodeId)
        .sort((a, b) => new Date(b.paidAt || b.date) - new Date(a.paidAt || a.date));
      // A partially-paid workbook contributes to both totals at once: its
      // paid-so-far amount counts toward paidTotal, and whatever's still
      // owed on it counts toward unpaidTotal - so it shows up correctly in
      // both rather than being bucketed as all-or-nothing.
      const statuses = directItems.map(wb => getPaymentStatus(wb));
      const unpaidItems = directItems.filter((wb, i) => statuses[i].status !== 'paid');

      // Show the full subtree under a tracked category, even the empty
      // parts - otherwise a freshly-created (still empty) subfolder would
      // have no way to be reached in order to add its first workbook.
      const children = getChildren(categories, nodeId)
        .map(child => buildNode(child.id, child.name, child.color, child.limit));

      const paidTotal = statuses.reduce((sum, s) => sum + s.paid, 0) +
        children.reduce((sum, c) => sum + c.paidTotal, 0);
      const unpaidTotal = statuses.reduce((sum, s) => sum + s.remaining, 0) +
        children.reduce((sum, c) => sum + c.unpaidTotal, 0);
      const paidCountNode = statuses.filter(s => s.paid > 0).length + children.reduce((sum, c) => sum + c.paidCount, 0);
      const unpaidCountNode = unpaidItems.length + children.reduce((sum, c) => sum + c.unpaidCount, 0);
      const itemCount = directItems.length + children.reduce((sum, c) => sum + c.itemCount, 0);

      return {
        id: nodeId,
        name: nodeName,
        color: nodeColor || null,
        limit: nodeLimit ?? null,
        directItems,
        children,
        paidTotal,
        unpaidTotal,
        paidCount: paidCountNode,
        unpaidCount: unpaidCountNode,
        itemCount
      };
    };

    // Root categories: show any that are explicitly tracked by this budget
    // (even empty ones, so they can be populated), plus any that happen to
    // contain matched items despite not being tracked directly (e.g. a
    // workbook explicitly attached under an otherwise-untracked category).
    // A tracked id can itself be a subcategory (e.g. a cloned one nested
    // under a freshly-cloned, still-empty parent) - walk up to also mark
    // every ancestor as tracked, so that empty parent stays reachable
    // instead of hiding the very node the budget actually tracks.
    const byId = new Map(categories.map(c => [c.id, c]));
    const trackedIds = new Set(budget.categoryIds || []);
    (budget.categoryIds || []).forEach(id => {
      let current = byId.get(id);
      while (current && current.parentId) {
        trackedIds.add(current.parentId);
        current = byId.get(current.parentId);
      }
    });
    const categoryRoots = getChildren(categories, null)
      .map(c => buildNode(c.id, c.name, c.color, c.limit))
      .filter(node => node.itemCount > 0 || trackedIds.has(node.id));

    const uncategorizedItems = matchedWorkbooks
      .filter(wb => !wb.categoryId)
      .sort((a, b) => new Date(b.paidAt || b.date) - new Date(a.paidAt || a.date));
    if (uncategorizedItems.length > 0) {
      const uncategorizedStatuses = uncategorizedItems.map(wb => getPaymentStatus(wb));
      categoryRoots.push({
        id: UNCATEGORIZED_ID,
        name: 'Uncategorized',
        color: null,
        limit: null,
        directItems: uncategorizedItems,
        children: [],
        paidTotal: uncategorizedStatuses.reduce((sum, s) => sum + s.paid, 0),
        unpaidTotal: uncategorizedStatuses.reduce((sum, s) => sum + s.remaining, 0),
        paidCount: uncategorizedStatuses.filter(s => s.paid > 0).length,
        unpaidCount: uncategorizedItems.filter((wb, i) => uncategorizedStatuses[i].status !== 'paid').length,
        itemCount: uncategorizedItems.length
      });
    }

    return categoryRoots.sort((a, b) => (b.paidTotal + b.unpaidTotal) - (a.paidTotal + a.unpaidTotal));
  }, [matchedWorkbooks, categories, budget]);

  const toggleExpanded = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleConfirmAddRootCategory = () => {
    if (newRootCategoryName.trim()) {
      const created = onAddCategory(newRootCategoryName, null);
      if (created) {
        const currentIds = budget.categoryIds || [];
        if (!currentIds.includes(created.id)) {
          onUpdateBudget(budget.id, { categoryIds: [...currentIds, created.id] });
        }
      }
    }
    setNewRootCategoryName('');
    setIsAddingRootCategory(false);
  };

  const handleAddUnfiledWorkbook = (wb) => {
    if (isAddWorkbookPending) return;
    setIsAddWorkbookPending(true);
    const currentIds = budget.workbookIds || [];
    if (!currentIds.includes(wb.id)) {
      onUpdateBudget(budget.id, { workbookIds: [...currentIds, wb.id] });
    }
    setTimeout(() => {
      setIsAddWorkbookPending(false);
      setIsAddingWorkbook(false);
    }, 400);
  };

  // Cloning (rather than reusing the source budget's category ids directly)
  // keeps this budget's copy fully isolated, same as every other path that
  // adds a category here - the source budget is never touched, and nothing
  // filed into this imported copy can ever show up back in the source.
  const handleImportBudget = (sourceBudget) => {
    if (isImporting) return;
    setIsImporting(true);
    const sourceRootIds = sourceBudget.categoryIds || [];
    if (sourceRootIds.length > 0) {
      // cloneCategoriesAsEmpty only clones upward (ancestors) - descendants
      // have to be included explicitly here so the imported copy keeps the
      // source's full subtree structure, not just its tracked root ids.
      const allSourceIds = Array.from(new Set(
        sourceRootIds.flatMap(id => getDescendantIds(categories, id))
      ));
      const cloneMapping = onCloneCategories(allSourceIds);
      const importedRootIds = sourceRootIds.map(id => cloneMapping[id] || id);
      const currentIds = budget.categoryIds || [];
      onUpdateBudget(budget.id, { categoryIds: [...currentIds, ...importedRootIds] });
    }
    setIsImportingBudget(false);
    setIsImporting(false);
  };

  const paidPct = budget.amount > 0 ? Math.min(100, (spent / budget.amount) * 100) : 0;
  const pendingPct = budget.amount > 0 ? Math.min(100 - paidPct, (pending / budget.amount) * 100) : 0;
  const isOver = availableBalance < 0;

  return (
    <div className="budget-detail">
      <button type="button" className="budget-detail-back" onClick={onBack}>
        &larr; Back to Budgets
      </button>

      <div className="budget-detail-header">
        <h4 className="budget-detail-name">{budget.name}</h4>
        <span className="budget-detail-limit">Limit: {formatWithCommas(budget.amount)}</span>
      </div>

      <div className="budget-stat-grid">
        <div className="budget-stat-tile">
          <span className="budget-stat-label">Paid</span>
          <span className="budget-stat-value paid">{formatWithCommas(spent)}</span>
          <span className="budget-stat-meta">{paidCount} item{paidCount === 1 ? '' : 's'}</span>
        </div>
        <div className="budget-stat-tile">
          <span className="budget-stat-label">Pending</span>
          <span className="budget-stat-value pending">{formatWithCommas(pending)}</span>
          <span className="budget-stat-meta">{pendingCount} item{pendingCount === 1 ? '' : 's'}</span>
        </div>
        <div className="budget-stat-tile">
          <span className="budget-stat-label">Available</span>
          <span className={`budget-stat-value ${isOver ? 'over' : 'available'}`}>
            {isOver ? `-${formatWithCommas(Math.abs(availableBalance))}` : formatWithCommas(availableBalance)}
          </span>
          <span className="budget-stat-meta">{isOver ? 'over budget' : 'balance left'}</span>
        </div>
      </div>

      <div className="spending-category-bar-track budget-bar-track">
        <div className="spending-category-bar-fill" style={{ width: `${paidPct}%` }} />
        <div className="budget-bar-fill-pending" style={{ width: `${pendingPct}%` }} />
      </div>

      <div className="budget-folder-actions budget-detail-root-actions">
        <button
          type="button"
          className="budget-folder-action-button"
          onClick={() => { setIsAddingRootCategory(v => !v); setIsAddingWorkbook(false); setIsImportingBudget(false); }}
        >
          + Add Category
        </button>
        <button
          type="button"
          className="budget-folder-action-button"
          onClick={() => { setIsAddingWorkbook(v => !v); setIsAddingRootCategory(false); setIsImportingBudget(false); }}
        >
          + Add Workbook
        </button>
        <button
          type="button"
          className="budget-folder-action-button"
          onClick={() => { setIsImportingBudget(v => !v); setIsAddingRootCategory(false); setIsAddingWorkbook(false); }}
        >
          Import Budget
        </button>
      </div>

      {isImportingBudget && (
        <InlineBudgetPicker
          budgets={otherBudgets}
          onSelect={handleImportBudget}
          onCancel={() => setIsImportingBudget(false)}
          isImporting={isImporting}
        />
      )}

      {isAddingRootCategory && (
        <div className="category-add-inline">
          <input
            type="text"
            value={newRootCategoryName}
            onChange={(e) => setNewRootCategoryName(e.target.value)}
            placeholder="New category name"
            className="dialog-input"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmAddRootCategory(); }}
          />
          <button type="button" className="category-add-button" onClick={handleConfirmAddRootCategory}>Add</button>
          <button type="button" className="category-cancel-button" onClick={() => setIsAddingRootCategory(false)}>Cancel</button>
        </div>
      )}

      {isAddingWorkbook && (
        <InlineWorkbookPicker
          workbooks={workbooks}
          excludeIds={unfiledExcludeIds}
          onSelect={handleAddUnfiledWorkbook}
          onCancel={() => setIsAddingWorkbook(false)}
          onCreateNew={onCreateWorkbook}
          isAdding={isAddWorkbookPending}
        />
      )}

      <div className="spending-summary-content budget-detail-content">
        {roots.length > 0 ? (
          <ul className="spending-category-list">
            {roots.map(node => (
              <BudgetCategoryNode
                key={node.id}
                node={node}
                depth={0}
                categories={categories}
                workbooks={workbooks}
                budget={budget}
                expandedIds={expandedIds}
                onToggle={toggleExpanded}
                onOpenWorkbook={onOpenWorkbook}
                onAddCategory={onAddCategory}
                onDeleteCategory={onDeleteCategory}
                onSetWorkbookCategory={onSetWorkbookCategory}
                onSetCategoryColor={onSetCategoryColor}
                onSetCategoryLimit={onSetCategoryLimit}
                onRenameCategory={onRenameCategory}
                onUpdateBudget={onUpdateBudget}
                onCreateWorkbook={onCreateWorkbook}
                onQuickView={setQuickViewWorkbook}
                onMarkPaid={onMarkPaid}
                formatWithCommas={formatWithCommas}
              />
            ))}
          </ul>
        ) : (
          <p className="no-spending-data">
            No workbooks filed under this budget yet. Attach one from the "Add to Budget / Category" action.
          </p>
        )}
      </div>

      {quickViewWorkbook && (
        <WorkbookQuickView
          workbook={quickViewWorkbook}
          formatWithCommas={formatWithCommas}
          onClose={() => setQuickViewWorkbook(null)}
          onOpenFull={() => { onOpenWorkbook(quickViewWorkbook); setQuickViewWorkbook(null); }}
        />
      )}
    </div>
  );
}

/**
 * Create/edit form for a single budget: name, limit amount, period, and the
 * scope it tracks - any number of categories (rolled up through their
 * subcategories) plus any number of individually attached workbooks.
 */
function BudgetForm({ initialBudget, categories, workbooks, onSave, onCancel, onCloneCategories }) {
  const [name, setName] = useState(initialBudget?.name || '');
  const [amount, setAmount] = useState(initialBudget ? String(initialBudget.amount) : '');
  const [period, setPeriod] = useState(initialBudget?.period || 'month');
  const [customFrom, setCustomFrom] = useState(initialBudget?.customFrom || '');
  const [customTo, setCustomTo] = useState(initialBudget?.customTo || '');
  const [categoryIds, setCategoryIds] = useState(() => new Set(initialBudget?.categoryIds || []));
  const [workbookIds, setWorkbookIds] = useState(() => new Set(initialBudget?.workbookIds || []));
  const [workbookSearch, setWorkbookSearch] = useState('');
  // Cloning newly-selected categories means one or more localStorage writes
  // before this form unmounts - guard + disable the submit button so a
  // rapid double-click can't create the budget (or clone its categories)
  // twice.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categories already tracked by this budget before this editing session -
  // only newly-checked ones (not these) get cloned into fresh empty copies
  // on submit, so re-saving an existing budget doesn't re-clone its scope.
  const originalCategoryIdsRef = useRef(new Set(initialBudget?.categoryIds || []));

  const categoryOptions = flattenTree(categories);
  const filteredWorkbooks = workbooks.filter(wb =>
    wb.name.toLowerCase().includes(workbookSearch.trim().toLowerCase())
  );

  const toggleCategory = (id) => {
    setCategoryIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleWorkbook = (id) => {
    setWorkbookIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    const parsedAmount = parseAmountValue(amount);
    if (!name.trim() || !Number.isFinite(parsedAmount)) return;
    setIsSubmitting(true);

    // Selecting an existing category here should give this budget its own
    // isolated copy, not link it to whatever is already filed under that
    // category elsewhere - so only genuinely new selections get cloned;
    // categories the budget already tracked keep their existing id.
    const currentIds = Array.from(categoryIds);
    const newlySelectedIds = currentIds.filter(id => !originalCategoryIdsRef.current.has(id));
    const keptIds = currentIds.filter(id => originalCategoryIdsRef.current.has(id));
    const cloneMapping = newlySelectedIds.length > 0 ? onCloneCategories(newlySelectedIds) : {};
    const finalCategoryIds = [...keptIds, ...newlySelectedIds.map(id => cloneMapping[id] || id)];

    onSave({
      name: name.trim(),
      amount: parsedAmount,
      period,
      customFrom,
      customTo,
      categoryIds: finalCategoryIds,
      workbookIds: Array.from(workbookIds)
    });
  };

  return (
    <div className="budget-form">
      <label className="payment-section-label">Budget Name</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Groceries this month"
        className="dialog-input"
        autoFocus
      />

      <label className="payment-section-label">Budget Amount</label>
      <AmountInput
        value={amount}
        onChange={setAmount}
        placeholder="Enter budget limit (e.g. 10K, 1.2M)"
        className="dialog-input"
      />

      <label className="payment-section-label">Period</label>
      <div className="payment-quick-options">
        <button type="button" className={`payment-quick-button ${period === 'all' ? 'active' : ''}`} onClick={() => setPeriod('all')}>
          All Time
        </button>
        <button type="button" className={`payment-quick-button ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>
          This Month
        </button>
        <button type="button" className={`payment-quick-button ${period === '30days' ? 'active' : ''}`} onClick={() => setPeriod('30days')}>
          Last 30 Days
        </button>
        <button type="button" className={`payment-quick-button ${period === 'custom' ? 'active' : ''}`} onClick={() => setPeriod('custom')}>
          Custom
        </button>
      </div>
      {period === 'custom' && (
        <div className="spending-custom-range">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="dialog-input"
            aria-label="From date"
          />
          <span className="spending-custom-range-separator">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="dialog-input"
            aria-label="To date"
          />
        </div>
      )}

      <label className="payment-section-label">Categories (includes subcategories)</label>
      <div className="budget-checklist">
        {categoryOptions.length > 0 ? (
          categoryOptions.map(opt => (
            <label
              key={opt.id}
              className="budget-checklist-item"
              style={{ paddingLeft: `${0.75 + opt.depth * 1}rem` }}
            >
              <input
                type="checkbox"
                checked={categoryIds.has(opt.id)}
                onChange={() => toggleCategory(opt.id)}
              />
              {opt.name}
            </label>
          ))
        ) : (
          <p className="budget-checklist-empty">No categories yet.</p>
        )}
      </div>

      <label className="payment-section-label">Workbooks</label>
      <input
        type="text"
        value={workbookSearch}
        onChange={(e) => setWorkbookSearch(e.target.value)}
        placeholder="Search workbooks by name..."
        className="dialog-input"
      />
      <div className="budget-checklist">
        {filteredWorkbooks.length > 0 ? (
          filteredWorkbooks.map(wb => (
            <label key={wb.id} className="budget-checklist-item">
              <input
                type="checkbox"
                checked={workbookIds.has(wb.id)}
                onChange={() => toggleWorkbook(wb.id)}
              />
              <span className="budget-checklist-workbook-name">{wb.name}</span>
              <span className="budget-checklist-workbook-meta">{wb.displayDate}</span>
            </label>
          ))
        ) : (
          <p className="budget-checklist-empty">No matching workbooks.</p>
        )}
      </div>

      <div className="dialog-buttons">
        <button onClick={onCancel} className="dialog-button cancel" disabled={isSubmitting}>
          Cancel
        </button>
        <button onClick={handleSubmit} className="dialog-button save" disabled={isSubmitting}>
          {isSubmitting
            ? (initialBudget ? 'Saving...' : 'Creating...')
            : (initialBudget ? 'Save Changes' : 'Create Budget')}
        </button>
      </div>
    </div>
  );
}

/**
 * BudgetManagerDialog Component
 *
 * Create and manage budgets: a named spending limit tracked against any mix
 * of attached workbooks and categories (rolled up through their
 * subcategories, however many levels deep). Shows progress against each
 * budget's limit and lets you drill into it to add/remove scope.
 */
function BudgetManagerDialog({
  isVisible,
  onClose,
  budgets,
  categories,
  workbooks,
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget,
  onOpenWorkbook,
  onAddCategory,
  onDeleteCategory,
  onSetWorkbookCategory,
  onSetCategoryColor,
  onSetCategoryLimit,
  onRenameCategory,
  onCloneCategories,
  onCreateWorkbook,
  onMarkPaid,
  formatWithCommas
}) {
  const [mode, setMode] = useState('list');
  const [editingBudget, setEditingBudget] = useState(null);
  const [viewingBudgetId, setViewingBudgetId] = useState(null);

  // Only recompute spend-per-budget when the underlying data actually
  // changes, not on every render this (always-mounted, for the slide
  // animation) panel happens to pick up from unrelated state elsewhere.
  const budgetStats = useMemo(
    () => budgets.map(budget => ({ budget, ...computeBudgetSpent(budget, workbooks, categories) })),
    [budgets, workbooks, categories]
  );

  // Re-derive from the live budgets list (rather than holding a stale copy)
  // so the detail view stays in sync if the budget is edited elsewhere.
  const viewingBudget = budgets.find(b => b.id === viewingBudgetId) || null;

  const handleCreate = () => {
    setEditingBudget(null);
    setMode('form');
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setMode('form');
  };

  const handleView = (budget) => {
    setViewingBudgetId(budget.id);
    setMode('detail');
  };

  const handleSave = (data) => {
    if (editingBudget) {
      onUpdateBudget(editingBudget.id, data);
    } else {
      onAddBudget(data);
    }
    setMode('list');
    setEditingBudget(null);
  };

  const handleDelete = (budget) => {
    if (window.confirm(`Delete the "${budget.name}" budget? This does not delete any workbooks.`)) {
      onDeleteBudget(budget.id);
      if (viewingBudgetId === budget.id) {
        setMode('list');
        setViewingBudgetId(null);
      }
    }
  };

  const handleOpenFromDetail = (workbook) => {
    onOpenWorkbook(workbook);
    onClose();
  };

  // Starting a new workbook from within the picker behaves exactly like
  // using the top menu's "New Workbook" - close this panel so the blank
  // workbook is ready to type into on the main calculator.
  const handleCreateWorkbookFromDetail = () => {
    onCreateWorkbook();
    onClose();
  };

  // Marking a workbook paid from here starts the exact same payment flow
  // used everywhere else (top menu, search results) - close this panel
  // first so the payment dialog isn't stacked behind it.
  const handleMarkPaidFromDetail = (workbook) => {
    onMarkPaid(workbook);
    onClose();
  };

  const headerTitle = mode === 'form'
    ? (editingBudget ? 'Edit Budget' : 'New Budget')
    : mode === 'detail'
      ? 'Budget Details'
      : 'Budgets';

  return (
    <div className={`budget-panel ${isVisible ? 'show' : ''}`}>
      <div className="spending-summary-header">
        <h3>{headerTitle}</h3>
        <button
          className="close-panel-button"
          onClick={onClose}
          aria-label="Close budgets"
        >
          &times;
        </button>
      </div>

      <div className="spending-summary-panel-body">
        {mode === 'form' ? (
          <BudgetForm
            initialBudget={editingBudget}
            categories={categories}
            workbooks={workbooks}
            onSave={handleSave}
            onCloneCategories={onCloneCategories}
            onCancel={() => { setMode('list'); setEditingBudget(null); }}
          />
        ) : mode === 'detail' && viewingBudget ? (
          <BudgetDetail
            budget={viewingBudget}
            budgets={budgets}
            workbooks={workbooks}
            categories={categories}
            onOpenWorkbook={handleOpenFromDetail}
            onBack={() => { setMode('list'); setViewingBudgetId(null); }}
            onAddCategory={onAddCategory}
            onDeleteCategory={onDeleteCategory}
            onSetWorkbookCategory={onSetWorkbookCategory}
            onSetCategoryColor={onSetCategoryColor}
            onSetCategoryLimit={onSetCategoryLimit}
            onRenameCategory={onRenameCategory}
            onUpdateBudget={onUpdateBudget}
            onCloneCategories={onCloneCategories}
            onCreateWorkbook={handleCreateWorkbookFromDetail}
            onMarkPaid={handleMarkPaidFromDetail}
            formatWithCommas={formatWithCommas}
          />
        ) : (
          <>
            <button type="button" className="save-to-history-button budget-new-button" onClick={handleCreate}>
              + New Budget
            </button>

            {budgetStats.length > 0 ? (
              <ul className="budget-list">
                {budgetStats.map(({ budget, spent, count, pending, pendingCount, availableBalance }) => {
                  const paidPct = budget.amount > 0 ? Math.min(100, (spent / budget.amount) * 100) : 0;
                  const pendingPct = budget.amount > 0 ? Math.min(100 - paidPct, (pending / budget.amount) * 100) : 0;
                  const isOver = availableBalance < 0;

                  return (
                    <li key={budget.id} className="budget-item">
                      <button
                        type="button"
                        className="spending-category-header budget-item-header"
                        onClick={() => handleView(budget)}
                      >
                        <span className="spending-category-name budget-item-name">{budget.name}</span>
                        <span className={`budget-item-amounts ${isOver ? 'over' : ''}`}>
                          {formatWithCommas(spent)} / {formatWithCommas(budget.amount)}
                        </span>
                      </button>
                      <div className="spending-category-bar-track budget-bar-track">
                        <div className="spending-category-bar-fill" style={{ width: `${paidPct}%` }} />
                        <div className="budget-bar-fill-pending" style={{ width: `${pendingPct}%` }} />
                      </div>
                      <div className="spending-category-meta">
                        <span>{count} paid &middot; {pendingCount} unpaid</span>
                        <span>Pending: {formatWithCommas(pending)}</span>
                      </div>
                      <div className="spending-category-meta">
                        <span />
                        <span className={isOver ? 'budget-available-over' : 'budget-available-ok'}>
                          {isOver
                            ? `${formatWithCommas(Math.abs(availableBalance))} over budget`
                            : `${formatWithCommas(availableBalance)} available`}
                        </span>
                      </div>
                      <div className="workbook-actions budget-item-actions">
                        <button onClick={() => handleView(budget)} className="workbook-action-button mark-paid">
                          View
                        </button>
                        <button onClick={() => handleEdit(budget)} className="workbook-action-button edit-budget">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(budget)} className="workbook-action-button delete">
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="no-spending-data">
                No budgets yet. Create one to start tracking spending against a limit.
              </p>
            )}
          </>
        )}
      </div>
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
  date: PropTypes.string,
  displayDate: PropTypes.string,
  isPaid: PropTypes.bool,
  amountPaid: PropTypes.number,
  paidAt: PropTypes.string,
  paidAtDisplay: PropTypes.string,
  categoryId: PropTypes.string
});

const budgetCategoryNodeShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  color: PropTypes.string,
  limit: PropTypes.number,
  directItems: PropTypes.arrayOf(workbookShape).isRequired,
  children: PropTypes.array.isRequired,
  paidTotal: PropTypes.number.isRequired,
  unpaidTotal: PropTypes.number.isRequired,
  paidCount: PropTypes.number.isRequired,
  unpaidCount: PropTypes.number.isRequired,
  itemCount: PropTypes.number.isRequired
});

const budgetShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  period: PropTypes.string,
  categoryIds: PropTypes.arrayOf(PropTypes.string),
  workbookIds: PropTypes.arrayOf(PropTypes.string)
});

InlineWorkbookPicker.propTypes = {
  workbooks: PropTypes.arrayOf(workbookShape).isRequired,
  excludeIds: PropTypes.instanceOf(Set).isRequired,
  onSelect: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onCreateNew: PropTypes.func.isRequired,
  isAdding: PropTypes.bool
};

InlineWorkbookPicker.defaultProps = {
  isAdding: false
};

InlineBudgetPicker.propTypes = {
  budgets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      categoryIds: PropTypes.arrayOf(PropTypes.string)
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isImporting: PropTypes.bool.isRequired
};

BudgetCategoryNode.propTypes = {
  node: budgetCategoryNodeShape.isRequired,
  depth: PropTypes.number.isRequired,
  categories: PropTypes.arrayOf(categoryShape).isRequired,
  workbooks: PropTypes.arrayOf(workbookShape).isRequired,
  budget: budgetShape.isRequired,
  expandedIds: PropTypes.instanceOf(Set).isRequired,
  onToggle: PropTypes.func.isRequired,
  onOpenWorkbook: PropTypes.func.isRequired,
  onAddCategory: PropTypes.func.isRequired,
  onDeleteCategory: PropTypes.func.isRequired,
  onSetWorkbookCategory: PropTypes.func.isRequired,
  onSetCategoryColor: PropTypes.func.isRequired,
  onSetCategoryLimit: PropTypes.func.isRequired,
  onRenameCategory: PropTypes.func.isRequired,
  onUpdateBudget: PropTypes.func.isRequired,
  onCreateWorkbook: PropTypes.func.isRequired,
  onQuickView: PropTypes.func.isRequired,
  onMarkPaid: PropTypes.func.isRequired,
  formatWithCommas: PropTypes.func.isRequired
};

BudgetDetail.propTypes = {
  budget: budgetShape.isRequired,
  budgets: PropTypes.arrayOf(budgetShape).isRequired,
  workbooks: PropTypes.arrayOf(workbookShape).isRequired,
  categories: PropTypes.arrayOf(categoryShape).isRequired,
  onOpenWorkbook: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onAddCategory: PropTypes.func.isRequired,
  onDeleteCategory: PropTypes.func.isRequired,
  onSetWorkbookCategory: PropTypes.func.isRequired,
  onSetCategoryColor: PropTypes.func.isRequired,
  onSetCategoryLimit: PropTypes.func.isRequired,
  onRenameCategory: PropTypes.func.isRequired,
  onUpdateBudget: PropTypes.func.isRequired,
  onCloneCategories: PropTypes.func.isRequired,
  onCreateWorkbook: PropTypes.func.isRequired,
  onMarkPaid: PropTypes.func.isRequired,
  formatWithCommas: PropTypes.func.isRequired
};

BudgetForm.propTypes = {
  initialBudget: PropTypes.shape({
    name: PropTypes.string,
    amount: PropTypes.number,
    period: PropTypes.string,
    customFrom: PropTypes.string,
    customTo: PropTypes.string,
    categoryIds: PropTypes.arrayOf(PropTypes.string),
    workbookIds: PropTypes.arrayOf(PropTypes.string)
  }),
  categories: PropTypes.arrayOf(categoryShape).isRequired,
  workbooks: PropTypes.arrayOf(workbookShape).isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onCloneCategories: PropTypes.func.isRequired
};

BudgetManagerDialog.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  budgets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      period: PropTypes.string,
      categoryIds: PropTypes.arrayOf(PropTypes.string),
      workbookIds: PropTypes.arrayOf(PropTypes.string)
    })
  ).isRequired,
  categories: PropTypes.arrayOf(categoryShape).isRequired,
  workbooks: PropTypes.arrayOf(workbookShape).isRequired,
  onAddBudget: PropTypes.func.isRequired,
  onUpdateBudget: PropTypes.func.isRequired,
  onDeleteBudget: PropTypes.func.isRequired,
  onOpenWorkbook: PropTypes.func.isRequired,
  onAddCategory: PropTypes.func.isRequired,
  onDeleteCategory: PropTypes.func.isRequired,
  onSetWorkbookCategory: PropTypes.func.isRequired,
  onSetCategoryColor: PropTypes.func.isRequired,
  onSetCategoryLimit: PropTypes.func.isRequired,
  onRenameCategory: PropTypes.func.isRequired,
  onCloneCategories: PropTypes.func.isRequired,
  onCreateWorkbook: PropTypes.func.isRequired,
  onMarkPaid: PropTypes.func.isRequired,
  formatWithCommas: PropTypes.func.isRequired
};

// Memoized: this panel stays mounted for its slide-in/out animation even
// while closed, so it must skip re-rendering when unrelated state changes
// elsewhere in the app (e.g. every keystroke in the calculator textarea).
export default React.memo(BudgetManagerDialog);
