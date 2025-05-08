import React from 'react';
import PropTypes from 'prop-types';

/**
 * HistoryPanel Component
 *
 * A collapsible panel that displays calculation history with options to:
 * - View previous calculations
 * - Load a selected calculation into the workbook
 * - Delete history items
 * - Save current calculation to history
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isVisible - Whether the panel is currently visible
 * @param {Function} props.onClose - Function to call when closing the panel
 * @param {Array} props.history - Array of history items
 * @param {Function} props.onLoadHistory - Function to call when loading a history item
 * @param {Function} props.onDeleteHistory - Function to call when deleting a history item
 * @param {Function} props.onSaveHistory - Function to call when saving current calculation
 * @param {Function} props.formatWithCommas - Function to format numbers with commas
 * @returns {JSX.Element} The history panel component
 */
function HistoryPanel({
  isVisible,
  onClose,
  history,
  onLoadHistory,
  onDeleteHistory,
  onSaveHistory,
  formatWithCommas
}) {
  // The displayDate is already formatted in the parent component

  return (
    <div className={`history-panel ${isVisible ? 'show' : ''}`}>
      <div className="history-panel-header">
        <h3>Calculation History</h3>
        <button
          className="close-panel-button"
          onClick={onClose}
          aria-label="Close history panel"
        >
          &times;
        </button>
      </div>
      <div className="history-panel-content">
        {history.length > 0 ? (
          <ul className="history-list">
            {history.map(item => (
              <li key={item.id} className="history-item">
                <div className="history-item-content" onClick={() => onLoadHistory(item)}>
                  <div className="history-item-preview">
                    {item.content.split('\n').slice(0, 2).map((line, i) => (
                      <div key={i} className="history-item-line">{line}</div>
                    ))}
                    {item.content.split('\n').length > 2 && <div className="history-item-more">...</div>}
                  </div>
                  <div className="history-item-info">
                    <span className="history-item-total">{formatWithCommas(item.total)}</span>
                    <span className="history-item-date">{item.displayDate}</span>
                  </div>
                </div>
                <button
                  className="history-delete-button"
                  onClick={() => onDeleteHistory(item.id)}
                  aria-label="Delete from history"
                >
                  <span className="delete-icon">&times;</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-history">No calculation history found.</p>
        )}
      </div>
      <button
        className="save-to-history-button"
        onClick={onSaveHistory}
      >
        Save Current Calculation
      </button>
    </div>
  );
}

HistoryPanel.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  history: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
      total: PropTypes.number.isRequired,
      date: PropTypes.string.isRequired,
      displayDate: PropTypes.string.isRequired
    })
  ).isRequired,
  onLoadHistory: PropTypes.func.isRequired,
  onDeleteHistory: PropTypes.func.isRequired,
  onSaveHistory: PropTypes.func.isRequired,
  formatWithCommas: PropTypes.func.isRequired
};

export default HistoryPanel;
