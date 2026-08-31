import React, { useState } from 'react';
import PropTypes from 'prop-types';
import CategoryPicker from './CategoryPicker';

/**
 * OrganizeWorkbookDialog Component
 *
 * Lets the user assign a category to the given workbook and add/remove it
 * from any number of existing budgets - independent of whether the
 * workbook has been marked paid.
 */
function OrganizeWorkbookDialog({
  isVisible,
  onClose,
  workbook,
  categories,
  budgets,
  onAddCategory,
  onSetCategory,
  onToggleBudget
}) {
  const [categoryId, setCategoryId] = useState(workbook?.categoryId || null);
  const [budgetSelections, setBudgetSelections] = useState(
    () => new Set(budgets.filter(b => (b.workbookIds || []).includes(workbook?.id)).map(b => b.id))
  );

  if (!isVisible || !workbook) return null;

  const toggleBudgetSelection = (id) => {
    setBudgetSelections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    onSetCategory(workbook.id, categoryId);

    budgets.forEach(budget => {
      const wasIncluded = (budget.workbookIds || []).includes(workbook.id);
      const isIncluded = budgetSelections.has(budget.id);
      if (wasIncluded !== isIncluded) {
        onToggleBudget(budget, isIncluded);
      }
    });

    onClose();
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog payment-dialog">
        <div className="dialog-header">
          <h3>Add to Budget / Category</h3>
          <button
            type="button"
            className="close-panel-button"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <p className="payment-dialog-workbook-name">{workbook.name}</p>

        <div className="dialog-content">
          <label className="payment-section-label">Category</label>
          <CategoryPicker
            categories={categories}
            initialCategoryId={workbook.categoryId}
            onChange={setCategoryId}
            onAddCategory={onAddCategory}
          />

          <label className="payment-section-label">Budgets</label>
          {budgets.length > 0 ? (
            <div className="budget-checklist">
              {budgets.map(budget => (
                <label key={budget.id} className="budget-checklist-item">
                  <input
                    type="checkbox"
                    checked={budgetSelections.has(budget.id)}
                    onChange={() => toggleBudgetSelection(budget.id)}
                  />
                  {budget.name}
                </label>
              ))}
            </div>
          ) : (
            <p className="budget-checklist-empty">
              No budgets yet. Create one from the Budgets panel first.
            </p>
          )}
        </div>

        <div className="dialog-buttons">
          <button onClick={onClose} className="dialog-button cancel">
            Cancel
          </button>
          <button onClick={handleSave} className="dialog-button save">
            Save
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

OrganizeWorkbookDialog.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  workbook: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    categoryId: PropTypes.string
  }),
  categories: PropTypes.arrayOf(categoryShape).isRequired,
  budgets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      workbookIds: PropTypes.arrayOf(PropTypes.string)
    })
  ).isRequired,
  onAddCategory: PropTypes.func.isRequired,
  onSetCategory: PropTypes.func.isRequired,
  onToggleBudget: PropTypes.func.isRequired
};

export default OrganizeWorkbookDialog;
