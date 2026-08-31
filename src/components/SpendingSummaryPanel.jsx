import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

const UNCATEGORIZED_ID = '__uncategorized__';
const NO_SUBCATEGORY_ID = '__none__';

/**
 * Whether a paid-at timestamp falls within the selected date range.
 */
const isWithinRange = (paidAt, range, customFrom, customTo) => {
  if (!paidAt) return false;
  const date = new Date(paidAt);

  if (range === 'month') {
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }

  if (range === '30days') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return date >= cutoff;
  }

  if (range === 'custom') {
    if (customFrom && date < new Date(customFrom)) return false;
    if (customTo) {
      const to = new Date(customTo);
      to.setHours(23, 59, 59, 999);
      if (date > to) return false;
    }
    return true;
  }

  return true; // 'all'
};

const sortByName = (a, b) => a.name.localeCompare(b.name);

/**
 * SpendingSummaryPanel Component
 *
 * A "look back" report + browser: filter paid workbooks by period, category
 * and subcategory, see subtotals and a grand total, and drill into the
 * actual workbooks behind each number to open them. Data stays local
 * (localStorage) today; this reads the same flat workbook records that will
 * sync via Google Drive later.
 */
function SpendingSummaryPanel({ isVisible, onClose, workbooks, onOpenWorkbook, formatWithCommas }) {
  const [range, setRange] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState('all');
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);

  // Reset the category/subcategory filter whenever the period changes, since
  // a previously selected category may no longer have any items in it.
  useEffect(() => {
    setCategoryFilter('all');
    setSubcategoryFilter('all');
  }, [range]);

  const periodPaid = useMemo(
    () => (workbooks || []).filter(wb => wb.isPaid && isWithinRange(wb.paidAt, range, customFrom, customTo)),
    [workbooks, range, customFrom, customTo]
  );

  const categoryOptions = useMemo(() => {
    const map = new Map();
    periodPaid.forEach(wb => {
      const id = wb.categoryId || UNCATEGORIZED_ID;
      const name = wb.category || 'Uncategorized';
      if (!map.has(id)) map.set(id, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort(sortByName);
  }, [periodPaid]);

  const subcategoryOptions = useMemo(() => {
    if (categoryFilter === 'all') return [];
    const map = new Map();
    periodPaid
      .filter(wb => (wb.categoryId || UNCATEGORIZED_ID) === categoryFilter)
      .forEach(wb => {
        const id = wb.subcategoryId || NO_SUBCATEGORY_ID;
        const name = wb.subcategory || 'No subcategory';
        if (!map.has(id)) map.set(id, name);
      });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort(sortByName);
  }, [periodPaid, categoryFilter]);

  const filteredPaid = useMemo(() => {
    return periodPaid.filter(wb => {
      const catId = wb.categoryId || UNCATEGORIZED_ID;
      if (categoryFilter !== 'all' && catId !== categoryFilter) return false;
      if (categoryFilter !== 'all' && subcategoryFilter !== 'all') {
        const subId = wb.subcategoryId || NO_SUBCATEGORY_ID;
        if (subId !== subcategoryFilter) return false;
      }
      return true;
    });
  }, [periodPaid, categoryFilter, subcategoryFilter]);

  const { groups, overallTotal } = useMemo(() => {
    const categoryMap = new Map();
    let total = 0;

    filteredPaid.forEach(wb => {
      const amount = wb.amountPaid || 0;
      total += amount;

      const catKey = wb.categoryId || UNCATEGORIZED_ID;
      const catName = wb.category || 'Uncategorized';
      if (!categoryMap.has(catKey)) {
        categoryMap.set(catKey, { id: catKey, name: catName, total: 0, count: 0, subcategories: new Map() });
      }
      const catEntry = categoryMap.get(catKey);
      catEntry.total += amount;
      catEntry.count += 1;

      const subKey = wb.subcategoryId || NO_SUBCATEGORY_ID;
      const subName = wb.subcategory || 'No subcategory';
      if (!catEntry.subcategories.has(subKey)) {
        catEntry.subcategories.set(subKey, { id: subKey, name: subName, total: 0, count: 0, items: [] });
      }
      const subEntry = catEntry.subcategories.get(subKey);
      subEntry.total += amount;
      subEntry.count += 1;
      subEntry.items.push(wb);
    });

    const groupsResult = Array.from(categoryMap.values())
      .map(cat => ({
        ...cat,
        subcategories: Array.from(cat.subcategories.values())
          .map(sub => ({
            ...sub,
            items: sub.items.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))
          }))
          .sort((a, b) => b.total - a.total)
      }))
      .sort((a, b) => b.total - a.total);

    return { groups: groupsResult, overallTotal: total };
  }, [filteredPaid]);

  if (!isVisible) return null;

  const toggleExpanded = (id) => {
    setExpandedCategoryId(prev => (prev === id ? null : id));
  };

  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
    setSubcategoryFilter('all');
  };

  const handleOpen = (workbook) => {
    onOpenWorkbook(workbook);
    onClose();
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog spending-summary-dialog">
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
            onChange={handleCategoryFilterChange}
            className="dialog-input spending-filter-select"
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {categoryOptions.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {categoryFilter !== 'all' && (
            <select
              value={subcategoryFilter}
              onChange={(e) => setSubcategoryFilter(e.target.value)}
              className="dialog-input spending-filter-select"
              aria-label="Filter by subcategory"
            >
              <option value="all">All Subcategories</option>
              {subcategoryOptions.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
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
          {groups.length > 0 ? (
            <ul className="spending-category-list">
              {groups.map(cat => {
                const pct = overallTotal > 0 ? (cat.total / overallTotal) * 100 : 0;
                const isExpanded = expandedCategoryId === cat.id || groups.length === 1;

                return (
                  <li key={cat.id} className="spending-category-item">
                    <button
                      type="button"
                      className="spending-category-header"
                      onClick={() => toggleExpanded(cat.id)}
                      aria-expanded={isExpanded}
                    >
                      <span className="spending-category-name">
                        <span className={`spending-expand-caret ${isExpanded ? 'expanded' : ''}`}>&#9656;</span>
                        {cat.name}
                      </span>
                      <span className="spending-category-total">{formatWithCommas(cat.total)}</span>
                    </button>
                    <div className="spending-category-bar-track">
                      <div className="spending-category-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="spending-category-meta">
                      <span>{cat.count} paid item{cat.count === 1 ? '' : 's'}</span>
                      <span>{pct.toFixed(1)}%</span>
                    </div>

                    {isExpanded && (
                      <div className="spending-subcategory-groups">
                        {cat.subcategories.map(sub => {
                          const subPct = cat.total > 0 ? (sub.total / cat.total) * 100 : 0;
                          return (
                            <div key={sub.id} className="spending-subcategory-group">
                              <div className="spending-subcategory-row">
                                <span className="spending-subcategory-name">{sub.name}</span>
                                <span className="spending-subcategory-total">{formatWithCommas(sub.total)}</span>
                              </div>
                              <div className="spending-category-bar-track subcategory">
                                <div className="spending-category-bar-fill subcategory" style={{ width: `${subPct}%` }} />
                              </div>
                              <ul className="spending-workbook-list">
                                {sub.items.map(wb => (
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
                                      onClick={() => handleOpen(wb)}
                                    >
                                      Open
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="no-spending-data">
              No paid expenses match these filters yet. Mark a workbook as paid to see it here.
            </p>
          )}
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
      category: PropTypes.string,
      categoryId: PropTypes.string,
      subcategory: PropTypes.string,
      subcategoryId: PropTypes.string
    })
  ).isRequired,
  onOpenWorkbook: PropTypes.func.isRequired,
  formatWithCommas: PropTypes.func.isRequired
};

export default SpendingSummaryPanel;
