declare module 'jspdf' {
  export class jsPDF {
    constructor(options?: unknown);
    addImage(...args: unknown[]): void;
    save(filename?: string): void;
  }
}

declare module 'html2canvas' {
  const html2canvas: (element: HTMLElement, options?: unknown) => Promise<HTMLCanvasElement>;
  export default html2canvas;
}
