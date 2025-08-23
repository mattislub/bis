import React from 'react';
import { X } from 'lucide-react';
import { Worshiper } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface Props {
  worshiper: Worshiper;
  onClose: () => void;
}

const WorshiperSeatsForm: React.FC<Props> = ({ worshiper, onClose }) => {
  const { seats, benches } = useAppContext();
  const userSeats = seats.filter(s => s.userId === worshiper.id);

  const getBenchName = (benchId?: string) =>
    benches.find(b => b.id === benchId)?.name || '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            המקומות של {worshiper.title} {worshiper.firstName} {worshiper.lastName}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {userSeats.length > 0 ? (
          <ul className="space-y-2">
            {userSeats.map(seat => (
              <li key={seat.id} className="flex justify-between">
                <span>מקום {seat.id}</span>
                <span>{getBenchName(seat.benchId)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 mb-4">לא הוקצו מקומות למתפלל זה</p>
        )}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorshiperSeatsForm;
