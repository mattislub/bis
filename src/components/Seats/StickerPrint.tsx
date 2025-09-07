import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const StickerPrint: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { benches, seats, worshipers, loadMap } = useAppContext();

  useEffect(() => {
    if (id) {
      loadMap(id);
    }
  }, [id, loadMap]);

  const stickers = seats
    .filter(s => s.userId)
    .map(s => {
      const w = worshipers.find(w => w.id === s.userId);
      const bench = benches.find(b => b.id === s.benchId);
      const name = w ? `${w.title ? w.title + ' ' : ''}${w.firstName} ${w.lastName}` : '';
      const benchName = bench?.name || '';
      return { name, benchName };
    });

  useEffect(() => {
    const originalPadding = document.body.style.padding;
    const originalMargin = document.body.style.margin;
    document.body.style.padding = '0';
    document.body.style.margin = '0';
    // Trigger print after styles applied
    if (stickers.length) {
      setTimeout(() => window.print(), 0);
    }
    return () => {
      document.body.style.padding = originalPadding;
      document.body.style.margin = originalMargin;
    };
  }, [stickers]);

  const pages: { name: string; benchName: string }[][] = [];
  for (let i = 0; i < stickers.length; i += 24) {
    pages.push(stickers.slice(i, i + 24));
  }

  return (
    <div className="p-0 m-0">
      {pages.map((page, pageIndex) => (
        <div
          key={pageIndex}
          className="w-[210mm] h-[297mm] grid grid-cols-3 grid-rows-8"
          style={{ pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto' }}
        >
          {page.map((s, i) => (
            <div key={i} className="flex flex-col items-center justify-center text-center p-2">
              <div className="text-xs">{s.benchName}</div>
              <div className="text-lg font-bold">{s.name}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default StickerPrint;

