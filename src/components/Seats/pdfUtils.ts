import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type PdfMode = 'a4' | 'onePage';
export type ColorMode = 'color' | 'bw';

const DPI_FOR_MM = 96;
const MM_PER_INCH = 25.4;

function pxToMm(px: number, dpi = DPI_FOR_MM) {
  return (px / dpi) * MM_PER_INCH;
}

async function renderWrapperToCanvas(wrapperEl: HTMLElement, mapLayerEl: HTMLElement) {
  const fullWidth = Math.max(
    wrapperEl.scrollWidth || wrapperEl.clientWidth,
    mapLayerEl.scrollWidth || mapLayerEl.clientWidth
  );
  const fullHeight = Math.max(
    wrapperEl.scrollHeight || wrapperEl.clientHeight,
    mapLayerEl.scrollHeight || mapLayerEl.clientHeight
  );

  return await html2canvas(wrapperEl, {
    width: fullWidth,
    height: fullHeight,
    windowWidth: fullWidth,
    windowHeight: fullHeight,
    scrollX: 0,
    scrollY: 0,
    scale: 3,
    useCORS: true,
    backgroundColor: '#ffffff',
  });
}

function toGrayscaleCanvas(src: HTMLCanvasElement, pureBW = false, threshold = 128) {
  const w = src.width, h = src.height;
  const dst = document.createElement('canvas');
  dst.width = w; dst.height = h;
  const sctx = src.getContext('2d')!;
  const dctx = dst.getContext('2d')!;
  const img = sctx.getImageData(0, 0, w, h);
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (pureBW) {
      const v = y >= threshold ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = v;
    } else {
      data[i] = data[i + 1] = data[i + 2] = y;
    }
  }
  dctx.putImageData(img, 0, 0);
  return dst;
}

export async function exportMapToPDF(opts: {
  wrapperEl: HTMLElement;
  mapLayerEl: HTMLElement;
  mode: PdfMode;
  colorMode: ColorMode;
  /** Desired orientation for the generated PDF pages */
  orientation?: 'portrait' | 'landscape';
  bwHard?: boolean;
  bwThreshold?: number;
  marginsMm?: number;
  fileName?: string;
}) {
  const {
    wrapperEl,
    mapLayerEl,
    mode,
    colorMode,
    bwHard = false,
    bwThreshold = 128,
    marginsMm = 10,
    fileName = 'map.pdf',
    orientation,
  } = opts;

  wrapperEl.classList.add('pdf-exporting');
  mapLayerEl.classList.add('pdf-export');
  let canvas = await renderWrapperToCanvas(wrapperEl, mapLayerEl);
  mapLayerEl.classList.remove('pdf-export');
  wrapperEl.classList.remove('pdf-exporting');

  if (colorMode === 'bw') {
    canvas = toGrayscaleCanvas(canvas, bwHard, bwThreshold);
  }

  if (mode === 'onePage') {
    const pageWmm = pxToMm(canvas.width);
    const pageHmm = pxToMm(canvas.height);
    const autoOrientation = pageWmm > pageHmm ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
      orientation: orientation || autoOrientation,
      unit: 'mm',
      format: [pageWmm, pageHmm],
      compress: false,
    });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageWmm, pageHmm);
    pdf.save(fileName);
    return;
  }

  const autoOrientation = canvas.width > canvas.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation: orientation || autoOrientation,
    unit: 'mm',
    format: 'a4',
    compress: false,
  });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const maxW = pageW - marginsMm * 2;
  const maxH = pageH - marginsMm * 2;

  const imgWpx = canvas.width;
  const imgHpx = canvas.height;

  const pxPerMm = DPI_FOR_MM / MM_PER_INCH;
  const sliceWidthPx = Math.floor(maxW * pxPerMm);
  const sliceHeightPx = Math.floor(maxH * pxPerMm);

  for (let yPx = 0; yPx < imgHpx; yPx += sliceHeightPx) {
    for (let xPx = 0; xPx < imgWpx; xPx += sliceWidthPx) {
      if (xPx > 0 || yPx > 0) pdf.addPage();
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = Math.min(sliceWidthPx, imgWpx - xPx);
      sliceCanvas.height = Math.min(sliceHeightPx, imgHpx - yPx);
      sliceCanvas.getContext('2d')!.drawImage(
        canvas,
        xPx,
        yPx,
        sliceCanvas.width,
        sliceCanvas.height,
        0,
        0,
        sliceCanvas.width,
        sliceCanvas.height
      );
      const sliceWmm = sliceCanvas.width / pxPerMm;
      const sliceHmm = sliceCanvas.height / pxPerMm;
      pdf.addImage(
        sliceCanvas.toDataURL('image/png'),
        'PNG',
        marginsMm,
        marginsMm,
        sliceWmm,
        sliceHmm
      );
    }
  }

  pdf.save(fileName);
}
