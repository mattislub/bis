import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Seat, User, Bench, MapBounds } from '../../types';
import {
  Move,
  User as UserIcon,
  X,
  Plus,
  Trash2,
  Edit2,
  Grid3X3,
  Settings,
  RotateCw,
  Copy,
  Lock,
  Unlock,
  ArrowRight,
  ArrowDown,
  ArrowDownRight
} from 'lucide-react';
import MapBoundsControls from './MapBoundsControls';

const specialElements = [
  {
    id: 'aron-kodesh',
    name: 'ארון הקודש',
    type: 'special',
    width: 120,
    height: 80,
    color: '#8B4513',
    icon: '🕍'
  },
  {
    id: 'bimah',
    name: 'בימה',
    type: 'special',
    width: 100,
    height: 100,
    color: '#654321',
    icon: '📖'
  },
  {
    id: 'amud-tfila',
    name: 'עמוד תפילה',
    type: 'special',
    width: 40,
    height: 60,
    color: '#2F4F4F',
    icon: '🕯️'
  },
  {
    id: 'mizrach',
    name: 'מזרח',
    type: 'special',
    width: 80,
    height: 40,
    color: '#FFD700',
    icon: '🧭'
  },
  {
    id: 'ner-tamid',
    name: 'נר תמיד',
    type: 'special',
    width: 30,
    height: 30,
    color: '#FF6347',
    icon: '🕯️'
  },
  {
    id: 'ezrat-nashim',
    name: 'עזרת נשים',
    type: 'special',
    width: 150,
    height: 100,
    color: '#DDA0DD',
    icon: '👥'
  }
];

