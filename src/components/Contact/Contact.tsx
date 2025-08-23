import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, User, MessageSquare, Map, X, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import Align from '../common/Align';
import { ContactForm } from '../../types';

// Dimensions for the map modal. This controls the area on the screen where
// the embedded map is rendered so its size can be easily adjusted in one place.
// Use a percentage for the width so the map never exceeds 70% of the page width.
const MAP_MODAL_WIDTH = '70%';
const MAP_MODAL_HEIGHT = 450;
// Fixed size for the embedded map. When larger than the container,
// navigation arrows will allow panning within the modal.
const MAP_IFRAME_WIDTH = 1000;
const MAP_IFRAME_HEIGHT = 600;

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [maxOffset, setMaxOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateBounds = () => {
      const container = containerRef.current;
      if (!container) return;
      setMaxOffset({
        x: Math.min(0, container.clientWidth - MAP_IFRAME_WIDTH),
        y: Math.min(0, MAP_MODAL_HEIGHT - MAP_IFRAME_HEIGHT),
      });
      setOffset({ x: 0, y: 0 });
    };

    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, [isMapOpen]);

  const pan = (dx: number, dy: number) => {
    setOffset(prev => ({
      x: Math.max(Math.min(prev.x + dx, 0), maxOffset.x),
      y: Math.max(Math.min(prev.y + dy, 0), maxOffset.y),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitted(true);
    setIsSubmitting(false);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="space-y-8">
      <Align align="center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">צור קשר</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          יש לך שאלות או הצעות? נשמח לשמוע ממך ולעזור בכל דרך אפשרית
        </p>
      </Align>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">פרטי התקשרות</h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">אימייל</h3>
                  <p className="text-gray-600">contact@seatingmanager.co.il</p>
                  <p className="text-gray-600">support@seatingmanager.co.il</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">טלפון</h3>
                  <p className="text-gray-600">03-1234567</p>
                  <p className="text-gray-600">050-9876543 (נייד)</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">כתובת</h3>
                  <p className="text-gray-600">רחוב הטכנולוגיה 25</p>
                  <p className="text-gray-600">תל אביב-יפו, 6789012</p>
                  <button
                    onClick={() => setIsMapOpen(true)}
                    className="mt-3 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Map className="h-4 w-4 ml-2" />
                    הצג מפה
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">שעות פעילות</h3>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between">
                <span>ראשון - חמישי:</span>
                <span>08:00 - 18:00</span>
              </div>
              <div className="flex justify-between">
                <span>שישי:</span>
                <span>08:00 - 14:00</span>
              </div>
              <div className="flex justify-between">
                <span>שבת:</span>
                <span>סגור</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg border">
          {isSubmitted ? (
            <Align align="center" className="py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">תודה רבה!</h3>
              <p className="text-gray-600">הודעתך נשלחה בהצלחה. נחזור אליך בהקדם האפשרי.</p>
            </Align>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">שלח הודעה</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      שם מלא *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="הכנס שם מלא"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      אימייל *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="example@domain.com"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    נושא
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="נושא ההודעה"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    הודעה *
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      placeholder="כתוב כאן את הודעתך..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !formData.name || !formData.email || !formData.message}
                  className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent ml-2"></div>
                      שולח...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 ml-2" />
                      שלח הודעה
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      {isMapOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-lg overflow-hidden"
            style={{ width: MAP_MODAL_WIDTH }}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">מפה</h3>
              <button
                onClick={() => setIsMapOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div
              ref={containerRef}
              className="relative overflow-hidden"
              style={{ width: '100%', height: MAP_MODAL_HEIGHT }}
            >
              <iframe
                title="map"
                style={{
                  border: 0,
                  width: MAP_IFRAME_WIDTH,
                  height: MAP_IFRAME_HEIGHT,
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                }}
                loading="lazy"
                allowFullScreen
                src="https://www.google.com/maps?q=%D7%A8%D7%97%D7%95%D7%91%20%D7%94%D7%98%D7%9B%D7%A0%D7%95%D7%9C%D7%95%D7%92%D7%99%D7%94%2025%20%D7%AA%D7%9C%20%D7%90%D7%91%D7%99%D7%91-%D7%99%D7%A4%D7%95&output=embed"
              />
              {maxOffset.x < 0 && (
                <>
                  <button
                    onClick={() => pan(100, 0)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => pan(-100, 0)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}
              {maxOffset.y < 0 && (
                <>
                  <button
                    onClick={() => pan(0, 100)}
                    className="absolute left-1/2 -translate-x-1/2 top-2 bg-white bg-opacity-70 rounded-full p-1"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => pan(0, -100)}
                    className="absolute left-1/2 -translate-x-1/2 bottom-2 bg-white bg-opacity-70 rounded-full p-1"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contact;
