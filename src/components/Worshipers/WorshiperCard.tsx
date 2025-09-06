import React from 'react';
import { X, Phone, Mail, MapPin, User as UserIcon, Users } from 'lucide-react';
import { Worshiper } from '../../types';

interface Props {
  worshiper: Worshiper;
  onClose: () => void;
}

const WorshiperCard: React.FC<Props> = ({ worshiper, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <button
          onClick={onClose}
          className="absolute top-3 left-3 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
            <UserIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">
            {worshiper.title} {worshiper.firstName} {worshiper.lastName}
          </h2>
        </div>

        <div className="space-y-3 text-gray-700 text-sm">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 ml-2 text-gray-500" />
            <span>
              {worshiper.address}
              {worshiper.city ? `, ${worshiper.city}` : ''}
            </span>
          </div>
          <div className="flex items-center">
            <Phone className="h-4 w-4 ml-2 text-gray-500" />
            <span>{worshiper.phone}</span>
          </div>
          {worshiper.secondaryPhone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 ml-2 text-gray-500" />
              <span>{worshiper.secondaryPhone}</span>
            </div>
          )}
          {worshiper.email && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 ml-2 text-gray-500" />
              <span>{worshiper.email}</span>
            </div>
          )}
          <div className="flex items-center">
            <Users className="h-4 w-4 ml-2 text-gray-500" />
            <span>כמות מקומות: {worshiper.seatCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorshiperCard;
