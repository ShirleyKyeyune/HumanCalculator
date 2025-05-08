import { useState, useEffect, useRef, useCallback } from "react";
import { Parser } from "expr-eval";
import "./HumanWebCalculator.css";
import calculatorService from "./services/calculatorService";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import HistoryPanel from "./components/HistoryPanel";
import QRCodeDisplay from "./components/QRCodeDisplay";
import { QRCodeIcon } from "./icons/Icons";
import useWorkbookManager from "./hooks/useWorkbookManager";

/* ─────────────  Helper functions  ───────────── */
const parserOptions = { operators: { assignment: true } };

// Sanitize expression for the parser - now using the service

// Strip non-math labels, preserving arithmetic; drop dangling ops

/** Evaluate an expression; fallback to sanitized version */
export function evaluateExpression(expr, scope = {}) {
  // First handle special cases specific to this calculator
  // that aren't in the general service
  let processedExpr = expr;
  const parser = new Parser(parserOptions);

  // Handle function-like expressions (e.g., "tape (140*25)")
  processedExpr = processedExpr.replace(/([a-zA-Z0-9_]+)\s*\(([^)]+)\)/g, (match, name, formula) => {
    try {
      const result = parser.evaluate(formula);
      return `${name}_${result}`;
    } catch (e) {
      return match;
    }
  });

  // Try to evaluate with the parser directly
  try {
    return { value: parser.evaluate(processedExpr, scope), scope };
  } catch {
    try {
      // If direct evaluation fails, use the calculator service
      const sanitized = calculatorService.sanitizeExpressionRaw(processedExpr);
      return { value: parser.evaluate(sanitized, scope), scope };
    } catch (e) {
      return { value: NaN, scope, error: e.message };
    }
  }
}

