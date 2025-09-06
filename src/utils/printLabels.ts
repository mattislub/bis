import { jsPDF } from 'jspdf';
import { Bench, Seat, Worshiper } from '../types';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)) as unknown as number[]
    );
  }
  return btoa(binary);
}

interface LabelPrintOptions {
  benches: Bench[];
  seats: Seat[];
  worshipers: Worshiper[];
}

export async function printLabels({ benches, seats, worshipers }: LabelPrintOptions): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  try {
    const res = await fetch('/fonts/NotoSansHebrew.ttf');
    if (!res.ok) throw new Error('Font request failed');
    const buf = await res.arrayBuffer();
    const base64 = arrayBufferToBase64(buf);
    pdf.addFileToVFS('NotoSansHebrew.ttf', base64);
    pdf.addFont('NotoSansHebrew.ttf', 'NotoHeb', 'normal');
    pdf.setFont('NotoHeb');
  } catch (err) {
    console.error('Failed to load custom font, aborting PDF generation', err);
    return;
  }

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const cols = 3;
  const rows = 8;
  const marginX = 10;
  const marginY = 10;
  const labelW = (pageW - marginX * 2) / cols;
  const labelH = (pageH - marginY * 2) / rows;

  const labels = seats
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
