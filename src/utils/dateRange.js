/**
 * Whether a paid-at timestamp falls within a quick date range selection.
 * Shared by any feature that filters paid workbooks by period (spending
 * summary, budgets, ...).
 *
 * @param {string} paidAt - ISO timestamp
 * @param {'all'|'month'|'30days'|'custom'} range
 * @param {string} customFrom - yyyy-mm-dd, only used when range === 'custom'
 * @param {string} customTo - yyyy-mm-dd, only used when range === 'custom'
 */
export const isWithinRange = (paidAt, range, customFrom, customTo) => {
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
