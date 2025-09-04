import React from 'react';
import { Plus, Minus, Maximize } from 'lucide-react';

interface MapZoomControlsProps {
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  onFit?: () => void;
  min?: number;
  max?: number;
  orientation?: 'horizontal' | 'vertical';
}

const MapZoomControls: React.FC<MapZoomControlsProps> = ({ setZoom, onFit, min = 0.3, max = 3, orientation = 'horizontal' }) => {
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.1, max));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.1, min));

  const containerClass = orientation === 'vertical'
    ? 'flex flex-col items-center space-y-2'
    : 'flex items-center space-x-2 space-x-reverse';

  return (
    <div className={containerClass}>
      <button
        onClick={zoomIn}
        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        aria-label="הגדל מפה"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        onClick={zoomOut}
        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        aria-label="הקטן מפה"
      >
        <Minus className="h-4 w-4" />
      </button>
      {onFit && (
        <button
          onClick={onFit}
          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          aria-label="התאם למסך"
        >
          <Maximize className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default MapZoomControls;

