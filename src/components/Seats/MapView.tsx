import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Seat, Worshiper } from '../../types';
import { API_BASE_URL } from '../../api';
import MapZoomControls from './MapZoomControls';
import { Printer, Target, Tags } from 'lucide-react';

const MapView: React.FC = () => {
  const { id } = useParams<{ id?: string }>();

  const {
    benches,
    seats,
    loadMap,
    mapBounds,
    mapOffset,
    setMapOffset,
    worshipers,
    currentMapId,
    boundaries,
  } = useAppContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [baseSize, setBaseSize] = useState({ width: 1200, height: 800 });
  const [zoom, setZoom] = useState(1);
  const mapId = id || currentMapId;

  useEffect(() => {
    const originalPadding = document.body.style.padding;
    const originalMargin = document.body.style.margin;
    document.body.style.padding = '0';
    document.body.style.margin = '0';
    return () => {
      document.body.style.padding = originalPadding;
      document.body.style.margin = originalMargin;
    };
  }, []);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setBaseSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (id) {
      loadMap(id);
    } else {
      const storageKey = user ? `${user.email}-defaultMapId` : 'defaultMapId';
      fetch(`${API_BASE_URL}/api/storage/${storageKey}`, {
        headers: user ? { 'X-User-Email': user.email } : undefined,
      })
        .then(res => res.json())
        .then((mapId) => {
          if (mapId) {
            navigate(`/view/${mapId}`, { replace: true });
          }
        })
        .catch(err => console.error('load default map error', err));
    }
  }, [id, loadMap, navigate, user]);

  const getWorshiperById = (worshiperId: string): Worshiper | undefined => {
    return worshipers.find(w => w.id === worshiperId);
  };

  const getSeatStatus = (seat: Seat) => {
    if (seat.userId) {
      const worshiper = getWorshiperById(seat.userId);
      return { worshiper, color: 'bg-blue-500' };
    }
    if (seat.area === 2) {
      return { worshiper: null, color: 'bg-red-300' };
    }
    return { worshiper: null, color: 'bg-gray-300' };
  };

  const centerMap = useCallback(() => {
    let minX = benches.length ? Infinity : 0;
    let minY = benches.length ? Infinity : 0;
    let maxX = benches.length ? -Infinity : 0;
    let maxY = benches.length ? -Infinity : 0;

    benches.forEach(b => {
      const width =
        b.type === 'special'
          ? b.width || 0
          : b.orientation === 'horizontal'
            ? b.seatCount * 60 + 20
            : 80;
      const height =
        b.type === 'special'
          ? b.height || 0
          : b.orientation === 'horizontal'
            ? 80
            : b.seatCount * 60 + 20;
      minX = Math.min(minX, b.position.x);
      minY = Math.min(minY, b.position.y);
      maxX = Math.max(maxX, b.position.x + width);
      maxY = Math.max(maxY, b.position.y + height);
    });

    minX -= mapBounds.left;
    minY -= mapBounds.top;
    maxX += mapBounds.right;
    maxY += mapBounds.bottom;

    const contentW = Math.max(1, maxX - minX);
    const contentH = Math.max(1, maxY - minY);
    const W = baseSize.width;
    const H = baseSize.height;

    setMapOffset({
      x: Math.round(W / 2 - (minX + contentW / 2) * zoom),
      y: Math.round(H / 2 - (minY + contentH / 2) * zoom),
    });
  }, [benches, mapBounds, baseSize, zoom, setMapOffset]);

  return (
    <div className="min-h-screen w-full overflow-auto bg-gray-100 print:h-auto print:min-h-full print:w-auto print:min-w-full print:overflow-visible">
      <div ref={containerRef} className="relative h-screen w-full print:h-auto print:w-auto print:min-w-full">

        <div className="absolute top-4 right-4 z-10 flex flex-col items-center space-y-2">
          <MapZoomControls setZoom={setZoom} orientation="vertical" />
          <button
            onClick={centerMap}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            aria-label="מרכז מפה"
          >
            <Target className="h-4 w-4" />
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            aria-label="הדפס מפה"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={() => mapId && navigate(`/view/${mapId}/labels`)}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            aria-label="הדפס מדבקות"
          >
            <Tags className="h-4 w-4" />
          </button>
        </div>
        <div
          className="absolute"
          style={{ width: baseSize.width + mapBounds.left + mapBounds.right, height: baseSize.height + mapBounds.top + mapBounds.bottom }}
        >
          <div
            className="absolute inset-0"
            style={{ transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${zoom})`, transformOrigin: 'top left' }}
          >
            {benches.map(bench => (
            <div
              key={bench.id}
              className="absolute rounded-lg border-2 print:border-black print:bg-white"
              style={{
                left: bench.position.x + mapBounds.left,
                top: bench.position.y + mapBounds.top,
                width:
                  bench.type === 'special'
                    ? bench.width
                    : bench.orientation === 'horizontal'
                      ? bench.seatCount * 60 + 20
                      : 80,
                height:
                  bench.type === 'special'
                    ? bench.height
                    : bench.orientation === 'horizontal'
                      ? 80
                      : bench.seatCount * 60 + 20,
                backgroundColor: `${bench.color}20`,
                borderColor: bench.color,
              }}
            >
              {bench.type !== 'special' &&
                seats
                  .filter(seat => seat.benchId === bench.id)
                  .map((seat, index) => {
                    const status = getSeatStatus(seat);
                    return (
                      <div
                        key={seat.id}
                        className={`absolute w-12 h-12 rounded-lg flex items-center justify-center text-[10px] text-white border-2 border-white ${status.color} p-1 print:text-black print:bg-white print:border-black`}
                        style={{
                          left: bench.orientation === 'horizontal' ? index * 60 + 10 : 10,
                          top: bench.orientation === 'horizontal' ? 10 : index * 60 + 10,
                        }}
                        title={
                          status.worshiper
                            ? `${status.worshiper.title} ${status.worshiper.firstName} ${status.worshiper.lastName}`
                            : 'פנוי'
                        }
                      >
                        {status.worshiper
                          ? `${status.worshiper.title} ${status.worshiper.firstName} ${status.worshiper.lastName}`
                          : 'פנוי'}
                      </div>
                    );
                  })}

              {bench.type === 'special' && (
                <div className="absolute inset-0 flex items-center justify-center text-center">
                  <div>
                    <div className="text-2xl mb-1">{bench.icon}</div>
                    <div className="text-xs font-semibold text-gray-700">{bench.name}</div>
                  </div>
                </div>
              )}
            </div>
            ))}

            {/* Boundaries */}
            <svg className="absolute inset-0 pointer-events-none z-50">
              {boundaries.map(b => (
                <rect
                  key={b.id}
                  x={b.x + mapBounds.left}
                  y={b.y + mapBounds.top}
                  width={b.width}
                  height={b.height}
                  stroke="#ff0000"
                  strokeWidth={2}
                  fill="#ff0000"
                  fillOpacity={0.2}
                />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;

