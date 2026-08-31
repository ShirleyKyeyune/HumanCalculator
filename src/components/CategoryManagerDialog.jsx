import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import WorkbookQuickView from './WorkbookQuickView';

const UNCATEGORIZED_KEY = '__uncategorized__';

/**
 * One workbook inside a grouped category listing: read-only here (no drag,
 * no "Move to") - Manage Categories is a browsing/aggregation view, not an
 * editing surface, since a grouped name can represent several budgets'
 * separate underlying categories at once (see CategoryManagerDialog docs
 * below). A small tag shows the workbook's own (sub)category name when it
 * differs from the group it's rolled up under, so flattening the tree for
 * display doesn't lose which specific folder something was actually filed
 * in.
 */
function GroupedWorkbookRow({ workbook, categoryName, groupName, onQuickView }) {
  const showSubTag = categoryName && categoryName.toLowerCase() !== groupName.toLowerCase();

  return (
    <li className="category-tree-workbook-row clickable" onClick={() => onQuickView(workbook)}>
      <span className="category-tree-workbook-name">{workbook.name}</span>
      {showSubTag && <span className="category-tree-workbook-subtag">{categoryName}</span>}
      <span className="category-tree-workbook-date">{workbook.displayDate}</span>
      <button
        type="button"
        className="workbook-quick-view-trigger"
        onClick={(e) => { e.stopPropagation(); onQuickView(workbook); }}
        title="Quick view"
        aria-label={`Quick view ${workbook.name}`}
      >
        &#128065;
      </button>
    </li>
  );
}

/**
 * One grouped row: a category name (e.g. "Groceries"), aggregated across
 * every budget's own isolated copy of it, plus every workbook filed
 * anywhere under it or any of its subcategories - flattened into one list
 * rather than a nested tree, since the underlying subcategory shape can
 * differ from budget to budget.
 */
