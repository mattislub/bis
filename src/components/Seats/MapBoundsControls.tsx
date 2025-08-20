import React from 'react';
import { ChevronUp, ChevronRight, ChevronDown, ChevronLeft, Maximize2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const MapBoundsControls: React.FC = () => {
  const { mapBounds, setMapBounds } = useAppContext();

  const expand = (side: 'top' | 'right' | 'bottom' | 'left') => {
    setMapBounds(prev => ({
      ...prev,
      // allow negative values so the map can grow beyond its initial bounds
      [side]: prev[side] - 20,
    }));
  };

  const expandAll = () => {
    setMapBounds({ top: 0, right: 0, bottom: 0, left: 0 });
  };

  return (
    <div
      className="absolute border-2 border-gray-400 pointer-events-none"
      style={{
        top: mapBounds.top,
        left: mapBounds.left,
        right: mapBounds.right,
        bottom: mapBounds.bottom,
      }}
    >
      <button
        onClick={expandAll}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow p-1 pointer-events-auto"
        aria-label="הרחב הכל"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
      <button
        onClick={() => expand('top')}
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-white rounded-full shadow p-1 pointer-events-auto"
        aria-label="הרחב למעלה"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <button
        onClick={() => expand('right')}
        className="absolute top-1/2 right-0 transform translate-x-full -translate-y-1/2 bg-white rounded-full shadow p-1 pointer-events-auto"
        aria-label="הרחב ימינה"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        onClick={() => expand('bottom')}
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full bg-white rounded-full shadow p-1 pointer-events-auto"
        aria-label="הרחב למטה"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      <button
        onClick={() => expand('left')}
        className="absolute top-1/2 left-0 transform -translate-x-full -translate-y-1/2 bg-white rounded-full shadow p-1 pointer-events-auto"
        aria-label="הרחב שמאלה"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </div>
  );
};

export default MapBoundsControls;

