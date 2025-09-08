import React, { useState, useRef, useEffect } from 'react';
import { Worshiper } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit2, Trash2, Save, X, User as UserIcon, Upload, Download, MapPin, FileText, ArrowUp, CreditCard } from 'lucide-react';
import WorshiperSeatsForm from './WorshiperSeatsForm';
import WorshiperItemsForm from './WorshiperItemsForm';
import WorshiperCard from './WorshiperCard';

const WorshiperManagement: React.FC = () => {
  const { worshipers, setWorshipers } = useAppContext();
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [editingWorshiper, setEditingWorshiper] = useState<string | null>(null);
  const [seatWorshiper, setSeatWorshiper] = useState<Worshiper | null>(null);
  const [promisesWorshiper, setPromisesWorshiper] = useState<Worshiper | null>(null);
  const [aliyotWorshiper, setAliyotWorshiper] = useState<Worshiper | null>(null);
  const [placesWorshiper, setPlacesWorshiper] = useState<Worshiper | null>(null);
  const [viewWorshiper, setViewWorshiper] = useState<Worshiper | null>(null);
  const [formData, setFormData] = useState<Partial<Worshiper>>({
    title: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    phone: '',
    secondaryPhone: '',
    email: '',
    promises: [],
    aliyot: [],
    places: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (viewWorshiper) {
      const updated = worshipers.find(w => w.id === viewWorshiper.id);
      if (updated && updated !== viewWorshiper) {
        setViewWorshiper(updated);
      }
    }
  }, [worshipers, viewWorshiper]);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const rows = text.trim().split(/\r?\n/);
      const headers =
        rows.shift()?.split(',').map(h => h.trim().replace(/^\ufeff/, '')) ?? [];
      let imported = rows.map((row, index) => {
        const values = row.split(',');
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = values[i]?.trim() || '';
        });
        const seatCount = Number(obj['כמות מקומות'] || 0);
        const places = seatCount
          ? [{
              id: (Date.now() + index).toString(),
              description: 'מקומות בבית הכנסת',
              amount: 0,
              count: seatCount,
              paid: false,
              createdAtGregorian: '',
              createdAtHebrew: '',
            }]
          : [];
        return {
          id: Date.now().toString() + index,
          title: obj['תואר'] || '',
          firstName: obj['שם פרטי'] || '',
          lastName: obj['שם משפחה'] || '',
          address: obj['כתובת'] || '',
          city: obj['עיר'] || '',
          phone: obj['טלפון'] || '',
          secondaryPhone: obj['טלפון נוסף'] || '',
          email: obj['אימייל'] || '',
          places,
        } as Worshiper;
      });
      if (user?.role === 'demo') {
        const remaining = 9 - worshipers.length;
        if (remaining <= 0) {
          alert('בחשבון דמו ניתן להוסיף עד 9 מתפללים בלבד.');
          return;
        }
        if (imported.length > remaining) {
          alert('בחשבון דמו ניתן להוסיף עד 9 מתפללים בלבד. נוספו רק המתפללים הראשונים.');
          imported = imported.slice(0, remaining);
        }
      }
      setWorshipers(prev => [...prev, ...imported]);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const downloadSampleCsv = () => {
    const headers = ['תואר', 'שם פרטי', 'שם משפחה', 'כתובת', 'עיר', 'טלפון', 'טלפון נוסף', 'אימייל', 'כמות מקומות'];
    const sample = ['מר', 'דוד', 'כהן', 'רחוב הדוגמה 1', 'תל אביב', '050-0000000', '', 'david@example.com', '1'];
    const csvContent = '\ufeff' + [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'worshipers_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveWorshiper = () => {
    if (!formData.firstName || !formData.lastName) return;

    if (editingWorshiper) {
      setWorshipers(prev => prev.map(w =>
        w.id === editingWorshiper ? { ...w, ...formData } as Worshiper : w
      ));
      setEditingWorshiper(null);
    } else {
      if (user?.role === 'demo' && worshipers.length >= 9) {
        alert('בחשבון דמו ניתן להוסיף עד 9 מתפללים בלבד.');
        return;
      }
      const newWorshiper: Worshiper = {
        id: Date.now().toString(),
        title: formData.title || '',
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        address: formData.address || '',
        city: formData.city || '',
        phone: formData.phone || '',
        secondaryPhone: formData.secondaryPhone || '',
        email: formData.email || '',
        promises: formData.promises || [],
        aliyot: formData.aliyot || [],
        places: formData.places || [],
      };
      setWorshipers(prev => [...prev, newWorshiper]);
      setIsAdding(false);
    }

    setFormData({
      title: '',
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      phone: '',
      secondaryPhone: '',
      email: '',
      promises: [],
      aliyot: [],
      places: [],
    });
  };

  const handleEditWorshiper = (worshiper: Worshiper) => {
    setEditingWorshiper(worshiper.id);
    setFormData(worshiper);
    setIsAdding(false);
  };

  const handleDeleteWorshiper = (worshiperId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק מתפלל זה?')) {
      setWorshipers(prev => prev.filter(w => w.id !== worshiperId));
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingWorshiper(null);
    setFormData({
      title: '',
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      phone: '',
      secondaryPhone: '',
      email: '',
      promises: [],
      aliyot: [],
      places: [],
    });
  };

  const handleAddNew = () => {
    if (user?.role === 'demo' && worshipers.length >= 9) {
      alert('בחשבון דמו ניתן להוסיף עד 9 מתפללים בלבד.');
      return;
    }
    setIsAdding(true);
    setEditingWorshiper(null);
    setFormData({
      title: '',
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      phone: '',
      secondaryPhone: '',
      email: '',
      promises: [],
      aliyot: [],
      places: [],
    });
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">ניהול מתפללים</h1>
        <div className="flex space-x-2 space-x-reverse">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleCsvUpload}
            className="hidden"
          />
          <button
            onClick={downloadSampleCsv}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4 ml-2" />
            הורד קובץ לדוגמה
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <Upload className="h-4 w-4 ml-2" />
            העלה רשימה מאקסל
          </button>
          <button
            onClick={handleAddNew}
            disabled={isAdding || editingWorshiper}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 ml-2" />
            הוסף מתפלל חדש
          </button>
        </div>
      </div>

      {(isAdding || editingWorshiper) && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-blue-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            {editingWorshiper ? 'עריכת מתפלל' : 'הוספת מתפלל חדש'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">תואר</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="מר/מרת/רב"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שם פרטי *</label>
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="הכנס שם פרטי"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שם משפחה *</label>
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="הכנס שם משפחה"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">כתובת</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="רחוב ומספר"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">עיר</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="שם העיר"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">טלפון</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="050-1234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">טלפון נוסף</label>
              <input
                type="tel"
                value={formData.secondaryPhone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, secondaryPhone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="מספר נוסף"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">אימייל</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="example@domain.com"
              />
            </div>

          </div>

          <div className="flex space-x-3 space-x-reverse">
            <button
              onClick={handleSaveWorshiper}
              disabled={!formData.firstName || !formData.lastName}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 ml-2" />
              שמור
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X className="h-4 w-4 ml-2" />
              ביטול
            </button>
          </div>
        </div>
      )}

      {worshipers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">שם מלא</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">אימייל</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">טלפון</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">טלפון נוסף</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">כתובת</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">עיר</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">כמות מקומות</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {worshipers.map((w) => (
                <tr
                  key={w.id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => setViewWorshiper(w)}
                >
                  <td className="px-4 py-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                      <span>{w.title} {w.firstName} {w.lastName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">{w.email}</td>
                  <td className="px-4 py-2">{w.phone}</td>
                  <td className="px-4 py-2">{w.secondaryPhone}</td>
                  <td className="px-4 py-2">{w.address}</td>
                  <td className="px-4 py-2">{w.city}</td>
                  <td className="px-4 py-2 text-center">{w.places?.reduce((sum, i) => sum + (i.count ?? 0), 0) ?? 0}</td>
                  <td className="px-4 py-2">
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSeatWorshiper(w);
                        }}
                        disabled={isAdding || editingWorshiper}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="הקצאת מקומות"
                      >
                        <MapPin className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPromisesWorshiper(w);
                        }}
                        disabled={isAdding || editingWorshiper}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="הבטחות"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAliyotWorshiper(w);
                        }}
                        disabled={isAdding || editingWorshiper}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="עליות"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlacesWorshiper(w);
                        }}
                        disabled={isAdding || editingWorshiper}
                        className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="מקומות"
                      >
                        <CreditCard className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditWorshiper(w);
                        }}
                        disabled={isAdding || editingWorshiper}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="עריכה"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorshiper(w.id);
                        }}
                        disabled={isAdding || editingWorshiper}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="מחיקה"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">אין מתפללים רשומים במערכת</p>
          <p className="text-gray-400">לחץ על "הוסף מתפלל חדש" כדי להתחיל</p>
        </div>
      )}
    </div>
    {seatWorshiper && (
      <WorshiperSeatsForm
        worshiper={seatWorshiper}
        onClose={() => setSeatWorshiper(null)}
      />
    )}
    {promisesWorshiper && (
      <WorshiperItemsForm
        worshiper={promisesWorshiper}
        field="promises"
        title="הבטחות"
        onClose={() => setPromisesWorshiper(null)}
      />
    )}
    {aliyotWorshiper && (
      <WorshiperItemsForm
        worshiper={aliyotWorshiper}
        field="aliyot"
        title="עליות"
        onClose={() => setAliyotWorshiper(null)}
      />
    )}
    {placesWorshiper && (
      <WorshiperItemsForm
        worshiper={placesWorshiper}
        field="places"
        title="מקומות"
        onClose={() => setPlacesWorshiper(null)}
      />
    )}
    {viewWorshiper && (
      <WorshiperCard
        worshiper={viewWorshiper}
        onClose={() => setViewWorshiper(null)}
      />
    )}
    </>
  );
};

export default WorshiperManagement;
