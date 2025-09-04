import React, { useState, useCallback, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Bench, Seat, Worshiper } from '../../types';
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
  RotateCw,
  Copy,
  ArrowDown,
  ArrowRight,
  MousePointer,
  Map as MapIcon,
  Maximize2,
} from 'lucide-react';

// סוגי כלים זמינים
 type Tool = 'select' | 'addBench' | 'multiSelect' | 'pan';

 type XY = { x: number; y: number };
 const MIN_BENCH_SPACING = 20;

 const getBenchDimensions = (bench: Bench) => {
   if (bench.type === 'special') {
     return { width: bench.width || 0, height: bench.height || 0 };
   }
   return {
     width: bench.orientation === 'horizontal' ? bench.seatCount * 60 + 20 : 80,
     height: bench.orientation === 'horizontal' ? 80 : bench.seatCount * 60 + 20,
   };
 };

 // מפזר ספסלים במקרה של חפיפה
 const ensureBenchSpacing = (benches: Bench[], spacing = MIN_BENCH_SPACING): Bench[] => {
   const adjusted = benches.map(b => ({ ...b, position: { ...b.position } }));
   let changed = true;
   let iterations = 0;
   while (changed && iterations < 20) {
     changed = false;
     for (let i = 0; i < adjusted.length; i++) {
       for (let j = i + 1; j < adjusted.length; j++) {
         const a = adjusted[i];
         const b = adjusted[j];
         const { width: aw, height: ah } = getBenchDimensions(a);
         const { width: bw, height: bh } = getBenchDimensions(b);
         const dx = a.position.x + aw / 2 - (b.position.x + bw / 2);
         const dy = a.position.y + ah / 2 - (b.position.y + bh / 2);
         const overlapX = aw / 2 + bw / 2 + spacing - Math.abs(dx);
         const overlapY = ah / 2 + bh / 2 + spacing - Math.abs(dy);
         if (overlapX > 0 && overlapY > 0) {
           changed = true;
           if (overlapX < overlapY) {
             const shift = overlapX / 2;
             a.position.x += dx > 0 ? shift : -shift;
             b.position.x += dx > 0 ? -shift : shift;
           } else {
             const shift = overlapY / 2;
             a.position.y += dy > 0 ? shift : -shift;
             b.position.y += dy > 0 ? -shift : shift;
           }
         }
       }
     }
     iterations++;
   }
   return adjusted;
 };

 const SeatsManagement: React.FC = () => {
   const {
     benches,
     setBenches,
     seats,
     setSeats,
     worshipers,
     gridSettings,
     setGridSettings,
     mapOffset,
     setMapOffset,
     maps,
     saveCurrentMap,
     currentMapId,
   } = useAppContext();

   const mapContainerRef = useRef<HTMLDivElement>(null);
   const mapLayerRef = useRef<HTMLDivElement>(null);

   const [selectedBenches, setSelectedBenches] = useState<string[]>([]);
   const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
   const [showAssignModal, setShowAssignModal] = useState(false);
   const [zoom, setZoom] = useState(1);
   const [tool, setTool] = useState<Tool>('select');
   const [draggedBench, setDraggedBench] = useState<string | null>(null);
   const dragOffset = useRef<XY>({ x: 0, y: 0 });

   const snapToGrid = useCallback(
     (value: number) =>
       gridSettings.snapToGrid
         ? Math.round(value / gridSettings.gridSize) * gridSettings.gridSize
         : value,
     [gridSettings.snapToGrid, gridSettings.gridSize],
   );

   const updateBenches = useCallback(
     (updater: Bench[] | ((prev: Bench[]) => Bench[])) => {
       if (typeof updater === 'function') {
         setBenches(prev => ensureBenchSpacing((updater as (p: Bench[]) => Bench[])(prev)));
       } else {
         setBenches(ensureBenchSpacing(updater));
       }
     },
     [setBenches],
   );

   const getWorshiperById = (id: string): Worshiper | undefined =>
     worshipers.find(w => w.id === id);

   const getSeatStatus = (seat: Seat) => {
     if (seat.userId) {
       const w = getWorshiperById(seat.userId);
       return { color: 'bg-blue-500', worshiper: w };
     }
     return { color: 'bg-gray-300', worshiper: null };
   };

   // יצירת ספסל חדש
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
     updateBenches([...benches, newBench]);
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

   // גרירת ספסלים
   const handleBenchMouseDown = (e: React.MouseEvent, id: string) => {
     if (tool === 'pan') return;
     const bench = benches.find(b => b.id === id);
     if (!bench || bench.locked) return;
     const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
     dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
     setDraggedBench(id);
   };

   const handleMouseMove = (e: React.MouseEvent) => {
     if (draggedBench) {
       const container = mapContainerRef.current?.getBoundingClientRect();
       if (!container) return;
       const x = snapToGrid(
         (e.clientX - container.left - dragOffset.current.x - mapOffset.x) / zoom,
       );
       const y = snapToGrid(
         (e.clientY - container.top - dragOffset.current.y - mapOffset.y) / zoom,
       );
       updateBenches(prev =>
         prev.map(b => (b.id === draggedBench ? { ...b, position: { x, y } } : b)),
       );
     } else if (tool === 'pan' && e.buttons === 1) {
       setMapOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
     }
   };

   const handleMouseUp = () => setDraggedBench(null);

   // פעולות על ספסלים
   const handleDelete = () => {
     updateBenches(prev => prev.filter(b => !selectedBenches.includes(b.id)));
     setSeats(prev => prev.filter(s => !selectedBenches.includes(s.benchId)));
     setSelectedBenches([]);
   };

   const handleToggleLock = () => {
     updateBenches(prev =>
       prev.map(b =>
         selectedBenches.includes(b.id) ? { ...b, locked: !b.locked } : b,
       ),
     );
   };

   const handleRotate = () => {
     if (selectedBenches.length !== 1) return;
     const id = selectedBenches[0];
     updateBenches(prev =>
       prev.map(b =>
         b.id === id
           ? { ...b, orientation: b.orientation === 'horizontal' ? 'vertical' : 'horizontal' }
           : b,
       ),
     );
   };

   const handleCopy = (direction: 'right' | 'down') => {
     if (selectedBenches.length !== 1) return;
     const source = benches.find(b => b.id === selectedBenches[0]);
     if (!source) return;
     const { width, height } = getBenchDimensions(source);
     const offsetX = direction === 'right' ? width + 20 : 0;
     const offsetY = direction === 'down' ? height + 20 : 0;
     const newBench: Bench = {
       ...source,
       id: `bench-${Date.now()}`,
       name: `${source.name} עותק`,
       position: { x: source.position.x + offsetX, y: source.position.y + offsetY },
     };
     updateBenches([...benches, newBench]);
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

   const handleRenumberSeats = () => {
     let id = 1;
     const updated = seats.map(s => ({ ...s, id: id++ }));
     setSeats(updated);
   };

   // התאמה למסך
   const fitToScreen = () => {
     const container = mapContainerRef.current;
     if (!container || benches.length === 0) return;
     const cw = container.clientWidth;
     const ch = container.clientHeight;
     let minX = Infinity,
       minY = Infinity,
       maxX = -Infinity,
       maxY = -Infinity;
     benches.forEach(b => {
       const { width, height } = getBenchDimensions(b);
       minX = Math.min(minX, b.position.x);
       minY = Math.min(minY, b.position.y);
       maxX = Math.max(maxX, b.position.x + width);
       maxY = Math.max(maxY, b.position.y + height);
     });
     const contentW = maxX - minX;
     const contentH = maxY - minY;
     const scale = Math.min(cw / (contentW + 100), ch / (contentH + 100), 3);
     setZoom(scale);
     setMapOffset({
       x: (cw - contentW * scale) / 2 - minX * scale,
       y: (ch - contentH * scale) / 2 - minY * scale,
     });
   };

   return (
     <div
       className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50"
       onMouseMove={handleMouseMove}
       onMouseUp={handleMouseUp}
     >
       {/* Header */}
       <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 p-4">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
             <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
               <MapIcon className="h-6 w-6 text-blue-600" /> ניהול מפת מקומות
             </h1>
             {currentMapId && (
               <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                 {maps.find(m => m.id === currentMapId)?.name || 'מפה ללא שם'}
               </span>
             )}
           </div>
         </div>
       </div>

       <div className="flex-1 flex">
         {/* Sidebar */}
         <div className="w-64 bg-white/80 backdrop-blur-sm border-l border-gray-200 p-4 flex flex-col gap-4">
           <div>
             <h3 className="font-semibold mb-2">כלים</h3>
             <div className="grid grid-cols-1 gap-2">
               <button
                 onClick={() => setTool('select')}
                 className={`flex items-center gap-2 p-2 rounded ${
                   tool === 'select' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                 }`}
               >
                 <MousePointer className="h-5 w-5" /> בחירה
               </button>
               <button
                 onClick={handleAddBench}
                 className="flex items-center gap-2 p-2 rounded hover:bg-gray-100"
               >
                 <Plus className="h-5 w-5" /> הוסף ספסל
               </button>
               <button
                 onClick={() => setTool('multiSelect')}
                 className={`flex items-center gap-2 p-2 rounded ${
                   tool === 'multiSelect' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                 }`}
               >
                 <BoxSelect className="h-5 w-5" /> בחירה מרובה
               </button>
               <button
                 onClick={() => setTool('pan')}
                 className={`flex items-center gap-2 p-2 rounded ${
                   tool === 'pan' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                 }`}
               >
                 <Hand className="h-5 w-5" /> הזזת מפה
               </button>
             </div>
           </div>

           <div>
             <h3 className="font-semibold mb-2">עריכה</h3>
             <div className="grid grid-cols-1 gap-2">
               <button
                 onClick={handleToggleLock}
                 disabled={selectedBenches.length === 0}
                 className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 disabled:opacity-50"
               >
                 <Lock className="h-5 w-5" /> נעל/שחרר
               </button>
               <button
                 onClick={handleRotate}
                 disabled={selectedBenches.length !== 1}
                 className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 disabled:opacity-50"
               >
                 <RotateCw className="h-5 w-5" /> סובב
               </button>
               <button
                 onClick={() => handleCopy('right')}
                 disabled={selectedBenches.length !== 1}
                 className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 disabled:opacity-50"
               >
                 <Copy className="h-5 w-5" /> <ArrowRight className="h-4 w-4" /> העתק ימינה
               </button>
               <button
                 onClick={() => handleCopy('down')}
                 disabled={selectedBenches.length !== 1}
                 className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 disabled:opacity-50"
               >
                 <Copy className="h-5 w-5" /> <ArrowDown className="h-4 w-4" /> העתק למטה
               </button>
               <button
                 onClick={handleDelete}
                 disabled={selectedBenches.length === 0}
                 className="flex items-center gap-2 p-2 rounded text-red-600 hover:bg-red-50 disabled:opacity-50"
               >
                 <Trash2 className="h-5 w-5" /> מחק
               </button>
             </div>
           </div>

           <div>
             <h3 className="font-semibold mb-2">תצוגה</h3>
             <div className="grid grid-cols-1 gap-2">
               <button
                 onClick={() => setGridSettings(p => ({ ...p, showGrid: !p.showGrid }))}
                 className={`flex items-center gap-2 p-2 rounded ${
                   gridSettings.showGrid
                     ? 'bg-green-100 text-green-700'
                     : 'hover:bg-gray-100'
                 }`}
               >
                 <Grid3X3 className="h-5 w-5" /> רשת
               </button>
               <button
                 onClick={() => setGridSettings(p => ({ ...p, snapToGrid: !p.snapToGrid }))}
                 className={`flex items-center gap-2 p-2 rounded ${
                   gridSettings.snapToGrid
                     ? 'bg-green-100 text-green-700'
                     : 'hover:bg-gray-100'
                 }`}
               >
                 <Settings className="h-5 w-5" /> הצמד לרשת
               </button>
               <button
                 onClick={fitToScreen}
                 className="flex items-center gap-2 p-2 rounded hover:bg-gray-100"
               >
                 <Maximize2 className="h-5 w-5" /> התאם למסך
               </button>
             </div>
           </div>

           <div>
             <h3 className="font-semibold mb-2">מפה</h3>
             <div className="grid grid-cols-1 gap-2">
               <button
                 onClick={handleRenumberSeats}
                 className="flex items-center gap-2 p-2 rounded hover:bg-gray-100"
               >
                 <ListOrdered className="h-5 w-5" /> מספר מחדש
               </button>
               <button
                 onClick={() => saveCurrentMap()}
                 className="flex items-center gap-2 p-2 rounded bg-blue-600 text-white hover:bg-blue-700"
               >
                 <Save className="h-5 w-5" /> שמור מפה
               </button>
               <button
                 onClick={handleDelete}
                 className="flex items-center gap-2 p-2 rounded text-red-600 hover:bg-red-50"
               >
                 <Trash2 className="h-5 w-5" /> נקה מפה
               </button>
             </div>
           </div>

           <div>
             <h3 className="font-semibold mb-2">זום</h3>
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
               onChange={e => setZoom(Number(e.target.value))}
               className="w-full"
             />
           </div>

           <div className="flex-1">
             <h3 className="font-semibold mb-2">ייצוא PDF</h3>
             <PdfToolbar wrapperRef={mapContainerRef} mapLayerRef={mapLayerRef} />
           </div>
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
               backgroundPosition: `${mapOffset.x % (gridSettings.gridSize * zoom)}px ${
                 mapOffset.y % (gridSettings.gridSize * zoom)
               }px`,
             }}
           >
             <div
               ref={mapLayerRef}
               className="absolute inset-0"
               style={{
                 transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${zoom})`,
                 transformOrigin: '0 0',
               }}
               onClick={() => setSelectedBenches([])}
             >
               {benches.map(bench => {
                 const selected = selectedBenches.includes(bench.id);
                 return (
                   <div
                     key={bench.id}
                     className={`absolute rounded-lg border-2 transition-all duration-200 ${
                       selected
                         ? 'border-blue-500 shadow-lg'
                         : 'border-gray-300 hover:border-gray-400'
                     } ${bench.locked ? 'opacity-75' : ''}`}
                     style={{
                       left: bench.position.x,
                       top: bench.position.y,
                       width:
                         bench.type === 'special'
                           ? bench.width
                           : bench.orientation === 'horizontal'
                           ? bench.seatCount * 60 + 20
                           : 80,
                       height:
                         bench.type === 'special'
                           ? bench.height
                           : bench.orientation === 'horizontal'
                           ? 80
                           : bench.seatCount * 60 + 20,
                       backgroundColor: `${bench.color}20`,
                       borderColor: selected ? '#3B82F6' : bench.color,
                     }}
                     onMouseDown={e => handleBenchMouseDown(e, bench.id)}
                     onClick={e => {
                       e.stopPropagation();
                       if (tool === 'multiSelect') {
                         setSelectedBenches(prev =>
                           prev.includes(bench.id)
                             ? prev.filter(id => id !== bench.id)
                             : [...prev, bench.id],
                         );
                       } else {
                         setSelectedBenches([bench.id]);
                       }
                     }}
                   >
                     {bench.type === 'special' ? (
                       <div className="absolute inset-0 flex items-center justify-center text-center">
                         <div>
                           <div className="text-2xl mb-1">{bench.icon}</div>
                           <div className="text-xs font-semibold text-gray-700">
                             {bench.name}
                           </div>
                         </div>
                       </div>
                     ) : (
                       <>
                         <div className="absolute -top-6 left-0 text-xs font-semibold text-gray-700 bg-white px-2 py-1 rounded shadow-sm">
                           {bench.name}
                         </div>
                         {seats
                           .filter(s => s.benchId === bench.id)
                           .map((seat, index) => {
                             const status = getSeatStatus(seat);
                             return (
                               <div
                                 key={seat.id}
                                 className={`absolute w-12 h-12 rounded-lg flex items-center justify-center text-xs text-white border-2 border-white cursor-pointer transition-all duration-200 hover:scale-105 ${status.color}`}
                                 style={{
                                   left:
                                     bench.orientation === 'horizontal'
                                       ? index * 60 + 10
                                       : 10,
                                   top:
                                     bench.orientation === 'horizontal'
                                       ? 10
                                       : index * 60 + 10,
                                 }}
                                 onClick={e => {
                                   e.stopPropagation();
                                   setSelectedSeat(seat);
                                   setShowAssignModal(true);
                                 }}
                                 title={
                                   status.worshiper
                                     ? `${status.worshiper.title} ${status.worshiper.firstName} ${status.worshiper.lastName}`
                                     : `מקום ${seat.id} - פנוי`
                                 }
                               >
                                 {seat.id}
                               </div>
                             );
                           })}
                       </>
                     )}
                     {bench.locked && (
                       <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                         <Lock className="h-3 w-3" />
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
           </div>

           <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
             <div className="flex items-center gap-4 text-sm text-gray-600">
               <span>כלי: {tool}</span>
               <span>זום: {Math.round(zoom * 100)}%</span>
               <span>נבחרו: {selectedBenches.length}</span>
               <span>
                 סה"כ: {benches.length} ספסלים, {seats.length} מקומות
               </span>
             </div>
           </div>
         </div>
       </div>

       {showAssignModal && selectedSeat && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md">
             <h3 className="text-lg font-semibold mb-4">
               הקצאת מתפלל למקום {selectedSeat.id}
             </h3>
             <select
               value={selectedSeat.userId || ''}
               onChange={e => {
                 const userId = e.target.value || undefined;
                 setSeats(prev =>
                   prev.map(s =>
                     s.id === selectedSeat.id
                       ? { ...s, userId, isOccupied: !!userId }
                       : s,
                   ),
                 );
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
                 onClick={() => setShowAssignModal(false)}
                 className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
               >
                 ביטול
               </button>
               <button
                 onClick={() => setShowAssignModal(false)}
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