const SeatsManagement: React.FC = () => {
  const { seats, setSeats, users, benches, setBenches, gridSettings, setGridSettings, mapBounds, setMapBounds } = useAppContext();
  const [draggedBench, setDraggedBench] = useState<string | null>(null);
  const [selectedBenchIds, setSelectedBenchIds] = useState<string[]>([]);
  const selectedBench = selectedBenchIds.length === 1 ? selectedBenchIds[0] : null;
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [dragStartPositions, setDragStartPositions] = useState<Record<string, { x: number; y: number }> | null>(null);
  const [isAddingBench, setIsAddingBench] = useState(false);
  const [editingBench, setEditingBench] = useState<string | null>(null);
  const [showRowDialog, setShowRowDialog] = useState(false);
  const [rowConfig, setRowConfig] = useState({
    count: 3,
    spacing: 50,
    direction: 'horizontal' as 'horizontal' | 'vertical'
  });
  const [benchForm, setBenchForm] = useState({
    name: '',
    seatCount: 4,
    orientation: 'horizontal' as 'horizontal' | 'vertical',
    color: '#3B82F6'
  });

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);
  const [showSpecialDialog, setShowSpecialDialog] = useState(false);
  const [selectedSpecialId, setSelectedSpecialId] = useState('');

  const [resizingBench, setResizingBench] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<
    { x: number; y: number; width: number; height: number; direction: 'right' | 'bottom' | 'corner' } | null
  >(null);
  const [openSettingsId, setOpenSettingsId] = useState<string | null>(null);

  const handleBoundChange = (side: keyof MapBounds, value: number) => {
    setMapBounds(prev => ({ ...prev, [side]: value }));
  };

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
  ];

  const getUserById = (userId: string): User | undefined => {
    return users.find(user => user.id === userId);
  };

  const snapToGrid = (value: number): number => {
    if (!gridSettings.snapToGrid) return value;
    return Math.round(value / gridSettings.gridSize) * gridSettings.gridSize;
  };

  const handleBenchDragStart = (e: React.DragEvent, benchId: string) => {
    const bench = benches.find(b => b.id === benchId);
    if (bench?.locked) {
      e.preventDefault();
      return;
    }
    let currentSelection = selectedBenchIds;
    if (!currentSelection.includes(benchId)) {
      currentSelection = [benchId];
      setSelectedBenchIds(currentSelection);
      setSelectedSeat(null);
    }
    setDraggedBench(benchId);
    if (currentSelection.length > 1) {
      const positions: Record<string, { x: number; y: number }> = {};
      currentSelection.forEach(id => {
        const b = benches.find(bench => bench.id === id);
        if (b) positions[id] = { ...b.position };
      });
      setDragStartPositions(positions);
    } else {
      setDragStartPositions(null);
    }
    e.dataTransfer.effectAllowed = 'move';
    // Some browsers require data to be set for drag events to fire properly
    e.dataTransfer.setData('text/plain', benchId);
  };

  const handleBenchDragEnd = () => {
    setDraggedBench(null);
    setDragStartPositions(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedBench) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = snapToGrid(e.clientX - rect.left - 40);
    const y = snapToGrid(e.clientY - rect.top - 40);

    const minX = mapBounds.left;
    const minY = mapBounds.top;
    const maxX = rect.width - 200 - mapBounds.right;
    const maxY = rect.height - 200 - mapBounds.bottom;
    const constrainedX = Math.max(minX, Math.min(x, maxX));
    const constrainedY = Math.max(minY, Math.min(y, maxY));

    // העברת ספסל קיים או בחירה מרובה
    if (dragStartPositions && selectedBenchIds.length > 1) {
      const start = dragStartPositions[draggedBench];
      const deltaX = constrainedX - start.x;
      const deltaY = constrainedY - start.y;
      setBenches(prev => prev.map(bench => {
        if (selectedBenchIds.includes(bench.id)) {
          if (bench.locked) return bench;
          const pos = dragStartPositions[bench.id];
          return {
            ...bench,
            position: {
              x: Math.max(minX, Math.min(snapToGrid(pos.x + deltaX), maxX)),
              y: Math.max(minY, Math.min(snapToGrid(pos.y + deltaY), maxY)),
            }
          };
        }
        return bench;
      }));
    } else {
      setBenches(prev => prev.map(bench =>
        bench.id === draggedBench && !bench.locked
          ? { ...bench, position: { x: constrainedX, y: constrainedY } }
          : bench
      ));
    }
  };

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    benchId: string,
    direction: 'right' | 'bottom' | 'corner'
  ) => {
    e.stopPropagation();
    const bench = benches.find(b => b.id === benchId);
    if (!bench || bench.locked) return;
    setResizingBench(benchId);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: bench.width || 0,
      height: bench.height || 0,
      direction,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!resizingBench || !resizeStart) return;
    const dx = e.clientX - resizeStart.x;
    const dy = e.clientY - resizeStart.y;

    setBenches(prev =>
      prev.map(b => {
        if (b.id !== resizingBench) return b;
        const containerWidth = 1200;
        const containerHeight = 800;
        const minWidth = 20;
        const minHeight = 20;
        const maxWidth = containerWidth - b.position.x - mapBounds.right;
        const maxHeight = containerHeight - b.position.y - mapBounds.bottom;
        let newWidth = b.width || 0;
        let newHeight = b.height || 0;
        if (resizeStart.direction === 'right' || resizeStart.direction === 'corner') {
          newWidth = snapToGrid((resizeStart.width || 0) + dx);
          newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
        }
        if (resizeStart.direction === 'bottom' || resizeStart.direction === 'corner') {
          newHeight = snapToGrid((resizeStart.height || 0) + dy);
          newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
        }
        return { ...b, width: newWidth, height: newHeight };
      })
    );
  };

  const handleMouseUp = () => {
    if (resizingBench) {
      setResizingBench(null);
      setResizeStart(null);
    }
  };

  const handleBenchClick = (e: React.MouseEvent, benchId: string) => {
    e.stopPropagation();
    setOpenSettingsId(null);
    if (e.shiftKey) {
      setSelectedBenchIds(prev => prev.includes(benchId)
        ? prev.filter(id => id !== benchId)
        : [...prev, benchId]);
    } else {
      setSelectedBenchIds([benchId]);
    }
    setSelectedSeat(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenuPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const generateSeatsForBench = (bench: Bench): Seat[] => {
    const newSeats: Seat[] = [];
    const maxSeatId = Math.max(...seats.map(s => s.id), 0);
    
    for (let i = 0; i < bench.seatCount; i++) {

      newSeats.push({
        id: maxSeatId + i + 1,
        benchId: bench.id,
        position: { x: 0, y: 0 }, // המיקום יחושב יחסית לספסל
        isOccupied: false,
      });
    }
    
    return newSeats;
  };

  const addNewBench = () => {
    if (!benchForm.name) return;
    const position = pendingPosition || { x: 50, y: 50 };

    const newBench: Bench = {
      id: `bench-${Date.now()}`,
      name: benchForm.name,
      seatCount: benchForm.seatCount,
      position,
      orientation: benchForm.orientation,
      color: benchForm.color,
      locked: false,
    };

    setBenches(prev => [...prev, newBench]);

    const newSeats = generateSeatsForBench(newBench);
    setSeats(prev => [...prev, ...newSeats]);

    setBenchForm({ name: '', seatCount: 4, orientation: 'horizontal', color: '#3B82F6' });
    setPendingPosition(null);
    setIsAddingBench(false);
  };

  const addSpecialElement = () => {
    if (!selectedSpecialId || !pendingPosition) return;
    const preset = specialElements.find(p => p.id === selectedSpecialId);
    if (!preset) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newSpecial: any = {
      id: `special-${Date.now()}`,
      name: preset.name,
      type: 'special',
      position: pendingPosition,
      width: preset.width,
      height: preset.height,
      color: preset.color,
      icon: preset.icon,
      locked: false,
    };
    setBenches(prev => [...prev, newSpecial]);
    setShowSpecialDialog(false);
    setSelectedSpecialId('');
    setPendingPosition(null);
  };

  const updateBench = () => {
    if (!editingBench || !benchForm.name) return;

    setBenches(prev => prev.map(bench => 
      bench.id === editingBench 
        ? { ...bench, name: benchForm.name, color: benchForm.color, orientation: benchForm.orientation }
        : bench
    ));

    // אם השתנה מספר המקומות, נעדכן את המקומות
    const currentBench = benches.find(b => b.id === editingBench);
    if (currentBench && currentBench.seatCount !== benchForm.seatCount) {
      // מחיקת מקומות ישנים
      setSeats(prev => prev.filter(seat => seat.benchId !== editingBench));
      
      // יצירת מקומות חדשים
      const updatedBench = { ...currentBench, seatCount: benchForm.seatCount, orientation: benchForm.orientation };
      setBenches(prev => prev.map(bench => 
        bench.id === editingBench ? updatedBench : bench
      ));
      
      const newSeats = generateSeatsForBench(updatedBench);
      setSeats(prev => [...prev, ...newSeats]);
    }

    setBenchForm({ name: '', seatCount: 4, orientation: 'horizontal', color: '#3B82F6' });
    setEditingBench(null);
  };

  const deleteBench = (benchId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק ספסל זה? כל המקומות שלו יימחקו גם כן.')) {
      setBenches(prev => prev.filter(bench => bench.id !== benchId));
      setSeats(prev => prev.filter(seat => seat.benchId !== benchId));
      setSelectedBenchIds(prev => prev.filter(id => id !== benchId));
    }
  };

  const rotateBench = (benchId: string) => {
    const bench = benches.find(b => b.id === benchId);
    if (!bench) return;

    const newOrientation = bench.orientation === 'horizontal' ? 'vertical' : 'horizontal';
    
    setBenches(prev => prev.map(b => 
      b.id === benchId ? { ...b, orientation: newOrientation } : b
    ));

    // המקומות עכשיו מוכלים בספסל ולא צריכים עדכון מיקום נפרד
  };

  const copyBench = (benchId: string) => {
    const originalBench = benches.find(b => b.id === benchId);
    if (!originalBench) return;

    // יצירת ספסל חדש באותה שורה עם רווח של 0.5 ס"מ (19 פיקסלים)
    const newBench: Bench = {
      ...originalBench,
      id: `bench-${Date.now()}`,
      name: `${originalBench.name} (עותק)`,
      position: {
        x: originalBench.position.x + (originalBench.orientation === 'horizontal' ? originalBench.seatCount * 60 + 20 + 19 : 80 + 19),
        y: originalBench.position.y,
      },
    };

    setBenches(prev => [...prev, newBench]);
    
    // יצירת מקומות חדשים לספסל המועתק
    const newSeats = generateSeatsForBench(newBench);
    setSeats(prev => [...prev, ...newSeats]);
  };

  const toggleBenchLock = (benchId: string) => {
    setBenches(prev => prev.map(bench =>
      bench.id === benchId ? { ...bench, locked: !bench.locked } : bench
    ));
  };

  const assignUserToSeat = (seatId: number, userId: string | null) => {
    setSeats(prev => prev.map(seat => 
      seat.id === seatId 
        ? { ...seat, userId: userId || undefined, isOccupied: !!userId }
        : seat
    ));
    setSelectedSeat(null);
  };

  const getSeatStatus = (seat: Seat) => {
    if (seat.userId) {
      const user = getUserById(seat.userId);
      return {
        isOccupied: true,
        user,
        color: 'bg-blue-500',
        hoverColor: 'hover:bg-blue-600'
      };
    }
    return {
      isOccupied: false,
      user: null,
      color: 'bg-gray-300',
      hoverColor: 'hover:bg-gray-400'
    };
  };

  const renderGrid = () => {
    if (!gridSettings.showGrid) return null;
    
    const gridLines = [];
    const containerWidth = 1200;
    const containerHeight = 800;
    
    for (let x = 0; x <= containerWidth; x += gridSettings.gridSize) {
      gridLines.push(
        <line key={`v-${x}`} x1={x} y1={0} x2={x} y2={containerHeight} stroke="#e5e7eb" strokeWidth="1" opacity="0.3" />
      );
    }
    
    for (let y = 0; y <= containerHeight; y += gridSettings.gridSize) {
      gridLines.push(
        <line key={`h-${y}`} x1={0} y1={y} x2={containerWidth} y2={y} stroke="#e5e7eb" strokeWidth="1" opacity="0.3" />
      );
    }
    
    return (
      <svg className="absolute inset-0 pointer-events-none" width={containerWidth} height={containerHeight}>
        {gridLines}
      </svg>
    );
  };

  const selectedBenchData = selectedBench ? benches.find(b => b.id === selectedBench) : null;
  const selectedSeatData = selectedSeat ? seats.find(s => s.id === selectedSeat) : null;
  const selectedSeatUser = selectedSeatData?.userId ? getUserById(selectedSeatData.userId) : null;

  // טיפול בלחיצות מקלדת
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedBenchIds.length === 0) return;

      const target = e.target as HTMLElement;
      if (target && target.closest('input, textarea, select, [contenteditable="true"]')) return;

      const moveDistance = gridSettings.snapToGrid ? gridSettings.gridSize : 10;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        setBenches(prev => prev.map(bench => {
          if (!selectedBenchIds.includes(bench.id) || bench.locked) return bench;
          let newX = bench.position.x;
          let newY = bench.position.y;
          const minX = mapBounds.left;
          const minY = mapBounds.top;
          const maxY = 720 - mapBounds.bottom;
          const maxX = 1120 - mapBounds.right;
          if (e.key === 'ArrowUp') newY = Math.max(minY, newY - moveDistance);
          if (e.key === 'ArrowDown') newY = Math.min(maxY, newY + moveDistance);
          if (e.key === 'ArrowLeft') newX = Math.max(minX, newX - moveDistance);
          if (e.key === 'ArrowRight') newX = Math.min(maxX, newX + moveDistance);
          return { ...bench, position: { x: newX, y: newY } };
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBenchIds, benches, setBenches, gridSettings, mapBounds]);

  const createBenchRow = () => {
    if (!selectedBench) return;
    
    const sourceBench = benches.find(b => b.id === selectedBench);
    if (!sourceBench) return;
    
    const newBenches: Bench[] = [];
    const newSeats: Seat[] = [];
    
    for (let i = 1; i < rowConfig.count; i++) {
      let newX = sourceBench.position.x;
      let newY = sourceBench.position.y;
      
      if (rowConfig.direction === 'horizontal') {
        // סרגל אופקי - ספסלים זה ליד זה
        const benchWidth = sourceBench.orientation === 'horizontal' 
          ? sourceBench.seatCount * 60 + 20 
          : 80;
        newX = sourceBench.position.x + (benchWidth + rowConfig.spacing) * i;
      } else {
        // סרגל אנכי - ספסלים זה מתחת לזה
        const benchHeight = sourceBench.orientation === 'vertical' 
          ? sourceBench.seatCount * 60 + 20 
          : 80;
        newY = sourceBench.position.y + (benchHeight + rowConfig.spacing) * i;
      }
      
      const newBench: Bench = {
        ...sourceBench,
        id: `bench-${Date.now()}-${i}`,
        name: `${sourceBench.name} ${i + 1}`,
        position: { x: newX, y: newY },
      };
      
      newBenches.push(newBench);
      
      // יצירת מקומות לספסל החדש
      const benchSeats = generateSeatsForBench(newBench);
      newSeats.push(...benchSeats);
    }
    
    setBenches(prev => [...prev, ...newBenches]);
    setSeats(prev => [...prev, ...newSeats]);
    setShowRowDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ניהול מקומות ישיבה</h1>
          <p className="text-gray-600 mt-2">גרור ושחרר ספסלים ומקומות ישיבה לעיצוב הפריסה הרצויה</p>
        </div>
        
        <div className="flex space-x-3 space-x-reverse">
          <button
            onClick={() => setIsAddingBench(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 ml-2" />
            הוסף ספסל
          </button>
          {selectedBench && (
            <button
              onClick={() => setShowRowDialog(true)}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Grid3X3 className="h-4 w-4 ml-2" />
              צור סרגל
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-600">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Move className="h-4 w-4" />
                  <span>גרור ספסלים או השתמש בחיצי המקלדת</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>תפוס</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-4 h-4 bg-gray-300 rounded"></div>
                  <span>פנוי</span>
                </div>
                {selectedBenchIds.length > 0 && (
                  <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
                    <span>← → ↑ ↓</span>
                    <span>הזז עם חיצי המקלדת</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3 space-x-reverse">
                <button
                  onClick={() => setGridSettings(prev => ({ ...prev, showGrid: !prev.showGrid }))}
                  className={`p-2 rounded-lg transition-colors ${
                    gridSettings.showGrid ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}
                  title="הצג/הסתר רשת"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setGridSettings(prev => ({ ...prev, snapToGrid: !prev.snapToGrid }))}
                  className={`p-2 rounded-lg transition-colors ${
                    gridSettings.snapToGrid ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}
                  title="הצמד לרשת"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse mb-4 text-sm">
              <label className="text-gray-600">עליון:</label>
              <input
                type="number"
                className="w-16 px-2 py-1 border rounded"
                value={mapBounds.top}
                onChange={(e) => handleBoundChange('top', Number(e.target.value))}
              />
              <label className="text-gray-600">ימין:</label>
              <input
                type="number"
                className="w-16 px-2 py-1 border rounded"
                value={mapBounds.right}
                onChange={(e) => handleBoundChange('right', Number(e.target.value))}
              />
              <label className="text-gray-600">תחתון:</label>
              <input
                type="number"
                className="w-16 px-2 py-1 border rounded"
                value={mapBounds.bottom}
                onChange={(e) => handleBoundChange('bottom', Number(e.target.value))}
              />
              <label className="text-gray-600">שמאל:</label>
              <input
                type="number"
                className="w-16 px-2 py-1 border rounded"
                value={mapBounds.left}
                onChange={(e) => handleBoundChange('left', Number(e.target.value))}
              />
            </div>

            <div
              className="relative border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 overflow-hidden"
              style={{ minHeight: '800px', width: '1200px', maxWidth: '100%' }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onContextMenu={handleContextMenu}
              onClick={() => { setContextMenuPos(null); setSelectedBenchIds([]); setSelectedSeat(null); setOpenSettingsId(null); }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {renderGrid()}

              <MapBoundsControls />

              {/* רינדור ספסלים */}
              {benches.map((bench) => (
                <div
                  key={bench.id}
                  className={`absolute rounded-lg shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${
                    bench.locked ? 'cursor-not-allowed' : 'cursor-move'
                  } ${selectedBenchIds.includes(bench.id) ? 'ring-4 ring-blue-300' : ''} ${
                    draggedBench === bench.id ? 'opacity-50' : ''
                  }`}
                  style={{
                    left: `${bench.position.x}px`,
                    top: `${bench.position.y}px`,
                    width: bench.type === 'special' ? `${bench.width}px` :
                           bench.orientation === 'horizontal' ? `${bench.seatCount * 60 + 20}px` : '80px',
                    height: bench.type === 'special' ? `${bench.height}px` :
                            bench.orientation === 'horizontal' ? '80px' : `${bench.seatCount * 60 + 20}px`,
                    backgroundColor: `${bench.color}20`,
                    borderColor: bench.color,
                  }}
                  draggable={!bench.locked}
                  onDragStart={(e) => handleBenchDragStart(e, bench.id)}
                  onDragEnd={handleBenchDragEnd}
                  onClick={(e) => handleBenchClick(e, bench.id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenSettingsId(openSettingsId === bench.id ? null : bench.id);
                    }}
                    className="absolute top-1 left-1 z-10 p-1 bg-white rounded shadow-md hover:bg-gray-50 transition-colors"
                    title="הגדרות"
                  >
                    <Settings className="h-3 w-3 text-gray-600" />
                  </button>
                  {openSettingsId === bench.id && (
                    <div className="absolute top-1 left-7 z-20 flex space-x-1 space-x-reverse p-1 bg-white rounded shadow-md">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBenchLock(bench.id);
                        }}
                        className="p-1 hover:bg-gray-50 rounded"
                        title={bench.locked ? 'שחרר קיבוע' : 'קבע ספסל'}
                      >
                        {bench.locked ? (
                          <Unlock className="h-3 w-3 text-gray-600" />
                        ) : (
                          <Lock className="h-3 w-3 text-gray-600" />
                        )}
                      </button>
                      {bench.type !== 'special' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            rotateBench(bench.id);
                          }}
                          className="p-1 hover:bg-gray-50 rounded"
                          title="סובב ספסל"
                        >
                          <RotateCw className="h-3 w-3 text-gray-600" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyBench(bench.id);
                        }}
                        className="p-1 hover:bg-gray-50 rounded"
                        title={bench.type === 'special' ? 'העתק אלמנט' : 'העתק ספסל'}
                      >
                        <Copy className="h-3 w-3 text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBench(bench.id);
                        }}
                        className="p-1 hover:bg-red-50 rounded"
                        title={bench.type === 'special' ? 'מחק אלמנט' : 'מחק ספסל'}
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </button>
                    </div>
                  )}
                  <div
                    className="absolute top-1 right-1 px-2 py-1 rounded text-xs font-semibold text-white"
                    style={{ backgroundColor: bench.color }}
                  >
                    {bench.type === 'special' && bench.icon && (
                      <span className="ml-1">{bench.icon}</span>
                    )}
                    {bench.name}
                  </div>
                  


                  {bench.type === 'special' && !bench.locked && (
                    <>
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, bench.id, 'right')}
                        className="absolute top-1/2 -right-3 p-0.5 bg-blue-500 text-white cursor-e-resize transform -translate-y-1/2"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </div>
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, bench.id, 'bottom')}
                        className="absolute left-1/2 -bottom-3 p-0.5 bg-blue-500 text-white cursor-s-resize transform -translate-x-1/2"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </div>
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, bench.id, 'corner')}
                        className="absolute -bottom-3 -right-3 p-0.5 bg-blue-500 text-white cursor-se-resize"
                      >
                        <ArrowDownRight className="h-3 w-3" />
                      </div>
                    </>
                  )}

                  {/* מקומות ישיבה בתוך הספסל */}
                  {bench.type !== 'special' && seats
                    .filter(seat => seat.benchId === bench.id)
                    .map((seat, index) => {
                      const status = getSeatStatus(seat);
                      
                      return (
                        <div
                          key={seat.id}
                          className={`absolute w-12 h-12 ${status.color} ${status.hoverColor} rounded-lg shadow-md transition-all duration-200 cursor-pointer transform hover:scale-110 flex items-center justify-center group border-2 border-white ${
                            selectedSeat === seat.id ? 'ring-4 ring-blue-300' : ''
                          }`}
                          style={{
                            left: bench.orientation === 'horizontal' ? `${index * 60 + 10}px` : '10px',
                            top: bench.orientation === 'horizontal' ? '10px' : `${index * 60 + 10}px`,
                            zIndex: 10,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSeat(seat.id);
                            setSelectedBenchIds([]);
                          }}
                          title={status.user ? `${status.user.name} - ${status.user.department}` : `מקום ${seat.id} - פנוי`}
                        >
                          <div className="text-white font-bold text-xs">{seat.id}</div>
                          
                          {status.user && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                              <UserIcon className="h-2 w-2 text-white" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  
                  {/* תוכן אלמנט מיוחד */}
                  {bench.type === 'special' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl mb-1">{bench.icon}</div>
                        <div className="text-xs font-semibold text-gray-700">{bench.name}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {contextMenuPos && (
                <div
                  className="absolute z-50 bg-white border rounded shadow-lg"
                  style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
                >
                  <button
                    className="block w-full px-4 py-2 text-right hover:bg-gray-100"
                    onClick={() => {
                      setPendingPosition(contextMenuPos);
                      setIsAddingBench(true);
                      setContextMenuPos(null);
                    }}
                  >
                    הוסף ספסל כאן
                  </button>
                  <button
                    className="block w-full px-4 py-2 text-right hover:bg-gray-100"
                    onClick={() => {
                      setPendingPosition(contextMenuPos);
                      setShowSpecialDialog(true);
                      setContextMenuPos(null);
                    }}
                  >
                    הוסף אלמנט קבוע כאן
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* הוספת/עריכת ספסל */}
          {(isAddingBench || editingBench) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-md border border-green-200 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingBench ? 'עריכת ספסל' : 'הוספת ספסל חדש'}
                  </h3>
                  <button
                    onClick={() => {
                      setIsAddingBench(false);
                      setEditingBench(null);
                      setBenchForm({ name: '', seatCount: 4, orientation: 'horizontal', color: '#3B82F6' });
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">שם הספסל</label>
                    <input
                      type="text"
                      value={benchForm.name}
                      onChange={(e) => setBenchForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="הכנס שם לספסל"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">מספר מקומות</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={benchForm.seatCount}
                      onChange={(e) => setBenchForm(prev => ({ ...prev, seatCount: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">כיוון</label>
                    <select
                      value={benchForm.orientation}
                      onChange={(e) => setBenchForm(prev => ({ ...prev, orientation: e.target.value as 'horizontal' | 'vertical' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="horizontal">אופקי</option>
                      <option value="vertical">אנכי</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">צבע</label>
                    <div className="grid grid-cols-4 gap-2">
                      {colors.map(color => (
                        <button
                          key={color}
                          onClick={() => setBenchForm(prev => ({ ...prev, color }))}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${
                            benchForm.color === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={editingBench ? updateBench : addNewBench}
                    disabled={!benchForm.name}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    {editingBench ? 'עדכן ספסל' : 'הוסף ספסל'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showSpecialDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-md border border-purple-200 w-full max-w-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">הוספת אלמנט קבוע</h3>
                  <button
                    onClick={() => {
                      setShowSpecialDialog(false);
                      setSelectedSpecialId('');
                      setPendingPosition(null);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">בחר אלמנט</label>
                    <select
                      value={selectedSpecialId}
                      onChange={(e) => setSelectedSpecialId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="" disabled>בחר...</option>
                      {specialElements.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={addSpecialElement}
                    disabled={!selectedSpecialId}
                    className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף אלמנט
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* פרטי ספסל נבחר */}
          {selectedBench && selectedBenchData && !isAddingBench && !editingBench && (
            <div className="bg-white p-6 rounded-lg shadow-md border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{selectedBenchData.name}</h3>
                <button
                  onClick={() => setSelectedBenchIds([])}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">מקומות:</span>
                  <span className="font-semibold">{selectedBenchData.seatCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">כיוון:</span>
                  <span className="font-semibold">{selectedBenchData.orientation === 'horizontal' ? 'אופקי' : 'אנכי'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">צבע:</span>
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: selectedBenchData.color }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex space-x-2 space-x-reverse">
                  <button
                    onClick={() => {
                      setBenchForm({
                        name: selectedBenchData.name,
                        seatCount: selectedBenchData.seatCount,
                        orientation: selectedBenchData.orientation,
                        color: selectedBenchData.color
                      });
                      setEditingBench(selectedBench);
                    }}
                    className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 className="h-4 w-4 ml-2" />
                    ערוך
                  </button>
                  <button
                    onClick={() => copyBench(selectedBench)}
                    className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Copy className="h-4 w-4 ml-2" />
                    העתק
                  </button>
                  <button
                    onClick={() => deleteBench(selectedBench)}
                    className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    מחק
                  </button>
                </div>
                
                <button
                  onClick={() => setShowRowDialog(true)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Grid3X3 className="h-4 w-4 ml-2" />
                  צור סרגל ספסלים
                </button>
              </div>
            </div>
          )}

          {/* פרטי מקום נבחר */}
          {selectedSeat && selectedSeatData && !selectedBench && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-md border border-blue-200 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">מקום {selectedSeat}</h3>
                  <button
                    onClick={() => setSelectedSeat(null)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      משויך למשתמש
                    </label>
                    <select
                      value={selectedSeatData.userId || ''}
                      onChange={(e) => assignUserToSeat(selectedSeat, e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">אין משויך</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} - {user.department}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedSeatUser && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{selectedSeatUser.name}</div>
                          <div className="text-sm text-gray-600">{selectedSeatUser.department}</div>
                          <div className="text-sm text-gray-500">{selectedSeatUser.email}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* יצירת סרגל ספסלים */}
          {showRowDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">צור סרגל ספסלים</h3>
                  <button
                    onClick={() => setShowRowDialog(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">מספר ספסלים</label>
                    <input
                      type="number"
                      min="2"
                      value={rowConfig.count}
                      onChange={(e) => setRowConfig(prev => ({ ...prev, count: parseInt(e.target.value) || 2 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">מרווח בין ספסלים (פיקסלים)</label>
                    <input
                      type="number"
                      min="0"
                      value={rowConfig.spacing}
                      onChange={(e) => setRowConfig(prev => ({ ...prev, spacing: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">כיוון</label>
                    <select
                      value={rowConfig.direction}
                      onChange={(e) => setRowConfig(prev => ({ ...prev, direction: e.target.value as 'horizontal' | 'vertical' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="horizontal">אופקי</option>
                      <option value="vertical">אנכי</option>
                    </select>
                  </div>

                  <button
                    onClick={createBenchRow}
                    className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Grid3X3 className="h-4 w-4 ml-2" />
                    צור סרגל
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* סטטיסטיקות */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">סטטיסטיקות</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">ספסלים:</span>
                <span className="font-semibold text-purple-600">{benches.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">סך הכל מקומות:</span>
                <span className="font-semibold">{seats.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">מקומות תפוסים:</span>
                <span className="font-semibold text-blue-600">
                  {seats.filter(s => s.userId).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">מקומות פנויים:</span>
                <span className="font-semibold text-green-600">
                  {seats.filter(s => !s.userId).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatsManagement;