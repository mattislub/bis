import React, { createContext, useContext, ReactNode } from 'react';
import {
  Worshiper,
  Seat,
  Bench,
  GridSettings,
  MapBounds,
  MapOffset,
  MapData,
  MapTemplate,
} from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';

interface AppContextType {
  worshipers: Worshiper[];
  setWorshipers: (worshipers: Worshiper[] | ((prev: Worshiper[]) => Worshiper[])) => void;
  seats: Seat[];
  setSeats: (seats: Seat[] | ((prev: Seat[]) => Seat[])) => void;
  benches: Bench[];
  setBenches: (benches: Bench[] | ((prev: Bench[]) => Bench[])) => void;
  gridSettings: GridSettings;
  setGridSettings: (settings: GridSettings | ((prev: GridSettings) => GridSettings)) => void;
  mapBounds: MapBounds;
  setMapBounds: (bounds: MapBounds | ((prev: MapBounds) => MapBounds)) => void;
  mapOffset: MapOffset;
  setMapOffset: (offset: MapOffset | ((prev: MapOffset) => MapOffset)) => void;
  maps: MapData[];
  setMaps: (maps: MapData[] | ((prev: MapData[]) => MapData[])) => void;
  currentMapId: string;
  setCurrentMapId: (id: string) => void;
  mapTemplates: MapTemplate[];
  addTemplate: (template: MapTemplate) => void;
  saveCurrentMap: (name?: string) => void;
  loadMap: (id: string) => void;
  deleteMap: (id: string) => void;
  renameMap: (id: string, name: string) => void;
  createMapFromTemplate: (templateId: string, name: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

const generateInitialBenches = (): Bench[] => {
  const benches: Bench[] = [];
  const colors = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#06B6D4',
    '#1F2937',
    '#6366F1',
    '#14B8A6',
    '#D946EF',
    '#F97316',
    '#84CC16',
    '#E879F9',
    '#22D3EE',
    '#F43F5E',
    '#A855F7',
  ];

  let colorIndex = 0;
  const getColor = () => colors[colorIndex++ % colors.length];

  // שלושת הספסלים העליונים (4 מקומות כל אחד)
  for (let i = 0; i < 3; i++) {
    benches.push({
      id: `bench-top-${i + 1}`,
      name: `ספסל עליון ${i + 1}`,
      seatCount: 4,
      position: { x: 100 + i * 370, y: 150 },
      orientation: 'horizontal',
      color: getColor(),
      locked: false,
      temporary: false,
    });
  }

  // שורה של חמישה ספסלים בצד שמאל
  for (let i = 0; i < 5; i++) {
    benches.push({
      id: `bench-left-${i + 1}`,
      name: `ספסל שמאל ${i + 1}`,
      seatCount: 4,
      position: { x: 50, y: 200 + i * 100 },
      orientation: 'horizontal',
      color: getColor(),
      locked: false,
      temporary: false,
    });
  }

  // שורה של חמישה ספסלים בצד ימין
  for (let i = 0; i < 5; i++) {
    benches.push({
      id: `bench-right-${i + 1}`,
      name: `ספסל ימין ${i + 1}`,
      seatCount: 4,
      position: { x: 890, y: 200 + i * 100 },
      orientation: 'horizontal',
      color: getColor(),
      locked: false,
      temporary: false,
    });
  }

  // שלושה ספסלים מתחת לבימה
  for (let i = 0; i < 3; i++) {
    benches.push({
      id: `bench-bottom-${i + 1}`,
      name: `ספסל תחתון ${i + 1}`,
      seatCount: 4,
      position: { x: 100 + i * 370, y: 650 },
      orientation: 'horizontal',
      color: getColor(),
      locked: false,
      temporary: false,
    });
  }

  // אלמנטים מיוחדים: ארון קודש, עמוד תפילה ובימה
  benches.push({
    id: 'aron-kodesh',
    name: 'ארון קודש',
    seatCount: 0,
    position: { x: 540, y: 20 },
    orientation: 'horizontal',
    color: '#8B4513',
    type: 'special',
    width: 120,
    height: 80,
    icon: '🕍',
    locked: false,
    temporary: false,
  });

  benches.push({
    id: 'amud-tfila',
    name: 'עמוד תפילה',
    seatCount: 0,
    position: { x: 700, y: 40 },
    orientation: 'horizontal',
    color: '#2F4F4F',
    type: 'special',
    width: 40,
    height: 60,
    icon: '🕯️',
    locked: false,
    temporary: false,
  });

  benches.push({
    id: 'bimah',
    name: 'בימה',
    seatCount: 0,
    position: { x: 550, y: 300 },
    orientation: 'horizontal',
    color: '#654321',
    type: 'special',
    width: 100,
    height: 100,
    icon: '📖',
    locked: false,
    temporary: false,
  });

  return benches;
};

const generateSeatsFromBenches = (benches: Bench[]): Seat[] => {
  const seats: Seat[] = [];
  let seatId = 1;

  benches.forEach(bench => {
    for (let i = 0; i < bench.seatCount; i++) {

      seats.push({
        id: seatId++,
        benchId: bench.id,
        position: { x: 0, y: 0 }, // המיקום יחושב יחסית לספסל
        isOccupied: false,
      });
    }
  });

  return seats;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userKey = user?.username ?? 'guest';
  const [worshipers, setWorshipers] = useLocalStorage<Worshiper[]>('worshipers', [
    {
      id: '1',
      title: 'מר',
      firstName: 'יוסי',
      lastName: 'כהן',
      address: 'רחוב האלף 1',
      city: 'תל אביב',
      phone: '050-1234567',
      email: 'yossi@example.com',
      seatCount: 1,
    },
    {
      id: '2',
      title: 'מרת',
      firstName: 'דנה',
      lastName: 'לוי',
      address: 'רחוב הבת 2',
      city: 'ירושלים',
      phone: '052-9876543',
      email: 'dana@example.com',
      seatCount: 2,
    },
    {
      id: '3',
      title: 'רב',
      firstName: 'מיכאל',
      lastName: 'גרין',
      address: 'רחוב הגימל 3',
      city: 'חיפה',
      phone: '054-5555555',
      email: 'michael@example.com',
      seatCount: 1,
    },
    {
      id: '4',
      title: 'מרת',
      firstName: 'שרה',
      lastName: 'אברהם',
      address: 'רחוב הדלת 4',
      city: 'באר שבע',
      phone: '053-1111111',
      email: 'sarah@example.com',
      seatCount: 3,
    },
    {
      id: '5',
      title: 'מר',
      firstName: 'אבי',
      lastName: 'רוזן',
      address: 'רחוב ההא 5',
      city: 'נתניה',
      phone: '052-2222222',
      email: 'avi@example.com',
      seatCount: 1,
    },
  ], userKey);
  const initialBenches = generateInitialBenches();
  const initialSeats = generateSeatsFromBenches(initialBenches);
  const defaultMap: MapData = {
    id: 'default-map',
    name: 'מפת ברירת מחדל',
    benches: initialBenches,
    seats: initialSeats,
    mapBounds: { top: 20, right: 20, bottom: 20, left: 20 },
    mapOffset: { x: 0, y: 0 },
  };
  const [benches, setBenches] = useLocalStorage<Bench[]>('benches', initialBenches, userKey);
  const [seats, setSeats] = useLocalStorage<Seat[]>('seats', initialSeats, userKey);

  const [maps, setMaps] = useLocalStorage<MapData[]>('maps', [defaultMap], userKey);
  const [currentMapId, setCurrentMapId] = useLocalStorage<string>('currentMapId', defaultMap.id, userKey);

  const defaultTemplate: MapTemplate = {
    id: 'default',
    name: 'תבנית ברירת מחדל',
    benches: initialBenches.map(b => ({ ...b })),
    seats: initialSeats.map(s => ({ ...s })),
    mapBounds: defaultMap.mapBounds,
    mapOffset: defaultMap.mapOffset,
  };
  const [mapTemplates, setMapTemplates] = useLocalStorage<MapTemplate[]>('mapTemplates', [defaultTemplate], userKey);

  const [gridSettings, setGridSettings] = useLocalStorage<GridSettings>('gridSettings', {
    showGrid: true,
    snapToGrid: true,
    gridSize: 20,
  }, userKey);

  const [mapBounds, setMapBounds] = useLocalStorage<MapBounds>('mapBounds', defaultMap.mapBounds, userKey);

  const [mapOffset, setMapOffset] = useLocalStorage<MapOffset>('mapOffset', defaultMap.mapOffset, userKey);

  const saveCurrentMap = (name?: string) => {
    if (currentMapId) {
      setMaps(prev =>
        prev.map(m =>
          m.id === currentMapId
            ? { ...m, benches, seats, mapBounds, mapOffset }
            : m
        )
      );
    } else if (name) {
      const id = Date.now().toString();
      const map: MapData = {
        id,
        name,
        benches,
        seats,
        mapBounds,
        mapOffset,
      };
      setMaps(prev => [...prev, map]);
      setCurrentMapId(id);
    }
  };

  const loadMap = (id: string) => {
    const map = maps.find(m => m.id === id);
    if (map) {
      setBenches(map.benches);
      setSeats(map.seats);
      setMapBounds(map.mapBounds);
      setMapOffset(map.mapOffset);
      setCurrentMapId(id);
    }
  };

  const deleteMap = (id: string) => {
    setMaps(prev => prev.filter(m => m.id !== id));
    if (currentMapId === id) {
      setCurrentMapId('');
    }
  };

  const renameMap = (id: string, name: string) => {
    setMaps(prev => prev.map(m => (m.id === id ? { ...m, name } : m)));
  };

  const addTemplate = (template: MapTemplate) => {
    setMapTemplates(prev => [...prev, template]);
  };

  const createMapFromTemplate = (templateId: string, name: string) => {
    const template = mapTemplates.find(t => t.id === templateId);
    if (template) {
      const id = Date.now().toString();
      const newMap: MapData = { ...template, id, name };
      setMaps(prev => [...prev, newMap]);
      setBenches(template.benches);
      setSeats(template.seats);
      setMapBounds(template.mapBounds);
      setMapOffset(template.mapOffset);
      setCurrentMapId(id);
    }
  };

  return (
    <AppContext.Provider value={{
      worshipers,
      setWorshipers,
      seats,
      setSeats,
      benches,
      setBenches,
      gridSettings,
      setGridSettings,
      mapBounds,
      setMapBounds,
      mapOffset,
      setMapOffset,
      maps,
      setMaps,
      currentMapId,
      setCurrentMapId,
      mapTemplates,
      addTemplate,
      saveCurrentMap,
      loadMap,
      deleteMap,
      renameMap,
      createMapFromTemplate
    }}>
      {children}
    </AppContext.Provider>
  );
};
