import React, { useState, useCallback, useRef, useLayoutEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Seat, Worshiper, Bench, MapBounds } from '../../types';
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
  ArrowDownRight,
  Hand,
  BoxSelect,
  ListOrdered,
  Save,
  Eye,
  UserCheck,
  Printer,
  Tag,
  ExternalLink
} from 'lucide-react';
import MapZoomControls from './MapZoomControls';
import PdfToolbar from './PdfToolbar';
import { exportMapToPDF } from './pdfUtils';
import { specialElements } from './specialElements';

const MIN_BENCH_SPACING = 20;
const MAP_EXPANSION_MARGIN = 20;

// עזרי חישוב והתאמת זום
type XY = { x: number; y: number };
type BBox = { x: number; y: number; w: number; h: number };

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;
const FIT_PADDING = 24;

function getContentBBox(items: Array<{ x: number; y: number; width: number; height: number }>): BBox | null {
  if (!items || items.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const it of items) {
    const x1 = it.x;
    const y1 = it.y;
    const x2 = it.x + it.width;
    const y2 = it.y + it.height;
    if (x1 < minX) minX = x1;
    if (y1 < minY) minY = y1;
    if (x2 > maxX) maxX = x2;
    if (y2 > maxY) maxY = y2;
  }
  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) return null;
  return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
}

const getBenchDimensions = (bench: Bench) => {
  if (bench.type === 'special') {
    return {
      width: bench.width || 0,
      height: bench.height || 0,
    };
  }
  return {
    width:
      bench.orientation === 'horizontal'
        ? bench.seatCount * 60 + 20
        : 80,
    height:
      bench.orientation === 'horizontal'
        ? 80
        : bench.seatCount * 60 + 20,
  };
};

