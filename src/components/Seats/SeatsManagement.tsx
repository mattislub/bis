import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Bench, Seat } from '../../types';
import { specialElements } from './specialElements';
import MapZoomControls from './MapZoomControls';
import PdfToolbar from './PdfToolbar';
import {
  Plus, Grid3X3, BoxSelect, Hand, ListOrdered, Save, Trash2, Lock, Unlock, RotateCw, Copy,
  ArrowRight, ArrowDown, ArrowDownRight, Eye, EyeOff, Palette, MousePointer, Layers,
  Download, Maximize2, Grid as GridIcon, Target, Printer, FileText
} from 'lucide-react';
import { printLabels } from '../../utils/printLabels';

/**
 * SeatsManagement — Full Merge
 * עיצוב = לפי הקובץ שלך (Header + Toolbars + Sidebar)
 * פיצ'רים = מלאים מהגרסה הוותיקה: גרירה, בחירה מרובה עם מלבן, חיצי מקלדת להזזה, תפריט קליק־ימני,
 * שכפול ימינה/למטה, סיבוב, נעילה/שחרור, "שמור", "שמור בשם", טעינה, הדפסה ל‑PDF (באמצעות PdfToolbar),
 * ייבוא/ייצוא JSON, Snap/Grid/Fit, מספור מחדש, אלמנטים מיוחדים.
 */

type Tool = 'select' | 'add' | 'multiSelect' | 'pan';
type XY = { x: number; y: number };

const clamp = (v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const MIN_ZOOM = 0.3, MAX_ZOOM = 3, FIT_PADDING = 24, MIN_BENCH_SPACING = 20;

function benchDims(bench: Bench) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((bench as any).type === 'special') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { width: (bench as any).width || 120, height: (bench as any).height || 120 };
  }
  return {
    width: bench.orientation === 'horizontal' ? bench.seatCount * 60 + 20 : 80,
    height: bench.orientation === 'horizontal' ? 80 : bench.seatCount * 60 + 20,
  };
}

function ensureBenchSpacing(benches: Bench[], spacing = MIN_BENCH_SPACING): Bench[] {
  const adjusted = benches.map(b => ({ ...b, position: { ...b.position } }));
  let changed = true, iter = 0;
  while (changed && iter < 80) {
    changed = false; iter++;
    for (let i=0;i<adjusted.length;i++) for (let j=i+1;j<adjusted.length;j++) {
      const a = adjusted[i], b = adjusted[j];
      const {width:aw,height:ah}=benchDims(a), {width:bw,height:bh}=benchDims(b);
      const ax=a.position.x+aw/2, ay=a.position.y+ah/2, bx=b.position.x+bw/2, by=b.position.y+bh/2;
      const dx=ax-bx, dy=ay-by;
      const overlapX = aw/2 + bw/2 + spacing - Math.abs(dx);
      const overlapY = ah/2 + bh/2 + spacing - Math.abs(dy);
      if (overlapX>0 && overlapY>0) {
        changed = true;
        if (overlapX < overlapY) {
          const s = overlapX/2;
          if (dx>0) { a.position.x += s; b.position.x -= s; } else { a.position.x -= s; b.position.x += s; }
        } else {
          const s = overlapY/2;
          if (dy>0) { a.position.y += s; b.position.y -= s; } else { a.position.y -= s; b.position.y += s; }
        }
      }
    }
  }
  return adjusted;
}

