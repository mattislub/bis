import React, { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { Worshiper, WorshiperItem } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface Props {
  worshiper: Worshiper;
  field: 'promises' | 'aliyot' | 'places';
  title: string;
  onClose: () => void;
}

const WorshiperItemsForm: React.FC<Props> = ({ worshiper, field, title, onClose }) => {
  const { setWorshipers } = useAppContext();
  const [items, setItems] = useState<WorshiperItem[]>(() => {
    if (field === 'places' && (!worshiper.places || worshiper.places.length === 0)) {
      return [
        {
          id: Date.now().toString(),
          description: 'מקומות בבית הכנסת',
          amount: 0,
          count: 1,
          paid: false,
          createdAtGregorian: '',
          createdAtHebrew: '',
        },
      ];
    }
    return worshiper[field] || [];
  });
  const [descriptionOption, setDescriptionOption] = useState(
    field === 'places' ? 'מקומות בבית הכנסת' : ''
  );
  const [newItem, setNewItem] = useState<Partial<WorshiperItem>>({
    description: field === 'places' ? 'מקומות בבית הכנסת' : '',
    amount: 0,
    count: field === 'places' ? 1 : undefined,
    paid: false,
    createdAtGregorian: '',
    createdAtHebrew: '',
  });

  const addItem = () => {
    if (!newItem.description) return;
    const nextIndex = items.length + 1;
    const item: WorshiperItem = {
      id: Date.now().toString(),
      description: newItem.description!,
      amount: Number(newItem.amount) || 0,
      count: field === 'places' ? Number(newItem.count) || 0 : undefined,
      paid: !!newItem.paid,
      createdAtGregorian: newItem.createdAtGregorian || '',
      createdAtHebrew: newItem.createdAtHebrew || '',
    };
    setItems(prev => [...prev, item]);
    setNewItem({
      description: field === 'places' ? 'מקומות בבית הכנסת' : '',
      amount: 0,
      count: field === 'places' ? 1 : undefined,
      paid: false,
      createdAtGregorian: '',
      createdAtHebrew: '',
    });
    setDescriptionOption(field === 'places' ? 'מקומות בבית הכנסת' : '');
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSave = () => {
    setWorshipers(prev => prev.map(w =>
      w.id === worshiper.id ? { ...w, [field]: items } : w
    ));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl overflow-y-auto max-h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {title} של {worshiper.title} {worshiper.firstName} {worshiper.lastName}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {items.length > 0 && (
          <table className="w-full mb-4 text-sm">
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
                <th className="px-2 py-1">פעולות</th>
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
                  <td className="px-2 py-1 text-center">
                    <button
                      onClick={() => removeItem(i.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="מחיקה"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className={`grid grid-cols-1 ${field === 'places' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 mb-4 text-sm`}>
          <div>
            <label className="block mb-1">תיאור</label>
            {field === 'places' ? (
              <>
                <select
                  value={descriptionOption}
                  onChange={e => {
                    const val = e.target.value;
                    setDescriptionOption(val);
                    setNewItem(prev => ({ ...prev, description: val === 'other' ? '' : val }));
                  }}
                  className="w-full px-2 py-1 border rounded"
                >
                  <option value="מקומות בבית הכנסת">מקומות בבית הכנסת</option>
                  <option value="מקומות בעזרת נשים">מקומות בעזרת נשים</option>
                  <option value="other">אחר</option>
                </select>
                {descriptionOption === 'other' && (
                  <input
                    type="text"
                    value={newItem.description || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full mt-2 px-2 py-1 border rounded"
                  />
                )}
              </>
            ) : (
              <input
                type="text"
                value={newItem.description || ''}
                onChange={e => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-2 py-1 border rounded"
              />
            )}
          </div>
          <div>
            <label className="block mb-1">{field === 'places' ? 'סכום למקום' : 'סכום'}</label>
            <input
              type="number"
              value={newItem.amount || 0}
              onChange={e => setNewItem(prev => ({ ...prev, amount: Number(e.target.value) }))}
              className="w-full px-2 py-1 border rounded"
            />
          </div>
          {field === 'places' && (
            <div>
              <label className="block mb-1">מספר מקומות</label>
              <input
                type="number"
                value={newItem.count || 0}
                onChange={e => setNewItem(prev => ({ ...prev, count: Number(e.target.value) }))}
                className="w-full px-2 py-1 border rounded"
              />
            </div>
          )}
          <div className="flex items-center space-x-2 space-x-reverse">
            <input
              type="checkbox"
              checked={newItem.paid || false}
              onChange={e => setNewItem(prev => ({ ...prev, paid: e.target.checked }))}
            />
            <label>שולם</label>
          </div>
          <div>
            <label className="block mb-1">תאריך לועזי</label>
            <input
              type="date"
              value={newItem.createdAtGregorian || ''}
              onChange={e => setNewItem(prev => ({ ...prev, createdAtGregorian: e.target.value }))}
              className="w-full px-2 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1">תאריך עברי</label>
            <input
              type="text"
              value={newItem.createdAtHebrew || ''}
              onChange={e => setNewItem(prev => ({ ...prev, createdAtHebrew: e.target.value }))}
              className="w-full px-2 py-1 border rounded"
            />
          </div>
          <div className="flex items-center">
            <button
              onClick={addItem}
              className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Plus className="h-4 w-4 ml-1" />
              הוסף
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-2 space-x-reverse">
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Save className="h-4 w-4 ml-2" />
            שמור
          </button>
          <button
            onClick={onClose}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <X className="h-4 w-4 ml-2" />
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorshiperItemsForm;