const ensureBenchSpacing = (
  benches: Bench[],
  spacing = MIN_BENCH_SPACING
): Bench[] => {
  const adjusted = benches.map(b => ({
    ...b,
    position: { ...b.position },
  }));
  let hasOverlap = true;
  let iterations = 0;
  while (hasOverlap && iterations < 100) {
    hasOverlap = false;
    for (let i = 0; i < adjusted.length; i++) {
      for (let j = i + 1; j < adjusted.length; j++) {
        const a = adjusted[i];
        const b = adjusted[j];
        const { width: aw, height: ah } = getBenchDimensions(a);
        const { width: bw, height: bh } = getBenchDimensions(b);

        const ax = a.position.x + aw / 2;
        const ay = a.position.y + ah / 2;
        const bx = b.position.x + bw / 2;
        const by = b.position.y + bh / 2;

        const dx = ax - bx;
        const dy = ay - by;

        const overlapX = aw / 2 + bw / 2 + spacing - Math.abs(dx);
        const overlapY = ah / 2 + bh / 2 + spacing - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          hasOverlap = true;
          if (overlapX < overlapY) {
            const shift = overlapX / 2;
            if (dx > 0) {
              a.position.x += shift;
              b.position.x -= shift;
            } else {
              a.position.x -= shift;
              b.position.x += shift;
            }
          } else {
            const shift = overlapY / 2;
            if (dy > 0) {
              a.position.y += shift;
              b.position.y -= shift;
            } else {
              a.position.y -= shift;
              b.position.y += shift;
            }
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
    seats,
    setSeats,
    worshipers,
    benches,
    setBenches,
    gridSettings,
    setGridSettings,
    mapBounds,
    setMapBounds,
    mapOffset,
    setMapOffset,
    maps,
    saveCurrentMap,
    loadMap,
    currentMapId,
    renameMap,
  } = useAppContext();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [baseSize, setBaseSize] = useState({ width: 1200, height: 800 });
  const currentMap = maps.find(m => m.id === currentMapId);
  const userInteractedRef = useRef(false);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setBaseSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    const onWheel = () => { userInteractedRef.current = true; };
    const onMouseDown = () => { userInteractedRef.current = true; };
    const onKeyDown = () => { userInteractedRef.current = true; };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const updateBenches = useCallback(
    (updater: Bench[] | ((prev: Bench[]) => Bench[])) => {
      if (typeof updater === 'function') {
        setBenches(prev => ensureBenchSpacing((updater as (prev: Bench[]) => Bench[])(prev)));
      } else {
        setBenches(ensureBenchSpacing(updater));
      }
    },
    [setBenches]
  );
  const [draggedBench, setDraggedBench] = useState<string | null>(null);
  const [selectedBenchIds, setSelectedBenchIds] = useState<string[]>([]);
  const selectedBench = selectedBenchIds.length === 1 ? selectedBenchIds[0] : null;
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [showSeatDetails, setShowSeatDetails] = useState(false);
  const [dragStartPositions, setDragStartPositions] = useState<Record<string, XY> | null>(null);
  const [dragOffset, setDragOffset] = useState<XY | null>(null);
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
    color: '#3B82F6',
    temporary: false,
  });

  const [contextMenuPos, setContextMenuPos] = useState<XY | null>(null);
  const [pendingPosition, setPendingPosition] = useState<XY | null>(null);
  const [showSpecialDialog, setShowSpecialDialog] = useState(false);
  const [selectedSpecialId, setSelectedSpecialId] = useState('');

  const [resizingBench, setResizingBench] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<
    { x: number; y: number; width: number; height: number; direction: 'right' | 'bottom' | 'corner' } | null
  >(null);
  const [openSettingsId, setOpenSettingsId] = useState<string | null>(null);

  const [isPanMode, setIsPanMode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<XY | null>(null);
  const [zoom, setZoom] = useState(1);

  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<XY | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const isInitialRender = useRef(true);
  React.useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    saveCurrentMap();
  }, [benches, saveCurrentMap]);

  const handleSaveMap = () => {
    saveCurrentMap();
  };

  const handleAddMap = () => {
    const name = prompt('הכנס שם למפה החדשה:');
    if (name) {
      saveCurrentMap(name);
    }
  };

  const handleRenameMap = useCallback(
    (id: string) => {
      const currentName = maps.find(m => m.id === id)?.name || '';
      const name = prompt('הכנס שם חדש למפה:', currentName);
      if (name) {
        renameMap(id, name);
      }
    },
    [maps, renameMap]
  );

  const handleBoundChange = (side: keyof MapBounds, value: number) => {
    setMapBounds(prev => ({ ...prev, [side]: value }));
  };

  const handleFitToScreen = () => {
    userInteractedRef.current = false;
    setZoom(z => z);
  };

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
  ];

  React.useEffect(() => {
    if (userInteractedRef.current) return;
    if (!baseSize?.width || !baseSize?.height) return;

    const items = benches.map(b => {
      const { width, height } = getBenchDimensions(b);
      return {
        x: b.position.x + mapBounds.left,
        y: b.position.y + mapBounds.top,
        width,
        height,
      };
    });
    const bbox = getContentBBox(items);
    if (!bbox) {
      setZoom(1);
      setMapOffset({ x: 0, y: 0 });
      return;
    }

    const availW = Math.max(1, baseSize.width - FIT_PADDING * 2);
    const availH = Math.max(1, baseSize.height - FIT_PADDING * 2);
    let scale = Math.min(availW / bbox.w, availH / bbox.h);
    scale = clamp(scale, MIN_ZOOM, MAX_ZOOM);

    const contentCenterX = bbox.x + bbox.w / 2;
    const contentCenterY = bbox.y + bbox.h / 2;
    const targetPanX = baseSize.width / 2 - contentCenterX * scale;
    const targetPanY = baseSize.height / 2 - contentCenterY * scale;

    setZoom(scale);
    setMapOffset({ x: Math.round(targetPanX), y: Math.round(targetPanY) });
  }, [baseSize.width, baseSize.height, benches, mapBounds, setMapOffset, setZoom]);

  const getWorshiperById = (id: string): Worshiper | undefined => {
    return worshipers.find(w => w.id === id);
  };

  const snapToGrid = (value: number): number => {
    if (!gridSettings.snapToGrid) return value;
    return Math.round(value / gridSettings.gridSize) * gridSettings.gridSize;
  };

  const expandBoundsIfNeeded = useCallback(
    (benchesToCheck: Bench[], rect: DOMRect | { width: number; height: number }) => {
      setMapBounds(prev => {
        let left = prev.left;
        let top = prev.top;
        let right = prev.right;
        let bottom = prev.bottom;

        benchesToCheck.forEach(b => {
          const { width, height } = getBenchDimensions(b);
          left = Math.max(left, Math.max(0, -b.position.x + MAP_EXPANSION_MARGIN));
          top = Math.max(top, Math.max(0, -b.position.y + MAP_EXPANSION_MARGIN));
          right = Math.max(
            right,
            Math.max(0, b.position.x + width - rect.width + MAP_EXPANSION_MARGIN)
          );
          bottom = Math.max(
            bottom,
            Math.max(0, b.position.y + height - rect.height + MAP_EXPANSION_MARGIN)
          );
        });

        return { left, top, right, bottom };
      });
    },
    [setMapBounds]
  );

  const handleBenchDragStart = (e: React.DragEvent<HTMLDivElement>, benchId: string) => {
    if (resizingBench) {
      e.preventDefault();
      return;
    }
    const bench = benches.find(b => b.id === benchId);
    if (bench?.locked) {
      e.preventDefault();
      return;
    }
    let currentSelection = selectedBenchIds;
    if (!currentSelection.includes(benchId)) {
      currentSelection = [benchId];
      setSelectedBenchIds(currentSelection);
      setSelectedSeatIds([]);
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
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    e.dataTransfer.effectAllowed = 'move';
    // Some browsers require data to be set for drag events to fire properly
    e.dataTransfer.setData('text/plain', benchId);
  };

  const handleBenchDragEnd = () => {
    setDraggedBench(null);
    setDragStartPositions(null);
    setDragOffset(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedBench) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = dragOffset?.x ?? 0;
    const offsetY = dragOffset?.y ?? 0;
    const x = snapToGrid((e.clientX - rect.left - mapOffset.x - mapBounds.left - offsetX) / zoom);
    const y = snapToGrid((e.clientY - rect.top - mapOffset.y - mapBounds.top - offsetY) / zoom);

    let updated: Bench[] = [];

    // העברת ספסל קיים או בחירה מרובה
    if (dragStartPositions && selectedBenchIds.length > 1) {
      const start = dragStartPositions[draggedBench];
      const deltaX = x - start.x;
      const deltaY = y - start.y;
      updated = benches.map(bench => {
        if (selectedBenchIds.includes(bench.id)) {
          if (bench.locked) return bench;
          const pos = dragStartPositions[bench.id];
          return {
            ...bench,
            position: {
              x: snapToGrid(pos.x + deltaX),
              y: snapToGrid(pos.y + deltaY),
            }
          };
        }
        return bench;
      });
    } else {
      updated = benches.map(bench =>
        bench.id === draggedBench && !bench.locked
          ? { ...bench, position: { x, y } }
          : bench
      );
    }

    updateBenches(updated);
    expandBoundsIfNeeded(updated, rect);
  };

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    benchId: string,
    direction: 'right' | 'bottom' | 'corner'
  ) => {
    e.stopPropagation();
    e.preventDefault();
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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - mapOffset.x - mapBounds.left) / zoom;
    const y = (e.clientY - rect.top - mapOffset.y - mapBounds.top) / zoom;

    if (isPanMode) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setContextMenuPos(null);
      setSelectedBenchIds([]);
      return;
    }

    if (e.target === e.currentTarget) {
      setContextMenuPos(null);
      if (isMultiSelectMode) {
        setIsSelecting(true);
        setSelectionStart({ x, y });
        setSelectionRect({ x, y, width: 0, height: 0 });
        setSelectedBenchIds([]);
        setSelectedSeatIds([]);
        setOpenSettingsId(null);
      } else {
        setSelectedBenchIds([]);
        setSelectedSeatIds([]);
        setOpenSettingsId(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning && panStart) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setMapOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (isSelecting && selectionStart) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left - mapOffset.x - mapBounds.left) / zoom;
      const y = (e.clientY - rect.top - mapOffset.y - mapBounds.top) / zoom;
      setSelectionRect({
        x: Math.min(x, selectionStart.x),
        y: Math.min(y, selectionStart.y),
        width: Math.abs(x - selectionStart.x),
        height: Math.abs(y - selectionStart.y),
      });
      return;
    }

    if (!resizingBench || !resizeStart) return;
    const dx = (e.clientX - resizeStart.x) / zoom;
    const dy = (e.clientY - resizeStart.y) / zoom;

    const minWidth = 20;
    const minHeight = 20;
    const containerWidth = baseSize.width;
    const containerHeight = baseSize.height;

    const updated = benches.map(b => {
      if (b.id !== resizingBench) return b;
      let newWidth = b.width || 0;
      let newHeight = b.height || 0;
      if (resizeStart.direction === 'right' || resizeStart.direction === 'corner') {
        newWidth = Math.max(minWidth, snapToGrid((resizeStart.width || 0) + dx));
      }
      if (resizeStart.direction === 'bottom' || resizeStart.direction === 'corner') {
        newHeight = Math.max(minHeight, snapToGrid((resizeStart.height || 0) + dy));
      }
      return { ...b, width: newWidth, height: newHeight };
    });

    updateBenches(updated);
    expandBoundsIfNeeded(updated, { width: containerWidth, height: containerHeight });
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
    }

    if (isSelecting && selectionRect) {
      const selected = benches.filter(b => {
        const benchWidth = b.type === 'special'
          ? (b.width || 0)
          : b.orientation === 'horizontal'
            ? b.seatCount * 60 + 20
            : 80;
        const benchHeight = b.type === 'special'
          ? (b.height || 0)
          : b.orientation === 'horizontal'
            ? 80
            : b.seatCount * 60 + 20;
        return (
          b.position.x + benchWidth > selectionRect.x &&
          b.position.x < selectionRect.x + selectionRect.width &&
          b.position.y + benchHeight > selectionRect.y &&
          b.position.y < selectionRect.y + selectionRect.height
        );
      }).map(b => b.id);
      setSelectedBenchIds(selected);
    }

    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionRect(null);

    if (resizingBench) {
      setResizingBench(null);
      setResizeStart(null);
    }
  };

  const handleBenchClick = (e: React.MouseEvent, benchId: string) => {
    e.stopPropagation();
    setOpenSettingsId(null);
    if (isMultiSelectMode || e.shiftKey) {
      setSelectedBenchIds(prev =>
        prev.includes(benchId)
          ? prev.filter(id => id !== benchId)
          : [...prev, benchId]
      );
    } else {
      setSelectedBenchIds([benchId]);
    }
    setSelectedSeatIds([]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenuPos({
      x: (e.clientX - rect.left - mapOffset.x - mapBounds.left) / zoom,
      y: (e.clientY - rect.top - mapOffset.y - mapBounds.top) / zoom,
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
      temporary: benchForm.temporary,
    };

    const updated = [...benches, newBench];
    updateBenches(updated);

    const newSeats = generateSeatsForBench(newBench);
    setSeats(prev => [...prev, ...newSeats]);

    expandBoundsIfNeeded(updated, { width: baseSize.width, height: baseSize.height });

    setBenchForm({ name: '', seatCount: 4, orientation: 'horizontal', color: '#3B82F6', temporary: false });
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
      temporary: false,
    };
    const updated = [...benches, newSpecial];
    updateBenches(updated);
    expandBoundsIfNeeded(updated, { width: baseSize.width, height: baseSize.height });
    setShowSpecialDialog(false);
    setSelectedSpecialId('');
    setPendingPosition(null);
  };

  const updateBench = () => {
    if (!editingBench || !benchForm.name) return;
    let updatedBenches = benches.map(bench =>
      bench.id === editingBench
        ? {
            ...bench,
            name: benchForm.name,
            color: benchForm.color,
            orientation: benchForm.orientation,
            temporary: benchForm.temporary,
          }
        : bench
    );

    const currentBench = benches.find(b => b.id === editingBench);
    if (currentBench && currentBench.seatCount !== benchForm.seatCount) {
      setSeats(prev => prev.filter(seat => seat.benchId !== editingBench));
      const updatedBench = {
        ...currentBench,
        name: benchForm.name,
        color: benchForm.color,
        orientation: benchForm.orientation,
        seatCount: benchForm.seatCount,
        temporary: benchForm.temporary,
      };
      updatedBenches = updatedBenches.map(bench =>
        bench.id === editingBench ? updatedBench : bench
      );
      const newSeats = generateSeatsForBench(updatedBench);
      setSeats(prev => [...prev, ...newSeats]);
    }

    updateBenches(updatedBenches);
    expandBoundsIfNeeded(updatedBenches, { width: baseSize.width, height: baseSize.height });

    setBenchForm({ name: '', seatCount: 4, orientation: 'horizontal', color: '#3B82F6', temporary: false });
    setEditingBench(null);
  };

  const deleteBench = (benchId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק ספסל זה? כל המקומות שלו יימחקו גם כן.')) {
      updateBenches(prev => prev.filter(bench => bench.id !== benchId));
      setSeats(prev => prev.filter(seat => seat.benchId !== benchId));
      setSelectedBenchIds(prev => prev.filter(id => id !== benchId));
    }
  };

  const rotateBench = (benchId: string) => {
    const bench = benches.find(b => b.id === benchId);
    if (!bench) return;

    const newOrientation = bench.orientation === 'horizontal' ? 'vertical' : 'horizontal';
    
    const updated = benches.map(b =>
      b.id === benchId ? { ...b, orientation: newOrientation } : b
    );
    updateBenches(updated);
    expandBoundsIfNeeded(updated, { width: baseSize.width, height: baseSize.height });

    // המקומות עכשיו מוכלים בספסל ולא צריכים עדכון מיקום נפרד
  };

  const copyBench = (benchId: string, direction: 'horizontal' | 'vertical') => {
    const originalBench = benches.find(b => b.id === benchId);
    if (!originalBench) return;

    const offsetX = direction === 'horizontal'
      ? (originalBench.orientation === 'horizontal'
          ? originalBench.seatCount * 60 + 20 + 19
          : 80 + 19)
      : 0;

    const offsetY = direction === 'vertical'
      ? (originalBench.orientation === 'vertical'
          ? originalBench.seatCount * 60 + 20 + 19
          : 80 + 19)
      : 0;

    const newBench: Bench = {
      ...originalBench,
      id: `bench-${Date.now()}`,
      name: `${originalBench.name} (עותק)`,
      position: {
        x: originalBench.position.x + offsetX,
        y: originalBench.position.y + offsetY,
      },
    };

    const updated = [...benches, newBench];
    updateBenches(updated);
    expandBoundsIfNeeded(updated, { width: baseSize.width, height: baseSize.height });

    const newSeats = generateSeatsForBench(newBench);
    setSeats(prev => [...prev, ...newSeats]);
  };

  const toggleBenchLock = (benchId: string) => {
    updateBenches(prev => prev.map(bench =>
      bench.id === benchId ? { ...bench, locked: !bench.locked } : bench
    ));
  };

  const clearMap = () => {
    if (window.confirm('האם אתה בטוח שברצונך לנקות את המפה?')) {
      updateBenches([]);
      setSeats([]);
      setSelectedBenchIds([]);
      setSelectedSeatIds([]);
      setMapOffset({ x: 0, y: 0 });
    }
  };

  const reorderSeatNumbers = () => {
    const orderedBenches = [...benches].sort((a, b) =>
      a.position.y - b.position.y || a.position.x - b.position.x
    );
    let nextId = 1;
    const updatedSeats: Seat[] = [];
    orderedBenches.forEach(bench => {
      const benchSeats = seats
        .filter(seat => seat.benchId === bench.id)
        .sort((a, b) => a.id - b.id);
      benchSeats.forEach(seat => {
        updatedSeats.push({ ...seat, id: nextId++ });
      });
    });
    setSeats(updatedSeats);
  };


  const exportAllSeatsToLabels = () => {
    const labeledSeats = seats
      .filter(seat => seat.userId)
      .sort((a, b) => a.id - b.id);
    if (labeledSeats.length === 0) {
      alert('לא נמצאו שמות להדפסה');
      return;
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: false });
    const pageWidth = doc.internal.pageSize.getWidth();
    const labelHeight = 35;
    const cols = 3;
    const rowsPerPage = 8;

    // שמירה על שוליים בצדדים וסידור התוויות במרכז העמוד
    const horizontalMargin = 10; // מ"מ
    const labelWidth = (pageWidth - horizontalMargin * 2) / cols;
    const topMargin = (297 - rowsPerPage * labelHeight) / 2; // מרכז אנכית

    labeledSeats.forEach((seat, index) => {
      const position = index % (cols * rowsPerPage);
      if (position === 0 && index !== 0) {
        doc.addPage();
      }
      const row = Math.floor(position / cols);
      const col = position % cols;
      const x = horizontalMargin + col * labelWidth;
      const y = topMargin + row * labelHeight;

      doc.rect(x, y, labelWidth, labelHeight);
      const worshiper = seat.userId ? worshipers.find(w => w.id === seat.userId) : undefined;
      const name = worshiper ? `${worshiper.firstName} ${worshiper.lastName}` : '';
      doc.setFontSize(12);
      doc.text(`מקום ${seat.id}`, x + labelWidth / 2, y + 12, { align: 'center' });
      if (name) {
        doc.setFontSize(10);
        doc.text(name, x + labelWidth / 2, y + labelHeight / 2 + 5, { align: 'center' });
      }
    });

    doc.save('labels.pdf');
  };

  const handlePrintMap = async (id: string) => {
    const previousId = currentMapId;
    loadMap(id);
    await new Promise(resolve => setTimeout(resolve, 100));
    if (wrapperRef.current && mapLayerRef.current) {
      await exportMapToPDF({
        wrapperEl: wrapperRef.current,
        mapLayerEl: mapLayerRef.current,
        mode: 'a4',
        colorMode: 'color',
        marginsMm: 10,
        fileName: 'map.pdf',
      });
    }
    if (previousId && previousId !== id) {
      loadMap(previousId);
    }
  };

  const assignWorshiperToSeats = (seatIds: number[], worshiperId: string | null) => {
    if (worshiperId) {
      const worshiper = worshipers.find(w => w.id === worshiperId);
      const assignedCount = seats.filter(s => s.userId === worshiperId).length;
      const selectedCount = seatIds.filter(id => {
        const seat = seats.find(s => s.id === id);
        return seat?.userId !== worshiperId;
      }).length;
      if (worshiper && assignedCount + selectedCount > worshiper.seatCount) {
        alert('לא ניתן לשייך למתפלל זה יותר מקומות מהכמות שהוגדרה עבורו');
        return;
      }
    }
    setSeats(prev => prev.map(seat =>
      seatIds.includes(seat.id)
        ? { ...seat, userId: worshiperId || undefined, isOccupied: !!worshiperId }
        : seat
    ));
    setSelectedSeatIds([]);
    setShowSeatDetails(false);
  };

  const getSeatStatus = (seat: Seat) => {
    if (seat.userId) {
      const worshiper = getWorshiperById(seat.userId);
      return {
        isOccupied: true,
        worshiper,
        color: 'bg-blue-500',
        hoverColor: 'hover:bg-blue-600'
      };
    }
    return {
      isOccupied: false,
      worshiper: null,
      color: 'bg-gray-300',
      hoverColor: 'hover:bg-gray-400'
    };
  };

  const renderGrid = () => {
    if (!gridSettings.showGrid) return null;
    const gridLines = [];
    const containerWidth = baseSize.width + mapBounds.left + mapBounds.right;
    const containerHeight = baseSize.height + mapBounds.top + mapBounds.bottom;
    const startX = (gridSettings.gridSize - (mapBounds.left % gridSettings.gridSize)) % gridSettings.gridSize;
    const startY = (gridSettings.gridSize - (mapBounds.top % gridSettings.gridSize)) % gridSettings.gridSize;

    for (let x = startX; x <= containerWidth; x += gridSettings.gridSize) {
      gridLines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={containerHeight}
          stroke="#e5e7eb"
          strokeWidth="1"
          opacity="0.3"
        />
      );
    }

    for (let y = startY; y <= containerHeight; y += gridSettings.gridSize) {
      gridLines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={containerWidth}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth="1"
          opacity="0.3"
        />
      );
    }

    return (
      <svg
        className="absolute pointer-events-none"
        width={containerWidth}
        height={containerHeight}
      >
        {gridLines}
      </svg>
    );
  };

  const selectedBenchData = selectedBench ? benches.find(b => b.id === selectedBench) : null;
  const selectedSeatsData = seats.filter(s => selectedSeatIds.includes(s.id));
  const selectedSeatData = selectedSeatsData[0] || null;
  const selectedSeatWorshiper = selectedSeatData?.userId ? getWorshiperById(selectedSeatData.userId) : null;

  // טיפול בלחיצות מקלדת
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedBenchIds.length === 0) return;

      const target = e.target as HTMLElement;
      if (target && target.closest('input, textarea, select, [contenteditable="true"]')) return;

      const moveDistance = gridSettings.snapToGrid ? gridSettings.gridSize : 10;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const updated = benches.map(bench => {
          if (!selectedBenchIds.includes(bench.id) || bench.locked) return bench;
          let newX = bench.position.x;
          let newY = bench.position.y;
          if (e.key === 'ArrowUp') newY -= moveDistance;
          if (e.key === 'ArrowDown') newY += moveDistance;
          if (e.key === 'ArrowLeft') newX -= moveDistance;
          if (e.key === 'ArrowRight') newX += moveDistance;
          return { ...bench, position: { x: newX, y: newY } };
        });
        updateBenches(updated);
        expandBoundsIfNeeded(updated, { width: baseSize.width, height: baseSize.height });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBenchIds, benches, updateBenches, gridSettings, expandBoundsIfNeeded, baseSize]);

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
    
    const updated = [...benches, ...newBenches];
    updateBenches(updated);
    setSeats(prev => [...prev, ...newSeats]);
    expandBoundsIfNeeded(updated, { width: baseSize.width, height: baseSize.height });
    setShowRowDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ניהול מקומות ישיבה</h1>
          <p className="text-gray-600 mt-2">גרור ושחרר ספסלים ומקומות ישיבה לעיצוב הפריסה הרצויה</p>
          <h2 className="text-xl font-semibold text-gray-800 mt-2">מפה נוכחית: {currentMap?.name || 'ללא שם'}</h2>
        </div>

        <div className="flex space-x-3 space-x-reverse">
          <button
            onClick={() => setIsAddingBench(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 ml-2" />
            הוסף ספסל
          </button>
          <button
            onClick={() => {
              setPendingPosition({ x: 50, y: 50 });
              setSelectedSpecialId('');
              setShowSpecialDialog(true);
            }}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4 ml-2" />
            הוסף אלמנט קבוע
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
                <button
                  onClick={() => setIsMultiSelectMode(prev => !prev)}
                  className={`p-2 rounded-lg transition-colors ${
                    isMultiSelectMode ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}
                  title="בחירה מרובה"
                >
                  <BoxSelect className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsPanMode(prev => !prev)}
                  className={`p-2 rounded-lg transition-colors ${
                    isPanMode ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}
                  title="הזז מפה"
                >
                  <Hand className="h-4 w-4" />
                </button>
                {selectedSeatIds.length > 0 && (
                  <button
                    onClick={() => setShowSeatDetails(true)}
                    className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    title="שייך למתפלל"
                  >
                    <UserCheck className="h-4 w-4" />
                  </button>
                )}
                  <button
                    onClick={reorderSeatNumbers}
                    className="p-2 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
                    title="סדר מחדש מספרי מקומות"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleSaveMap}
                    className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                    title="שמור שינויים"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <PdfToolbar wrapperRef={wrapperRef} mapLayerRef={mapLayerRef} />
                  <button
                    onClick={exportAllSeatsToLabels}
                    className="p-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                    title="הדפס מדבקות"
                  >
                    <Tag className="h-4 w-4" />
                  </button>
                  <button
                    onClick={clearMap}
                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    title="נקה מפה"
                  >
                    <Trash2 className="h-4 w-4" />
                </button>
                  <MapZoomControls setZoom={setZoom} onFit={handleFitToScreen} min={MIN_ZOOM} max={MAX_ZOOM} />
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
              ref={containerRef}
              className="relative h-[75vh] w-full overflow-auto bg-gray-50 border border-gray-200 rounded-lg"
            >
              <div
                ref={wrapperRef}
                className="relative border-2 border-dashed border-gray-300 rounded-lg mx-auto my-4"
                style={{ width: baseSize.width + mapBounds.left + mapBounds.right, height: baseSize.height + mapBounds.top + mapBounds.bottom }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onContextMenu={handleContextMenu}
                onClick={() => { setContextMenuPos(null); setSelectedBenchIds([]); setSelectedSeatIds([]); setOpenSettingsId(null); setShowSeatDetails(false); }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onMouseDown={handleMouseDown}
              >
                <div
                  ref={mapLayerRef}
                  className="absolute inset-0"
                  style={{ transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${zoom})`, transformOrigin: 'top left' }}
                >
                {renderGrid()}

                {/* סימון מרכז המפה */}
                <div className="absolute left-1/2 top-1/2 w-4 h-4 bg-red-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 map-center-marker print-hidden" />

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
                    left: `${bench.position.x + mapBounds.left}px`,
                    top: `${bench.position.y + mapBounds.top}px`,
                    width: bench.type === 'special' ? `${bench.width}px` :
                           bench.orientation === 'horizontal' ? `${bench.seatCount * 60 + 20}px` : '80px',
                    height: bench.type === 'special' ? `${bench.height}px` :
                            bench.orientation === 'horizontal' ? '80px' : `${bench.seatCount * 60 + 20}px`,
                    backgroundColor: `${bench.color}20`,
                    borderColor: bench.color,
                  }}
                  draggable={!bench.locked && resizingBench !== bench.id}
                  onDragStart={(e) => handleBenchDragStart(e, bench.id)}
                  onDragEnd={handleBenchDragEnd}
                  onClick={(e) => handleBenchClick(e, bench.id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenSettingsId(openSettingsId === bench.id ? null : bench.id);
                    }}
                    className="absolute top-1 left-1 z-[50] p-1 bg-white rounded shadow-md hover:bg-gray-50 transition-colors print-hidden"
                    title="הגדרות"
                  >
                    <Settings className="h-3 w-3 text-gray-600" />
                  </button>
                  {openSettingsId === bench.id && (
                    <div className="absolute top-1 left-7 z-[60] flex space-x-1 space-x-reverse p-1 bg-white rounded shadow-md print-hidden">
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
                          copyBench(bench.id, 'horizontal');
                        }}
                        className="p-1 hover:bg-gray-50 rounded flex items-center gap-0.5"
                        title={bench.type === 'special' ? 'העתק אלמנט אופקי' : 'העתק ספסל אופקי'}
                      >
                        <Copy className="h-3 w-3 text-gray-600" />
                        <ArrowRight className="h-3 w-3 text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyBench(bench.id, 'vertical');
                        }}
                        className="p-1 hover:bg-gray-50 rounded flex items-center gap-0.5"
                        title={bench.type === 'special' ? 'העתק אלמנט אנכי' : 'העתק ספסל אנכי'}
                      >
                        <Copy className="h-3 w-3 text-gray-600" />
                        <ArrowDown className="h-3 w-3 text-gray-600" />
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
                    className="absolute -top-6 left-1/2 -translate-x-1/2 transform px-2 py-1 rounded text-xs font-semibold text-white"
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
                        className="absolute top-1/2 -right-3 p-0.5 bg-blue-500 text-white cursor-e-resize transform -translate-y-1/2 print-hidden"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </div>
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, bench.id, 'bottom')}
                        className="absolute left-1/2 -bottom-3 p-0.5 bg-blue-500 text-white cursor-s-resize transform -translate-x-1/2 print-hidden"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </div>
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, bench.id, 'corner')}
                        className="absolute -bottom-3 -right-3 p-0.5 bg-blue-500 text-white cursor-se-resize print-hidden"
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
                            selectedSeatIds.includes(seat.id) ? 'ring-4 ring-blue-300' : ''
                          }`}
                          style={{
                            left: bench.orientation === 'horizontal' ? `${index * 60 + 10}px` : '10px',
                            top: bench.orientation === 'horizontal' ? '10px' : `${index * 60 + 10}px`,
                            zIndex: 10,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (e.shiftKey || e.ctrlKey || e.metaKey) {
                              setSelectedSeatIds(prev =>
                                prev.includes(seat.id)
                                  ? prev.filter(id => id !== seat.id)
                                  : [...prev, seat.id]
                              );
                            } else {
                              setSelectedSeatIds([seat.id]);
                            }
                            setSelectedBenchIds([]);
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setShowSeatDetails(true);
                          }}
                          title={status.worshiper ? `${status.worshiper.title} ${status.worshiper.firstName} ${status.worshiper.lastName}` : 'פנוי'}
                        >
                          <div className="text-white font-medium text-[10px] leading-tight text-center px-1">
                            {status.worshiper
                              ? `${status.worshiper.title} ${status.worshiper.firstName} ${status.worshiper.lastName}`
                              : 'פנוי'}
                          </div>
                          
                          {status.worshiper && (
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

              {selectionRect && (
                <div
                  className="absolute border-2 border-blue-400 bg-blue-200 bg-opacity-25 pointer-events-none"
                  style={{
                    left: selectionRect.x + mapBounds.left,
                    top: selectionRect.y + mapBounds.top,
                    width: selectionRect.width,
                    height: selectionRect.height,
                  }}
                />
              )}

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
                      setBenchForm({ name: '', seatCount: 4, orientation: 'horizontal', color: '#3B82F6', temporary: false });
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">סוג</label>
                    <select
                      value={benchForm.temporary ? 'temporary' : 'permanent'}
                      onChange={(e) =>
                        setBenchForm(prev => ({ ...prev, temporary: e.target.value === 'temporary' }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="permanent">קבוע</option>
                      <option value="temporary">זמני</option>
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
                <div className="flex justify-between">
                  <span className="text-gray-600">סוג:</span>
                  <span className="font-semibold">{selectedBenchData.temporary ? 'זמני' : 'קבוע'}</span>
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
                        color: selectedBenchData.color,
                        temporary: selectedBenchData.temporary ?? false,
                      });
                      setEditingBench(selectedBench);
                    }}
                    className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 className="h-4 w-4 ml-2" />
                    ערוך
                  </button>
                  <button
                    onClick={() => copyBench(selectedBench, 'horizontal')}
                    className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Copy className="h-4 w-4 ml-2" />
                    <ArrowRight className="h-4 w-4 ml-1" />
                    העתק אופקי
                  </button>
                  <button
                    onClick={() => copyBench(selectedBench, 'vertical')}
                    className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Copy className="h-4 w-4 ml-2" />
                    <ArrowDown className="h-4 w-4 ml-1" />
                    העתק אנכי
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

          {/* פרטי מקום/ות נבחר/ים */}
          {selectedSeatIds.length > 0 && selectedSeatsData.length > 0 && !selectedBench && showSeatDetails && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-md border border-blue-200 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedSeatIds.length > 1 ? `מקומות ${selectedSeatIds.join(', ')}` : `מקום ${selectedSeatIds[0]}`}
                  </h3>
                  <button
                    onClick={() => { setSelectedSeatIds([]); setShowSeatDetails(false); }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      משויך למתפלל
                    </label>
                    <select
                      value={selectedSeatIds.length === 1 ? selectedSeatData?.userId || '' : ''}
                      onChange={(e) => assignWorshiperToSeats(selectedSeatIds, e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">אין משויך</option>
                      {worshipers.map(w => {
                        const assignedCount = seats.filter(s => s.userId === w.id).length;
                        const selectedCount = selectedSeatIds.filter(id => {
                          const seat = seats.find(s => s.id === id);
                          return seat?.userId !== w.id;
                        }).length;
                        const disabled = assignedCount + selectedCount > w.seatCount;
                        return (
                          <option key={w.id} value={w.id} disabled={disabled}>
                            {`${w.title} ${w.firstName} ${w.lastName}`} ({assignedCount}/{w.seatCount})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {selectedSeatIds.length === 1 && selectedSeatWorshiper && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{selectedSeatWorshiper.title} {selectedSeatWorshiper.firstName} {selectedSeatWorshiper.lastName}</div>
                          <div className="text-sm text-gray-600">{selectedSeatWorshiper.city}</div>
                          <div className="text-sm text-gray-500">{selectedSeatWorshiper.email}</div>
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

          {/* רשימת מפות בזכרון */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">מפות בזכרון</h3>
            <button
              onClick={handleAddMap}
              className="w-full flex items-center justify-center px-4 py-2 mb-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 ml-2" />
              הוסף מפה חדשה
            </button>
            {maps.length === 0 ? (
              <p className="text-gray-600">אין מפות בזכרון</p>
            ) : (
              <ul className="space-y-2">
                {maps.map(m => (
                  <li
                    key={m.id}
                    className={`flex items-center justify-between p-2 rounded ${m.id === currentMapId ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
                  >
                  <span className="flex-grow text-right">{m.name}</span>
                  <div className="flex items-center space-x-1 rtl:space-x-reverse">
                      <button
                        onClick={() => loadMap(m.id)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <a
                        href={`#/view/${m.id}`}
                        target="_blank"
                        className="p-1 text-green-600 hover:text-green-800"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handlePrintMap(m.id)}
                        className="p-1 text-purple-600 hover:text-purple-800"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRenameMap(m.id)}
                        className="p-1 text-gray-600 hover:text-gray-800"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

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
