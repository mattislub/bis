import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Seat, Worshiper } from '../../types';
import { Users as UsersIcon, MapPin, User as UserIcon, Grid3X3, Armchair } from 'lucide-react';
import MapZoomControls from './MapZoomControls';

const SeatsView: React.FC = () => {
  const { seats, worshipers, benches, gridSettings } = useAppContext();
  const [zoom, setZoom] = useState(1);

  const getWorshiperById = (id: string): Worshiper | undefined => {
    return worshipers.find(w => w.id === id);
  };


  const getSeatStatus = (seat: Seat) => {
    if (seat.userId) {
      const worshiper = getWorshiperById(seat.userId);
      return {
        isOccupied: true,
        worshiper,
        color: 'bg-blue-500',
        hoverColor: 'hover:bg-blue-600'
      };
    }
    return {
      isOccupied: false,
      worshiper: null,
      color: 'bg-gray-300',
      hoverColor: 'hover:bg-gray-400'
    };
  };

  const occupiedSeats = seats.filter(seat => seat.userId).length;
  const availableSeats = seats.length - occupiedSeats;

  const renderGrid = () => {
    if (!gridSettings.showGrid) return null;

    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundSize: `${gridSettings.gridSize}px ${gridSettings.gridSize}px`,
          backgroundImage:
            'linear-gradient(to right, #e5e7eb 1px, transparent 1px),' +
            'linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
        }}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">תצוגת מקומות ישיבה</h1>
          <p className="text-gray-600 mt-2">תצוגה ויזואלית של כל מקומות הישיבה והספסלים במשרד</p>
        </div>
        
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="bg-white p-4 rounded-lg shadow-md border">
            <div className="flex items-center justify-center mb-2">
              <Armchair className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{benches.length}</div>
            <div className="text-sm text-gray-600">ספסלים</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md border">
            <div className="flex items-center justify-center mb-2">
              <MapPin className="h-6 w-6 text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{seats.length}</div>
            <div className="text-sm text-gray-600">סך הכל מקומות</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md border">
            <div className="flex items-center justify-center mb-2">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{occupiedSeats}</div>
            <div className="text-sm text-gray-600">תפוס</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md border">
            <div className="flex items-center justify-center mb-2">
              <UserIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{availableSeats}</div>
            <div className="text-sm text-gray-600">פנוי</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-6 space-x-reverse">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">תפוס</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span className="text-sm text-gray-600">פנוי</span>
            </div>
          </div>
          
          {gridSettings.showGrid && (
            <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
              <Grid3X3 className="h-4 w-4" />
              <span>רשת מסייעת מופעלת</span>
            </div>
          )}
        </div>

        <div
          className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50"
          style={{
            minHeight: '800px',
            width: '1200px',
            maxWidth: '100%',
          }}
        >
          <div
            className="relative"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: '1200px',
              height: '800px',
            }}
          >
            {renderGrid()}

            {/* סימון מרכז המפה */}
            <div className="absolute left-1/2 top-1/2 w-4 h-4 bg-red-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50" />

            {/* רינדור ספסלים */}
              {benches.map((bench) => (
                <div
                  key={bench.id}
                  className="absolute"
                  style={{ left: `${bench.position.x}px`, top: `${bench.position.y}px` }}
                >
                  <div
                    className="absolute -top-6 left-1/2 -translate-x-1/2 transform px-2 py-1 rounded text-xs font-semibold text-white"
                    style={{ backgroundColor: bench.color }}
                  >
                    {bench.type === 'special' && bench.icon && (<span className="ml-1">{bench.icon}</span>)}
                    {bench.name}
                  </div>
                  <div
                    className="rounded-lg shadow-lg border-2 border-white"
                    style={{
                      width: bench.type === 'special'
                        ? `${bench.width}px`
                        : bench.orientation === 'horizontal'
                          ? `${bench.seatCount * 60 + 20}px`
                          : '80px',
                      height: bench.type === 'special'
                        ? `${bench.height}px`
                        : bench.orientation === 'horizontal'
                          ? '80px'
                          : `${bench.seatCount * 60 + 20}px`,
                      backgroundColor: `${bench.color}20`,
                      borderColor: bench.color,
                    }}
                  >
                    {/* מקומות ישיבה בתוך הספסל */}
                    {seats
                      .filter(seat => seat.benchId === bench.id)
                      .map((seat, index) => {
                        const status = getSeatStatus(seat);

                        return (
                          <div
                            key={seat.id}
                            className={`absolute w-12 h-12 ${status.color} ${status.hoverColor} rounded-lg shadow-md transition-all duration-200 cursor-pointer transform hover:scale-110 flex items-center justify-center group border-2 border-white`}
                            style={{
                              left: bench.orientation === 'horizontal' ? `${index * 60 + 10}px` : '10px',
                              top: bench.orientation === 'horizontal' ? '10px' : `${index * 60 + 10}px`,
                              zIndex: 10,
                            }}
                            title={status.worshiper ? `${status.worshiper.title} ${status.worshiper.firstName} ${status.worshiper.lastName}` : 'פנוי'}
                          >
                            <div className="text-white font-bold text-[7px] leading-tight text-center px-1">
                              {status.worshiper ? `${status.worshiper.title} ${status.worshiper.firstName} ${status.worshiper.lastName}` : 'פנוי'}
                            </div>

                            {status.worshiper && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                                <UserIcon className="h-2 w-2 text-white" />
                              </div>
                            )}

                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-20 max-w-xs">
                              {status.worshiper ? (
                                <>
                                  <div className="font-semibold">{status.worshiper.title} {status.worshiper.firstName} {status.worshiper.lastName}</div>
                                  <div className="text-gray-300">{status.worshiper.city}</div>
                                  <div className="text-gray-300">{status.worshiper.email}</div>
                                  <div className="text-gray-400 text-xs mt-1">{bench.name}</div>
                                </>
                              ) : (
                                <>
                                  <div>פנוי</div>
                                  <div className="text-gray-400">{bench.name}</div>
                                </>
                              )}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
          </div>
          <MapZoomControls setZoom={setZoom} />
        </div>
      </div>

      {/* רשימת ספסלים */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">רשימת ספסלים</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {benches.map((bench) => {
            const benchSeats = seats.filter(seat => seat.benchId === bench.id);
            const occupiedBenchSeats = benchSeats.filter(seat => seat.userId).length;
            
            return (
              <div key={bench.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{bench.name}</h3>
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: bench.color }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>מקומות: {bench.seatCount}</div>
                  <div>תפוס: {occupiedBenchSeats}/{bench.seatCount}</div>
                  <div>כיוון: {bench.orientation === 'horizontal' ? 'אופקי' : 'אנכי'}</div>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(occupiedBenchSeats / bench.seatCount) * 100}%`,
                      backgroundColor: bench.color 
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeatsView;
