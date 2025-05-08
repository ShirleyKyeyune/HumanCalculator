import './App.css';
import { useState, useEffect } from 'react';
import HumanWebCalculator from './HumanWebCalculator';
import { SunIcon, MoonIcon, ShareIcon, HistoryIcon } from './icons/Icons';
import pkg from '../package.json';
const calculatorIcon = process.env.PUBLIC_URL + '/favicon.svg';

function App() {
  const [workbookName, setWorkbookName] = useState('My Workbook');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Toggle document class for dark mode
  useEffect(() => {
    const cls = document.documentElement.classList;
    if (darkMode) cls.add("dark"); else cls.remove("dark");
  }, [darkMode]);

  return (
    <div className="App">
      <header className="App-header">
        <div className="App-header-left">
          <img src={calculatorIcon} className="App-logo" alt="Human Calculator logo" />
          <h1 className="App-title">Human Calculator</h1>
        </div>
        <div className="App-header-right">
          <input
            type="text"
            value={workbookName}
            onChange={(e) => setWorkbookName(e.target.value)}
            className="workbook-name-input"
            aria-label="Workbook name"
          />
          <div className="workbook-buttons">
            <button
              onClick={() => document.getElementById('new-workbook-trigger').click()}
              className="workbook-button"
            >
              New
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="workbook-button"
            >
              Save
            </button>
            <button
              onClick={() => setShowImportDialog(true)}
              className="workbook-button"
            >
              Import
            </button>
            <button
              className="workbook-button"
              id="export-button"
              onClick={() => document.getElementById('export-trigger').click()}
              title="Export calculation results"
            >
              <ShareIcon className="button-icon" /> Export
            </button>
            <button
              className="workbook-button"
              id="history-button"
              onClick={() => document.getElementById('history-trigger').click()}
              title="View calculation history"
            >
              <HistoryIcon className="button-icon" /> History
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="workbook-button dark-mode-button"
              aria-label="Toggle dark mode"
            >
              {darkMode ?
                <SunIcon className="mode-icon" /> :
                <MoonIcon className="mode-icon" />
              }
            </button>
          </div>
        </div>
      </header>
      <main className={`App-main ${darkMode ? 'dark' : ''}`}>
        <HumanWebCalculator
          workbookName={workbookName}
          setWorkbookName={setWorkbookName}
          showSaveDialog={showSaveDialog}
          setShowSaveDialog={setShowSaveDialog}
          showImportDialog={showImportDialog}
          setShowImportDialog={setShowImportDialog}
          darkMode={darkMode}
        />
      </main>
      <footer className="App-footer">
        <p>Version: {pkg.version}</p>
        <p>Developed by Shirley Godfrey Kyeyune</p>
      </footer>
    </div>
  );
}

export default App;
