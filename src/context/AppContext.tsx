import React, { createContext, useContext, ReactNode } from 'react';
import { User, Seat, Bench, GridSettings, MapBounds, MapOffset } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface AppContextType {
  users: User[];
  setUsers: (users: User[] | ((prev: User[]) => User[])) => void;
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
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
  
  // יצירת 6 ספסלים ראשוניים
  for (let i = 0; i < 6; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    benches.push({
      id: `bench-${i + 1}`,
      name: `ספסל ${i + 1}`,
      seatCount: 4,
      position: {
        x: col * 300 + 50,
        y: row * 200 + 50,
      },
      orientation: 'horizontal',
      color: colors[i],
      locked: false,
    });
  }
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
  const [users, setUsers] = useLocalStorage<User[]>('users', [
    {
      id: '1',
      name: 'יוסי כהן',
      email: 'yossi@example.com',
      phone: '050-1234567',
      department: 'פיתוח',
    },
    {
      id: '2',
      name: 'דנה לוי',
      email: 'dana@example.com',
      phone: '052-9876543',
      department: 'עיצוב',
    },
    {
      id: '3',
      name: 'מיכאל גרין',
      email: 'michael@example.com',
      phone: '054-5555555',
      department: 'שיווק',
    },
    {
      id: '4',
      name: 'שרה אברהם',
      email: 'sarah@example.com',
      phone: '053-1111111',
      department: 'משאבי אנוש',
    },
    {
      id: '5',
      name: 'אבי רוזן',
      email: 'avi@example.com',
      phone: '052-2222222',
      department: 'מכירות',
    },
  ]);

  const [benches, setBenches] = useLocalStorage<Bench[]>('benches', generateInitialBenches());
  const [seats, setSeats] = useLocalStorage<Seat[]>('seats', () => generateSeatsFromBenches(generateInitialBenches()));
  
  const [gridSettings, setGridSettings] = useLocalStorage<GridSettings>('gridSettings', {
    showGrid: true,
    snapToGrid: true,
    gridSize: 20,
  });

  const [mapBounds, setMapBounds] = useLocalStorage<MapBounds>('mapBounds', {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  });

  const [mapOffset, setMapOffset] = useLocalStorage<MapOffset>('mapOffset', {
    x: 0,
    y: 0,
  });

  return (
    <AppContext.Provider value={{ 
      users, 
      setUsers, 
      seats, 
      setSeats, 
      benches,
      setBenches,
      gridSettings,
      setGridSettings,
      mapBounds,
      setMapBounds,
      mapOffset,
      setMapOffset
    }}>
      {children}
    </AppContext.Provider>
  );
};