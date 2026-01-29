
import React from 'react';
import './LayoutSelector.css';

interface LayoutOption {
  name: string;
  rows: number;
  cols: number;
  totalPlayers: number;
}

interface LayoutSelectorProps {
  currentLayout: LayoutOption;
  onLayoutChange: (layout: LayoutOption) => void;
}

const LayoutSelector: React.FC<LayoutSelectorProps> = ({ currentLayout, onLayoutChange }) => {
  const layouts: LayoutOption[] = [
    { name: '1 Player', rows: 1, cols: 1, totalPlayers: 1 },
    { name: '2 Players', rows: 1, cols: 2, totalPlayers: 2 },
    { name: '4 Players', rows: 2, cols: 2, totalPlayers: 4 },
    { name: '6 Players', rows: 2, cols: 3, totalPlayers: 6 },
  ];

  return (
    <div className="layout-selector">
      <span className="layout-label">Layout:</span>
      {layouts.map((layout) => (
        <button
          key={layout.name}
          className={`layout-btn ${currentLayout.totalPlayers === layout.totalPlayers ? 'active' : ''}`}
          onClick={() => onLayoutChange(layout)}
        >
          {layout.name}
        </button>
      ))}
    </div>
  );
};

export default LayoutSelector;

