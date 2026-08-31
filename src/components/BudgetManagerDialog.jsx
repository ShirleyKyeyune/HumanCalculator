import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { flattenTree, getChildren, getDescendantIds } from '../hooks/useCategories';
import { computeBudgetSpent } from '../hooks/useBudgets';
import AmountInput from './AmountInput';

const UNCATEGORIZED_ID = '__uncategorized__';

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
 */
function BudgetCategoryNode({ node, depth, expandedIds, onToggle, onOpenWorkbook, formatWithCommas }) {
  const isExpanded = expandedIds.has(node.id);

  return (
    <li className="spending-category-item" style={depth > 0 ? { marginLeft: '0.5rem' } : undefined}>
      <button
        type="button"
        className="spending-category-header"
        onClick={() => onToggle(node.id)}
        aria-expanded={isExpanded}
      >
        <span className="spending-category-name">
          <span className={`spending-expand-caret ${isExpanded ? 'expanded' : ''}`}>&#9656;</span>
          {node.name}
        </span>
        <span className="spending-category-total">{formatWithCommas(node.paidTotal)}</span>
      </button>
      <div className="spending-category-meta">
        <span>{node.paidCount} paid · {node.unpaidCount} unpaid</span>
      </div>

      {isExpanded && (
        <div className="spending-subcategory-groups">
          {node.directItems.length > 0 && (
            <ul className="spending-workbook-list">
              {node.directItems.map(wb => (
                <li key={wb.id} className="spending-workbook-row">
                  <div className="spending-workbook-info">
                    <span className="spending-workbook-name">{wb.name}</span>
                    <span className="spending-workbook-date">{wb.paidAtDisplay || wb.displayDate}</span>
                  </div>
                  {wb.isPaid ? (
                    <span className="workbook-paid-badge paid">{formatWithCommas(wb.amountPaid || 0)}</span>
                  ) : (
                    <span className="workbook-paid-badge unpaid">Unpaid</span>
                  )}
                  <button
                    type="button"
                    className="spending-workbook-open-button"
                    onClick={() => onOpenWorkbook(wb)}
                  >
                    Open
                  </button>
                </li>
              ))}
            </ul>
          )}
          {node.children.length > 0 && (
            <ul className="spending-category-list spending-category-list-nested">
              {node.children.map(child => (
                <BudgetCategoryNode
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  expandedIds={expandedIds}
                  onToggle={onToggle}
                  onOpenWorkbook={onOpenWorkbook}
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
function BudgetDetail({ budget, workbooks, categories, onOpenWorkbook, onBack, formatWithCommas }) {
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const matchedWorkbooks = useMemo(
    () => getBudgetWorkbooks(budget, workbooks, categories),
    [budget, workbooks, categories]
  );

  const { spent, count: paidCount } = useMemo(
    () => computeBudgetSpent(budget, workbooks, categories),
    [budget, workbooks, categories]
  );
  const unpaidCount = matchedWorkbooks.length - paidCount;

  const roots = useMemo(() => {
    const buildNode = (nodeId, nodeName) => {
      const directItems = matchedWorkbooks
        .filter(wb => (wb.categoryId || null) === nodeId)
        .sort((a, b) => new Date(b.paidAt || b.date) - new Date(a.paidAt || a.date));
      const paidItems = directItems.filter(wb => wb.isPaid);

      const children = getChildren(categories, nodeId)
        .map(child => buildNode(child.id, child.name))
        .filter(child => child.itemCount > 0);

      const paidTotal = paidItems.reduce((sum, wb) => sum + (wb.amountPaid || 0), 0) +
        children.reduce((sum, c) => sum + c.paidTotal, 0);
      const paidCountNode = paidItems.length + children.reduce((sum, c) => sum + c.paidCount, 0);
      const unpaidCountNode = (directItems.length - paidItems.length) + children.reduce((sum, c) => sum + c.unpaidCount, 0);
      const itemCount = directItems.length + children.reduce((sum, c) => sum + c.itemCount, 0);

      return { id: nodeId, name: nodeName, directItems, children, paidTotal, paidCount: paidCountNode, unpaidCount: unpaidCountNode, itemCount };
    };

    const categoryRoots = getChildren(categories, null)
      .map(c => buildNode(c.id, c.name))
      .filter(node => node.itemCount > 0);

    const uncategorizedItems = matchedWorkbooks
      .filter(wb => !wb.categoryId)
      .sort((a, b) => new Date(b.paidAt || b.date) - new Date(a.paidAt || a.date));
    if (uncategorizedItems.length > 0) {
      const paidItems = uncategorizedItems.filter(wb => wb.isPaid);
      categoryRoots.push({
        id: UNCATEGORIZED_ID,
        name: 'Uncategorized',
        directItems: uncategorizedItems,
        children: [],
        paidTotal: paidItems.reduce((sum, wb) => sum + (wb.amountPaid || 0), 0),
        paidCount: paidItems.length,
        unpaidCount: uncategorizedItems.length - paidItems.length,
        itemCount: uncategorizedItems.length
      });
    }

    return categoryRoots.sort((a, b) => b.itemCount - a.itemCount);
  }, [matchedWorkbooks, categories]);

  const toggleExpanded = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const pct = budget.amount > 0 ? Math.min(100, (spent / budget.amount) * 100) : 0;
  const isOver = spent > budget.amount;

  return (
    <div className="budget-detail">
      <button type="button" className="budget-detail-back" onClick={onBack}>
        &larr; Back to Budgets
      </button>

      <div className="spending-summary-total">
        <div>
          <span className="spending-summary-total-label">{budget.name}</span>
          <span className="spending-summary-total-value">
            {formatWithCommas(spent)} <span className="budget-detail-limit">/ {formatWithCommas(budget.amount)}</span>
          </span>
        </div>
        <span className="spending-summary-total-count">
          {paidCount} paid &middot; {unpaidCount} unpaid
        </span>
      </div>
      <div className="spending-category-bar-track">
        <div
          className={`spending-category-bar-fill ${isOver ? 'over-budget' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="spending-summary-content budget-detail-content">
        {roots.length > 0 ? (
          <ul className="spending-category-list">
            {roots.map(node => (
              <BudgetCategoryNode
                key={node.id}
                node={node}
                depth={0}
                expandedIds={expandedIds}
                onToggle={toggleExpanded}
                onOpenWorkbook={onOpenWorkbook}
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
    </div>
  );
}

/**
 * Create/edit form for a single budget: name, limit amount, period, and the
 * scope it tracks - any number of categories (rolled up through their
 * subcategories) plus any number of individually attached workbooks.
 */
function BudgetForm({ initialBudget, categories, workbooks, onSave, onCancel }) {
  const [name, setName] = useState(initialBudget?.name || '');
  const [amount, setAmount] = useState(initialBudget ? String(initialBudget.amount) : '');
  const [period, setPeriod] = useState(initialBudget?.period || 'month');
  const [customFrom, setCustomFrom] = useState(initialBudget?.customFrom || '');
  const [customTo, setCustomTo] = useState(initialBudget?.customTo || '');
  const [categoryIds, setCategoryIds] = useState(() => new Set(initialBudget?.categoryIds || []));
  const [workbookIds, setWorkbookIds] = useState(() => new Set(initialBudget?.workbookIds || []));
  const [workbookSearch, setWorkbookSearch] = useState('');

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
    const parsedAmount = parseFloat(amount);
    if (!name.trim() || !Number.isFinite(parsedAmount)) return;

    onSave({
      name: name.trim(),
      amount: parsedAmount,
      period,
      customFrom,
      customTo,
      categoryIds: Array.from(categoryIds),
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
        placeholder="Enter budget limit"
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
        <button onClick={onCancel} className="dialog-button cancel">
          Cancel
        </button>
        <button onClick={handleSubmit} className="dialog-button save">
          {initialBudget ? 'Save Changes' : 'Create Budget'}
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
            onCancel={() => { setMode('list'); setEditingBudget(null); }}
          />
        ) : mode === 'detail' && viewingBudget ? (
          <BudgetDetail
            budget={viewingBudget}
            workbooks={workbooks}
            categories={categories}
            onOpenWorkbook={handleOpenFromDetail}
            onBack={() => { setMode('list'); setViewingBudgetId(null); }}
            formatWithCommas={formatWithCommas}
          />
        ) : (
          <>
            <button type="button" className="save-to-history-button budget-new-button" onClick={handleCreate}>
              + New Budget
            </button>

            {budgetStats.length > 0 ? (
              <ul className="budget-list">
                {budgetStats.map(({ budget, spent, count }) => {
                  const pct = budget.amount > 0 ? Math.min(100, (spent / budget.amount) * 100) : 0;
                  const isOver = spent > budget.amount;

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
                      <div className="spending-category-bar-track">
                        <div
                          className={`spending-category-bar-fill ${isOver ? 'over-budget' : ''}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="spending-category-meta">
                        <span>{count} paid item{count === 1 ? '' : 's'}</span>
                        <span>{isOver ? 'Over budget' : `${(100 - pct).toFixed(0)}% left`}</span>
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
  parentId: PropTypes.string
});

const workbookShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
  displayDate: PropTypes.string,
  isPaid: PropTypes.bool,
  amountPaid: PropTypes.number,
  paidAt: PropTypes.string,
  categoryId: PropTypes.string
});

const budgetCategoryNodeShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  directItems: PropTypes.arrayOf(workbookShape).isRequired,
  children: PropTypes.array.isRequired,
  paidTotal: PropTypes.number.isRequired,
  paidCount: PropTypes.number.isRequired,
  unpaidCount: PropTypes.number.isRequired,
  itemCount: PropTypes.number.isRequired
});

BudgetCategoryNode.propTypes = {
  node: budgetCategoryNodeShape.isRequired,
  depth: PropTypes.number.isRequired,
  expandedIds: PropTypes.instanceOf(Set).isRequired,
  onToggle: PropTypes.func.isRequired,
  onOpenWorkbook: PropTypes.func.isRequired,
  formatWithCommas: PropTypes.func.isRequired
};

BudgetDetail.propTypes = {
  budget: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    period: PropTypes.string,
    categoryIds: PropTypes.arrayOf(PropTypes.string),
    workbookIds: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  workbooks: PropTypes.arrayOf(workbookShape).isRequired,
  categories: PropTypes.arrayOf(categoryShape).isRequired,
  onOpenWorkbook: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
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
  onCancel: PropTypes.func.isRequired
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
  formatWithCommas: PropTypes.func.isRequired
};

// Memoized: this panel stays mounted for its slide-in/out animation even
// while closed, so it must skip re-rendering when unrelated state changes
// elsewhere in the app (e.g. every keystroke in the calculator textarea).
export default React.memo(BudgetManagerDialog);
