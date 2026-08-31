import calculatorService from '../services/calculatorService';

/**
 * Compute the total value of a workbook's content, independent of whichever
 * workbook is currently loaded in the editor. Used both to show what a
 * workbook is worth before it's marked paid, and to total up unpaid
 * ("pending") workbooks attached to a budget.
 */
export const computeWorkbookTotal = (content) => {
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
 * A workbook's payment status: `amountPaid` is a running total of every
 * payment recorded against it (see PaymentDialog), which can land anywhere
 * between nothing paid and the full amount - so a workbook is "unpaid",
 * "partial" (something paid, balance still owed), or "paid" (balance fully
 * covered), never just a binary paid/unpaid split. `isPaid` is kept in sync
 * with this (`amountPaid >= total`) wherever a payment is recorded, but the
 * three-way status here is always derived fresh from the numbers rather
 * than trusted as a separate flag, so it can't drift out of sync.
 */
export const getPaymentStatus = (workbook) => {
  const total = computeWorkbookTotal(workbook.content);
  const paid = Math.max(0, workbook.amountPaid || 0);
  const remaining = Math.max(0, total - paid);
  const status = paid <= 0 ? 'unpaid' : remaining <= 0 ? 'paid' : 'partial';
  return { total, paid, remaining, status };
};
