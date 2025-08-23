import React, { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { Worshiper, Commitment } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface Props {
  worshiper: Worshiper;
  onClose: () => void;
}

const WorshiperCommitmentsForm: React.FC<Props> = ({ worshiper, onClose }) => {
  const { setWorshipers } = useAppContext();
  const [commitments, setCommitments] = useState<Commitment[]>(worshiper.commitments || []);
  const [newCommitment, setNewCommitment] = useState<Partial<Commitment>>({
    description: '',
    amount: 0,
    paid: false,
    paidToPlace: false,
    placeAmount: 0,
    aliyah: '',
    date: '',
  });

  const addCommitment = () => {
    if (!newCommitment.description) return;
    const commitment: Commitment = {
      id: Date.now().toString(),
      description: newCommitment.description!,
      amount: Number(newCommitment.amount) || 0,
      paid: !!newCommitment.paid,
      paidToPlace: !!newCommitment.paidToPlace,
      placeAmount: Number(newCommitment.placeAmount) || 0,
      aliyah: newCommitment.aliyah || undefined,
      date: newCommitment.date || undefined,
    };
    setCommitments(prev => [...prev, commitment]);
    setNewCommitment({
      description: '',
      amount: 0,
      paid: false,
      paidToPlace: false,
      placeAmount: 0,
      aliyah: '',
      date: '',
    });
  };

  const removeCommitment = (id: string) => {
    setCommitments(prev => prev.filter(c => c.id !== id));
  };

  const handleSave = () => {
    setWorshipers(prev => prev.map(w => w.id === worshiper.id ? { ...w, commitments } : w));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl overflow-y-auto max-h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            התחייבויות של {worshiper.title} {worshiper.firstName} {worshiper.lastName}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {commitments.length > 0 && (
          <table className="w-full mb-4 text-sm">
            <thead>
              <tr className="text-right">
                <th className="px-2 py-1">תיאור</th>
                <th className="px-2 py-1">סכום</th>
                <th className="px-2 py-1">שולם</th>
                <th className="px-2 py-1">שולם למקום</th>
                <th className="px-2 py-1">סכום למקום</th>
                <th className="px-2 py-1">עליה</th>
                <th className="px-2 py-1">תאריך</th>
                <th className="px-2 py-1">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {commitments.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="px-2 py-1">{c.description}</td>
                  <td className="px-2 py-1 text-center">{c.amount}</td>
                  <td className="px-2 py-1 text-center">{c.paid ? 'כן' : 'לא'}</td>
                  <td className="px-2 py-1 text-center">{c.paidToPlace ? 'כן' : 'לא'}</td>
                  <td className="px-2 py-1 text-center">{c.placeAmount}</td>
                  <td className="px-2 py-1">{c.aliyah}</td>
                  <td className="px-2 py-1">{c.date}</td>
                  <td className="px-2 py-1 text-center">
                    <button
                      onClick={() => removeCommitment(c.id)}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <label className="block mb-1">תיאור</label>
            <input
              type="text"
              value={newCommitment.description || ''}
              onChange={e => setNewCommitment(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-2 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1">סכום</label>
            <input
              type="number"
              value={newCommitment.amount || 0}
              onChange={e => setNewCommitment(prev => ({ ...prev, amount: Number(e.target.value) }))}
              className="w-full px-2 py-1 border rounded"
            />
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <input
              type="checkbox"
              checked={newCommitment.paid || false}
              onChange={e => setNewCommitment(prev => ({ ...prev, paid: e.target.checked }))}
            />
            <label>שולם</label>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <input
              type="checkbox"
              checked={newCommitment.paidToPlace || false}
              onChange={e => setNewCommitment(prev => ({ ...prev, paidToPlace: e.target.checked }))}
            />
            <label>שולם למקום</label>
          </div>
          <div>
            <label className="block mb-1">סכום למקום</label>
            <input
              type="number"
              value={newCommitment.placeAmount || 0}
              onChange={e => setNewCommitment(prev => ({ ...prev, placeAmount: Number(e.target.value) }))}
              className="w-full px-2 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1">עליה</label>
            <input
              type="text"
              value={newCommitment.aliyah || ''}
              onChange={e => setNewCommitment(prev => ({ ...prev, aliyah: e.target.value }))}
              className="w-full px-2 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1">תאריך</label>
            <input
              type="date"
              value={newCommitment.date || ''}
              onChange={e => setNewCommitment(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-2 py-1 border rounded"
            />
          </div>
          <div className="flex items-center">
            <button
              onClick={addCommitment}
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

export default WorshiperCommitmentsForm;

