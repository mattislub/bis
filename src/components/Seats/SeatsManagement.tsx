import React, { useState, useRef, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Bench, Seat, Worshiper } from '../../types';
import { specialElements } from './specialElements';
import MapZoomControls from './MapZoomControls';
import PdfToolbar from './PdfToolbar';
import {
  Plus,
  Grid3X3,
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
  ArrowDownRight,
  Eye,
  EyeOff,
  Palette,
  MousePointer,
  Layers,
  Download,
  Upload,
  Maximize2,
  Grid,
  Target,
} from 'lucide-react';

const benchColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4',
  '#1F2937', '#6366F1', '#14B8A6', '#D946EF', '#F97316', '#84CC16',
  '#E879F9', '#22D3EE', '#F43F5E', '#A855F7'
];

type Tool = 'select' | 'add' | 'multiSelect' | 'pan';

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
    saveCurrentMap,
    maps,
    currentMapId,
    loadMap,
  } = useAppContext();

  // State management
  const [selectedBench, setSelectedBench] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Set<number>>(new Set());
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showWorshiperModal, setShowWorshiperModal] = useState(false);
  const [selectedSeatForWorshiper, setSelectedSeatForWorshiper] = useState<number | null>(null);
  const [newMapName, setNewMapName] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Refs
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapLayerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Utility functions
  const snapToGrid = useCallback((value: number) => {
    if (!gridSettings.snapToGrid) return value;
    return Math.round(value / gridSettings.gridSize) * gridSettings.gridSize;
  }, [gridSettings.snapToGrid, gridSettings.gridSize]);

  const getWorshiperById = useCallback((worshiperId: string): Worshiper | undefined => {
    return worshipers.find(w => w.id === worshiperId);
  }, [worshipers]);

  const getSeatStatus = useCallback((seat: Seat) => {
    if (seat.userId) {
      const worshiper = getWorshiperById(seat.userId);
      return { worshiper, color: 'bg-blue-500' };
    }
    return { worshiper: null, color: 'bg-gray-300' };
  }, [getWorshiperById]);

  // Event handlers
  const handleBenchClick = useCallback((benchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTool === 'select') {
      setSelectedBench(selectedBench === benchId ? null : benchId);
      setSelectedSeats(new Set());
    }
  }, [activeTool, selectedBench]);

  const handleSeatClick = useCallback((seatId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTool === 'select') {
      setSelectedSeatForWorshiper(seatId);
      setShowWorshiperModal(true);
    } else if (activeTool === 'multiSelect') {
      setSelectedSeats(prev => {
        const newSet = new Set(prev);
        if (newSet.has(seatId)) {
          newSet.delete(seatId);
        } else {
          newSet.add(seatId);
        }
        return newSet;
      });
    }
  }, [activeTool]);

  const handleMapClick = useCallback((e: React.MouseEvent) => {
    if (activeTool === 'add') {
      const rect = mapLayerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = snapToGrid((e.clientX - rect.left) / zoom - mapBounds.left);
      const y = snapToGrid((e.clientY - rect.top) / zoom - mapBounds.top);

      const newBench: Bench = {
        id: `bench-${Date.now()}`,
        name: `ספסל ${benches.length + 1}`,
        seatCount: 4,
        position: { x, y },
        orientation: 'horizontal',
        color: benchColors[benches.length % benchColors.length],
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
    } else {
      setSelectedBench(null);
      setSelectedSeats(new Set());
    }
  }, [activeTool, zoom, mapBounds, snapToGrid, benches.length, setBenches, setSeats]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool === 'pan') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y });
    }
  }, [activeTool, mapOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (activeTool === 'pan' && isDragging) {
      setMapOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [activeTool, isDragging, dragStart, setMapOffset]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  // Bench operations
  const deleteBench = useCallback((benchId: string) => {
    setBenches(prev => prev.filter(b => b.id !== benchId));
    setSeats(prev => prev.filter(s => s.benchId !== benchId));
    setSelectedBench(null);
  }, [setBenches, setSeats]);

  const duplicateBench = useCallback((benchId: string, direction: 'right' | 'down') => {
    const bench = benches.find(b => b.id === benchId);
    if (!bench) return;

    const offset = direction === 'right' ? { x: 100, y: 0 } : { x: 0, y: 100 };
    const newBench: Bench = {
      ...bench,
      id: `bench-${Date.now()}`,
      name: `${bench.name} (עותק)`,
      position: {
        x: bench.position.x + offset.x,
        y: bench.position.y + offset.y,
      },
    };

    setBenches(prev => [...prev, newBench]);

    // Create seats for the duplicated bench
    const benchSeats = seats.filter(s => s.benchId === benchId);
    const newSeats: Seat[] = benchSeats.map((seat, index) => ({
      ...seat,
      id: Date.now() + index,
      benchId: newBench.id,
    }));
    setSeats(prev => [...prev, ...newSeats]);
  }, [benches, seats, setBenches, setSeats]);

  const rotateBench = useCallback((benchId: string) => {
    setBenches(prev => prev.map(b => 
      b.id === benchId 
        ? { ...b, orientation: b.orientation === 'horizontal' ? 'vertical' : 'horizontal' }
        : b
    ));
  }, [setBenches]);

  const toggleBenchLock = useCallback((benchId: string) => {
    setBenches(prev => prev.map(b => 
      b.id === benchId ? { ...b, locked: !b.locked } : b
    ));
  }, [setBenches]);

  const changeBenchColor = useCallback((benchId: string, color: string) => {
    setBenches(prev => prev.map(b => 
      b.id === benchId ? { ...b, color } : b
    ));
    setShowColorPicker(null);
  }, [setBenches]);

  // Map operations
  const clearMap = useCallback(() => {
    if (window.confirm('האם אתה בטוח שברצונך לנקות את המפה?')) {
      setBenches([]);
      setSeats([]);
      setSelectedBench(null);
      setSelectedSeats(new Set());
    }
  }, [setBenches, setSeats]);

  const renumberSeats = useCallback(() => {
    let seatId = 1;
    const updatedSeats = seats.map(seat => ({ ...seat, id: seatId++ }));
    setSeats(updatedSeats);
  }, [seats, setSeats]);

  const createRow = useCallback(() => {
    if (!selectedBench) return;
    
    const bench = benches.find(b => b.id === selectedBench);
    if (!bench) return;

    const newBench: Bench = {
      ...bench,
      id: `bench-${Date.now()}`,
      name: `${bench.name} (שורה)`,
      position: {
        x: bench.position.x,
        y: bench.position.y + 100,
      },
    };

    setBenches(prev => [...prev, newBench]);

    // Create seats for the new row
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
  }, [selectedBench, benches, setBenches, setSeats]);

  // Special elements
  const addSpecialElement = useCallback((elementType: string) => {
    const element = specialElements.find(e => e.id === elementType);
    if (!element) return;

    const newElement: Bench = {
      ...element,
      id: `${element.id}-${Date.now()}`,
      position: { x: 400, y: 300 },
      seatCount: 0,
      orientation: 'horizontal',
      locked: false,
      temporary: false,
    };

    setBenches(prev => [...prev, newElement]);
  }, [setBenches]);

  // File operations
  const exportMap = useCallback(() => {
    const mapData = {
      benches,
      seats,
      mapBounds,
      mapOffset,
      gridSettings,
    };
    const dataStr = JSON.stringify(mapData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'map-export.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [benches, seats, mapBounds, mapOffset, gridSettings]);

  const importMap = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const mapData = JSON.parse(event.target?.result as string);
        setBenches(mapData.benches || []);
        setSeats(mapData.seats || []);
        setMapBounds(mapData.mapBounds || { top: 20, right: 20, bottom: 20, left: 20 });
        setMapOffset(mapData.mapOffset || { x: 0, y: 0 });
        if (mapData.gridSettings) {
          setGridSettings(mapData.gridSettings);
        }
      } catch (error) {
        console.error(error);
        alert('שגיאה בקריאת הקובץ');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [setBenches, setSeats, setMapBounds, setMapOffset, setGridSettings]);

  // Fit to screen
  const fitToScreen = useCallback(() => {
    if (!wrapperRef.current || benches.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    benches.forEach(bench => {
      const width = bench.type === 'special' ? (bench.width || 0) : 
        (bench.orientation === 'horizontal' ? bench.seatCount * 60 + 20 : 80);
      const height = bench.type === 'special' ? (bench.height || 0) : 
        (bench.orientation === 'horizontal' ? 80 : bench.seatCount * 60 + 20);

      minX = Math.min(minX, bench.position.x);
      minY = Math.min(minY, bench.position.y);
      maxX = Math.max(maxX, bench.position.x + width);
      maxY = Math.max(maxY, bench.position.y + height);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const containerWidth = wrapperRef.current.clientWidth;
    const containerHeight = wrapperRef.current.clientHeight;

    const scaleX = containerWidth / (contentWidth + 100);
    const scaleY = containerHeight / (contentHeight + 100);
    const newZoom = Math.min(scaleX, scaleY, 2);

    setZoom(newZoom);
    setMapOffset({
      x: (containerWidth - contentWidth * newZoom) / 2 - minX * newZoom,
      y: (containerHeight - contentHeight * newZoom) / 2 - minY * newZoom,
    });
  }, [benches, setMapOffset]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50" dir="rtl">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Grid className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">ניהול מפת המושבים</h1>
              <p className="text-sm text-gray-600">עצב וארגן את מפת בית הכנסת שלך</p>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg"
            >
              <Save className="h-4 w-4" />
              שמור
            </button>
            <button
              onClick={fitToScreen}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg"
            >
              <Maximize2 className="h-4 w-4" />
              התאם למסך
            </button>
          </div>
        </div>

        {/* Main Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tools Section */}
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-xl">
            <span className="text-xs font-semibold text-gray-600 px-2">כלים:</span>
            <button
              onClick={() => setActiveTool('select')}
              className={`p-2 rounded-lg transition-all ${
                activeTool === 'select' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="בחירה"
            >
              <MousePointer className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActiveTool('add')}
              className={`p-2 rounded-lg transition-all ${
                activeTool === 'add' 
                  ? 'bg-green-500 text-white shadow-md' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="הוסף ספסל"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActiveTool('multiSelect')}
              className={`p-2 rounded-lg transition-all ${
                activeTool === 'multiSelect' 
                  ? 'bg-purple-500 text-white shadow-md' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="בחירה מרובה"
            >
              <BoxSelect className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActiveTool('pan')}
              className={`p-2 rounded-lg transition-all ${
                activeTool === 'pan' 
                  ? 'bg-orange-500 text-white shadow-md' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="הזזת מפה"
            >
              <Hand className="h-4 w-4" />
            </button>
          </div>

          {/* Map Actions */}
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-xl">
            <span className="text-xs font-semibold text-gray-600 px-2">מפה:</span>
            <button
              onClick={createRow}
              disabled={!selectedBench}
              className="p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="צור שורה"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setGridSettings(prev => ({ ...prev, showGrid: !prev.showGrid }))}
              className={`p-2 rounded-lg transition-all ${
                gridSettings.showGrid 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="הצג/הסתר רשת"
            >
              {gridSettings.showGrid ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setGridSettings(prev => ({ ...prev, snapToGrid: !prev.snapToGrid }))}
              className={`p-2 rounded-lg transition-all ${
                gridSettings.snapToGrid 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="הצמד לרשת"
            >
              <Target className="h-4 w-4" />
            </button>
            <button
              onClick={renumberSeats}
              className="p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-50 transition-all"
              title="מספר מחדש"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              onClick={clearMap}
              className="p-2 rounded-lg bg-white text-red-600 hover:bg-red-50 transition-all"
              title="נקה מפה"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* File Operations */}
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-xl">
            <span className="text-xs font-semibold text-gray-600 px-2">קבצים:</span>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={importMap}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-50 transition-all"
              title="ייבא מפה"
            >
              <Upload className="h-4 w-4" />
            </button>
            <button
              onClick={exportMap}
              className="p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-50 transition-all"
              title="ייצא מפה"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>

          {/* Special Elements */}
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-xl">
            <span className="text-xs font-semibold text-gray-600 px-2">אלמנטים:</span>
            {specialElements.slice(0, 3).map(element => (
              <button
                key={element.id}
                onClick={() => addSpecialElement(element.id)}
                className="p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-50 transition-all text-sm"
                title={element.name}
              >
                {element.icon}
              </button>
            ))}
          </div>

          {/* Zoom Controls */}
          <div className="mr-auto">
            <MapZoomControls setZoom={setZoom} onFit={fitToScreen} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white/90 backdrop-blur-sm shadow-lg border-l border-gray-200 p-4 overflow-y-auto">
          {/* Selected Bench Panel */}
          {selectedBench && (
            <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                ספסל נבחר
              </h3>
              {(() => {
                const bench = benches.find(b => b.id === selectedBench);
                if (!bench) return null;
                
                return (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-700">
                      <strong>{bench.name}</strong>
                    </div>
                    
                    {/* Bench Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => toggleBenchLock(selectedBench)}
                        className={`flex items-center justify-center gap-1 p-2 rounded-lg text-xs transition-all ${
                          bench.locked 
                            ? 'bg-red-500 text-white' 
                            : 'bg-green-500 text-white'
                        }`}
                      >
                        {bench.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                        {bench.locked ? 'נעול' : 'פתוח'}
                      </button>
                      <button
                        onClick={() => rotateBench(selectedBench)}
                        className="flex items-center justify-center gap-1 p-2 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition-all"
                      >
                        <RotateCw className="h-3 w-3" />
                        סובב
                      </button>
                      <button
                        onClick={() => duplicateBench(selectedBench, 'right')}
                        className="flex items-center justify-center gap-1 p-2 bg-purple-500 text-white rounded-lg text-xs hover:bg-purple-600 transition-all"
                      >
                        <Copy className="h-3 w-3" />
                        <ArrowRight className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => duplicateBench(selectedBench, 'down')}
                        className="flex items-center justify-center gap-1 p-2 bg-purple-500 text-white rounded-lg text-xs hover:bg-purple-600 transition-all"
                      >
                        <Copy className="h-3 w-3" />
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Color Picker */}
                    <div>
                      <button
                        onClick={() => setShowColorPicker(showColorPicker === selectedBench ? null : selectedBench)}
                        className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-all w-full"
                      >
                        <Palette className="h-4 w-4" />
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: bench.color }}
                        />
                        <span className="text-sm">שנה צבע</span>
                      </button>
                      
                      {showColorPicker === selectedBench && (
                        <div className="mt-2 grid grid-cols-4 gap-2">
                          {benchColors.map(color => (
                            <button
                              key={color}
                              onClick={() => changeBenchColor(selectedBench, color)}
                              className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-all"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => deleteBench(selectedBench)}
                      className="flex items-center justify-center gap-2 p-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-all w-full"
                    >
                      <Trash2 className="h-4 w-4" />
                      מחק ספסל
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Maps List */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Layers className="h-5 w-5 text-green-600" />
              מפות שמורות
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {maps.map(map => (
                <div
                  key={map.id}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    currentMapId === map.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => loadMap(map.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{map.name}</span>
                    {currentMapId === map.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PDF Export */}
          <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-100 rounded-xl border border-orange-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Download className="h-5 w-5 text-orange-600" />
              ייצוא PDF
            </h3>
            <PdfToolbar wrapperRef={wrapperRef} mapLayerRef={mapLayerRef} />
          </div>
        </div>

        {/* Map Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={wrapperRef}
            className="w-full h-full relative cursor-crosshair"
            onClick={handleMapClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Grid */}
            {gridSettings.showGrid && (
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #3B82F6 1px, transparent 1px),
                    linear-gradient(to bottom, #3B82F6 1px, transparent 1px)
                  `,
                  backgroundSize: `${gridSettings.gridSize * zoom}px ${gridSettings.gridSize * zoom}px`,
                  transform: `translate(${mapOffset.x}px, ${mapOffset.y}px)`,
                }}
              />
            )}

            {/* Map Layer */}
            <div
              ref={mapLayerRef}
              className="absolute inset-0"
              style={{
                transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${zoom})`,
                transformOrigin: 'top left',
              }}
            >
              {/* Benches */}
              {benches.map(bench => (
                <div
                  key={bench.id}
                  className={`absolute rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    selectedBench === bench.id
                      ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${bench.locked ? 'opacity-75' : ''}`}
                  style={{
                    left: bench.position.x + mapBounds.left,
                    top: bench.position.y + mapBounds.top,
                    width: bench.type === 'special' ? bench.width : 
                      (bench.orientation === 'horizontal' ? bench.seatCount * 60 + 20 : 80),
                    height: bench.type === 'special' ? bench.height : 
                      (bench.orientation === 'horizontal' ? 80 : bench.seatCount * 60 + 20),
                    backgroundColor: `${bench.color}15`,
                    borderColor: bench.color,
                  }}
                  onClick={(e) => handleBenchClick(bench.id, e)}
                >
                  {/* Bench Label */}
                  <div className="absolute -top-6 left-0 text-xs font-semibold text-gray-700 bg-white px-2 py-1 rounded shadow-sm">
                    {bench.name}
                  </div>

                  {/* Lock Indicator */}
                  {bench.locked && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <Lock className="h-3 w-3 text-white" />
                    </div>
                  )}

                  {/* Seats or Special Content */}
                  {bench.type === 'special' ? (
                    <div className="absolute inset-0 flex items-center justify-center text-center">
                      <div>
                        <div className="text-2xl mb-1">{bench.icon}</div>
                        <div className="text-xs font-semibold text-gray-700">{bench.name}</div>
                      </div>
                    </div>
                  ) : (
                    seats
                      .filter(seat => seat.benchId === bench.id)
                      .map((seat, index) => {
                        const status = getSeatStatus(seat);
                        return (
                          <div
                            key={seat.id}
                            className={`absolute w-12 h-12 rounded-lg flex items-center justify-center text-xs text-white border-2 border-white cursor-pointer transition-all hover:scale-105 ${
                              status.color
                            } ${selectedSeats.has(seat.id) ? 'ring-2 ring-yellow-400' : ''}`}
                            style={{
                              left: bench.orientation === 'horizontal' ? index * 60 + 10 : 10,
                              top: bench.orientation === 'horizontal' ? 10 : index * 60 + 10,
                            }}
                            onClick={(e) => handleSeatClick(seat.id, e)}
                            title={
                              status.worshiper
                                ? `${status.worshiper.title} ${status.worshiper.firstName} ${status.worshiper.lastName}`
                                : 'מקום פנוי - לחץ להקצאה'
                            }
                          >
                            <span className="font-bold">{seat.id}</span>
                          </div>
                        );
                      })
                  )}

                  {/* Resize Handles for Special Elements */}
                  {bench.type === 'special' && selectedBench === bench.id && (
                    <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize">
                      <ArrowDownRight className="h-3 w-3 text-white m-0.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Status Bar */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-gray-200">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>זום: {Math.round(zoom * 100)}%</span>
                <span>ספסלים: {benches.length}</span>
                <span>מקומות: {seats.length}</span>
                <span>כלי פעיל: {
                  activeTool === 'select' ? 'בחירה' :
                  activeTool === 'add' ? 'הוספה' :
                  activeTool === 'multiSelect' ? 'בחירה מרובה' :
                  'הזזה'
                }</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showWorshiperModal && selectedSeatForWorshiper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">הקצה מקום</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  setSeats(prev => prev.map(s => 
                    s.id === selectedSeatForWorshiper ? { ...s, userId: undefined } : s
                  ));
                  setShowWorshiperModal(false);
                  setSelectedSeatForWorshiper(null);
                }}
                className="w-full p-3 text-right bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
              >
                פנה מקום
              </button>
              {worshipers.map(worshiper => (
                <button
                  key={worshiper.id}
                  onClick={() => {
                    setSeats(prev => prev.map(s => 
                      s.id === selectedSeatForWorshiper ? { ...s, userId: worshiper.id } : s
                    ));
                    setShowWorshiperModal(false);
                    setSelectedSeatForWorshiper(null);
                  }}
                  className="w-full p-3 text-right bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                >
                  {worshiper.title} {worshiper.firstName} {worshiper.lastName}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setShowWorshiperModal(false);
                setSelectedSeatForWorshiper(null);
              }}
              className="mt-4 w-full p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">שמור מפה</h3>
            <input
              type="text"
              value={newMapName}
              onChange={(e) => setNewMapName(e.target.value)}
              placeholder="שם המפה"
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (newMapName.trim()) {
                    saveCurrentMap(newMapName.trim());
                    setNewMapName('');
                    setShowSaveDialog(false);
                  }
                }}
                disabled={!newMapName.trim()}
                className="flex-1 p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                שמור
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setNewMapName('');
                }}
                className="flex-1 p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatsManagement;

