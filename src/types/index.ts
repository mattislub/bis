export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
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