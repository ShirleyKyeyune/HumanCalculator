import React, { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { getPaymentStatus } from '../utils/workbookTotal';

/**
 * A read-only preview of a workbook's content, layered on top of whichever
 * panel triggered it (Budget Detail, Category Manager). Deliberately kept
 * dropdown-like rather than a full modal: no dimming backdrop, and it
 * dismisses on any click/touch outside itself - so peeking at a workbook
 * doesn't feel heavier than opening any other menu in these panels.
 */
function WorkbookQuickView({ workbook, formatWithCommas, onClose, onOpenFull }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) onClose();
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const { paid, remaining, status } = useMemo(() => getPaymentStatus(workbook), [workbook]);

  return (
    <div className="workbook-quick-view-layer">
      <div className="workbook-quick-view" ref={cardRef}>
        <div className="workbook-quick-view-header">
          <h4>{workbook.name}</h4>
          <button
            type="button"
            className="close-panel-button"
            onClick={onClose}
            aria-label="Close quick view"
          >
            &times;
          </button>
        </div>
        <div className="workbook-quick-view-meta">
          <span>{workbook.paidAtDisplay || workbook.displayDate}</span>
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
        </div>
        <pre className="workbook-quick-view-content">{workbook.content || '(empty)'}</pre>
        <div className="dialog-buttons">
          <button type="button" className="dialog-button cancel" onClick={onClose}>
            Close
          </button>
          {onOpenFull && (
            <button type="button" className="dialog-button save" onClick={onOpenFull}>
              Open
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

WorkbookQuickView.propTypes = {
  workbook: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    content: PropTypes.string,
    displayDate: PropTypes.string,
    isPaid: PropTypes.bool,
    amountPaid: PropTypes.number,
    paidAtDisplay: PropTypes.string
  }).isRequired,
  formatWithCommas: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onOpenFull: PropTypes.func
};

export default WorkbookQuickView;
