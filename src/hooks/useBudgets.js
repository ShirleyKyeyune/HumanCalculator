import { useState, useEffect, useCallback } from 'react';
import { getDescendantIds } from './useCategories';
import { isWithinRange } from '../utils/dateRange';

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

/**
 * Compute what's been spent against a budget: paid workbooks that are
 * either explicitly attached, or fall under one of the budget's categories
 * (rolled up through all subcategory levels), within the budget's period.
 */
export const computeBudgetSpent = (budget, workbooks, categories) => {
  const scopeIds = new Set();
  (budget.categoryIds || []).forEach(catId => {
    getDescendantIds(categories, catId).forEach(id => scopeIds.add(id));
  });

  const matched = (workbooks || []).filter(wb => {
    if (!wb.isPaid) return false;
    if (!isWithinRange(wb.paidAt, budget.period, budget.customFrom, budget.customTo)) return false;

    const explicitlyIncluded = (budget.workbookIds || []).includes(wb.id);
    const categoryIncluded = wb.categoryId && scopeIds.has(wb.categoryId);
    return explicitlyIncluded || categoryIncluded;
  });

  const spent = matched.reduce((sum, wb) => sum + (wb.amountPaid || 0), 0);
  return { spent, count: matched.length, workbooks: matched };
};

export default useBudgets;
