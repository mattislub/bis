declare module 'jspdf' {
  export class jsPDF {
    constructor(options?: unknown);
    addImage(...args: unknown[]): void;
    addPage(): void;
    addFileToVFS(filename: string, filecontent: string): void;
    addFont(postScriptName: string, id: string, fontStyle: string): void;
    setFont(fontName: string): void;
    setFontSize(size: number): void;
    text(text: string, x: number, y: number, options?: unknown): void;
    getFontList(): Record<string, unknown>;
    internal: {
      pageSize: { getWidth(): number; getHeight(): number };
    };
    save(filename?: string): void;
  }
}

declare module 'html2canvas' {
  const html2canvas: (element: HTMLElement, options?: unknown) => Promise<HTMLCanvasElement>;
  export default html2canvas;
}
