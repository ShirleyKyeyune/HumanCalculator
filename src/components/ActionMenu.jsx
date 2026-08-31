import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * A small "..." kebab button that reveals a dropdown of row-level actions -
 * used to keep per-item/per-folder actions out of view until needed, rather
 * than lining up several buttons on every row. Closes on outside click,
 * item selection, or Escape (same convention as ToolbarMenu).
 *
 * The trigger stays visible (dimmed) rather than fully hidden, so it works
 * the same way on touch devices that have no hover state to reveal it.
 */
function ActionMenu({ items, label = 'Actions', align = 'right' }) {
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

  const visibleItems = items.filter(Boolean);
  if (visibleItems.length === 0) return null;

  const handleItemClick = (item) => {
    item.onClick();
    setIsOpen(false);
  };

  return (
    <div className="action-menu" ref={containerRef}>
      <button
        type="button"
        className="action-menu-trigger"
        onClick={(e) => { e.stopPropagation(); setIsOpen(prev => !prev); }}
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        &#8942;
      </button>
      {isOpen && (
        <div className={`action-menu-dropdown align-${align}`} onClick={(e) => e.stopPropagation()}>
          {visibleItems.map(item => (
            <button
              key={item.key || item.label}
              type="button"
              className={`action-menu-item ${item.danger ? 'danger' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

ActionMenu.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.shape({
        key: PropTypes.string,
        label: PropTypes.node.isRequired,
        onClick: PropTypes.func.isRequired,
        danger: PropTypes.bool
      }),
      PropTypes.oneOf([null, false])
    ])
  ).isRequired,
  label: PropTypes.string,
  align: PropTypes.oneOf(['left', 'right'])
};

export default ActionMenu;
