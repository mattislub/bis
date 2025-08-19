import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface MapZoomControlsProps {
  setZoom: React.Dispatch<React.SetStateAction<number>>;
}

const MapZoomControls: React.FC<MapZoomControlsProps> = ({ setZoom }) => {
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));

  return (
    <div className="absolute top-4 left-4 flex flex-col bg-white rounded shadow-md z-50">
      <button
        onClick={zoomIn}
        className="p-2 hover:bg-gray-100 border-b"
        aria-label="הגדל מפה"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        onClick={zoomOut}
        className="p-2 hover:bg-gray-100"
        aria-label="הקטן מפה"
      >
        <Minus className="h-4 w-4" />
      </button>
    </div>
  );
};

export default MapZoomControls;