/** React component */
export default function HumanWebCalculator({
  workbookName,
  setWorkbookName,
  showSaveDialog,
  setShowSaveDialog,
  showImportDialog,
  setShowImportDialog}) {
  const seedLines = [
    "bottles 1.2k x 300 people",
    "Quantity: 300 × 1.2k bottles",
    "",
    "// should be ignored 200"
  ];

  const [text, setText] = useState(seedLines.join("\n"));
  const [lineResults, setLineResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [selectionResult, setSelectionResult] = useState(0);
  // Dark mode is now managed in the App component
  // Workbook controls are now passed as props
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [calculationHistory, setCalculationHistory] = useState([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeContent, setQRCodeContent] = useState('');
  const textareaRef = useRef(null);
  const bannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const resultsContainerRef = useRef(null);
  const historyPanelRef = useRef(null);

  // Use the workbook manager hook to handle all workbook-related operations
  const {
    savedWorkbooks,
    saveWorkbook,
    loadWorkbook,
    deleteWorkbook,
    createNewWorkbook
    // formatDateForDisplay is available but not used in this component
  } = useWorkbookManager(text, setText, workbookName, setWorkbookName, showSaveDialog, setShowSaveDialog);

  // Dark mode toggle moved to App component

  // Load calculation history from localStorage on component mount
  useEffect(() => {
    // Workbooks are loaded by the useWorkbookManager hook
    const storedHistory = localStorage.getItem('humanCalculatorHistory');
    if (storedHistory) {
      setCalculationHistory(JSON.parse(storedHistory));
    }
  }, []);

  // Toggle history panel
  const toggleHistoryPanel = () => {
    setShowHistoryPanel(prev => !prev);
  };

  // Toggle QR code display
  const toggleQRCode = () => {
    // Generate QR code content if showing
    if (!showQRCode) {
      generateQRCode();
    }
    setShowQRCode(prev => !prev);
  };

  // Generate QR code content based on current selection or full workbook
  const generateQRCode = () => {
    const ta = textareaRef.current;
    if (!ta) return;

    const { selectionStart, selectionEnd, value } = ta;
    let calculationTotal = 0;

    try {
      // Normalize the content by replacing problematic characters
      const normalizeText = (text) => {
        // Replace multiplication symbols with standard asterisk
        return text
          .replace(/[×]/g, '*') // Replace × with *
          .replace(/[\u05df]/g, '*'); // Replace Hebrew final nun (נ) with *
      };

      let rawContent = '';
      
      // If there's a selection, use that content
      if (selectionStart !== selectionEnd) {
        const selectedText = value.slice(selectionStart, selectionEnd).trim();
        if (selectedText) {
          rawContent = selectedText;
          calculationTotal = selectionResult;
        }
      } else {
        // Otherwise use the full workbook content
        rawContent = value;
        calculationTotal = total;
      }

      // Normalize the content to handle special characters
      const normalizedContent = normalizeText(rawContent);
      
      // Add the total as a separate line
      const content = normalizedContent + '\n\nTotal: ' + formatWithCommas(calculationTotal);
      
      // Set the QR code content
      setQRCodeContent(content);
      console.log('QR Code content:', content); // Debug log
    } catch (error) {
      console.error('Error generating QR code content:', error);
      setQRCodeContent('Error generating QR code');
    }
  };

  // Save current calculation to history
  const saveToHistory = () => {
    const now = new Date();
    const historyItem = {
      id: now.getTime().toString(),
      content: text,
      total: total,
      date: now.toISOString(),
      displayDate: formatDate(now)
    };

    const updatedHistory = [historyItem, ...calculationHistory].slice(0, 50); // Keep only the last 50 items
    setCalculationHistory(updatedHistory);
    localStorage.setItem('humanCalculatorHistory', JSON.stringify(updatedHistory));
  };

  // Load calculation from history
  const loadFromHistory = (historyItem) => {
    setText(historyItem.content || "");
  };

  // Delete item from history
  const deleteFromHistory = (id) => {
    const updatedHistory = calculationHistory.filter(item => item.id !== id);
    setCalculationHistory(updatedHistory);
    localStorage.setItem('humanCalculatorHistory', JSON.stringify(updatedHistory));
  };

  // Check if a line ends with an operator

  // Check if a line starts with an operator

  // NOTE: We now use the calculator service directly instead of processing individual lines
  // This is a simplified version kept for reference

  // Process multi-line expression using the calculator service
  const processMultiLineExpression = useCallback((text) => {
    if (!text || !text.trim()) return 0;

    try {
      // Use the calculator service to process all lines
      const processedLines = calculatorService.processInput(text);

      // Calculate the total from the processed lines
      const total = processedLines.reduce((sum, line) => sum + (line.value || 0), 0);
      return total;
    } catch (error) {
      console.error('Error processing multi-line expression:', error);
      return 0;
    }
  }, []);

  // Evaluate per-line & overall when text changes
  useEffect(() => {
    // Use the calculator service to process all lines
    try {
      const processedLines = calculatorService.processInput(text);

      // Extract the results for each line and format with commas
      const results = processedLines.map(line => {
        // Use the existing formatWithCommas function for numbers
        return typeof line.value === 'number' ? line.value : 0;
      });
      setLineResults(results);

      // Calculate the total from the processed lines
      const overall = processedLines.reduce((sum, line) => sum + (line.value || 0), 0);
      setTotal(overall);
    } catch (error) {
      console.error('Error processing lines:', error);
      setLineResults([]);
      setTotal(0);
    }
  }, [text]);

  // Evaluate selection
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const handler = () => {
      const { selectionStart, selectionEnd, value } = ta;
      if (selectionStart === selectionEnd) { setSelectionResult(0); return; }

      // Check if all text is selected
      const isAllSelected = selectionStart === 0 && selectionEnd === value.length;

      // If all text is selected, use the total value directly
      if (isAllSelected) {
        setSelectionResult(total);
        return;
      }

      const sel = value.slice(selectionStart, selectionEnd).trim();
      if (!sel) { setSelectionResult(0); return; }

      try {
        // Use the calculator service to process the selection
        const processedLines = calculatorService.processInput(sel);

        // Calculate the total from the processed lines
        const result = processedLines.reduce((sum, line) => sum + (line.value || 0), 0);
        setSelectionResult(result);
      } catch (error) {
        console.error('Error calculating selection:', error);
        setSelectionResult('Error');
      }
    };
    ['mouseup','keyup','select'].forEach(evt => ta.addEventListener(evt, handler));
    document.addEventListener('selectionchange', handler);
    handler();
    return () => {
      ['mouseup','keyup','select'].forEach(evt => ta.removeEventListener(evt, handler));
      document.removeEventListener('selectionchange', handler);
    };
  }, [processMultiLineExpression, total]);

  // Auto-save calculations to history when they change significantly
  useEffect(() => {
    // Only save if there's actual content and a non-zero total
    if (text.trim() && total !== 0) {
      // Check if this is significantly different from the last history item
      const lastHistoryItem = calculationHistory[0];
      if (!lastHistoryItem ||
          Math.abs(lastHistoryItem.total - total) > 0.1 ||
          lastHistoryItem.content !== text) {
        // Debounce the save operation to avoid too many history items
        const timer = setTimeout(() => {
          const now = new Date();
          const historyItem = {
            id: now.getTime().toString(),
            content: text,
            total: total,
            date: now.toISOString(),
            displayDate: formatDate(now)
          };

          const updatedHistory = [historyItem, ...calculationHistory].slice(0, 50); // Keep only the last 50 items
          setCalculationHistory(updatedHistory);
          localStorage.setItem('humanCalculatorHistory', JSON.stringify(updatedHistory));
        }, 2000); // Wait 2 seconds of inactivity before saving

        return () => clearTimeout(timer);
      }
    }
  }, [text, total, calculationHistory]);

  // Auto-save workbooks when content changes significantly
  useEffect(() => {
    // Only auto-save if there's actual content and we have a workbook name
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
  }, [text, saveWorkbook]); // Include saveWorkbook in dependencies

  // Scroll banner into view
  useEffect(() => {
    if (bannerRef.current) bannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectionResult]);

  // Format a number with commas
  const formatWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Format date for display in history
  const formatDate = (date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateToFormat = new Date(date);
    const isToday = dateToFormat >= today;
    const isYesterday = dateToFormat >= yesterday && dateToFormat < today;

    if (isToday) {
      return `Today at ${dateToFormat.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isYesterday) {
      return `Yesterday at ${dateToFormat.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return dateToFormat.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
             ` at ${dateToFormat.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  // Workbook management functions are now provided by the useWorkbookManager hook

  // Export workbook in various formats
  const exportWorkbook = () => {
    // Show the export dialog instead of exporting directly
    setShowExportDialog(true);
  };

  // Export as PDF
  const exportAsPDF = () => {
    if (!resultsContainerRef.current) return;

    const fileName = `${workbookName.replace(/\s+/g, '_')}.pdf`;
    const element = resultsContainerRef.current;

    html2canvas(element).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(fileName);
    });

    setShowExportDialog(false);
  };

  // Export as Image (PNG)
  const exportAsImage = () => {
    if (!resultsContainerRef.current) return;

    const fileName = `${workbookName.replace(/\s+/g, '_')}.png`;
    const element = resultsContainerRef.current;

    html2canvas(element).then(canvas => {
      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });

    setShowExportDialog(false);
  };

  // Export as Excel
  const exportAsExcel = () => {
    const fileName = `${workbookName.replace(/\s+/g, '_')}.xlsx`;

    // Prepare data for Excel
    const lines = text.split(/\r?\n/).filter(line => line.trim() && !line.trim().startsWith('//'));
    const data = lines.map((line, index) => ({
      Item: line.trim(),
      Value: lineResults[index] || 0
    }));

    // Add total row
    data.push({ Item: 'Total', Value: total });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Calculation');

    // Save file
    XLSX.writeFile(wb, fileName);

    setShowExportDialog(false);
  };

  // Handle export based on selected format
  const handleExport = () => {
    switch (exportFormat) {
      case 'pdf':
        exportAsPDF();
        break;
      case 'image':
        exportAsImage();
        break;
      case 'excel':
        exportAsExcel();
        break;
      default:
        exportAsPDF();
    }
  };

  // createNewWorkbook function is now provided by the useWorkbookManager hook

  // Import workbook from JSON file
  const importWorkbook = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = JSON.parse(e.target.result);
        setText(workbook.content || "");
        setWorkbookName(workbook.name || "Imported Workbook");
        setShowImportDialog(false);
      } catch (error) {
        console.error("Error parsing workbook file:", error);
        alert("Invalid workbook file format");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="calculator-container">

      {/* Hidden buttons for toolbar actions */}
      <button
        id="export-trigger"
        onClick={exportWorkbook}
        style={{ display: 'none' }}
      >
        Export
      </button>
      <button
        id="history-trigger"
        onClick={toggleHistoryPanel}
        style={{ display: 'none' }}
      >
        History
      </button>
      <button
        id="new-workbook-trigger"
        onClick={createNewWorkbook}
        style={{ display: 'none' }}
      >
        New Workbook
      </button>

      {/* History Panel */}
      <HistoryPanel
        ref={historyPanelRef}
        isVisible={showHistoryPanel}
        onClose={toggleHistoryPanel}
        history={calculationHistory}
        onLoadHistory={loadFromHistory}
        onDeleteHistory={deleteFromHistory}
        onSaveHistory={saveToHistory}
        formatWithCommas={formatWithCommas}
      />

      {/* Left panel */}
      <div className="panel">
        <div
          ref={bannerRef}
          className="selection-banner"
        >
          <span>Selection Total = {formatWithCommas(selectionResult)}</span>
          <button
            className="icon-button qr-code-button"
            onClick={toggleQRCode}
            title="Generate QR Code"
          >
            <QRCodeIcon className="icon" />
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          className="calculator-textarea"
          spellCheck="false"
        />
      </div>

      {/* Right panel */}
      <div className="results-container">
        <div className="panel" ref={resultsContainerRef}>
          {lineResults.map((res, idx) => (
            <div key={idx} className="result-row">
              <span className="expression">
                {text.split(/\r?\n/)[idx]}
              </span>
              <span className="result">
                {formatWithCommas(res)}
              </span>
            </div>
          ))}
          <div className="total-row">
            <span className="total-label">Total:</span>
            <span className="total-value">
              {formatWithCommas(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Save Workbook</h3>
            <div className="dialog-content">
              <label htmlFor="workbook-name">Workbook Name:</label>
              <input
                id="workbook-name"
                type="text"
                value={workbookName}
                onChange={(e) => setWorkbookName(e.target.value)}
                className="dialog-input"
              />
            </div>
            <div className="dialog-buttons">
              <button onClick={() => setShowSaveDialog(false)} className="dialog-button cancel">
                Cancel
              </button>
              <button onClick={saveWorkbook} className="dialog-button save">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Export Options</h3>
            <div className="dialog-content">
              <div className="export-options">
                <label className="export-option">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="pdf"
                    checked={exportFormat === 'pdf'}
                    onChange={() => setExportFormat('pdf')}
                  />
                  <span>PDF Document</span>
                </label>
                <label className="export-option">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="image"
                    checked={exportFormat === 'image'}
                    onChange={() => setExportFormat('image')}
                  />
                  <span>Image (PNG)</span>
                </label>
                <label className="export-option">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="excel"
                    checked={exportFormat === 'excel'}
                    onChange={() => setExportFormat('excel')}
                  />
                  <span>Excel Spreadsheet</span>
                </label>
              </div>
            </div>
            <div className="dialog-buttons">
              <button onClick={() => setShowExportDialog(false)} className="dialog-button cancel">
                Cancel
              </button>
              <button onClick={handleExport} className="dialog-button save">
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Display */}
      <QRCodeDisplay
        isVisible={showQRCode}
        content={qrCodeContent}
        onClose={toggleQRCode}
      />

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Import Workbook</h3>
            <div className="dialog-content">
              <div className="import-tabs">
                <button className="import-tab active">Saved</button>
                <button className="import-tab">From File</button>
              </div>

              <div className="saved-workbooks">
                {savedWorkbooks.length > 0 ? (
                  <ul className="workbook-list">
                    {savedWorkbooks.map(workbook => (
                      <li key={workbook.id} className="workbook-item">
                        <div className="workbook-info">
                          <span className="workbook-name">{workbook.name}</span>
                          <span className="workbook-date">
                            {workbook.displayDate || formatDate(workbook.date)}
                          </span>
                        </div>
                        <div className="workbook-actions">
                          <button
                            onClick={() => loadWorkbook(workbook)}
                            className="workbook-action-button load"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => deleteWorkbook(workbook.id)}
                            className="workbook-action-button delete"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-workbooks">No saved workbooks found.</p>
                )}
              </div>

              <div className="file-import" style={{ display: 'none' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={importWorkbook}
                  className="file-input"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="file-select-button"
                >
                  Select File
                </button>
              </div>
            </div>
            <div className="dialog-buttons">
              <button onClick={() => setShowImportDialog(false)} className="dialog-button cancel">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
