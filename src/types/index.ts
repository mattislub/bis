
export interface Worshiper {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  phone: string;
  secondaryPhone?: string;
  email: string;
  seatCount: number;
  avatar?: string;
  promises?: WorshiperItem[];
  aliyot?: WorshiperItem[];
  places?: WorshiperItem[];
}

export interface WorshiperItem {
  id: string;
  description: string;
  amount: number;
  paid: boolean;
  createdAtGregorian: string;
  createdAtHebrew: string;
}

export interface Seat {
  id: number;
  userId?: string;
  benchId?: string;
  position: {
    x: number;
    y: number;
  };
  isOccupied: boolean;
}

export interface Bench {
  id: string;
  name: string;
  seatCount: number;
  position: {
    x: number;
    y: number;
  };
  orientation: 'horizontal' | 'vertical';
  color: string;
  type?: 'bench' | 'special';
  width?: number;
  height?: number;
  icon?: string;
  locked?: boolean;
  temporary?: boolean;
}

export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface GridSettings {
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

export interface MapBounds {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface MapOffset {
  x: number;
  y: number;
}

export interface Boundary {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export interface Sticker {
  name: string;
  benchName: string;
}

export interface MapData {
  id: string;
  name: string;
  benches: Bench[];
  seats: Seat[];
  mapBounds: MapBounds;
  mapOffset: MapOffset;
  boundaries: Boundary[];
  stickers: Sticker[];
}

export interface MapTemplate {
  id: string;
  name: string;
  benches: Bench[];
  seats: Seat[];
  mapBounds: MapBounds;
  mapOffset: MapOffset;
  boundaries: Boundary[];
  stickers?: Sticker[];
}