function CategoryGroupRow({ name, color, entries, isExpanded, onToggle, onQuickView }) {
  return (
    <li className="category-tree-item">
      <div
        className={`category-tree-row clickable ${isExpanded ? 'expanded' : ''}`}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      >
        <div className="category-tree-name-group">
          <span
            className="category-tree-expand-button"
            aria-hidden="true"
          >
            <span className={`spending-expand-caret ${isExpanded ? 'expanded' : ''}`}>&#9656;</span>
          </span>
          {color !== undefined && (
            <span
              className={`category-color-dot ${color ? '' : 'none'}`}
              style={color ? { backgroundColor: color } : undefined}
              aria-hidden="true"
            />
          )}
          <span className="category-tree-name">{name}</span>
          {entries.length > 0 && (
            <span className="category-tree-count-badge">{entries.length}</span>
          )}
        </div>
      </div>

      {isExpanded && entries.length > 0 && (
        <ul className="category-tree-workbook-list" style={{ marginLeft: '1.25rem' }}>
          {entries.map(({ workbook, categoryName }) => (
            <GroupedWorkbookRow
              key={workbook.id}
              workbook={workbook}
              categoryName={categoryName}
              groupName={name}
              onQuickView={onQuickView}
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
 * A read-only, aggregated browser across the whole category "namespace".
 *
 * Budgets keep their spending fully isolated from one another (see
 * useCategories.cloneCategoriesAsEmpty): picking an existing category name
 * for a new budget clones it into a brand-new id rather than linking to the
 * original, so the same name (e.g. "Groceries") can end up as many
 * different underlying category records - one per budget that used it.
 * That's correct for scoping spend, but it means the raw category list can
 * have any number of same-named entries once there are many budgets.
 *
 * This panel groups all of those by name instead of listing every
 * duplicate, so browsing stays sane regardless of how many budgets reuse a
 * given name: one row per distinct name, aggregating every workbook filed
 * under it (or any of its subcategories, at any depth, in any budget's
 * copy) into a single flat list. Because a grouped row can represent many
 * different underlying ids at once, there's no unambiguous single target
 * for renaming, deleting, recoloring, limiting, or reassigning a workbook
 * from here - those stay scoped to a specific budget's own category tree
 * (Budget Details) or a workbook's own "Add to Budget / Category" action.
 */
function CategoryManagerDialog({
  isVisible,
  onClose,
  categories,
  workbooks,
  onAddCategory,
  onOpenWorkbook,
  formatWithCommas
}) {
  const [newRootName, setNewRootName] = useState('');
  const [expandedKeys, setExpandedKeys] = useState(() => new Set());
  const [quickViewWorkbook, setQuickViewWorkbook] = useState(null);

  const byId = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // Resolve every category id to the name of its top-level ancestor
  // (itself, if it's already a root) - memoized per id so a deep chain
  // isn't re-walked for every descendant that shares it.
  const rootNameById = useMemo(() => {
    const resolved = new Map();
    const resolve = (id) => {
      if (resolved.has(id)) return resolved.get(id);
      const cat = byId.get(id);
      if (!cat) return null;
      const name = cat.parentId ? resolve(cat.parentId) : cat.name.trim();
      resolved.set(id, name);
      return name;
    };
    categories.forEach(c => resolve(c.id));
    return resolved;
  }, [categories, byId]);

  const groups = useMemo(() => {
    const order = [];
    const byName = new Map();

    const getGroup = (name) => {
      const key = name.trim().toLowerCase();
      if (!byName.has(key)) {
        byName.set(key, { name: name.trim(), color: null, entries: [] });
        order.push(key);
      }
      return byName.get(key);
    };

    // Seed a row for every root category even if it has no workbooks yet,
    // and pick up the first color set on any instance of that name.
    categories.filter(c => !c.parentId).forEach(c => {
      const group = getGroup(c.name);
      if (!group.color && c.color) group.color = c.color;
    });

    workbooks.forEach(wb => {
      if (!wb.categoryId) return;
      const rootName = rootNameById.get(wb.categoryId);
      if (!rootName) return;
      const ownCategory = byId.get(wb.categoryId);
      getGroup(rootName).entries.push({ workbook: wb, categoryName: ownCategory ? ownCategory.name : null });
    });

    order.forEach(key => {
      byName.get(key).entries.sort((a, b) => new Date(b.workbook.date) - new Date(a.workbook.date));
    });

    return order.map(key => byName.get(key));
  }, [categories, workbooks, rootNameById, byId]);

  const uncategorizedEntries = useMemo(() => {
    return workbooks
      .filter(wb => !wb.categoryId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(wb => ({ workbook: wb, categoryName: null }));
  }, [workbooks]);

  const toggleExpand = (key) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
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
        {uncategorizedEntries.length > 0 && (
          <ul className="category-tree-children category-tree-root">
            <CategoryGroupRow
              name="Uncategorized"
              color={undefined}
              entries={uncategorizedEntries}
              isExpanded={expandedKeys.has(UNCATEGORIZED_KEY)}
              onToggle={() => toggleExpand(UNCATEGORIZED_KEY)}
              onQuickView={setQuickViewWorkbook}
            />
          </ul>
        )}

        {groups.length > 0 ? (
          <ul className="category-tree-children category-tree-root">
            {groups.map(group => {
              const key = group.name.toLowerCase();
              return (
                <CategoryGroupRow
                  key={key}
                  name={group.name}
                  color={group.color}
                  entries={group.entries}
                  isExpanded={expandedKeys.has(key)}
                  onToggle={() => toggleExpand(key)}
                  onQuickView={setQuickViewWorkbook}
                />
              );
            })}
          </ul>
        ) : (
          uncategorizedEntries.length === 0 && (
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
  date: PropTypes.string,
  displayDate: PropTypes.string,
  categoryId: PropTypes.string,
  isPaid: PropTypes.bool,
  amountPaid: PropTypes.number,
  paidAtDisplay: PropTypes.string
});

GroupedWorkbookRow.propTypes = {
  workbook: workbookShape.isRequired,
  categoryName: PropTypes.string,
  groupName: PropTypes.string.isRequired,
  onQuickView: PropTypes.func.isRequired
};

CategoryGroupRow.propTypes = {
  name: PropTypes.string.isRequired,
  color: PropTypes.string,
  entries: PropTypes.arrayOf(PropTypes.shape({
    workbook: workbookShape.isRequired,
    categoryName: PropTypes.string
  })).isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onQuickView: PropTypes.func.isRequired
};

CategoryManagerDialog.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(categoryShape).isRequired,
  workbooks: PropTypes.arrayOf(workbookShape).isRequired,
  onAddCategory: PropTypes.func.isRequired,
  onOpenWorkbook: PropTypes.func.isRequired,
  formatWithCommas: PropTypes.func.isRequired
};

// Memoized: this panel stays mounted for its slide-in/out animation even
// while closed, so it must skip re-rendering when unrelated state changes
// elsewhere in the app (e.g. every keystroke in the calculator textarea).
export default React.memo(CategoryManagerDialog);
