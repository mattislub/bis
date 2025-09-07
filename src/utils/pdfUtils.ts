import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export type PdfMode = 'a4' | 'onePage';
export type ColorMode = 'color' | 'bw';

type ExportOpts = {
  wrapperEl: HTMLDivElement;       // המעטפת (לא חובה לצילום, כן לחישובים עתידיים)
  mapLayerEl: HTMLDivElement;      // השכבה עם כל המפה (זה מה שנצלם)
  mode: PdfMode;                   // 'a4' מפוצל או 'onePage'
  colorMode: ColorMode;            // 'color' או 'bw'
  bwHard?: boolean;                // אופציונלי: המרה קשיחה לשחור/לבן
  bwThreshold?: number;            // סף לשחור/לבן (0-255)
  marginsMm?: number;              // שוליים (ברירת מחדל 5mm)
  orientation?: 'portrait' | 'landscape';
  fileName?: string;               // שם קובץ
};

// ---------- טעינת פונט עברי חד-פעמית ----------
let hebrewFontReady: Promise<void> | null = null;
async function ensureHebrewFont(doc: jsPDF, url = '/fonts/NotoSansHebrew.ttf') {
  if (!hebrewFontReady) {
    hebrewFontReady = (async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch font ${url}`);
      const buf = await res.arrayBuffer();

      // ArrayBuffer -> base64 נקי
      let binary = '';
      const bytes = new Uint8Array(buf);
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[]);
      }
      const base64 = btoa(binary);

      doc.addFileToVFS('NotoSansHebrew.ttf', base64);
      try {
        // תאימות לגרסאות jsPDF שונות:
        // @ts-expect-error: jsPDF older versions use 4th arg for encoding
        doc.addFont('NotoSansHebrew.ttf', 'NotoSansHebrew', 'normal', 'Identity-H');
      } catch {
        doc.addFont('NotoSansHebrew.ttf', 'NotoSansHebrew', 'normal');
      }
    })();
  }
  await hebrewFontReady;

  doc.setFont('NotoSansHebrew', 'normal');
  // RTL אם נתמך
  const docWithR2L = doc as unknown as { setR2L?: (enable?: boolean) => void };
  if (typeof docWithR2L.setR2L === 'function') docWithR2L.setR2L(true);
}

// ---------- מדידה מלאה של המפה (גם מה שלא על המסך) ----------
function measureFullMapBBox(mapLayerEl: HTMLDivElement) {
  const prev = mapLayerEl.style.transform;
  mapLayerEl.style.transform = 'translate(0px, 0px) scale(1)'; // אפסנו זמנית כדי למדוד אמת

  let minLeft = Infinity, minTop = Infinity, maxRight = -Infinity, maxBottom = -Infinity;
  const children = Array.from(mapLayerEl.children) as HTMLElement[];

  if (!children.length) {
    mapLayerEl.style.transform = prev;
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  for (const el of children) {
    const left = el.offsetLeft;
    const top = el.offsetTop;
    const right = left + el.offsetWidth;
    const bottom = top + el.offsetHeight;
    if (left < minLeft) minLeft = left;
    if (top < minTop) minTop = top;
    if (right > maxRight) maxRight = right;
    if (bottom > maxBottom) maxBottom = bottom;
  }

  mapLayerEl.style.transform = prev;

  return {
    x: minLeft,
    y: minTop,
    width: Math.max(0, maxRight - minLeft),
    height: Math.max(0, maxBottom - minTop),
  };
}

// ---------- מסנן אלמנטים שלא נכנסים ל-PDF ----------
function ignorePdfHide(el: Element) {
  const any = el as HTMLElement;
  return any.classList?.contains('pdf-hide'); // אל תצלם אלמנטים עם המחלקה הזו
}

// ---------- המרת קנבס לשחור-לבן קשיח (אופציונלי) ----------
function toHardBW(canvas: HTMLCanvasElement, threshold = 128) {
  const ctx = canvas.getContext('2d')!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    const v = gray >= threshold ? 255 : 0;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

// ---------- צילום אלמנט לטווח BBox ----------
async function renderBBoxToCanvas(el: HTMLDivElement, bbox: {x:number;y:number;width:number;height:number}) {
  // נצלם רק את תחום ה-BBox
  const scale = Math.min(2, window.devicePixelRatio || 1) * 2; // איכות טובה בלי משקלים מטורפים
  const canvas = await html2canvas(el, {
    backgroundColor: '#ffffff',
    x: bbox.x,
    y: bbox.y,
    width: bbox.width,
    height: bbox.height,
    scale,
    // אל תכלול אלמנטים עם pdf-hide
    ignoreElements: ignorePdfHide,
  });
  return canvas;
}

// ---------- עוזרים להמרות יחידות ----------
const mmToPt = (mm: number) => (mm * 72) / 25.4; // jsPDF עובד ב-pt (72pt = 1in = 25.4mm)
const pxToPt = (px: number, pxPerPt = 96 / 72) => px / pxPerPt; // הנחה של 96dpi בדפדפן

// ---------- ייצוא מרכזי ----------
export async function exportMapToPDF(opts: ExportOpts) {
  const {
    mapLayerEl,
    mode,
    colorMode,
    bwHard = false,
    bwThreshold = 128,
    marginsMm = 5,
    orientation = 'portrait',
    fileName = mode === 'a4' ? 'map-a4.pdf' : 'map-onepage.pdf',
  } = opts;

  // 1) מודדים את כל המפה (לא תלוי זום/סקְרוֹל על המסך)
  const bbox = measureFullMapBBox(mapLayerEl);

  // 2) מצלמים את כל המפה לקנבס
  let canvas = await renderBBoxToCanvas(mapLayerEl, bbox);

  // 3) עיבוד צבע אופציונלי
  if (colorMode === 'bw' && bwHard) {
    canvas = toHardBW(canvas, bwThreshold);
  }

  // 4) מסמך PDF
  const doc = new jsPDF({ orientation, unit: 'pt', compress: true, putOnlyUsedFonts: true });
  await ensureHebrewFont(doc);

  const pageWpt = doc.internal.pageSize.getWidth();
  const pageHpt = doc.internal.pageSize.getHeight();
  const marginPt = mmToPt(marginsMm);
  const workWpt = pageWpt - marginPt * 2;
  const workHpt = pageHpt - marginPt * 2;

  // 5) הזרקה ל-PDF, מצב אחד-דף או פיצול A4
  if (mode === 'onePage') {
    // התאמה פרופורציונלית
    const imgWpt = pxToPt(canvas.width);
    const imgHpt = pxToPt(canvas.height);
    const scale = Math.min(workWpt / imgWpt, workHpt / imgHpt);
    const drawW = imgWpt * scale;
    const drawH = imgHpt * scale;
    const x = marginPt + (workWpt - drawW) / 2;
    const y = marginPt + (workHpt - drawH) / 2;

    const dataURL = canvas.toDataURL('image/png');
    doc.addImage(dataURL, 'PNG', x, y, drawW, drawH, undefined, 'FAST');
  } else {
    // A4 – מפצלים לעמודים
    const pxPerPt = 96 / 72; // תואם px→pt שלמעלה
    const tileWpx = Math.floor(workWpt * pxPerPt);
    const tileHpx = Math.floor(workHpt * pxPerPt);

    const cols = Math.max(1, Math.ceil(canvas.width / tileWpx));
    const rows = Math.max(1, Math.ceil(canvas.height / tileHpx));

    const ctx = canvas.getContext('2d')!;
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = tileWpx;
    pageCanvas.height = tileHpx;
    const pageCtx = pageCanvas.getContext('2d')!;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const sx = c * tileWpx;
        const sy = r * tileHpx;
        const sWidth = Math.min(tileWpx, canvas.width - sx);
        const sHeight = Math.min(tileHpx, canvas.height - sy);

        // נקה דף
        pageCtx.clearRect(0, 0, tileWpx, tileHpx);
        // חתיכה מהתמונה הראשית
        const imgData = ctx.getImageData(sx, sy, sWidth, sHeight);
        pageCtx.putImageData(imgData, 0, 0);

        const tileURL = pageCanvas.toDataURL('image/png');
        if (r !== 0 || c !== 0) doc.addPage();
        doc.addImage(tileURL, 'PNG', marginPt, marginPt, workWpt, workHpt, undefined, 'FAST');
      }
    }
  }

  doc.save(fileName);
}
