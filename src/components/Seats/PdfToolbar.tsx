import React from 'react';
import { exportMapToPDF, PdfMode, ColorMode } from './pdfUtils';

interface PdfToolbarProps {
  wrapperRef: React.RefObject<HTMLDivElement>;
  mapLayerRef: React.RefObject<HTMLDivElement>;
  /** optional id for the export button */
  id?: string;
}

const PdfToolbar: React.FC<PdfToolbarProps> = ({ wrapperRef, mapLayerRef, id }) => {
  const [pdfMode, setPdfMode] = React.useState<PdfMode>('a4');
  const [colorMode, setColorMode] = React.useState<ColorMode>('color');
  const [hardBW, setHardBW] = React.useState(false);
  const [threshold, setThreshold] = React.useState(128);
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>('portrait');

  const onExport = async () => {
    if (!wrapperRef.current || !mapLayerRef.current) return;
    await exportMapToPDF({
      wrapperEl: wrapperRef.current,
      mapLayerEl: mapLayerRef.current,
      mode: pdfMode,
      colorMode,
      bwHard: hardBW,
      bwThreshold: threshold,
      marginsMm: 0,
      scale: 0.5,
      orientation,
      fileName:
        (colorMode === 'bw' ? 'map-bw-' : 'map-color-') +
        (pdfMode === 'a4' ? 'a4.pdf' : 'onepage.pdf'),
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-sm">
        צבע:
        <select
          value={colorMode}
          onChange={e => setColorMode(e.target.value as ColorMode)}
          className="ml-2 border rounded px-2 py-1"
        >
          <option value="color">צבעוני</option>
          <option value="bw">שחור-לבן</option>
        </select>
      </label>

      {colorMode === 'bw' && (
        <>
          <label className="text-sm flex items-center gap-1">
            <input
              type="checkbox"
              checked={hardBW}
              onChange={e => setHardBW(e.target.checked)}
            />
            המרה קשיחה (B/W)
          </label>
          {hardBW && (
            <label className="text-sm">
              סף:
              <input
                type="range"
                min={0}
                max={255}
                value={threshold}
                onChange={e => setThreshold(+e.target.value)}
                className="ml-2"
              />
              <span className="ml-2">{threshold}</span>
            </label>
          )}
        </>
      )}

      <label className="text-sm">
        פורמט:
        <select
          value={pdfMode}
          onChange={e => setPdfMode(e.target.value as PdfMode)}
          className="ml-2 border rounded px-2 py-1"
        >
          <option value="a4">A4 (פיצול עמודים אוטומטי)</option>
          <option value="onePage">דף אחד (כל המפה)</option>
        </select>
      </label>

      {pdfMode === 'a4' && (
        <label className="text-sm">
          כיוון:
          <select
            value={orientation}
            onChange={e => setOrientation(e.target.value as 'portrait' | 'landscape')}
            className="ml-2 border rounded px-2 py-1"
          >
            <option value="portrait">אנכי</option>
            <option value="landscape">אופקי</option>
          </select>
        </label>
      )}

      <button
        id={id}
        onClick={onExport}
        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
      >
        ייצוא PDF
      </button>
    </div>
  );
};

export default PdfToolbar;
