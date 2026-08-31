import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing workbooks with auto-save and duplicate prevention
 * 
 * This hook encapsulates all workbook management logic including:
 * - Loading saved workbooks from localStorage
 * - Saving workbooks with duplicate prevention
 * - Auto-saving workbooks when content changes
 * - Creating new workbooks
 * - Loading existing workbooks
 * - Deleting workbooks
 * 
 * @param {string} text - The current workbook content
 * @param {function} setText - Function to update the workbook content
 * @param {string} workbookName - The current workbook name
 * @param {function} setWorkbookName - Function to update the workbook name
 * @param {boolean} showSaveDialog - Whether the save dialog is shown
 * @param {function} setShowSaveDialog - Function to toggle the save dialog
 * @returns {object} - Workbook management functions and state
 */
function useWorkbookManager(text, setText, workbookName, setWorkbookName, showSaveDialog, setShowSaveDialog) {
  const [savedWorkbooks, setSavedWorkbooks] = useState([]);

  // Format date for display in workbook info
  const formatDateForDisplay = useCallback((date) => {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, []);

  // Load saved workbooks from localStorage on component mount
  useEffect(() => {
    const storedWorkbooks = localStorage.getItem('humanCalculatorWorkbooks');
    if (storedWorkbooks) {
      const parsed = JSON.parse(storedWorkbooks);
      // Migrate the old { category, categoryId, subcategory, subcategoryId }
      // shape (2 levels only) down to a single leaf `categoryId`, matching
      // the category tree's flat { id, name, parentId } shape.
      const migrated = parsed.map(wb => {
        if ('subcategoryId' in wb || 'category' in wb) {
          const { category, subcategory, categoryId, subcategoryId, ...rest } = wb;
          return { ...rest, categoryId: subcategoryId || categoryId || null };
        }
        return wb;
      });
      setSavedWorkbooks(migrated);
      localStorage.setItem('humanCalculatorWorkbooks', JSON.stringify(migrated));
    }
  }, []);

  /**
   * Save current workbook - idempotent against the *entire* saved list, not
   * just the last entry, so revisiting or re-saving identical content never
   * creates a duplicate row (e.g. auto-save firing repeatedly, or clicking
   * Save on unchanged content).
   *
   * @param {boolean} forceSave - If true, an exact-content match is
   * refreshed in place (name/date) instead of being skipped outright.
   * @returns {object|null} - The saved/updated workbook, or null if nothing
   * changed
   */
  const saveWorkbook = useCallback((forceSave = false) => {
    // Don't save empty workbooks
    if (!text.trim()) return null;

    // Idempotency: this exact content may already be saved somewhere in the
    // list (not necessarily the last entry) - never create a second row for it.
    const existingMatch = savedWorkbooks.find(wb => wb.content === text);

    if (existingMatch && !forceSave) {
      // Background/auto-save trigger: nothing new to persist.
      console.log('Workbook content already saved, skipping duplicate save');
      setShowSaveDialog(false);
      return null;
    }

    if (existingMatch && forceSave) {
      // Explicit Save on content that already exists: refresh it in place
      // (name + timestamp) rather than duplicating it.
      const now = new Date();
      const formattedDate = formatDateForDisplay(now);
      const updatedWorkbook = {
        ...existingMatch,
        name: workbookName || existingMatch.name,
        date: now.toISOString(),
        displayDate: formattedDate
      };
      const updatedWorkbooks = savedWorkbooks.map(wb => (wb.id === existingMatch.id ? updatedWorkbook : wb));
      setSavedWorkbooks(updatedWorkbooks);
      localStorage.setItem('humanCalculatorWorkbooks', JSON.stringify(updatedWorkbooks));
      setShowSaveDialog(false);
      return updatedWorkbook;
    }

    const now = new Date();
    const formattedDate = formatDateForDisplay(now);
    const workbook = {
      id: now.getTime().toString(),
      name: workbookName || `Workbook ${formattedDate}`,
      content: text,
      date: now.toISOString(),
      displayDate: formattedDate,
      // Payment tracking - kept flat so this stays simple, plain JSON
      // that can sync to a file-based backend (e.g. Google Drive) later.
      // `amountPaid` is a running total of every payment recorded (see
      // PaymentDialog); `payments` is a lightweight history of each of
      // those recordings (amount, optional note, date) purely for display -
      // it's never read for balance math, so it can't drift out of sync
      // with `amountPaid`.
      isPaid: false,
      amountPaid: null,
      paidAt: null,
      paidAtDisplay: null,
      payments: [],
      categoryId: null
    };

    const updatedWorkbooks = [...savedWorkbooks, workbook];
    setSavedWorkbooks(updatedWorkbooks);
    localStorage.setItem('humanCalculatorWorkbooks', JSON.stringify(updatedWorkbooks));
    setShowSaveDialog(false);
    return workbook;
  }, [text, savedWorkbooks, workbookName, setShowSaveDialog, formatDateForDisplay]);

  /**
   * Get the saved workbook record that represents the current editor content,
   * saving it first (if needed) so payment/category info always has a
   * workbook id to attach to.
   *
   * @returns {object|null} - The current workbook record, or null if the
   * editor is empty
   */
  const getCurrentWorkbookRecord = useCallback(() => {
    if (!text.trim()) return null;

    const existingMatch = savedWorkbooks.find(wb => wb.content === text);
    if (existingMatch) return existingMatch;

    return saveWorkbook(true);
  }, [text, savedWorkbooks, saveWorkbook]);

  /**
   * Merge arbitrary fields (payment info, category, ...) onto a saved
   * workbook.
   *
   * @param {string} id - The workbook id to update
   * @param {object} fields - Fields to merge onto the workbook
   */
  const updateWorkbook = useCallback((id, fields) => {
    const updatedWorkbooks = savedWorkbooks.map(wb =>
      wb.id === id ? { ...wb, ...fields } : wb
    );
    setSavedWorkbooks(updatedWorkbooks);
    localStorage.setItem('humanCalculatorWorkbooks', JSON.stringify(updatedWorkbooks));
  }, [savedWorkbooks]);

  /**
   * Clear the category assignment on any workbook that references one of
   * the given category ids - used after deleting a category (and its
   * descendants) so workbooks don't keep a dangling reference.
   *
   * @param {string[]} categoryIds - ids that were just deleted
   */
  const clearWorkbookCategoryReferences = useCallback((categoryIds) => {
    if (!categoryIds || categoryIds.length === 0) return;
    const updatedWorkbooks = savedWorkbooks.map(wb =>
      wb.categoryId && categoryIds.includes(wb.categoryId) ? { ...wb, categoryId: null } : wb
    );
    setSavedWorkbooks(updatedWorkbooks);
    localStorage.setItem('humanCalculatorWorkbooks', JSON.stringify(updatedWorkbooks));
  }, [savedWorkbooks]);

  /**
   * Create a new workbook after saving the current one if needed
   * Uses the saveWorkbook function to avoid duplicate saves
   */
  const createNewWorkbook = useCallback(() => {
    // First save the current workbook if it has content
    // We use forceSave=false to prevent saving duplicates
    saveWorkbook(false);
    
    // Then create a new empty workbook
    const now = new Date();
    const formattedDate = formatDateForDisplay(now);
    setText("");
    setWorkbookName(`New Workbook - ${formattedDate}`);
  }, [saveWorkbook, setText, setWorkbookName, formatDateForDisplay]);

  /**
   * Load a workbook
   * @param {object} workbook - The workbook to load
   */
  const loadWorkbook = useCallback((workbook) => {
    setText(workbook.content || "");
    setWorkbookName(workbook.name || "");
  }, [setText, setWorkbookName]);

  /**
   * Delete a workbook
   * @param {string} id - The ID of the workbook to delete
   */
  const deleteWorkbook = useCallback((id) => {
    const updatedWorkbooks = savedWorkbooks.filter(wb => wb.id !== id);
    setSavedWorkbooks(updatedWorkbooks);
    localStorage.setItem('humanCalculatorWorkbooks', JSON.stringify(updatedWorkbooks));
  }, [savedWorkbooks]);

  // Auto-save workbooks when content changes significantly
  useEffect(() => {
    // Only auto-save if there's actual content
    if (text.trim()) {
      // Debounce the save operation to avoid too many saves
      const timer = setTimeout(() => {
        // Use the saveWorkbook function with forceSave=false to prevent duplicates
        // This will only save if the content is different from the last saved workbook
        const autoSaved = saveWorkbook(false);
        if (autoSaved) {
          console.log('Workbook auto-saved');
        }
      }, 5000); // Wait 5 seconds of inactivity before auto-saving
      
      return () => clearTimeout(timer);
    }
  }, [text, saveWorkbook]);
  
  // Save workbook when user leaves the page, switches tabs, or closes the window
  useEffect(() => {
    /**
     * Handle page visibility change (user switches tabs or minimizes window)
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && text.trim()) {
        console.log('Page visibility changed to hidden, saving workbook...');
        saveWorkbook(false);
      }
    };
    
    /**
     * Handle before unload event (user closes tab/window or navigates away)
     */
    const handleBeforeUnload = () => {
      if (text.trim()) {
        console.log('User is leaving the page, saving workbook...');
        saveWorkbook(false);
      }
    };
    
    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Clean up event listeners
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [text, saveWorkbook]);

  return {
    savedWorkbooks,
    saveWorkbook,
    loadWorkbook,
    deleteWorkbook,
    createNewWorkbook,
    formatDateForDisplay,
    getCurrentWorkbookRecord,
    updateWorkbook,
    clearWorkbookCategoryReferences
  };
}

export default useWorkbookManager;
