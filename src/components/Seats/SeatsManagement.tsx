import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Bench, Seat, Worshiper } from '../../types';
import { specialElements } from './specialElements';
import MapZoomControls from './MapZoomControls';
import PdfToolbar from './PdfToolbar';
import {
  Plus,
  Grid3X3,
  Settings,
  BoxSelect,
  Hand,
  ListOrdered,
  Save,
  Trash2,
  Lock,
  Unlock,
  RotateCw,
  Copy,
  ArrowRight,
  ArrowDown,
  Eye,
  EyeOff,
  Map,
  FileText,
  Download,
  Upload,
  Palette,
  Move,
  MousePointer,
  Layers,
  Target,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';

type Tool = 'select' | 'addBench' | 'createRow' | 'multiSelect' | 'pan';

const SeatsManagement: React.FC = () => {
  const {
    benches,
    setBenches,
    seats,
    setSeats,
    worshipers,
    gridSettings,
    setGridSettings,
    mapBounds,
    setMapBounds,
    mapOffset,
    setMapOffset,
    trimMap,
    saveCurrentMap,
    maps,
    currentMapId
  } = useAppContext();

  // State management
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [selectedBenches, setSelectedBenches] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showWorshiperAssignment, setShowWorshiperAssignment] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);

  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapLayerRef = useRef<HTMLDivElement>(null);

  // Helper functions
  const snapToGrid = useCallback((value: number) => {
    if (!gridSettings.snapToGrid) return value;
    return Math.round(value / gridSettings.gridSize) * gridSettings.gridSize;
  }, [gridSettings.snapToGrid, gridSettings.gridSize]);

  const getWorshiperById = (worshiperId: string): Worshiper | undefined => {
    return worshipers.find(w => w.id === worshiperId);
  };

  const getSeatStatus = (seat: Seat) => {
    if (seat.userId) {
      const worshiper = getWorshiperById(seat.userId);
      return { worshiper, color: 'bg-blue-500' };
    }
    return { worshiper: null, color: 'bg-gray-300' };
  };

  // Tool handlers
  const handleAddBench = () => {
    const newBench: Bench = {
      id: `bench-${Date.now()}`,
      name: `ספסל ${benches.length + 1}`,
      seatCount: 4,
      position: { x: 100, y: 100 },
      orientation: 'horizontal',
      color: '#3B82F6',
      locked: false,
      temporary: false,
    };
    setBenches(prev => [...prev, newBench]);
    
    // Create seats for the new bench
    const newSeats: Seat[] = [];
    for (let i = 0; i < newBench.seatCount; i++) {
      newSeats.push({
        id: Date.now() + i,
        benchId: newBench.id,
        position: { x: 0, y: 0 },
        isOccupied: false,
      });
    }
    setSeats(prev => [...prev, ...newSeats]);
  };

  const handleCreateRow = () => {
    if (selectedBenches.length !== 1) return;
    
    const selectedBench = benches.find(b => b.id === selectedBenches[0]);
    if (!selectedBench) return;

    const newBench: Bench = {
      ...selectedBench,
      id: `bench-${Date.now()}`,
      name: `${selectedBench.name} - עותק`,
      position: {
        x: selectedBench.position.x + (selectedBench.orientation === 'horizontal' ? 0 : 100),
        y: selectedBench.position.y + (selectedBench.orientation === 'horizontal' ? 100 : 0),
      },
    };
    
    setBenches(prev => [...prev, newBench]);
    
    // Create seats for the new bench
    const newSeats: Seat[] = [];
    for (let i = 0; i < newBench.seatCount; i++) {
      newSeats.push({
        id: Date.now() + i,
        benchId: newBench.id,
        position: { x: 0, y: 0 },
        isOccupied: false,
      });
    }
    setSeats(prev => [...prev, ...newSeats]);
  };

  const handleDeleteSelected = () => {
    if (selectedBenches.length === 0) return;
    
    if (window.confirm('האם אתה בטוח שברצונך למחוק את הספסלים הנבחרים?')) {
      setBenches(prev => prev.filter(b => !selectedBenches.includes(b.id)));
      setSeats(prev => prev.filter(s => !selectedBenches.includes(s.benchId || '')));
      setSelectedBenches([]);
    }
  };

  const handleToggleLock = () => {
    if (selectedBenches.length === 0) return;
    
    setBenches(prev => prev.map(b => 
      selectedBenches.includes(b.id) 
        ? { ...b, locked: !b.locked }
        : b
    ));
  };

  const handleRotateBench = () => {
    if (selectedBenches.length !== 1) return;
    
    setBenches(prev => prev.map(b => 
      b.id === selectedBenches[0]
        ? { ...b, orientation: b.orientation === 'horizontal' ? 'vertical' : 'horizontal' }
        : b
    ));
  };

  const handleClearMap = () => {
    if (window.confirm('האם אתה בטוח שברצונך לנקות את כל המפה?')) {
      setBenches([]);
      setSeats([]);
      setSelectedBenches([]);
    }
  };

  const handleSaveMap = () => {
    const mapName = prompt('הכנס שם למפה:');
    if (mapName) {
      saveCurrentMap(mapName);
    }
  };

  const handleRenumberSeats = () => {
    let seatNumber = 1;
    const updatedSeats = seats.map(seat => ({
      ...seat,
      id: seatNumber++
    }));
    setSeats(updatedSeats);
  };

  const fitToScreen = () => {
    if (!mapContainerRef.current) return;
    
    const container = mapContainerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Calculate content bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    benches.forEach(bench => {
      const width = bench.type === 'special' ? bench.width || 0 : 
        bench.orientation === 'horizontal' ? bench.seatCount * 60 + 20 : 80;
      const height = bench.type === 'special' ? bench.height || 0 :
        bench.orientation === 'horizontal' ? 80 : bench.seatCount * 60 + 20;
      
      minX = Math.min(minX, bench.position.x);
      minY = Math.min(minY, bench.position.y);
      maxX = Math.max(maxX, bench.position.x + width);
      maxY = Math.max(maxY, bench.position.y + height);
    });
    
    if (minX === Infinity) return;
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    const scaleX = containerWidth / (contentWidth + 100);
    const scaleY = containerHeight / (contentHeight + 100);
    const newZoom = Math.min(scaleX, scaleY, 2);
    
    setZoom(newZoom);
    setMapOffset({
      x: (containerWidth - contentWidth * newZoom) / 2 - minX * newZoom,
      y: (containerHeight - contentHeight * newZoom) / 2 - minY * newZoom
    });
  };

  // Main toolbar configuration
  const mainTools = [
    {
      id: 'select',
      icon: MousePointer,
      label: 'בחירה',
      active: selectedTool === 'select',
      onClick: () => setSelectedTool('select'),
      shortcut: 'V'
    },
    {
      id: 'addBench',
      icon: Plus,
      label: 'הוסף ספסל',
      active: selectedTool === 'addBench',
      onClick: handleAddBench,
      shortcut: 'B'
    },
    {
      id: 'createRow',
      icon: Grid3X3,
      label: 'צור שורה',
      active: false,
      onClick: handleCreateRow,
      disabled: selectedBenches.length !== 1,
      shortcut: 'R'
    },
    {
      id: 'multiSelect',
      icon: BoxSelect,
      label: 'בחירה מרובה',
      active: selectedTool === 'multiSelect',
      onClick: () => setSelectedTool('multiSelect'),
      shortcut: 'M'
    },
    {
      id: 'pan',
      icon: Hand,
      label: 'הזזת מפה',
      active: selectedTool === 'pan',
      onClick: () => setSelectedTool('pan'),
      shortcut: 'H'
    }
  ];

  const editTools = [
    {
      id: 'lock',
      icon: selectedBenches.some(id => benches.find(b => b.id === id)?.locked) ? Unlock : Lock,
      label: 'נעל/שחרר',
      onClick: handleToggleLock,
      disabled: selectedBenches.length === 0
    },
    {
      id: 'rotate',
      icon: RotateCw,
      label: 'סובב',
      onClick: handleRotateBench,
      disabled: selectedBenches.length !== 1
    },
    {
      id: 'copy-right',
      icon: Copy,
      label: 'העתק ימינה',
      onClick: () => {}, // TODO: Implement
      disabled: selectedBenches.length === 0
    },
    {
      id: 'copy-down',
      icon: ArrowDown,
      label: 'העתק למטה',
      onClick: () => {}, // TODO: Implement
      disabled: selectedBenches.length === 0
    },
    {
      id: 'delete',
      icon: Trash2,
      label: 'מחק',
      onClick: handleDeleteSelected,
      disabled: selectedBenches.length === 0,
      variant: 'danger'
    }
  ];

  const viewTools = [
    {
      id: 'grid',
      icon: Grid3X3,
      label: gridSettings.showGrid ? 'הסתר רשת' : 'הצג רשת',
      active: gridSettings.showGrid,
      onClick: () => setGridSettings(prev => ({ ...prev, showGrid: !prev.showGrid }))
    },
    {
      id: 'snap',
      icon: Target,
      label: 'הצמד לרשת',
      active: gridSettings.snapToGrid,
      onClick: () => setGridSettings(prev => ({ ...prev, snapToGrid: !prev.snapToGrid }))
    },
    {
      id: 'fit',
      icon: Maximize2,
      label: 'התאם למסך',
      onClick: fitToScreen
    }
  ];

  const mapTools = [
    {
      id: 'renumber',
      icon: ListOrdered,
      label: 'מספר מחדש',
      onClick: handleRenumberSeats
    },
    {
      id: 'trim',
      icon: RefreshCw,
      label: 'חתוך מפה',
      onClick: trimMap
    },
    {
      id: 'save',
      icon: Save,
      label: 'שמור מפה',
      onClick: handleSaveMap,
      variant: 'primary'
    },
    {
      id: 'clear',
      icon: Trash2,
      label: 'נקה מפה',
      onClick: handleClearMap,
      variant: 'danger'
    }
  ];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Map className="h-6 w-6 text-blue-600" />
              ניהול מפת מקומות
            </h1>
            {currentMapId && (
              <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                {maps.find(m => m.id === currentMapId)?.name || 'מפה ללא שם'}
              </span>
            )}
          </div>
          
          <button
            onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {isToolbarCollapsed ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className={`bg-white/80 backdrop-blur-sm border-l border-gray-200 transition-all duration-300 ${
          isToolbarCollapsed ? 'w-16' : 'w-80'
        } flex flex-col`}>
          
          {/* Main Tools */}
          <div className="p-4 border-b border-gray-200">
            <h3 className={`font-semibold text-gray-900 mb-3 ${isToolbarCollapsed ? 'hidden' : 'block'}`}>
              כלים עיקריים
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {mainTools.map(tool => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={tool.onClick}
                    disabled={tool.disabled}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                      tool.active
                        ? 'bg-blue-100 text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    } ${tool.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${
                      isToolbarCollapsed ? 'justify-center' : ''
                    }`}
                    title={isToolbarCollapsed ? tool.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isToolbarCollapsed && (
                      <>
                        <span className="font-medium">{tool.label}</span>
                        {tool.shortcut && (
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded ml-auto">
                            {tool.shortcut}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Edit Tools */}
          <div className="p-4 border-b border-gray-200">
            <h3 className={`font-semibold text-gray-900 mb-3 ${isToolbarCollapsed ? 'hidden' : 'block'}`}>
              עריכה
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {editTools.map(tool => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={tool.onClick}
                    disabled={tool.disabled}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                      tool.variant === 'danger'
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    } ${tool.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${
                      isToolbarCollapsed ? 'justify-center' : ''
                    }`}
                    title={isToolbarCollapsed ? tool.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isToolbarCollapsed && (
                      <span className="font-medium">{tool.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* View Tools */}
          <div className="p-4 border-b border-gray-200">
            <h3 className={`font-semibold text-gray-900 mb-3 ${isToolbarCollapsed ? 'hidden' : 'block'}`}>
              תצוגה
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {viewTools.map(tool => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={tool.onClick}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                      tool.active
                        ? 'bg-green-100 text-green-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    } ${isToolbarCollapsed ? 'justify-center' : ''}`}
                    title={isToolbarCollapsed ? tool.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isToolbarCollapsed && (
                      <span className="font-medium">{tool.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Map Tools */}
          <div className="p-4 border-b border-gray-200">
            <h3 className={`font-semibold text-gray-900 mb-3 ${isToolbarCollapsed ? 'hidden' : 'block'}`}>
              ניהול מפה
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {mapTools.map(tool => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={tool.onClick}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                      tool.variant === 'primary'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : tool.variant === 'danger'
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    } ${isToolbarCollapsed ? 'justify-center' : ''}`}
                    title={isToolbarCollapsed ? tool.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isToolbarCollapsed && (
                      <span className="font-medium">{tool.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zoom Controls */}
          {!isToolbarCollapsed && (
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">זום</h3>
              <div className="flex items-center justify-between mb-3">
                <MapZoomControls setZoom={setZoom} onFit={fitToScreen} />
                <span className="text-sm text-gray-600">{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* PDF Export */}
          {!isToolbarCollapsed && (
            <div className="p-4 flex-1">
              <h3 className="font-semibold text-gray-900 mb-3">ייצוא PDF</h3>
              <PdfToolbar 
                wrapperRef={mapContainerRef}
                mapLayerRef={mapLayerRef}
              />
            </div>
          )}
        </div>

        {/* Map Area */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={mapContainerRef}
            className="absolute inset-0 bg-white"
            style={{
              backgroundImage: gridSettings.showGrid 
                ? `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`
                : 'none',
              backgroundSize: gridSettings.showGrid 
                ? `${gridSettings.gridSize * zoom}px ${gridSettings.gridSize * zoom}px`
                : 'auto',
              backgroundPosition: `${mapOffset.x % (gridSettings.gridSize * zoom)}px ${mapOffset.y % (gridSettings.gridSize * zoom)}px`
            }}
          >
            <div
              ref={mapLayerRef}
              className="absolute inset-0"
              style={{
                transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${zoom})`,
                transformOrigin: '0 0'
              }}
            >
              {/* Render benches */}
              {benches.map(bench => (
                <div
                  key={bench.id}
                  className={`absolute rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedBenches.includes(bench.id)
                      ? 'border-blue-500 shadow-lg'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${bench.locked ? 'opacity-75' : ''}`}
                  style={{
                    left: bench.position.x,
                    top: bench.position.y,
                    width: bench.type === 'special' ? bench.width : 
                      bench.orientation === 'horizontal' ? bench.seatCount * 60 + 20 : 80,
                    height: bench.type === 'special' ? bench.height :
                      bench.orientation === 'horizontal' ? 80 : bench.seatCount * 60 + 20,
                    backgroundColor: `${bench.color}20`,
                    borderColor: selectedBenches.includes(bench.id) ? '#3B82F6' : bench.color,
                  }}
                  onClick={() => {
                    if (selectedTool === 'multiSelect') {
                      setSelectedBenches(prev => 
                        prev.includes(bench.id)
                          ? prev.filter(id => id !== bench.id)
                          : [...prev, bench.id]
                      );
                    } else {
                      setSelectedBenches([bench.id]);
                    }
                  }}
                >
                  {/* Bench content */}
                  {bench.type === 'special' ? (
                    <div className="absolute inset-0 flex items-center justify-center text-center">
                      <div>
                        <div className="text-2xl mb-1">{bench.icon}</div>
                        <div className="text-xs font-semibold text-gray-700">{bench.name}</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Bench label */}
                      <div className="absolute -top-6 left-0 text-xs font-semibold text-gray-700 bg-white px-2 py-1 rounded shadow-sm">
                        {bench.name}
                      </div>
                      
                      {/* Seats */}
                      {seats
                        .filter(seat => seat.benchId === bench.id)
                        .map((seat, index) => {
                          const status = getSeatStatus(seat);
                          return (
                            <div
                              key={seat.id}
                              className={`absolute w-12 h-12 rounded-lg flex items-center justify-center text-xs text-white border-2 border-white cursor-pointer transition-all duration-200 hover:scale-105 ${status.color}`}
                              style={{
                                left: bench.orientation === 'horizontal' ? index * 60 + 10 : 10,
                                top: bench.orientation === 'horizontal' ? 10 : index * 60 + 10,
                              }}
                              title={
                                status.worshiper
                                  ? `${status.worshiper.title} ${status.worshiper.firstName} ${status.worshiper.lastName}`
                                  : `מקום ${seat.id} - פנוי`
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSeat(seat);
                                setShowWorshiperAssignment(true);
                              }}
                            >
                              {seat.id}
                            </div>
                          );
                        })}
                    </>
                  )}
                  
                  {/* Lock indicator */}
                  {bench.locked && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                      <Lock className="h-3 w-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Status Bar */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>כלי: {mainTools.find(t => t.active)?.label || 'בחירה'}</span>
              <span>זום: {Math.round(zoom * 100)}%</span>
              <span>נבחרו: {selectedBenches.length} ספסלים</span>
              <span>סה"כ: {benches.length} ספסלים, {seats.length} מקומות</span>
            </div>
          </div>
        </div>
      </div>

      {/* Worshiper Assignment Modal */}
      {showWorshiperAssignment && selectedSeat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">הקצאת מתפלל למקום {selectedSeat.id}</h3>
            
            <select
              value={selectedSeat.userId || ''}
              onChange={(e) => {
                const userId = e.target.value || undefined;
                setSeats(prev => prev.map(s => 
                  s.id === selectedSeat.id ? { ...s, userId } : s
                ));
                setSelectedSeat({ ...selectedSeat, userId });
              }}
              className="w-full p-2 border rounded-lg mb-4"
            >
              <option value="">בחר מתפלל...</option>
              {worshipers.map(w => (
                <option key={w.id} value={w.id}>
                  {w.title} {w.firstName} {w.lastName}
                </option>
              ))}
            </select>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowWorshiperAssignment(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                ביטול
              </button>
              <button
                onClick={() => setShowWorshiperAssignment(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                שמור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatsManagement;
