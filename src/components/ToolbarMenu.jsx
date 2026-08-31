import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ChevronDownIcon } from '../icons/Icons';

/**
 * ToolbarMenu Component
 *
 * A toolbar button that expands into a dropdown list of related actions,
 * so the toolbar can group several buttons under one label instead of
 * growing a new top-level button per feature. Closes on outside click,
 * item selection, or Escape.
 */
function ToolbarMenu({ label, icon, items }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleItemClick = (item) => {
    item.onClick();
    setIsOpen(false);
  };

  return (
    <div className="toolbar-menu" ref={containerRef}>
      <button
        type="button"
        className="workbook-button toolbar-menu-trigger"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {icon}
        {label}
        <ChevronDownIcon className={`toolbar-menu-caret ${isOpen ? 'open' : ''}`} />
      </button>
      {isOpen && (
        <div className="toolbar-menu-dropdown">
          {items.map(item => (
            <button
              key={item.label}
              type="button"
              className="toolbar-menu-item"
              onClick={() => handleItemClick(item)}
              title={item.title}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

ToolbarMenu.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.node,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      title: PropTypes.string,
      onClick: PropTypes.func.isRequired
    })
  ).isRequired
};

export default ToolbarMenu;
