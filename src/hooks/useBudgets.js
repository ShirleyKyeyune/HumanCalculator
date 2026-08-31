import { useState, useEffect, useCallback } from 'react';
import { getDescendantIds } from './useCategories';
import { isWithinRange } from '../utils/dateRange';
import { computeWorkbookTotal } from '../utils/workbookTotal';

const STORAGE_KEY = 'humanCalculatorBudgets';

/**
 * Custom hook for managing budgets.
 *
 * A budget is a named spending limit tracked against a scope: any
 * explicitly attached workbooks, plus any paid workbook whose category
 * falls under one of the attached categories (including all of that
 * category's subcategories, however deep). Stored offline in localStorage
 * today as plain JSON, ready to sync to a file-based backend later.
 */
function useBudgets() {
  const [budgets, setBudgets] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setBudgets(JSON.parse(stored));
    }
  }, []);

  const persist = useCallback((next) => {
    setBudgets(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addBudget = useCallback((data) => {
    const now = new Date();
    const budget = {
      id: `budget-${now.getTime()}`,
      name: data.name,
      amount: data.amount,
      period: data.period || 'all',
      customFrom: data.customFrom || '',
      customTo: data.customTo || '',
      categoryIds: data.categoryIds || [],
      workbookIds: data.workbookIds || [],
      createdAt: now.toISOString()
    };
    persist([...budgets, budget]);
    return budget;
  }, [budgets, persist]);

  const updateBudget = useCallback((id, data) => {
    persist(budgets.map(b => (b.id === id ? { ...b, ...data } : b)));
  }, [budgets, persist]);

  const deleteBudget = useCallback((id) => {
    persist(budgets.filter(b => b.id !== id));
  }, [budgets, persist]);

  /**
   * Un-attach a workbook from every budget - used after a workbook is
   * deleted so budgets don't keep a dangling reference.
   */
  const removeWorkbookFromBudgets = useCallback((workbookId) => {
    const next = budgets.map(b => ({
      ...b,
      workbookIds: b.workbookIds.filter(id => id !== workbookId)
    }));
    persist(next);
  }, [budgets, persist]);

  return { budgets, addBudget, updateBudget, deleteBudget, removeWorkbookFromBudgets };
}

/** This budget's scope: any category it tracks, plus all their subcategories. */
const getBudgetScopeIds = (budget, categories) => {
  const scopeIds = new Set();
  (budget.categoryIds || []).forEach(catId => {
    getDescendantIds(categories, catId).forEach(id => scopeIds.add(id));
  });
  return scopeIds;
};

/** Whether a workbook belongs to a budget - explicitly attached, or filed under its category scope. */
const isWorkbookInBudgetScope = (wb, budget, scopeIds) => {
  const explicitlyIncluded = (budget.workbookIds || []).includes(wb.id);
  const categoryIncluded = wb.categoryId && scopeIds.has(wb.categoryId);
  return explicitlyIncluded || categoryIncluded;
};

/**
 * Compute a budget's full picture: what's been spent (paid workbooks in
 * scope, within the budget's period), what's still pending (unpaid
 * workbooks in scope, valued at their calculated total), and what's left
 * available against the limit once both are accounted for.
 */
export const computeBudgetSpent = (budget, workbooks, categories) => {
  const scopeIds = getBudgetScopeIds(budget, categories);

  const paidMatched = (workbooks || []).filter(wb =>
    wb.isPaid &&
    isWithinRange(wb.paidAt, budget.period, budget.customFrom, budget.customTo) &&
    isWorkbookInBudgetScope(wb, budget, scopeIds)
  );

  // Unpaid items aren't tied to the period (they have no paid date yet) -
  // "pending" is everything currently unpaid and in scope, regardless of
  // when it might eventually be paid.
  const unpaidMatched = (workbooks || []).filter(wb =>
    !wb.isPaid && isWorkbookInBudgetScope(wb, budget, scopeIds)
  );

  const spent = paidMatched.reduce((sum, wb) => sum + (wb.amountPaid || 0), 0);
  const pending = unpaidMatched.reduce((sum, wb) => sum + computeWorkbookTotal(wb.content), 0);

  return {
    spent,
    count: paidMatched.length,
    workbooks: paidMatched,
    pending,
    pendingCount: unpaidMatched.length,
    pendingWorkbooks: unpaidMatched,
    availableBalance: budget.amount - spent - pending
  };
};

export default useBudgets;
