import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'humanCalculatorCategories';

const DEFAULT_CATEGORIES = [
  { id: 'cat-groceries', name: 'Groceries', subcategories: [] },
  { id: 'cat-transport', name: 'Transport', subcategories: [] },
  { id: 'cat-utilities', name: 'Utilities', subcategories: [] },
  { id: 'cat-rent', name: 'Rent', subcategories: [] },
  { id: 'cat-entertainment', name: 'Entertainment', subcategories: [] },
  { id: 'cat-other', name: 'Other', subcategories: [] },
];

/**
 * Custom hook for managing expense categories and subcategories.
 *
 * Categories are stored offline in localStorage today; the shape is kept as
 * plain, flat JSON so it can be synced to Google Drive (or any file-based
 * backend) later without a data migration.
 */
function useCategories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setCategories(JSON.parse(stored));
    } else {
      setCategories(DEFAULT_CATEGORIES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
    }
  }, []);

  const persist = useCallback((next) => {
    setCategories(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  /**
   * Add a new category, or return the existing one if the name already exists
   * (case-insensitive) so we never end up with accidental duplicates.
   */
  const addCategory = useCallback((name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return null;

    const existing = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const newCategory = { id: `cat-${Date.now()}`, name: trimmed, subcategories: [] };
    persist([...categories, newCategory]);
    return newCategory;
  }, [categories, persist]);

  /**
   * Add a new subcategory under a category, or return the existing one if a
   * subcategory with that name already exists under the same category.
   */
  const addSubcategory = useCallback((categoryId, name) => {
    const trimmed = (name || '').trim();
    if (!trimmed || !categoryId) return null;

    let result = null;
    const next = categories.map(cat => {
      if (cat.id !== categoryId) return cat;

      const existing = cat.subcategories.find(s => s.name.toLowerCase() === trimmed.toLowerCase());
      if (existing) {
        result = existing;
        return cat;
      }

      const newSubcategory = { id: `sub-${Date.now()}`, name: trimmed };
      result = newSubcategory;
      return { ...cat, subcategories: [...cat.subcategories, newSubcategory] };
    });

    persist(next);
    return result;
  }, [categories, persist]);

  return { categories, addCategory, addSubcategory };
}

export default useCategories;
