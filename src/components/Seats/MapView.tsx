import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Seat, Worshiper } from '../../types';

const MapView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { benches, seats, loadMap, mapBounds, mapOffset, worshipers } = useAppContext();

  useEffect(() => {
    if (id) {
      loadMap(id);
    }
  }, [id, loadMap]);

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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div
        className="relative bg-white shadow-lg"
        style={{ width: 1200 + mapBounds.left + mapBounds.right, height: 800 + mapBounds.top + mapBounds.bottom }}
      >
        <div
          className="absolute inset-0"
          style={{ transform: `translate(${mapOffset.x}px, ${mapOffset.y}px)`, transformOrigin: 'top left' }}
        >
          {benches.map(bench => (
            <div
              key={bench.id}
              className="absolute rounded-lg border-2"
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
                        className={`absolute w-12 h-12 rounded-lg flex items-center justify-center text-[10px] text-white border-2 border-white ${status.color}`}
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
  );
};

export default MapView;

