
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

export interface MapData {
  id: string;
  name: string;
  benches: Bench[];
  seats: Seat[];
  mapBounds: MapBounds;
  mapOffset: MapOffset;
}

export interface MapTemplate {
  id: string;
  name: string;
  benches: Bench[];
  seats: Seat[];
  mapBounds: MapBounds;
  mapOffset: MapOffset;
}
