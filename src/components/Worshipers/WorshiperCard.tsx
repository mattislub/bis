import React, { useState } from 'react';
import { X, Phone, Mail, MapPin, User as UserIcon, Users } from 'lucide-react';
import { Worshiper, WorshiperItem } from '../../types';
import WorshiperItemsForm from './WorshiperItemsForm';

interface Props {
  worshiper: Worshiper;
  onClose: () => void;
}

const WorshiperCard: React.FC<Props> = ({ worshiper, onClose }) => {
  const [activeTab, setActiveTab] = useState<'promises' | 'aliyot' | 'places'>('promises');
  const [editingField, setEditingField] = useState<null | 'promises' | 'aliyot' | 'places'>(null);
  const totalSeats = worshiper.places?.reduce((sum, i) => sum + (i.count ?? 0), 0) ?? 0;

  const renderItems = (
    field: 'promises' | 'aliyot' | 'places',
    items?: WorshiperItem[]
  ) => {
    if (!items || items.length === 0) {
      return <p className="text-center text-gray-500 text-sm">אין פריטים</p>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-right">
              <th className="px-2 py-1">תיאור</th>
              {field === 'places' ? (
                <>
                  <th className="px-2 py-1">סכום למקום</th>
                  <th className="px-2 py-1">מספר מקומות</th>
                  <th className="px-2 py-1">סה"כ</th>
                </>
              ) : (
                <th className="px-2 py-1">סכום</th>
              )}
              <th className="px-2 py-1">שולם</th>
              <th className="px-2 py-1">תאריך לועזי</th>
              <th className="px-2 py-1">תאריך עברי</th>
            </tr>
          </thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id} className="border-t">
                <td className="px-2 py-1">{i.description}</td>
                {field === 'places' ? (
                  <>
                    <td className="px-2 py-1 text-center">{i.amount}</td>
                    <td className="px-2 py-1 text-center">{i.count ?? 0}</td>
                    <td className="px-2 py-1 text-center">{(i.amount || 0) * (i.count ?? 0)}</td>
                  </>
                ) : (
                  <td className="px-2 py-1 text-center">{i.amount}</td>
                )}
                <td className="px-2 py-1 text-center">{i.paid ? 'כן' : 'לא'}</td>
                <td className="px-2 py-1">{i.createdAtGregorian}</td>
                <td className="px-2 py-1">{i.createdAtHebrew}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const tabs = [
    { key: 'promises', label: 'הבטחות', items: worshiper.promises },
    { key: 'aliyot', label: 'עליות', items: worshiper.aliyot },
    { key: 'places', label: 'מקומות', items: worshiper.places },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-3xl p-6">
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
            <span>כמות מקומות: {totalSeats}</span>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex border-b mb-4">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm focus:outline-none ${
                  activeTab === tab.key
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {renderItems(
            activeTab,
            tabs.find(t => t.key === activeTab)?.items
          )}
          {activeTab === 'places' && worshiper.places && worshiper.places.length > 1 && (
            <div className="text-right font-semibold mt-2">
              סה"כ: {worshiper.places.reduce((sum, i) => sum + (i.amount || 0) * (i.count ?? 0), 0)}
            </div>
          )}
          <div className="flex justify-end space-x-2 space-x-reverse mt-4">
            <button
              onClick={() => setEditingField('promises')}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              הוסף התחייבות חדש
            </button>
            <button
              onClick={() => setEditingField('aliyot')}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              הוסף עליה חדשה
            </button>
            <button
              onClick={() => setEditingField('places')}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              הוסף חיוב מקומות חדשה
            </button>
          </div>
        </div>
        {editingField && (
          <WorshiperItemsForm
            worshiper={worshiper}
            field={editingField}
            title={
              editingField === 'promises'
                ? 'הבטחות'
                : editingField === 'aliyot'
                  ? 'עליות'
                  : 'מקומות'
            }
            onClose={() => setEditingField(null)}
          />
        )}
      </div>
    </div>
  );
};

export default WorshiperCard;
