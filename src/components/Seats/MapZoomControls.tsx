import React from 'react';
import { Plus, Minus, Maximize } from 'lucide-react';

interface MapZoomControlsProps {
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  onFit?: () => void;
}

const MapZoomControls: React.FC<MapZoomControlsProps> = ({ setZoom, onFit }) => {
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));

  return (
    <div className="flex items-center space-x-2 space-x-reverse">
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

