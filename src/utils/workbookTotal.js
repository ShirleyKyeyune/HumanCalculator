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
