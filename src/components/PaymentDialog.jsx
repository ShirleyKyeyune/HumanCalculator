import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import calculatorService from '../services/calculatorService';
import AmountInput from './AmountInput';
import CategoryPicker from './CategoryPicker';

const pad = (n) => String(n).padStart(2, '0');

const toTimeInputValue = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const toDateTimeInputValue = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${toTimeInputValue(date)}`;

const formatDateTimeForDisplay = (date) =>
  date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

/**
 * Compute the total value of a workbook's content, independent of whichever
 * workbook is currently loaded in the editor.
 */
const computeWorkbookTotal = (content) => {
  if (!content || !content.trim()) return 0;
  try {
    const processedLines = calculatorService.processInput(content);
    return processedLines.reduce((sum, line) => sum + (line.value || 0), 0);
  } catch (error) {
    console.error('Error computing workbook total:', error);
    return 0;
  }
};

/**
 * PaymentDialog Component
 *
 * Lets the user mark a workbook as paid: pick a quick or custom amount,
 * assign a category/subcategory (creating new ones inline), and capture
 * when it was paid via quick date/time options.
 */
function PaymentDialog({
  isVisible,
  onClose,
  workbook,
  categories,
  onAddCategory,
  onSave,
  formatWithCommas
}) {
  const total = useMemo(
    () => (workbook ? computeWorkbookTotal(workbook.content) : 0),
    [workbook]
  );

  const wasAlreadyPaid = !!workbook?.isPaid;

  const [amountMode, setAmountMode] = useState(
    wasAlreadyPaid && workbook.amountPaid !== total ? 'other' : 'full'
  );
  const [customAmount, setCustomAmount] = useState(
    wasAlreadyPaid ? String(workbook.amountPaid ?? '') : ''
  );

  const [dateMode, setDateMode] = useState(wasAlreadyPaid ? 'custom' : 'now');
  const [timeValue, setTimeValue] = useState(toTimeInputValue(new Date()));
  const [customDateTime, setCustomDateTime] = useState(
    toDateTimeInputValue(wasAlreadyPaid && workbook.paidAt ? new Date(workbook.paidAt) : new Date())
  );

  const [categoryId, setCategoryId] = useState(workbook?.categoryId || null);

  if (!isVisible || !workbook) return null;

  const computeAmount = () => {
    if (amountMode === 'full') return total;
    const parsed = parseFloat(customAmount);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const computePaidAt = () => {
    if (dateMode === 'now') return new Date();
    if (dateMode === 'today') {
      const [hh, mm] = timeValue.split(':').map(Number);
      const d = new Date();
      d.setHours(hh || 0, mm || 0, 0, 0);
      return d;
    }
    return customDateTime ? new Date(customDateTime) : new Date();
  };

  const handleMarkPaid = () => {
    const paidAt = computePaidAt();

    onSave(workbook.id, {
      isPaid: true,
      amountPaid: computeAmount(),
      paidAt: paidAt.toISOString(),
      paidAtDisplay: formatDateTimeForDisplay(paidAt),
      categoryId
    });
    onClose();
  };

  const handleRemovePayment = () => {
    onSave(workbook.id, {
      isPaid: false,
      amountPaid: null,
      paidAt: null,
      paidAtDisplay: null
    });
    onClose();
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog payment-dialog">
        <h3>{wasAlreadyPaid ? 'Edit Payment' : 'Mark as Paid'}</h3>
        <p className="payment-dialog-workbook-name">{workbook.name}</p>

        <div className="dialog-content">
          <label className="payment-section-label">Amount Paid</label>
          <div className="payment-quick-options">
            <button
              type="button"
              className={`payment-quick-button ${amountMode === 'full' ? 'active' : ''}`}
              onClick={() => setAmountMode('full')}
            >
              Full Amount ({formatWithCommas(total)})
            </button>
            <button
              type="button"
              className={`payment-quick-button ${amountMode === 'other' ? 'active' : ''}`}
              onClick={() => setAmountMode('other')}
            >
              Other
            </button>
          </div>
          {amountMode === 'other' && (
            <AmountInput
              value={customAmount}
              onChange={setCustomAmount}
              placeholder="Enter amount paid"
              className="dialog-input"
              autoFocus
            />
          )}

          <label className="payment-section-label">Category</label>
          <CategoryPicker
            categories={categories}
            initialCategoryId={workbook.categoryId}
            onChange={setCategoryId}
            onAddCategory={onAddCategory}
          />

          <label className="payment-section-label">Paid</label>
          <div className="payment-quick-options">
            <button
              type="button"
              className={`payment-quick-button ${dateMode === 'now' ? 'active' : ''}`}
              onClick={() => setDateMode('now')}
            >
              Now
            </button>
            <button
              type="button"
              className={`payment-quick-button ${dateMode === 'today' ? 'active' : ''}`}
              onClick={() => setDateMode('today')}
            >
              Today at
            </button>
            <button
              type="button"
              className={`payment-quick-button ${dateMode === 'custom' ? 'active' : ''}`}
              onClick={() => setDateMode('custom')}
            >
              Custom
            </button>
          </div>
          {dateMode === 'today' && (
            <input
              type="time"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              className="dialog-input"
            />
          )}
          {dateMode === 'custom' && (
            <input
              type="datetime-local"
              value={customDateTime}
              onChange={(e) => setCustomDateTime(e.target.value)}
              className="dialog-input"
            />
          )}
        </div>

        <div className="dialog-buttons payment-dialog-buttons">
          {wasAlreadyPaid && (
            <button onClick={handleRemovePayment} className="dialog-button remove-payment">
              Remove Payment
            </button>
          )}
          <button onClick={onClose} className="dialog-button cancel">
            Cancel
          </button>
          <button onClick={handleMarkPaid} className="dialog-button save">
            {wasAlreadyPaid ? 'Save Changes' : 'Mark as Paid'}
          </button>
        </div>
      </div>
    </div>
  );
}

PaymentDialog.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  workbook: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    content: PropTypes.string,
    isPaid: PropTypes.bool,
    amountPaid: PropTypes.number,
    paidAt: PropTypes.string,
    categoryId: PropTypes.string
  }),
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      parentId: PropTypes.string
    })
  ).isRequired,
  onAddCategory: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  formatWithCommas: PropTypes.func.isRequired
};

export default PaymentDialog;
