import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { flattenTree } from '../hooks/useCategories';
import { computeBudgetSpent } from '../hooks/useBudgets';
import AmountInput from './AmountInput';

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
  formatWithCommas
}) {
  const [mode, setMode] = useState('list');
  const [editingBudget, setEditingBudget] = useState(null);

  // Only recompute spend-per-budget when the underlying data actually
  // changes, not on every render this (always-mounted, for the slide
  // animation) panel happens to pick up from unrelated state elsewhere.
  const budgetStats = useMemo(
    () => budgets.map(budget => ({ budget, ...computeBudgetSpent(budget, workbooks, categories) })),
    [budgets, workbooks, categories]
  );

  const handleCreate = () => {
    setEditingBudget(null);
    setMode('form');
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setMode('form');
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
    }
  };

  return (
    <div className={`budget-panel ${isVisible ? 'show' : ''}`}>
      <div className="spending-summary-header">
        <h3>{mode === 'form' ? (editingBudget ? 'Edit Budget' : 'New Budget') : 'Budgets'}</h3>
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
                      <div className="spending-category-header budget-item-header">
                        <span className="spending-category-name budget-item-name">{budget.name}</span>
                        <span className={`budget-item-amounts ${isOver ? 'over' : ''}`}>
                          {formatWithCommas(spent)} / {formatWithCommas(budget.amount)}
                        </span>
                      </div>
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
                        <button onClick={() => handleEdit(budget)} className="workbook-action-button mark-paid">
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
  formatWithCommas: PropTypes.func.isRequired
};

export default BudgetManagerDialog;
