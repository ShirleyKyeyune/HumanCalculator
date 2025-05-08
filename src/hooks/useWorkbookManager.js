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
      setSavedWorkbooks(JSON.parse(storedWorkbooks));
    }
  }, []);

  /**
   * Save current workbook if content has changed significantly
   * Prevents duplicate saves by checking if the current content is different
   * from the last saved workbook
   * 
   * @param {boolean} forceSave - If true, save regardless of content similarity
   * @returns {boolean} - Whether a new workbook was saved
   */
  const saveWorkbook = useCallback((forceSave = false) => {
    // Don't save empty workbooks
    if (!text.trim()) return false;
    
    // Check if this content is significantly different from the last saved workbook
    const lastWorkbook = savedWorkbooks.length > 0 ? savedWorkbooks[savedWorkbooks.length - 1] : null;
    
    // If not forcing save, check if content is similar to avoid duplicates
    if (!forceSave && lastWorkbook && lastWorkbook.content === text) {
      console.log('Workbook content unchanged, skipping save');
      setShowSaveDialog(false);
      return false;
    }
    
    const now = new Date();
    const formattedDate = formatDateForDisplay(now);
    const workbook = {
      id: now.getTime().toString(),
      name: workbookName || `Workbook ${formattedDate}`,
      content: text,
      date: now.toISOString(),
      displayDate: formattedDate
    };

    const updatedWorkbooks = [...savedWorkbooks, workbook];
    setSavedWorkbooks(updatedWorkbooks);
    localStorage.setItem('humanCalculatorWorkbooks', JSON.stringify(updatedWorkbooks));
    setShowSaveDialog(false);
    return true;
  }, [text, savedWorkbooks, workbookName, setShowSaveDialog, formatDateForDisplay]);

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
    formatDateForDisplay
  };
}

export default useWorkbookManager;
