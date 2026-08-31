import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getPath } from '../hooks/useCategories';

/**
 * SearchPanel Component
 *
 * A collapsible panel that lets the user search across saved workbooks and
 * calculation history by name or content, preview a matching item inline,
 * and open it into the calculator.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isVisible - Whether the panel is currently visible
 * @param {Function} props.onClose - Function to call when closing the panel
 * @param {Array} props.workbooks - Array of saved workbooks
 * @param {Array} props.history - Array of history items
 * @param {Function} props.onOpenWorkbook - Function to call to open a workbook
 * @param {Function} props.onOpenHistory - Function to call to open a history item
 * @param {Function} props.formatWithCommas - Function to format numbers with commas
 * @returns {JSX.Element} The search panel component
 */
function SearchPanel({
  isVisible,
  onClose,
  workbooks,
  history,
  categories,
  onOpenWorkbook,
  onOpenHistory,
  onMarkPaid,
  formatWithCommas
}) {
  const [query, setQuery] = useState('');
  const [expandedKey, setExpandedKey] = useState(null);

  const getCategoryLabel = (categoryId) => {
    if (!categoryId) return null;
    const path = getPath(categories, categoryId);
    return path.length > 0 ? path.map(node => node.name).join(' › ') : null;
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    const workbookResults = (workbooks || []).map(wb => ({
      key: `workbook-${wb.id}`,
      type: 'workbook',
      title: wb.name || 'Untitled workbook',
      content: wb.content || '',
      total: null,
      date: wb.date,
      displayDate: wb.displayDate,
      raw: wb
    }));

    const historyResults = (history || []).map(item => ({
      key: `history-${item.id}`,
      type: 'history',
      title: 'Calculation',
      content: item.content || '',
      total: item.total,
      date: item.date,
      displayDate: item.displayDate,
      raw: item
    }));

    const combined = [...workbookResults, ...historyResults];

    const filtered = q
      ? combined.filter(r =>
          r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q)
        )
      : combined;

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [query, workbooks, history]);

  // Pull out the line that matched the query (plus a little context) so the
  // preview shows *why* an item matched, not just its first lines.
  const getSnippetLines = (content, q) => {
    const lines = content.split('\n');
    if (!q) return lines.slice(0, 2);

    const matchIdx = lines.findIndex(line => line.toLowerCase().includes(q));
    if (matchIdx === -1) return lines.slice(0, 2);

    const start = Math.max(0, matchIdx - 1);
    return lines.slice(start, start + 3);
  };

  const highlightMatch = (line, q) => {
    if (!q) return line;
    const idx = line.toLowerCase().indexOf(q);
    if (idx === -1) return line;
    return (
      <>
        {line.slice(0, idx)}
        <mark className="search-match-highlight">{line.slice(idx, idx + q.length)}</mark>
        {line.slice(idx + q.length)}
      </>
    );
  };

  const toggleExpanded = (key) => {
    setExpandedKey(prev => (prev === key ? null : key));
  };

  const handleOpen = (result) => {
    if (result.type === 'workbook') {
      onOpenWorkbook(result.raw);
    } else {
      onOpenHistory(result.raw);
    }
    onClose();
  };

  const q = query.trim().toLowerCase();

  return (
    <div className={`search-panel ${isVisible ? 'show' : ''}`}>
      <div className="search-panel-header">
        <h3>Search Workbooks &amp; History</h3>
        <button
          className="close-panel-button"
          onClick={onClose}
          aria-label="Close search panel"
        >
          &times;
        </button>
      </div>
      <div className="search-panel-input-wrap">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or content..."
          className="search-panel-input"
          aria-label="Search saved workbooks and history"
          autoFocus
        />
      </div>
      <div className="search-panel-content">
        {results.length > 0 ? (
          <ul className="search-result-list">
            {results.map(result => {
              const isExpanded = expandedKey === result.key;
              const snippetLines = getSnippetLines(result.content, q);

              return (
                <li key={result.key} className="search-result-item">
                  <div className="search-result-header">
                    <span className={`search-result-type-badge ${result.type}`}>
                      {result.type === 'workbook' ? 'Workbook' : 'History'}
                    </span>
                    <span className="search-result-title">{result.title}</span>
                  </div>
                  <div className="search-result-preview">
                    {(isExpanded ? result.content.split('\n') : snippetLines).map((line, i) => (
                      <div key={i} className="search-result-line">
                        {highlightMatch(line, q)}
                      </div>
                    ))}
                    {!isExpanded && result.content.split('\n').length > snippetLines.length && (
                      <div className="search-result-more">...</div>
                    )}
                  </div>
                  <div className="search-result-info">
                    {result.total !== null && (
                      <span className="search-result-total">{formatWithCommas(result.total)}</span>
                    )}
                    <span className="search-result-date">{result.displayDate}</span>
                  </div>
                  {result.type === 'workbook' && (
                    <div className="search-result-payment-status">
                      {result.raw.isPaid ? (
                        <span className="workbook-paid-badge paid">
                          Paid {formatWithCommas(result.raw.amountPaid || 0)}
                        </span>
                      ) : (
                        <span className="workbook-paid-badge unpaid">Unpaid</span>
                      )}
                      {getCategoryLabel(result.raw.categoryId) && (
                        <span className="workbook-category-tag">
                          {getCategoryLabel(result.raw.categoryId)}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="search-result-actions">
                    <button
                      className="search-result-action-button preview"
                      onClick={() => toggleExpanded(result.key)}
                    >
                      {isExpanded ? 'Hide' : 'Preview'}
                    </button>
                    {result.type === 'workbook' && (
                      <button
                        className="search-result-action-button mark-paid"
                        onClick={() => onMarkPaid(result.raw)}
                      >
                        {result.raw.isPaid ? 'Edit Payment' : 'Mark Paid'}
                      </button>
                    )}
                    <button
                      className="search-result-action-button open"
                      onClick={() => handleOpen(result)}
                    >
                      Open
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="no-search-results">
            {query.trim() ? 'No matching workbooks or history found.' : 'No saved workbooks or history found.'}
          </p>
        )}
      </div>
    </div>
  );
}

SearchPanel.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  workbooks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      content: PropTypes.string,
      date: PropTypes.string,
      displayDate: PropTypes.string
    })
  ).isRequired,
  history: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      content: PropTypes.string,
      total: PropTypes.number,
      date: PropTypes.string,
      displayDate: PropTypes.string
    })
  ).isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      parentId: PropTypes.string
    })
  ).isRequired,
  onOpenWorkbook: PropTypes.func.isRequired,
  onOpenHistory: PropTypes.func.isRequired,
  onMarkPaid: PropTypes.func.isRequired,
  formatWithCommas: PropTypes.func.isRequired
};

// Memoized: this panel stays mounted for its slide-in/out animation even
// while closed, so it must skip re-rendering when unrelated state changes
// elsewhere in the app (e.g. every keystroke in the calculator textarea).
export default React.memo(SearchPanel);
