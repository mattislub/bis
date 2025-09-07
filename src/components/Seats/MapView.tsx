import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Seat, Worshiper } from '../../types';
import { API_BASE_URL } from '../../api';
import MapZoomControls from './MapZoomControls';

const MapView: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const { benches, seats, loadMap, mapBounds, mapOffset, worshipers } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [baseSize, setBaseSize] = useState({ width: 1200, height: 800 });
  const [zoom, setZoom] = useState(1);

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
      fetch(`${API_BASE_URL}/api/storage/defaultMapId`)
        .then(res => res.json())
        .then((mapId) => {
          if (mapId) {
            loadMap(mapId);
          }
        })
        .catch(err => console.error('load default map error', err));
    }
  }, [id, loadMap]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('print')) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [location]);

  const getWorshiperById = (worshiperId: string): Worshiper | undefined => {
    return worshipers.find(w => w.id === worshiperId);
  };

  const getSeatStatus = (seat: Seat) => {
    if (seat.userId) {
      const worshiper = getWorshiperById(seat.userId);
      return { worshiper, color: 'bg-blue-500' };
    }
    return { worshiper: null, color: 'bg-gray-300' };
  };

  return (
    <div className="min-h-screen w-full overflow-auto bg-gray-100">
      <div ref={containerRef} className="relative h-screen w-full">
        <div className="absolute top-4 right-4 z-10">
          <MapZoomControls setZoom={setZoom} orientation="vertical" />
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;