function SeatsManagement(): JSX.Element {
  const {
    benches, setBenches, seats, setSeats, worshipers,
    gridSettings, setGridSettings,
    mapBounds,
    mapOffset, setMapOffset,
    saveCurrentMap, maps, loadMap, renameMap, currentMapId,
  } = useAppContext();

  // UI State
  const [selectedSeats, setSelectedSeats] = useState<Set<number>>(new Set());
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [zoom, setZoom] = useState(1);
  const [showWorshiperModal, setShowWorshiperModal] = useState(false);
  const [selectedSeatsForWorshiper, setSelectedSeatsForWorshiper] = useState<number[]>([]);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [isToolbarCollapsed] = useState(false);

  // Multi‑drag & selection
  const [selectedBenches, setSelectedBenches] = useState<string[]>([]);
  const [draggedBench, setDraggedBench] = useState<string | null>(null);
  const [dragStartPositions, setDragStartPositions] = useState<Record<string, XY> | null>(null);
  const [dragOffset, setDragOffset] = useState<XY | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<XY | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<XY | null>(null);
  const [selectionRect, setSelectionRect] = useState<{x:number;y:number;width:number;height:number}|null>(null);

  // Right‑click menu
  const [ctxMenu, setCtxMenu] = useState<{show:boolean;x:number;y:number;targetId?:string}>({show:false,x:0,y:0});

  // Refs
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapLayerRef = useRef<HTMLDivElement>(null);

  // Colors
  const benchColors = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#1F2937','#6366F1','#14B8A6','#D946EF','#F97316','#84CC16','#E879F9','#22D3EE','#F43F5E','#A855F7'];

  // Current map info and save state
  const currentMap = useMemo(() => maps.find(m => m.id === currentMapId), [maps, currentMapId]);
  const currentMapName = currentMap ? currentMap.name : 'מפה חדשה';
  const isMapSaved = useMemo(() => {
    if (!currentMap) return false;
    return (
      JSON.stringify(currentMap.benches) === JSON.stringify(benches) &&
      JSON.stringify(currentMap.seats) === JSON.stringify(seats) &&
      JSON.stringify(currentMap.mapBounds) === JSON.stringify(mapBounds) &&
      JSON.stringify(currentMap.mapOffset) === JSON.stringify(mapOffset)
    );
  }, [currentMap, benches, seats, mapBounds, mapOffset]);

  // Helpers
  const snapToGrid = useCallback((v:number)=> gridSettings.snapToGrid ? Math.round(v / gridSettings.gridSize) * gridSettings.gridSize : v, [gridSettings.snapToGrid,gridSettings.gridSize]);
  const getWorshiperById = useCallback((id:string)=> worshipers.find(w=>w.id===id), [worshipers]);

  // Auto‑fit on first render until user interacts
  const userInteractedRef = useRef(false);
  useEffect(() => {
    const onAny = () => { userInteractedRef.current = true; };
    window.addEventListener('wheel', onAny, { passive: true });
    window.addEventListener('mousedown', onAny);
    window.addEventListener('keydown', onAny);
    return () => { window.removeEventListener('wheel', onAny); window.removeEventListener('mousedown', onAny); window.removeEventListener('keydown', onAny); };
  }, []);

  useEffect(() => {
    if (userInteractedRef.current) return;
    if (!wrapperRef.current) return;

    let minX = benches.length ? Infinity : 0;
    let minY = benches.length ? Infinity : 0;
    let maxX = benches.length ? -Infinity : 0;
    let maxY = benches.length ? -Infinity : 0;

    benches.forEach(b => {
      const { width, height } = benchDims(b);
      minX = Math.min(minX, b.position.x);
      minY = Math.min(minY, b.position.y);
      maxX = Math.max(maxX, b.position.x + width);
      maxY = Math.max(maxY, b.position.y + height);
    });

    // include explicit map bounds
    minX -= mapBounds.left;
    minY -= mapBounds.top;
    maxX += mapBounds.right;
    maxY += mapBounds.bottom;

    const W = wrapperRef.current.clientWidth;
    const H = wrapperRef.current.clientHeight;
    const contentW = Math.max(1, maxX - minX);
    const contentH = Math.max(1, maxY - minY);
    let scale = Math.min((W - FIT_PADDING * 2) / contentW, (H - FIT_PADDING * 2) / contentH);
    scale = clamp(scale, MIN_ZOOM, MAX_ZOOM);
    setZoom(scale);
    setMapOffset({
      x: Math.round(W / 2 - (minX + contentW / 2) * scale),
      y: Math.round(H / 2 - (minY + contentH / 2) * scale),
    });
  }, [benches, mapBounds, setMapOffset]);

  // Keyboard move & delete
  useEffect(()=>{
    const onKeyDown = (e: KeyboardEvent)=>{
      const target = e.target as HTMLElement;
      if (target && target.closest('input,textarea,select,[contenteditable="true"]')) return;
      if (selectedBenches.length && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const dist = gridSettings.snapToGrid ? gridSettings.gridSize : 10;
        setBenches(prev => ensureBenchSpacing(prev.map(b=>{
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (!selectedBenches.includes(b.id) || (b as any).locked) return b;
          let {x,y}=b.position;
          if (e.key==='ArrowUp') y -= dist;
          if (e.key==='ArrowDown') y += dist;
          if (e.key==='ArrowLeft') x -= dist;
          if (e.key==='ArrowRight') x += dist;
          return {...b, position:{x,y}};
        })));
      }
      if (selectedBenches.length && (e.key==='Delete' || e.key==='Backspace')) {
        e.preventDefault();
        deleteSelectedBenches();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return ()=>window.removeEventListener('keydown', onKeyDown);
  }, [selectedBenches, setBenches, gridSettings]);

  // Events
  const handleBenchClick = useCallback((benchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCtxMenu(s=>({...s, show:false}));
    if (activeTool==='multiSelect' || e.shiftKey) {
      setSelectedBenches(prev => prev.includes(benchId) ? prev.filter(id=>id!==benchId) : [...prev, benchId]);
    } else {
      setSelectedBenches([benchId]);
      setSelectedSeats(new Set());
    }
  }, [activeTool]);

  const handleSeatClick = useCallback((seatId:number, e:React.MouseEvent)=>{
    e.stopPropagation();
    const seatsToAssign = selectedSeats.size
      ? (selectedSeats.has(seatId) ? Array.from(selectedSeats) : [seatId])
      : [seatId];
    setSelectedSeatsForWorshiper(seatsToAssign);
    setShowWorshiperModal(true);
  }, [selectedSeats]);

  const handleMapClick = useCallback((e: React.MouseEvent) => {
    if (activeTool === 'add') {
      const rect = mapLayerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = snapToGrid((e.clientX - rect.left - mapOffset.x) / zoom - mapBounds.left);
      const y = snapToGrid((e.clientY - rect.top - mapOffset.y) / zoom - mapBounds.top);
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
      const updated = ensureBenchSpacing([...benches, newBench]);
      setBenches(updated);
      const maxSeatId = Math.max(0, ...seats.map(s=>s.id));
      const newSeats: Seat[] = Array.from({length:newBench.seatCount}).map((_,i)=>({
        id: maxSeatId + i + 1, benchId: newBench.id, position:{x:0,y:0}, isOccupied:false
      }));
      setSeats(prev=>[...prev, ...newSeats]);
    } else {
      setSelectedBenches([]);
      setSelectedSeats(new Set());
    }
    setCtxMenu(s=>({...s, show:false}));
  }, [activeTool, zoom, mapBounds, mapOffset, snapToGrid, benches, seats, setBenches, setSeats]);

  // Drag & drop (multi)
  const onDragStartBench = (e: React.DragEvent<HTMLDivElement>, benchId: string) => {
    const bench = benches.find(b=>b.id===benchId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!bench || (bench as any).locked) { e.preventDefault(); return; }
    let selection = selectedBenches;
    if (!selection.includes(benchId)) selection = [benchId];
    setSelectedBenches(selection); setSelectedSeats(new Set());
    const rect = e.currentTarget.getBoundingClientRect();
    setDraggedBench(benchId);
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    if (selection.length > 1) {
      const positions: Record<string, XY> = {};
      selection.forEach(id => { const b = benches.find(x => x.id === id)!; positions[id] = { ...b.position }; });
      setDragStartPositions(positions);
    } else setDragStartPositions(null);
    e.dataTransfer.effectAllowed='move';
    e.dataTransfer.setData('text/plain', benchId);
  };

  const onDropMap = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedBench || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const offX = dragOffset?.x ?? 0, offY = dragOffset?.y ?? 0;
    const x = snapToGrid((e.clientX - rect.left - mapOffset.x - mapBounds.left - offX) / zoom);
    const y = snapToGrid((e.clientY - rect.top - mapOffset.y - mapBounds.top - offY) / zoom);
    let updated: Bench[] = [];
    if (dragStartPositions && selectedBenches.length > 1) {
      const start = dragStartPositions[draggedBench]; const dx = x - start.x; const dy = y - start.y;
      updated = benches.map(b => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!selectedBenches.includes(b.id) || (b as any).locked) return b;
        const pos = dragStartPositions[b.id];
        return { ...b, position: { x: snapToGrid(pos.x + dx), y: snapToGrid(pos.y + dy) } };
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updated = benches.map(b => b.id === draggedBench && !(b as any).locked ? { ...b, position: { x, y } } : b);
    }
    setBenches(ensureBenchSpacing(updated));
    setDraggedBench(null); setDragStartPositions(null); setDragOffset(null);
  };

  // Pan & selection rectangle
  const onMouseDownCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - mapOffset.x - mapBounds.left) / zoom;
    const y = (e.clientY - rect.top - mapOffset.y - mapBounds.top) / zoom;
    if (activeTool==='pan') {
      e.preventDefault(); setIsPanning(true); setPanStart({x:e.clientX,y:e.clientY});
      setSelectedBenches([]); setSelectedSeats(new Set()); setCtxMenu(s=>({...s,show:false})); return;
    }
    if (e.target === e.currentTarget && activeTool==='multiSelect') {
      setIsSelecting(true); setSelectionStart({x,y}); setSelectionRect({x,y,width:0,height:0});
      setSelectedBenches([]); setSelectedSeats(new Set());
      setCtxMenu(s=>({...s,show:false}));
    }
  };
  const onMouseMoveCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning && panStart) {
      const dx=e.clientX-panStart.x, dy=e.clientY-panStart.y;
      setMapOffset(prev=>({x:prev.x+dx,y:prev.y+dy}));
      setPanStart({x:e.clientX,y:e.clientY}); return;
    }
    if (isSelecting && selectionStart && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - mapOffset.x - mapBounds.left) / zoom;
      const y = (e.clientY - rect.top - mapOffset.y - mapBounds.top) / zoom;
      setSelectionRect({ x: Math.min(x, selectionStart.x), y: Math.min(y, selectionStart.y), width: Math.abs(x - selectionStart.x), height: Math.abs(y - selectionStart.y) });
    }
  };
  const onMouseUpCanvas = () => {
    if (isPanning) { setIsPanning(false); setPanStart(null); }
    if (isSelecting && selectionRect) {
      const selected = benches.filter(b=>{
        const {width,height}=benchDims(b);
        return (b.position.x + width > selectionRect.x &&
                b.position.x < selectionRect.x + selectionRect.width &&
                b.position.y + height > selectionRect.y &&
                b.position.y < selectionRect.y + selectionRect.height);
      }).map(b=>b.id);
      const seatIds: number[] = [];
      benches.forEach(b => {
        if (b.type === 'special') return;
        const benchSeats = seats.filter(s => s.benchId === b.id);
        benchSeats.forEach((seat, idx) => {
          const sx = b.position.x + (b.orientation==='horizontal' ? idx*60 + 10 : 10);
          const sy = b.position.y + (b.orientation==='horizontal' ? 10 : idx*60 + 10);
          if (sx + 60 > selectionRect.x && sx < selectionRect.x + selectionRect.width &&
              sy + 60 > selectionRect.y && sy < selectionRect.y + selectionRect.height) {
            seatIds.push(seat.id);
          }
        });
      });
      setSelectedBenches(selected);
      setSelectedSeats(new Set(seatIds));
    }
    setIsSelecting(false); setSelectionStart(null); setSelectionRect(null);
  };

  // Context menu
  const onContextMenuBench = (e: React.MouseEvent, benchId: string) => {
    e.preventDefault();
    setSelectedBenches(prev => prev.includes(benchId) ? prev : [benchId]);
    setCtxMenu({ show:true, x: e.clientX, y: e.clientY, targetId: benchId });
  };

  // Bench ops
  const deleteSelectedBenches = useCallback(()=>{
    if (!selectedBenches.length) return;
    if (!window.confirm('למחוק את הספסלים הנבחרים?')) return;
    setBenches(prev=>prev.filter(b=>!selectedBenches.includes(b.id)));
    setSeats(prev=>prev.filter(s=>!selectedBenches.includes(s.benchId)));
    setSelectedBenches([]);
  }, [selectedBenches]);

  const duplicateBench = useCallback((benchId: string, direction: 'right' | 'down') => {
    const bench = benches.find(b => b.id === benchId); if (!bench) return;
    const off = direction==='right' ? {x: 100, y:0} : {x:0,y:100};
    const nb: Bench = { ...bench, id:`bench-${Date.now()}`, name:`${bench.name} (עותק)`, position:{ x: bench.position.x+off.x, y: bench.position.y+off.y } };
    const updated = ensureBenchSpacing([...benches, nb]);
    setBenches(updated);
    const benchSeats = seats.filter(s=>s.benchId===benchId);
    const maxSeatId = Math.max(0, ...seats.map(s=>s.id));
    const newSeats: Seat[] = benchSeats.map((s,i)=>({...s, id:maxSeatId+i+1, benchId: nb.id }));
    setSeats(prev=>[...prev, ...newSeats]);
  }, [benches, seats, setBenches, setSeats]);

  const updateSeatCount = useCallback((benchId: string, newCount: number) => {
    if (newCount < 0 || !Number.isFinite(newCount)) return;
    setBenches(prev => prev.map(b => b.id === benchId ? { ...b, seatCount: newCount } : b));
    setSeats(prev => {
      const keep: Seat[] = [];
      const add: Seat[] = [];
      let maxId = Math.max(0, ...prev.map(s => s.id));
      // for each bench, if matches benchId adjust; others keep as-is
      const currentForBench = prev.filter(s => s.benchId === benchId).sort((a,b)=>a.id-b.id);
      if (newCount <= currentForBench.length) {
        // keep first newCount seats for that bench
        keep.push(...currentForBench.slice(0, newCount));
      } else {
        keep.push(...currentForBench);
        const toAdd = newCount - currentForBench.length;
        for (let i=0;i<toAdd;i++) {
          add.push({ id: ++maxId, benchId, position:{x:0,y:0}, isOccupied:false });
        }
      }
      // merge others + adjusted for bench
      const others = prev.filter(s => s.benchId !== benchId);
      return [...others, ...keep, ...add];
    });
  }, [setBenches, setSeats]);


  const rotateBench = useCallback((benchId: string) => {
    setBenches(prev=>prev.map(b=> b.id===benchId ? {...b, orientation: b.orientation==='horizontal' ? 'vertical' : 'horizontal'} : b));
  }, [setBenches]);

  const toggleBenchLock = useCallback((benchId: string) => {
    setBenches(prev=>prev.map(b=> b.id===benchId ? {...b, locked: !b.locked} : b));
  }, [setBenches]);

  const changeBenchColor = useCallback((benchId: string, color: string) => {
    setBenches(prev=>prev.map(b=> b.id===benchId ? {...b, color} : b));
    setShowColorPicker(null);
  }, [setBenches]);

  // Map ops
  const clearMap = useCallback(()=>{
    if (window.confirm('לנקות את המפה?')) {
      setBenches([]); setSeats([]);
      setSelectedBenches([]); setSelectedSeats(new Set());
    }
  }, []);

  const renumberSeats = useCallback(()=>{
    let id = 1;
    const orderedBenches = [...benches].sort((a,b)=> a.position.y - b.position.y || a.position.x - b.position.x);
    const updated: Seat[] = [];
    orderedBenches.forEach(b=>{
      const benchSeats = seats.filter(s=>s.benchId===b.id).sort((a,b)=>a.id-b.id);
      benchSeats.forEach(s=> updated.push({...s, id: id++}));
    });
    setSeats(updated);
  }, [benches, seats, setSeats]);

  const addMultipleBenches = useCallback(() => {
    const count = parseInt(prompt('כמה ספסלים להוסיף?') || '0', 10);
    if (!count || count < 1) return;
    const newBenches: Bench[] = [];
    const newSeats: Seat[] = [];
    let maxSeatId = Math.max(0, ...seats.map(s => s.id));
    let x = 100;
    const y = 100;
    for (let i = 0; i < count; i++) {
      const b: Bench = {
        id: `bench-${Date.now()}-${i}`,
        name: `ספסל ${benches.length + newBenches.length + 1}`,
        seatCount: 4,
        position: { x, y },
        orientation: 'horizontal',
        color: benchColors[(benches.length + newBenches.length) % benchColors.length],
        locked: false,
        temporary: false,
      };
      newBenches.push(b);
      for (let j = 0; j < b.seatCount; j++) {
        maxSeatId += 1;
        newSeats.push({ id: maxSeatId, benchId: b.id, position: { x: 0, y: 0 }, isOccupied: false });
      }
      x += benchDims(b).width + MIN_BENCH_SPACING;
    }
    setBenches(prev => ensureBenchSpacing([...prev, ...newBenches]));
    setSeats(prev => [...prev, ...newSeats]);
  }, [benches, seats, setBenches, setSeats]);

  const addCustomElement = useCallback(() => {
    const name = prompt('שם האלמנט?');
    if (!name) return;
    const el: Bench = {
      id: `element-${Date.now()}`,
      name,
      seatCount: 0,
      position: { x: 400, y: 300 },
      orientation: 'horizontal',
      color: '#9CA3AF',
      type: 'special',
      width: 80,
      height: 80,
      locked: false,
      temporary: false,
    };
    setBenches(prev => ensureBenchSpacing([...prev, el]));
  }, [setBenches]);

  // Fit to screen
  const fitToScreen = useCallback(() => {
    if (!wrapperRef.current) return;

    let minX = benches.length ? Infinity : 0;
    let minY = benches.length ? Infinity : 0;
    let maxX = benches.length ? -Infinity : 0;
    let maxY = benches.length ? -Infinity : 0;

    benches.forEach(b => {
      const { width, height } = benchDims(b);
      minX = Math.min(minX, b.position.x);
      minY = Math.min(minY, b.position.y);
      maxX = Math.max(maxX, b.position.x + width);
      maxY = Math.max(maxY, b.position.y + height);
    });

    // include explicit map bounds
    minX -= mapBounds.left;
    minY -= mapBounds.top;
    maxX += mapBounds.right;
    maxY += mapBounds.bottom;

    const contentW = Math.max(1, maxX - minX);
    const contentH = Math.max(1, maxY - minY);
    const W = wrapperRef.current.clientWidth;
    const H = wrapperRef.current.clientHeight;
    let scale = Math.min((W - FIT_PADDING * 2) / contentW, (H - FIT_PADDING * 2) / contentH);
    scale = clamp(scale, MIN_ZOOM, MAX_ZOOM);
    setZoom(scale);
    setMapOffset({
      x: Math.round(W / 2 - (minX + contentW / 2) * scale),
      y: Math.round(H / 2 - (minY + contentH / 2) * scale),
    });
  }, [benches, mapBounds]);

  // UI derived
  const selectedOne = useMemo(()=> selectedBenches.length===1 ? benches.find(b=>b.id===selectedBenches[0]) : null, [selectedBenches, benches]);

  return (
    <div className="h-screen flex bg-gradient-to-br from-gray-50 to-blue-50" dir="rtl">
      {/* Maps sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">מפות</h2>
        <div className="space-y-2">
          {maps.map(m => (
            <div key={m.id} className="flex items-center gap-2 py-2">
              <button onClick={()=>loadMap(m.id)} className="flex-1 text-right hover:underline">{m.name}</button>
              <button onClick={()=>{ const name=window.prompt('שנה שם מפה:', m.name); if (name) renameMap(m.id, name); }} title="שנה שם" className="p-1 rounded hover:bg-gray-100"><span className="text-xs">שם</span></button>
              <button onClick={()=>PdfToolbar && mapLayerRef.current && wrapperRef.current && (document.querySelector('#pdfExportBtn') as HTMLButtonElement)?.click()} title="הדפס מפה" className="p-1 rounded hover:bg-gray-100"><Printer className="h-4 w-4" /></button>
              <button
                onClick={() =>
                  printLabels({
                    benches: m.benches,
                    seats: m.seats,
                    worshipers,
                    stickers: m.seats.map((seat) => {
                      const w = worshipers.find((w) => w.id === seat.userId);
                      const bench = m.benches.find((b) => b.id === seat.benchId);
                      return {
                        name: w
                          ? `${w.title ? w.title + ' ' : ''}${w.firstName} ${w.lastName}`
                          : 'פנוי',
                        benchName: bench?.name || '',
                      };
                    }),
                    fileName: `labels-${m.name.replace(/\s+/g, '-')}.pdf`,
                  })
                }
                title="הדפס מדבקות"
                className="p-1 rounded hover:bg-gray-100"
              >
                <FileText className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-4">
          <button
            onClick={() => saveCurrentMap()}
            className={`flex-1 px-3 py-2 rounded text-white ${isMapSaved ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
          >שמור</button>
          <button onClick={()=>{ const name=window.prompt('שם חדש:', 'מפה חדשה'); if (name) saveCurrentMap(name); }} className="flex-1 px-3 py-2 rounded bg-blue-100 text-blue-700 hover:bg-blue-200">שמור בשם…</button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <GridIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">ניהול מפת המושבים - {currentMapName}</h1>
              <p className="text-sm text-gray-600">עצב וארגן את מפת בית הכנסת שלך</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => saveCurrentMap()}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl transition-all shadow-lg ${isMapSaved ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'}`}
            >
              <Save className="h-4 w-4" /> שמור
            </button>
            <button onClick={fitToScreen} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg">
              <Maximize2 className="h-4 w-4" /> התאם למסך
            </button>
          </div>
        </div>

        {/* Main Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tools Section */}
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-xl">
            <span className="text-xs font-semibold text-gray-600 px-2">כלים:</span>
            <button onClick={()=>setActiveTool('select')} className={`p-2 rounded-lg transition-all ${activeTool==='select' ? 'bg-blue-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`} title="בחירה"><MousePointer className="h-4 w-4" /></button>
              <button onClick={()=>setActiveTool('add')} className={`p-2 rounded-lg transition-all ${activeTool==='add' ? 'bg-green-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`} title="הוסף ספסל"><Plus className="h-4 w-4" /></button>
              <button onClick={addMultipleBenches} className="p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-50" title="הוסף ספסלים מרובים"><Layers className="h-4 w-4" /></button>
              <button onClick={()=>setActiveTool('multiSelect')} className={`p-2 rounded-lg transition-all ${activeTool==='multiSelect' ? 'bg-purple-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`} title="בחירה מרובה"><BoxSelect className="h-4 w-4" /></button>
            <button onClick={()=>setActiveTool('pan')} className={`p-2 rounded-lg transition-all ${activeTool==='pan' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`} title="הזזת מפה"><Hand className="h-4 w-4" /></button>
          </div>

          {/* Map Actions */}
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-xl">
            <span className="text-xs font-semibold text-gray-600 px-2">מפה:</span>
              <button onClick={()=>{ if (selectedOne) { const nb: Bench={...selectedOne,id:`bench-${Date.now()}`,name:`${selectedOne.name} (שורה)`,position:{x:selectedOne.position.x,y:selectedOne.position.y+100}}; setBenches(prev=>ensureBenchSpacing([...prev, nb])); const maxSeatId = Math.max(0, ...seats.map(s=>s.id)); const newSeats: Seat[] = Array.from({length:nb.seatCount}).map((_,i)=>({ id:maxSeatId+i+1, benchId: nb.id, position:{x:0,y:0}, isOccupied:false })); setSeats(prev=>[...prev, ...newSeats]); }}} disabled={!selectedOne} className="p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50" title="צור שורה"><Grid3X3 className="h-4 w-4" /></button>
            <button onClick={()=>setGridSettings(p=>({...p, showGrid:!p.showGrid}))} className={`p-2 rounded-lg transition-all ${gridSettings.showGrid ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`} title="הצג/הסתר רשת">{gridSettings.showGrid ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
            <button onClick={()=>setGridSettings(p=>({...p, snapToGrid:!p.snapToGrid}))} className={`p-2 rounded-lg transition-all ${gridSettings.snapToGrid ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`} title="הצמד לרשת"><Target className="h-4 w-4" /></button>
            <button onClick={renumberSeats} className="p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-50" title="מספר מחדש"><ListOrdered className="h-4 w-4" /></button>
            <button onClick={clearMap} className="p-2 rounded-lg bg-white text-red-600 hover:bg-red-50" title="נקה מפה"><Trash2 className="h-4 w-4" /></button>
          </div>

            {/* Special Elements quick add */}
            <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-xl">
              <span className="text-xs font-semibold text-gray-600 px-2">אלמנטים:</span>
              {specialElements.map(el => (
                <button
                  key={el.id}
                  onClick={() => {
                    const b = {
                      ...el,
                    id: `${el.id}-${Date.now()}`,
                    type: 'special',
                    locked: false,
                    temporary: false,
                    position: { x: 400, y: 300 },
                    seatCount: 0,
                  } as Bench;
                  setBenches(prev => ensureBenchSpacing([...prev, b]));
                }}
                className="p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-50 text-sm"
                title={el.name}
                  >
                    {el.icon}
                  </button>
                ))}
              <button onClick={addCustomElement} className="p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-50" title="הוסף אלמנט">
                <Plus className="h-4 w-4" />
              </button>
            </div>

          {/* Zoom */}
          <div className="mr-auto pdf-hide"><MapZoomControls setZoom={setZoom} onFit={fitToScreen} /></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className={`bg-white/90 backdrop-blur-sm shadow-lg border-l border-gray-200 p-4 overflow-y-auto ${isToolbarCollapsed ? 'w-20' : 'w-80'} transition-all`}>
          {/* Selected Bench Panel */}
          {selectedOne && (
            <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                ספסל נבחר
              </h3>
              <div className="space-y-3">
                <div className="text-sm text-gray-700"><strong>{selectedOne.name}</strong></div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={()=>toggleBenchLock(selectedOne.id)} className={`flex items-center justify-center gap-1 p-2 rounded-lg text-xs ${selectedOne.locked ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                    {selectedOne.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    {selectedOne.locked ? 'נעול' : 'פתוח'}
                  </button>
                  <button onClick={()=>rotateBench(selectedOne.id)} className="flex items-center justify-center gap-1 p-2 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600">
                    <RotateCw className="h-3 w-3" /> סובב
                  </button>
                  <button onClick={()=>duplicateBench(selectedOne.id,'right')} className="flex items-center justify-center gap-1 p-2 bg-purple-500 text-white rounded-lg text-xs hover:bg-purple-600">
                    <Copy className="h-3 w-3" /> <ArrowRight className="h-3 w-3" />
                  </button>
                  <button onClick={()=>duplicateBench(selectedOne.id,'down')} className="flex items-center justify-center gap-1 p-2 bg-purple-500 text-white rounded-lg text-xs hover:bg-purple-600">
                    <Copy className="h-3 w-3" /> <ArrowDown className="h-3 w-3" />
                  </button>
                </div>

                {/* Color Picker */}
                <div>
                  <button onClick={()=>setShowColorPicker(showColorPicker===selectedOne.id?null:selectedOne.id)} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 w-full">
                    <Palette className="h-4 w-4" />
                    <div className="w-4 h-4 rounded-full border border-gray-300" style={{backgroundColor:selectedOne.color}}/>
                    <span className="text-sm">שנה צבע</span>
                  </button>
                  {showColorPicker===selectedOne.id && (
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {benchColors.map(color => (
                        <button key={color} onClick={()=>changeBenchColor(selectedOne.id, color)} className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-gray-400" style={{backgroundColor:color}}/>
                      ))}
                    </div>
                  )}
                </div>

                {/* Seat count */}
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-sm text-gray-700 col-span-1">מס׳ מקומות</span>
                  <div className="col-span-2 flex items-center gap-2">
                    <button
                      onClick={() => updateSeatCount(selectedOne.id, Math.max(0, (selectedOne.seatCount || 0) - 1))}
                      className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      className="w-20 px-2 py-1 border rounded-lg"
                      value={selectedOne.seatCount || 0}
                      onChange={(e) =>
                        updateSeatCount(selectedOne.id, Math.max(0, parseInt(e.target.value || '0', 10)))
                      }
                    />
                    <button
                      onClick={() => updateSeatCount(selectedOne.id, (selectedOne.seatCount || 0) + 1)}
                      className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  onClick={deleteSelectedBenches}
                  className="flex items-center justify-center gap-2 p-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 w-full"
                >
                  <Trash2 className="h-4 w-4" />
                  מחק ספסל
                </button>
              </div>
            </div>
          )}

          {/* PDF Export */}
          <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-100 rounded-xl border border-orange-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Download className="h-5 w-5 text-orange-600" />
              ייצוא PDF
            </h3>
            <PdfToolbar id="pdfExportBtn" wrapperRef={wrapperRef} mapLayerRef={mapLayerRef} />
          </div>
        </div>

        {/* Map Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={wrapperRef}
            className="w-full h-full relative cursor-crosshair"
            onClick={handleMapClick}
            onDrop={onDropMap}
            onDragOver={(e)=>{e.preventDefault(); e.dataTransfer.dropEffect='move';}}
            onMouseDown={onMouseDownCanvas}
            onMouseMove={onMouseMoveCanvas}
            onMouseUp={onMouseUpCanvas}
            onMouseLeave={onMouseUpCanvas}
            onContextMenu={(e)=>{ e.preventDefault(); setCtxMenu(s=>({...s,show:false})); }}
          >
            {/* Grid */}
            {gridSettings.showGrid && (
              <div
                className="absolute inset-0 opacity-20 pointer-events-none pdf-hide"
                style={{
                  backgroundImage: `linear-gradient(to right, #3B82F6 1px, transparent 1px), linear-gradient(to bottom, #3B82F6 1px, transparent 1px)`,
                  backgroundSize: `${gridSettings.gridSize * zoom}px ${gridSettings.gridSize * zoom}px`,
                  transform: `translate(${mapOffset.x}px, ${mapOffset.y}px)`,
                }}
              />
            )}

            {/* Map Layer */}
            <div
              ref={mapLayerRef}
              className="absolute inset-0"
              style={{ transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${zoom})`, transformOrigin: 'top left' }}
            >
              {/* Benches */}
              {benches.map(bench => {
                const { width, height } = benchDims(bench);
                const selected = selectedBenches.includes(bench.id);
                return (
                  <div
                    key={bench.id}
                    className={`absolute rounded-xl border-2 transition-all duration-200 ${bench.locked ? 'cursor-not-allowed opacity-80' : 'cursor-move'} ${selected ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'}`}
                    style={{
                      left: bench.position.x + mapBounds.left,
                      top: bench.position.y + mapBounds.top,
                      width, height,
                      backgroundColor: `${bench.color}15`, borderColor: bench.color,
                    }}
                    draggable={!bench.locked}
                    onDragStart={(e)=>onDragStartBench(e, bench.id)}
                    onClick={(e)=>handleBenchClick(bench.id, e)}
                    onContextMenu={(e)=>onContextMenuBench(e, bench.id)}
                    title={bench.name}
                  >
                    {/* Bench Label */}

                    {/* Seat count badge (non-special) */}
                    {bench.type!=='special' && (
                      <div className="absolute -top-6 right-0 text-xxs text-gray-600 bg-white px-2 py-1 rounded shadow-sm">
                        {bench.seatCount ?? 0} מקומות
                      </div>
                    )}

                    <div className="absolute -top-6 left-0 text-xs font-semibold text-gray-700 bg-white px-2 py-1 rounded shadow-sm">{bench.name}</div>
                    {/* Lock Indicator */}
                    {bench.locked && (<div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"><Lock className="h-3 w-3 text-white"/></div>)}
                    {/* Seats or Special */}
                    {bench.type==='special' ? (
                      <div className="absolute inset-0 flex items-center justify-center text-center">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <div><div className="text-2xl mb-1">{(bench as any).icon}</div><div className="text-xs font-semibold text-gray-700">{bench.name}</div></div>
                      </div>
                    ) : (
                      seats.filter(s=>s.benchId===bench.id).map((seat, idx)=>{
                        const w = seat.userId ? getWorshiperById(seat.userId) : undefined;
                        return (
                          <div
                            key={seat.id}
                            className={`absolute w-12 h-12 rounded-lg flex items-center justify-center text-xs text-white border-2 border-white cursor-pointer transition-all hover:scale-105 ${w ? 'bg-blue-500' : 'bg-gray-300'} ${selectedSeats.has(seat.id) ? 'ring-2 ring-yellow-400' : ''}`}
                            style={{ left: bench.orientation==='horizontal' ? idx*60+10 : 10, top: bench.orientation==='horizontal' ? 10 : idx*60+10 }}
                            onClick={(e)=>{
                              e.stopPropagation();
                              if (e.detail > 1 || activeTool !== 'select') return;
                              setSelectedSeats(prev=>{
                                const set = new Set(prev);
                                if (!e.shiftKey) set.clear();
                                if (set.has(seat.id)) set.delete(seat.id); else set.add(seat.id);
                                return set;
                              });
                            }}
                            onDoubleClick={(e)=>handleSeatClick(seat.id, e)}
                            title={w ? `${w.title ? w.title + ' ' : ''}${w.firstName} ${w.lastName}` : 'מקום פנוי - לחיצה כפולה להקצאה'}
                          >
                            <span className={`font-bold text-center ${w ? 'p-1 text-[10px] leading-tight' : ''}`}>
                              {w ? `${w.title ? w.title + ' ' : ''}${w.firstName} ${w.lastName}` : ''}
                            </span>
                          </div>
                          );
                        })
                      )}
                    {/* Resize handle hint for special */}
                    {bench.type==='special' && selected && (<div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize"><ArrowDownRight className="h-3 w-3 text-white m-0.5"/></div>)}
                  </div>
                );
              })}

              {/* selection rectangle */}
              {isSelecting && selectionRect && (
                <div className="absolute border-2 border-blue-400 bg-blue-200/20 pointer-events-none pdf-hide"
                     style={{ left: selectionRect.x + mapBounds.left, top: selectionRect.y + mapBounds.top, width: selectionRect.width, height: selectionRect.height }}/>
              )}
            </div>

            {/* Status Bar */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-gray-200 pdf-hide">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>זום: {Math.round(zoom*100)}%</span>
                <span>ספסלים: {benches.length}</span>
                <span>מקומות: {seats.length}</span>
                <span>כלי פעיל: {activeTool==='select'?'בחירה':activeTool==='add'?'הוספה':activeTool==='multiSelect'?'בחירה מרובה':'הזזה'}</span>
              </div>
            </div>

            {/* Context menu */}
            {ctxMenu.show && (
              <div
                className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 text-sm"
                style={{ left: ctxMenu.x, top: ctxMenu.y }}
                onMouseLeave={() => setCtxMenu(s => ({ ...s, show: false }))}
              >
                <button
                  className="block w-full text-right px-4 py-2 hover:bg-gray-50 text-red-600"
                  disabled={!selectedBenches.length}
                  onClick={() => {
                    if (selectedBenches.length) deleteSelectedBenches();
                    setCtxMenu(s => ({ ...s, show: false }));
                  }}
                >
                  מחק
                </button>
                <button
                  className="block w-full text-right px-4 py-2 hover:bg-gray-50"
                  disabled={!selectedBenches.length}
                  onClick={() => {
                    if (selectedBenches.length) {
                      const current = benches.find(b => b.id === selectedBenches[0])?.seatCount ?? 0;
                      const result = prompt('מספר מקומות חדש', current.toString());
                      const count = result ? parseInt(result, 10) : NaN;
                      if (!Number.isNaN(count)) updateSeatCount(selectedBenches[0], count);
                    }
                    setCtxMenu(s => ({ ...s, show: false }));
                  }}
                >
                  שנה מספר מקומות
                </button>
                <button
                  className="block w-full text-right px-4 py-2 hover:bg-gray-50"
                  disabled={!selectedBenches.length}
                  onClick={() => {
                    if (selectedBenches.length) duplicateBench(selectedBenches[0], 'down');
                    setCtxMenu(s => ({ ...s, show: false }));
                  }}
                >
                  העתקה למטה
                </button>
                <button
                  className="block w-full text-right px-4 py-2 hover:bg-gray-50"
                  disabled={!selectedBenches.length}
                  onClick={() => {
                    if (selectedBenches.length) duplicateBench(selectedBenches[0], 'right');
                    setCtxMenu(s => ({ ...s, show: false }));
                  }}
                >
                  העתקה לצד
                </button>
                <button
                  className="block w-full text-right px-4 py-2 hover:bg-gray-50"
                  disabled={selectedBenches.length !== 1}
                  onClick={() => {
                    if (selectedBenches.length === 1) rotateBench(selectedBenches[0]);
                    setCtxMenu(s => ({ ...s, show: false }));
                  }}
                >
                  סיבוב 90°
                </button>
                <button
                  className="block w-full text-right px-4 py-2 hover:bg-gray-50"
                  disabled={selectedSeats.size === 0}
                  onClick={() => {
                    if (selectedSeats.size) {
                      setSelectedSeatsForWorshiper(Array.from(selectedSeats));
                      setShowWorshiperModal(true);
                    }
                    setCtxMenu(s => ({ ...s, show: false }));
                  }}
                >
                  שיוך שם למקום
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign worshiper modal */}
      {showWorshiperModal && selectedSeatsForWorshiper.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{selectedSeatsForWorshiper.length > 1 ? 'הקצה מקומות' : 'הקצה מקום'}</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              <button
                onClick={()=>{
                  setSeats(prev=>prev.map(s=> selectedSeatsForWorshiper.includes(s.id) ? { ...s, userId: undefined } : s));
                  setShowWorshiperModal(false);
                  setSelectedSeatsForWorshiper([]);
                  setSelectedSeats(new Set());
                }}
                className="w-full p-3 text-right bg-gray-100 hover:bg-gray-200 rounded-lg"
              >פנה מקום</button>
              {worshipers.map(w => {
                const assignedSeats = seats.filter(s => s.userId === w.id).length;
                const isFull = assignedSeats + selectedSeatsForWorshiper.length > w.seatCount;
                return (
                  <button
                    key={w.id}
                    disabled={isFull}
                    onClick={()=>{
                      if (!isFull) {
                        setSeats(prev=>prev.map(s=> selectedSeatsForWorshiper.includes(s.id) ? { ...s, userId: w.id } : s));
                        setShowWorshiperModal(false);
                        setSelectedSeatsForWorshiper([]);
                        setSelectedSeats(new Set());
                      }
                    }}
                    className={`w-full p-3 text-right rounded-lg ${isFull ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 hover:bg-blue-100'}`}
                  >
                    {w.title} {w.firstName} {w.lastName}
                    {isFull && ' (מכסת מקומות מלאה)'}
                  </button>
                );
              })}
            </div>
            <button
              onClick={()=>{
                setShowWorshiperModal(false);
                setSelectedSeatsForWorshiper([]);
              }}
              className="mt-4 w-full p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >ביטול</button>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}

export default SeatsManagement;
