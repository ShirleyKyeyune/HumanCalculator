import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getChildren, getDescendantIds, flattenTree } from '../hooks/useCategories';
import { isWithinRange } from '../utils/dateRange';

const UNCATEGORIZED_ID = '__uncategorized__';

/**
 * One category (or "Uncategorized") node in the spending tree: its own
 * paid workbooks, plus recursively-rendered children with their own
 * roll-up totals.
 */
function SpendingCategoryNode({
  node,
  parentTotal,
  depth,
  expandedIds,
  onToggle,
  onOpenWorkbook,
  formatWithCommas,
  autoExpand
}) {
  const pct = parentTotal > 0 ? (node.rollupTotal / parentTotal) * 100 : 0;
  const isExpanded = autoExpand || expandedIds.has(node.id);

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
        <span className="spending-category-total">{formatWithCommas(node.rollupTotal)}</span>
      </button>
      <div className="spending-category-bar-track">
        <div className="spending-category-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="spending-category-meta">
        <span>{node.rollupCount} paid item{node.rollupCount === 1 ? '' : 's'}</span>
        <span>{pct.toFixed(1)}%</span>
      </div>

      {isExpanded && (
        <div className="spending-subcategory-groups">
          {node.directItems.length > 0 && (
            <ul className="spending-workbook-list">
              {node.directItems.map(wb => (
                <li key={wb.id} className="spending-workbook-row">
                  <div className="spending-workbook-info">
                    <span className="spending-workbook-name">{wb.name}</span>
                    <span className="spending-workbook-date">{wb.paidAtDisplay}</span>
                  </div>
                  <span className="spending-workbook-amount">
                    {formatWithCommas(wb.amountPaid || 0)}
                  </span>
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
                <SpendingCategoryNode
                  key={child.id}
                  node={child}
                  parentTotal={node.rollupTotal}
                  depth={depth + 1}
                  expandedIds={expandedIds}
                  onToggle={onToggle}
                  onOpenWorkbook={onOpenWorkbook}
                  formatWithCommas={formatWithCommas}
                  autoExpand={false}
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
 * SpendingSummaryPanel Component
 *
 * A "look back" report + browser: filter paid workbooks by period and by
 * category (rolling up through however many subcategory levels exist), see
 * subtotals and a grand total, and drill into the actual workbooks behind
 * each number to open them. Data stays local (localStorage) today; this
 * reads the same flat workbook records that will sync via Google Drive later.
 */
function SpendingSummaryPanel({ isVisible, onClose, workbooks, categories, onOpenWorkbook, formatWithCommas }) {
  const [range, setRange] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  // Reset the category filter whenever the period changes, since a
  // previously selected category may no longer have anything in it.
  useEffect(() => {
    setCategoryFilter('all');
  }, [range]);

  const categoryFilterOptions = useMemo(() => flattenTree(categories), [categories]);

  const periodPaid = useMemo(
    () => (workbooks || []).filter(wb => wb.isPaid && isWithinRange(wb.paidAt, range, customFrom, customTo)),
    [workbooks, range, customFrom, customTo]
  );

  const filteredPaid = useMemo(() => {
    if (categoryFilter === 'all') return periodPaid;
    if (categoryFilter === UNCATEGORIZED_ID) return periodPaid.filter(wb => !wb.categoryId);

    const scopeIds = getDescendantIds(categories, categoryFilter);
    return periodPaid.filter(wb => wb.categoryId && scopeIds.includes(wb.categoryId));
  }, [periodPaid, categoryFilter, categories]);

  const overallTotal = useMemo(
    () => filteredPaid.reduce((sum, wb) => sum + (wb.amountPaid || 0), 0),
    [filteredPaid]
  );

  const buildNode = (nodeId, nodeName) => {
    const directItems = filteredPaid
      .filter(wb => (wb.categoryId || null) === nodeId)
      .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
    const directTotal = directItems.reduce((sum, wb) => sum + (wb.amountPaid || 0), 0);

    const children = getChildren(categories, nodeId)
      .map(child => buildNode(child.id, child.name))
      .filter(child => child.rollupTotal > 0);

    const rollupTotal = directTotal + children.reduce((sum, c) => sum + c.rollupTotal, 0);
    const rollupCount = directItems.length + children.reduce((sum, c) => sum + c.rollupCount, 0);

    return { id: nodeId, name: nodeName, directItems, directTotal, children, rollupTotal, rollupCount };
  };

  const roots = useMemo(() => {
    if (categoryFilter === UNCATEGORIZED_ID) {
      const node = buildNode(null, 'Uncategorized');
      return node.rollupTotal > 0 || node.directItems.length > 0 ? [node] : [];
    }

    if (categoryFilter !== 'all') {
      const match = categoryFilterOptions.find(c => c.id === categoryFilter);
      return [buildNode(categoryFilter, match ? match.name : 'Category')];
    }

    const categoryRoots = getChildren(categories, null)
      .map(c => buildNode(c.id, c.name))
      .filter(node => node.rollupTotal > 0);

    const uncategorizedItems = filteredPaid.filter(wb => !wb.categoryId);
    if (uncategorizedItems.length > 0) {
      categoryRoots.push({
        id: UNCATEGORIZED_ID,
        name: 'Uncategorized',
        directItems: uncategorizedItems.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt)),
        directTotal: uncategorizedItems.reduce((sum, wb) => sum + (wb.amountPaid || 0), 0),
        children: [],
        rollupTotal: uncategorizedItems.reduce((sum, wb) => sum + (wb.amountPaid || 0), 0),
        rollupCount: uncategorizedItems.length
      });
    }

    return categoryRoots.sort((a, b) => b.rollupTotal - a.rollupTotal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPaid, categories, categoryFilter, categoryFilterOptions]);

  const toggleExpanded = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleOpen = (workbook) => {
    onOpenWorkbook(workbook);
    onClose();
  };

  return (
    <div className={`spending-summary-panel ${isVisible ? 'show' : ''}`}>
      <div className="spending-summary-header">
        <h3>Spending Summary</h3>
        <button
          className="close-panel-button"
          onClick={onClose}
          aria-label="Close spending summary"
        >
          &times;
        </button>
      </div>

      <div className="spending-summary-panel-body">
        <div className="payment-quick-options spending-range-options">
          <button
            type="button"
            className={`payment-quick-button ${range === 'all' ? 'active' : ''}`}
            onClick={() => setRange('all')}
          >
            All Time
          </button>
          <button
            type="button"
            className={`payment-quick-button ${range === 'month' ? 'active' : ''}`}
            onClick={() => setRange('month')}
          >
            This Month
          </button>
          <button
            type="button"
            className={`payment-quick-button ${range === '30days' ? 'active' : ''}`}
            onClick={() => setRange('30days')}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            className={`payment-quick-button ${range === 'custom' ? 'active' : ''}`}
            onClick={() => setRange('custom')}
          >
            Custom
          </button>
        </div>
        {range === 'custom' && (
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

        <div className="spending-filter-row">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="dialog-input spending-filter-select"
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {categoryFilterOptions.map(opt => (
              <option key={opt.id} value={opt.id}>
                {'› '.repeat(opt.depth)}{opt.name}
              </option>
            ))}
            <option value={UNCATEGORIZED_ID}>Uncategorized</option>
          </select>
        </div>

        <div className="spending-summary-total">
          <div>
            <span className="spending-summary-total-label">Total Spent</span>
            <span className="spending-summary-total-value">{formatWithCommas(overallTotal)}</span>
          </div>
          <span className="spending-summary-total-count">
            {filteredPaid.length} paid workbook{filteredPaid.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="spending-summary-content">
          {roots.length > 0 ? (
            <ul className="spending-category-list">
              {roots.map(node => (
                <SpendingCategoryNode
                  key={node.id}
                  node={node}
                  parentTotal={overallTotal}
                  depth={0}
                  expandedIds={expandedIds}
                  onToggle={toggleExpanded}
                  onOpenWorkbook={handleOpen}
                  formatWithCommas={formatWithCommas}
                  autoExpand={roots.length === 1}
                />
              ))}
            </ul>
          ) : (
            <p className="no-spending-data">
              No paid expenses match these filters yet. Mark a workbook as paid to see it here.
            </p>
          )}
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

SpendingCategoryNode.propTypes = {
  node: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    directItems: PropTypes.array.isRequired,
    directTotal: PropTypes.number.isRequired,
    children: PropTypes.array.isRequired,
    rollupTotal: PropTypes.number.isRequired,
    rollupCount: PropTypes.number.isRequired
  }).isRequired,
  parentTotal: PropTypes.number.isRequired,
  depth: PropTypes.number.isRequired,
  expandedIds: PropTypes.instanceOf(Set).isRequired,
  onToggle: PropTypes.func.isRequired,
  onOpenWorkbook: PropTypes.func.isRequired,
  formatWithCommas: PropTypes.func.isRequired,
  autoExpand: PropTypes.bool.isRequired
};

SpendingSummaryPanel.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  workbooks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      isPaid: PropTypes.bool,
      amountPaid: PropTypes.number,
      paidAt: PropTypes.string,
      paidAtDisplay: PropTypes.string,
      categoryId: PropTypes.string
    })
  ).isRequired,
  categories: PropTypes.arrayOf(categoryShape).isRequired,
  onOpenWorkbook: PropTypes.func.isRequired,
  formatWithCommas: PropTypes.func.isRequired
};

export default SpendingSummaryPanel;
