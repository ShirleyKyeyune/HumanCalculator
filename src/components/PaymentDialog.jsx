import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import AmountInput from './AmountInput';
import CategoryPicker from './CategoryPicker';
import { computeWorkbookTotal } from '../utils/workbookTotal';

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
 * PaymentDialog Component
 *
 * Records a payment against a workbook: `amountPaid` is a running total of
 * every payment made so far, so this dialog always records an amount to
 * *add* on top of whatever's already been paid, rather than replacing it -
 * that's what makes a partial payment (e.g. "10K of the 50K labor cost")
 * correctly reduce the remaining balance instead of either being ignored or
 * flipping the whole workbook to fully paid. `isPaid` is derived and kept in
 * sync (`amountPaid >= total`) every time a payment is recorded.
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

  const alreadyPaid = Math.max(0, workbook?.amountPaid || 0);
  const remaining = Math.max(0, total - alreadyPaid);
  const hasExistingPayment = alreadyPaid > 0;

  const [amountMode, setAmountMode] = useState(remaining > 0 ? 'full' : 'other');
  const [customAmount, setCustomAmount] = useState('');
  const [note, setNote] = useState('');

  const [dateMode, setDateMode] = useState('now');
  const [timeValue, setTimeValue] = useState(toTimeInputValue(new Date()));
  const [customDateTime, setCustomDateTime] = useState(toDateTimeInputValue(new Date()));

  const [categoryId, setCategoryId] = useState(workbook?.categoryId || null);

  if (!isVisible || !workbook) return null;

  const computeNewPaymentAmount = () => {
    if (amountMode === 'full') return remaining;
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

  const handleRecordPayment = () => {
    const paidAt = computePaidAt();
    const newPaymentAmount = computeNewPaymentAmount();
    const newAmountPaid = alreadyPaid + newPaymentAmount;
    const trimmedNote = note.trim();

    const paymentEntry = {
      amount: newPaymentAmount,
      note: trimmedNote || null,
      paidAt: paidAt.toISOString(),
      paidAtDisplay: formatDateTimeForDisplay(paidAt)
    };

    onSave(workbook.id, {
      isPaid: newAmountPaid >= total,
      amountPaid: newAmountPaid,
      paidAt: paidAt.toISOString(),
      paidAtDisplay: formatDateTimeForDisplay(paidAt),
      payments: [...(workbook.payments || []), paymentEntry],
      categoryId
    });
    onClose();
  };

  const handleResetPayments = () => {
    onSave(workbook.id, {
      isPaid: false,
      amountPaid: null,
      paidAt: null,
      paidAtDisplay: null,
      payments: []
    });
    onClose();
  };

  const title = !hasExistingPayment
    ? 'Mark as Paid'
    : remaining > 0
      ? 'Record Payment'
      : 'Edit Payment';

  return (
    <div className="dialog-overlay">
      <div className="dialog payment-dialog">
        <div className="dialog-header">
          <h3>{title}</h3>
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

        {hasExistingPayment && (
          <div className="payment-dialog-balance">
            <span>Total: {formatWithCommas(total)}</span>
            <span>Already paid: {formatWithCommas(alreadyPaid)}</span>
            <span className={remaining > 0 ? 'payment-dialog-balance-owing' : 'payment-dialog-balance-clear'}>
              {remaining > 0 ? `Remaining: ${formatWithCommas(remaining)}` : 'Fully paid'}
            </span>
          </div>
        )}

        <div className="dialog-content">
          <label className="payment-section-label">
            {hasExistingPayment ? 'New Payment Amount' : 'Amount Paid'}
          </label>
          <div className="payment-quick-options">
            {remaining > 0 && (
              <button
                type="button"
                className={`payment-quick-button ${amountMode === 'full' ? 'active' : ''}`}
                onClick={() => setAmountMode('full')}
              >
                {hasExistingPayment ? `Remaining Balance (${formatWithCommas(remaining)})` : `Full Amount (${formatWithCommas(total)})`}
              </button>
            )}
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

          <label className="payment-section-label">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. labor, deposit, first installment..."
            className="dialog-input"
          />

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
          {hasExistingPayment && (
            <button onClick={handleResetPayments} className="dialog-button remove-payment">
              Reset Payments
            </button>
          )}
          <button onClick={onClose} className="dialog-button cancel">
            Cancel
          </button>
          <button onClick={handleRecordPayment} className="dialog-button save">
            {hasExistingPayment ? 'Record Payment' : 'Mark as Paid'}
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
