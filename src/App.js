import './App.css';
import { useState, useEffect } from 'react';
import HumanWebCalculator from './HumanWebCalculator';
import ToolbarMenu from './components/ToolbarMenu';
import {
  SunIcon, MoonIcon, ShareIcon, HistoryIcon, WalletIcon, SearchIcon, PaidIcon,
  ChartIcon, TagIcon, TargetIcon, PlusIcon, SaveIcon, ImportIcon, FolderPlusIcon
} from './icons/Icons';
import pkg from '../package.json';
const calculatorIcon = process.env.PUBLIC_URL + '/favicon.svg';

function App() {
  const [workbookName, setWorkbookName] = useState('My Workbook');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showMobileMoney, setShowMobileMoney] = useState(false);
  const [collapseCalculator, setCollapseCalculator] = useState(false);
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
          <button
            type="button"
            className="workbook-name-button"
            onClick={() => setShowSaveDialog(true)}
            title="Save or rename this workbook"
            aria-label={`Save or rename workbook, currently named ${workbookName}`}
          >
            <SaveIcon className="button-icon" />
            <span className="workbook-name-button-text">{workbookName}</span>
          </button>
          <div className="workbook-buttons">
            <ToolbarMenu
              label="Workbook"
              icon={<SaveIcon className="button-icon" />}
              items={[
                {
                  label: 'New',
                  icon: <PlusIcon className="button-icon" />,
                  onClick: () => document.getElementById('new-workbook-trigger').click()
                },
                {
                  label: 'Save',
                  icon: <SaveIcon className="button-icon" />,
                  onClick: () => setShowSaveDialog(true)
                },
                {
                  label: 'Import',
                  icon: <ImportIcon className="button-icon" />,
                  onClick: () => setShowImportDialog(true)
                },
                {
                  label: 'Export',
                  icon: <ShareIcon className="button-icon" />,
                  onClick: () => document.getElementById('export-trigger').click()
                },
                {
                  label: 'Mark Paid',
                  icon: <PaidIcon className="button-icon" />,
                  title: 'Mark this workbook as paid',
                  onClick: () => document.getElementById('mark-paid-trigger').click()
                },
                {
                  label: 'Add to Budget / Category',
                  icon: <FolderPlusIcon className="button-icon" />,
                  title: 'Assign a category or attach to a budget',
                  onClick: () => document.getElementById('organize-workbook-trigger').click()
                }
              ]}
            />
            <ToolbarMenu
              label="Insights"
              icon={<ChartIcon className="button-icon" />}
              items={[
                {
                  label: 'History',
                  icon: <HistoryIcon className="button-icon" />,
                  title: 'View calculation history',
                  onClick: () => document.getElementById('history-trigger').click()
                },
                {
                  label: 'Search',
                  icon: <SearchIcon className="button-icon" />,
                  title: 'Search saved workbooks and history',
                  onClick: () => document.getElementById('search-trigger').click()
                },
                {
                  label: 'Summary',
                  icon: <ChartIcon className="button-icon" />,
                  title: 'View spending by category',
                  onClick: () => document.getElementById('spending-summary-trigger').click()
                },
                {
                  label: 'Budgets',
                  icon: <TargetIcon className="button-icon" />,
                  title: 'Create and manage budgets',
                  onClick: () => document.getElementById('budget-manager-trigger').click()
                },
                {
                  label: 'Categories',
                  icon: <TagIcon className="button-icon" />,
                  title: 'Manage categories and subcategories',
                  onClick: () => document.getElementById('category-manager-trigger').click()
                }
              ]}
            />
            <button
              className="workbook-button"
              id="mobile-money-button"
              onClick={() => {
                setShowMobileMoney(true);
                setCollapseCalculator(true);
                window.setTimeout(() => {
                  document.getElementById('mobile-money-calculator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 0);
              }}
              title="Open mobile money charges calculator"
            >
              <WalletIcon className="button-icon" /> Mobile Money
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
          showMobileMoney={showMobileMoney}
          collapseCalculator={collapseCalculator}
          onExpandCalculator={() => setCollapseCalculator(false)}
          onCloseMobileMoney={() => {
            setShowMobileMoney(false);
            setCollapseCalculator(false);
          }}
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
