import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'humanCalculatorCategories';

// Category tree depth is capped at 6 levels total: a root category plus up
// to 5 levels of child categories below it.
export const MAX_DEPTH = 6;

const DEFAULT_CATEGORIES = [
  { id: 'cat-groceries', name: 'Groceries', parentId: null },
  { id: 'cat-transport', name: 'Transport', parentId: null },
  { id: 'cat-utilities', name: 'Utilities', parentId: null },
  { id: 'cat-rent', name: 'Rent', parentId: null },
  { id: 'cat-entertainment', name: 'Entertainment', parentId: null },
  { id: 'cat-other', name: 'Other', parentId: null },
];

/**
 * Convert the old { id, name, subcategories: [{id, name}] } shape (2 levels
 * only) into the flat { id, name, parentId } shape used now, so existing
 * localStorage data keeps working after this upgrade.
 */
const migrateLegacyShape = (stored) => {
  if (!Array.isArray(stored)) return [];
  const isLegacy = stored.some(c => Array.isArray(c.subcategories));
  if (!isLegacy) return stored;

  const flat = [];
  stored.forEach(cat => {
    flat.push({ id: cat.id, name: cat.name, parentId: null });
    (cat.subcategories || []).forEach(sub => {
      flat.push({ id: sub.id, name: sub.name, parentId: cat.id });
    });
  });
  return flat;
};

/** Direct children of a node (parentId === null for root categories). */
export const getChildren = (categories, parentId) =>
  categories.filter(c => (c.parentId || null) === (parentId || null));

/** 0-indexed depth of a node: root categories are depth 0. */
export const getDepth = (categories, id) => {
  const byId = new Map(categories.map(c => [c.id, c]));
  let depth = 0;
  let currentId = id;
  while (currentId && byId.has(currentId) && byId.get(currentId).parentId) {
    depth += 1;
    currentId = byId.get(currentId).parentId;
  }
  return depth;
};

/** Path from the root category down to (and including) this node. */
export const getPath = (categories, id) => {
  const byId = new Map(categories.map(c => [c.id, c]));
  const path = [];
  let currentId = id;
  while (currentId && byId.has(currentId)) {
    const node = byId.get(currentId);
    path.unshift(node);
    currentId = node.parentId;
  }
  return path;
};

/** This node's id plus every descendant id (for cascade delete). */
export const getDescendantIds = (categories, id) => {
  const ids = [id];
  const queue = [id];
  while (queue.length) {
    const parentId = queue.shift();
    getChildren(categories, parentId).forEach(child => {
      ids.push(child.id);
      queue.push(child.id);
    });
  }
  return ids;
};

/** Flatten the category tree into an indented list (depth-first, root to leaves). */
export const flattenTree = (categories, parentId = null, depth = 0) =>
  getChildren(categories, parentId).flatMap(c => [
    { id: c.id, name: c.name, depth },
    ...flattenTree(categories, c.id, depth + 1)
  ]);

/**
 * Custom hook for managing expense categories as a tree (up to MAX_DEPTH
 * levels deep), with add/rename/delete support.
 *
 * Categories are stored offline in localStorage today; the shape is kept as
 * a plain, flat JSON list so it can be synced to Google Drive (or any
 * file-based backend) later without a data migration.
 */
function useCategories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const migrated = migrateLegacyShape(JSON.parse(stored));
      setCategories(migrated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
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
   * Add a new category (optionally under a parent), or return the existing
   * sibling if the name already exists under that parent (case-insensitive).
   * Returns null if the parent is already at the maximum depth.
   */
  const addCategory = useCallback((name, parentId = null) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return null;

    if (parentId) {
      const parentDepth = getDepth(categories, parentId);
      if (parentDepth >= MAX_DEPTH - 1) return null;
    }

    const siblings = getChildren(categories, parentId);
    const existing = siblings.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const newCategory = { id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: trimmed, parentId: parentId || null };
    persist([...categories, newCategory]);
    return newCategory;
  }, [categories, persist]);

  /** Rename a category in place. */
  const renameCategory = useCallback((id, name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return false;
    persist(categories.map(c => (c.id === id ? { ...c, name: trimmed } : c)));
    return true;
  }, [categories, persist]);

  /**
   * Delete a category and all of its descendants.
   * @returns {string[]} ids of every category removed (this node + descendants)
   */
  const deleteCategory = useCallback((id) => {
    const removedIds = getDescendantIds(categories, id);
    persist(categories.filter(c => !removedIds.includes(c.id)));
    return removedIds;
  }, [categories, persist]);

  return { categories, addCategory, renameCategory, deleteCategory };
}

export default useCategories;
