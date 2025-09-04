import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type PdfMode = 'a4' | 'onePage';
export type ColorMode = 'color' | 'bw';

const DPI_FOR_MM = 96;
const MM_PER_INCH = 25.4;

function pxToMm(px: number, dpi = DPI_FOR_MM) {
  return (px / dpi) * MM_PER_INCH;
}

async function renderWrapperToCanvas(wrapperEl: HTMLElement) {
  const fullWidth = wrapperEl.scrollWidth || wrapperEl.clientWidth;
  const fullHeight = wrapperEl.scrollHeight || wrapperEl.clientHeight;

  return await html2canvas(wrapperEl, {
    width: fullWidth,
    height: fullHeight,
    windowWidth: fullWidth,
    windowHeight: fullHeight,
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
  } = opts;

  mapLayerEl.classList.add('pdf-export');
  let canvas = await renderWrapperToCanvas(wrapperEl);
  mapLayerEl.classList.remove('pdf-export');

  if (colorMode === 'bw') {
    canvas = toGrayscaleCanvas(canvas, bwHard, bwThreshold);
  }

  if (mode === 'onePage') {
    const pageWmm = pxToMm(canvas.width);
    const pageHmm = pxToMm(canvas.height);
    const orientation = pageWmm > pageHmm ? 'landscape' : 'portrait';
    const pdf = new jsPDF({ orientation, unit: 'mm', format: [pageWmm, pageHmm], compress: false });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageWmm, pageHmm);
    pdf.save(fileName);
    return;
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: false });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const maxW = pageW - marginsMm * 2;
  const maxH = pageH - marginsMm * 2;

  const imgWpx = canvas.width;
  const imgHpx = canvas.height;

  let renderW = maxW;
  let renderH = (imgHpx * renderW) / imgWpx;
  if (renderH > maxH) {
    renderH = maxH;
    renderW = (imgWpx * renderH) / imgHpx;
  }
  const pxPerMm = imgWpx / renderW;
  const sliceHeightPx = Math.floor(maxH * pxPerMm);

  for (let yPx = 0; yPx < imgHpx; yPx += sliceHeightPx) {
    if (yPx > 0) pdf.addPage();
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = imgWpx;
    sliceCanvas.height = Math.min(sliceHeightPx, imgHpx - yPx);
    sliceCanvas.getContext('2d')!.drawImage(
      canvas,
      0,
      yPx,
      imgWpx,
      sliceCanvas.height,
      0,
      0,
      imgWpx,
      sliceCanvas.height
    );
    const sliceHmm = sliceCanvas.height / pxPerMm;
    pdf.addImage(
      sliceCanvas.toDataURL('image/png'),
      'PNG',
      (pageW - renderW) / 2,
      marginsMm,
      renderW,
      Math.min(sliceHmm, maxH)
    );
  }

  pdf.save(fileName);
}
