import { jsPDF } from 'jspdf';

import { Bench, Seat, Sticker, Worshiper } from '../types';

// Convert an ArrayBuffer font file to a binary string jsPDF can consume
function arrayBufferToBinaryString(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)) as unknown as number[]
    );
  }
  return binary;
}

interface LabelPrintOptions {
  benches?: Bench[];
  seats?: Seat[];
  worshipers?: Worshiper[];
  stickers?: Sticker[];
}

export async function printLabels({ benches = [], seats = [], worshipers = [], stickers }: LabelPrintOptions): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Try to load an available font for Hebrew text. We attempt a list of
  // candidates, falling back to the built-in font if none can be loaded.
  const fonts = [
    { url: '/fonts/NotoSansHebrew.ttf', file: 'NotoSansHebrew.ttf' },
    { url: '/fonts/DejaVuSans.ttf', file: 'DejaVuSans.ttf' }
  ];
  let customFontLoaded = false;

  for (const font of fonts) {
    try {
      const res = await fetch(font.url);
      // Some servers might not set a specific font content-type.
      // As long as the request succeeds, assume the response is a font file.
      if (!res.ok) {
        continue;
      }
      const buf = await res.arrayBuffer();
      const fontData = arrayBufferToBinaryString(buf);
      pdf.addFileToVFS(font.file, fontData);
      pdf.addFont(font.file, 'HebrewFont', 'normal');
      if (pdf.getFontList()['HebrewFont']) {
        pdf.setFont('HebrewFont');
        customFontLoaded = true;
        break;
      }
    } catch (err) {
      console.warn('Failed to load font', font.url, err);
      // Try the next font
    }
  }

  if (!customFontLoaded) {
    console.warn('No custom font found; using built-in font');
  }

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const cols = 3;
  const rows = 8;
  const marginX = 10;
  const marginY = 10;
  const labelW = (pageW - marginX * 2) / cols;
  const labelH = (pageH - marginY * 2) / rows;

  const labels = stickers
    ? stickers
    : seats
        .filter(s => s.userId)
        .map(s => {
          const w = worshipers.find(w => w.id === s.userId);
          const bench = benches.find(b => b.id === s.benchId);
          const name = w ? `${w.title ? w.title + ' ' : ''}${w.firstName} ${w.lastName}` : '';
          const benchName = bench?.name || '';
          return { name, benchName };
        });

  const rtl = (s: string) => `\u202B${s}\u202C`;

  labels.forEach((label, idx) => {
    if (idx > 0 && idx % (cols * rows) === 0) {
      pdf.addPage();
    }
    const pos = idx % (cols * rows);
    const col = pos % cols;
    const row = Math.floor(pos / cols);
    const x = marginX + col * labelW;
    const y = marginY + row * labelH;

    pdf.setFontSize(16);
    pdf.text(rtl(label.name), x + labelW / 2, y + labelH / 2 - 4, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text(rtl(label.benchName), x + labelW / 2, y + labelH / 2 + 6, { align: 'center' });
  });

  pdf.save('labels.pdf');
}

export default printLabels;
