import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  CheckCircle, 
  User, 
  MessageSquare, 
  Map, 
  X, 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown,
  Clock,
  Globe,
  Headphones
} from 'lucide-react';
import Align from '../common/Align';
import { ContactForm } from '../../types';
import Header from '../common/Header';

// Dimensions for the map modal
const MAP_MODAL_WIDTH = 600;
const MAP_MODAL_HEIGHT = 450;
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

  const contactMethods = [
    {
      icon: Mail,
      title: 'אימייל',
      primary: 'info@seatflow.online',
      secondary: 'info@seatflow.online',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Phone,
      title: 'טלפון',
      primary: '052-718-6026',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Headphones,
      title: 'תמיכה טכנית',
      primary: 'זמין במייל',
      secondary: 'מענה מהיר ומקצועי',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="space-y-12">
      <Header />
      
      {/* Hero Section */}
      <div className="text-center relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full">
            <div className="w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          </div>
        </div>
        
        <h1 className="text-5xl font-black text-gray-900 mb-6">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">צור קשר</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          יש לך שאלות או הצעות? נשמח לשמוע ממך ולעזור בכל דרך אפשרית.
          הצוות שלנו זמין עבורך ומוכן לסייע בכל עת.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">פרטי התקשרות</h2>
            
            <div className="space-y-6">
              {contactMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <div key={index} className="group bg-white p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex items-start space-x-4 space-x-reverse">
                      <div className={`w-14 h-14 bg-gradient-to-br ${method.color} rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2 text-lg">{method.title}</h3>
                        <p className="text-gray-700 font-medium">{method.primary}</p>
                        <p className="text-gray-600">{method.secondary}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Address */}
              <div className="group bg-white p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="flex items-start space-x-4 space-x-reverse">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <MapPin className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">כתובת</h3>
                    <p className="text-gray-600">ירושלים, עיה"ק</p>
                    <button
                      onClick={() => setIsMapOpen(true)}
                      className="mt-3 flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                      <Map className="h-4 w-4 ml-2" />
                      הצג מפה
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-3xl shadow-lg">
            <div className="flex items-center mb-6">
              <Clock className="h-8 w-8 text-blue-600 ml-3" />
              <h3 className="font-bold text-gray-900 text-xl">שעות פעילות</h3>
            </div>
            <div className="space-y-3 text-gray-700">
              <div className="flex justify-between items-center py-2 border-b border-blue-200">
                <span className="font-medium">ראשון - חמישי:</span>
                <span className="font-bold text-blue-700">08:00 - 18:00</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-blue-200">
                <span className="font-medium">שישי:</span>
                <span className="font-bold text-blue-700">08:00 - 14:00</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium">שבת:</span>
                <span className="font-bold text-red-600">סגור</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/20">
          {isSubmitted ? (
            <Align align="center" className="py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">תודה רבה!</h3>
              <p className="text-gray-600 text-lg">הודעתך נשלחה בהצלחה. נחזור אליך בהקדם האפשרי.</p>
            </Align>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">שלח הודעה</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name Field */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      שם מלא *
                    </label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white/50 backdrop-blur-sm"
                        placeholder="הכנס שם מלא"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      אימייל *
                    </label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white/50 backdrop-blur-sm"
                        placeholder="example@domain.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Subject Field */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                    נושא
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white/50 backdrop-blur-sm"
                    placeholder="נושא ההודעה"
                  />
                </div>

                {/* Message Field */}
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    הודעה *
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none bg-white/50 backdrop-blur-sm"
                      placeholder="כתוב כאן את הודעתך..."
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.name || !formData.email || !formData.message}
                  className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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

      {/* Map Modal */}
      {isMapOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-3xl overflow-hidden shadow-2xl"
            style={{ width: MAP_MODAL_WIDTH }}
          >
            <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <h3 className="text-xl font-bold text-gray-900">מיקום המשרד</h3>
              <button
                onClick={() => setIsMapOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div
              ref={containerRef}
              className="relative overflow-hidden"
              style={{ width: MAP_MODAL_WIDTH, height: MAP_MODAL_HEIGHT }}
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
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 rounded-full p-2 shadow-lg hover:bg-opacity-100 transition-all"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => pan(-100, 0)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 rounded-full p-2 shadow-lg hover:bg-opacity-100 transition-all"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </>
              )}
              {maxOffset.y < 0 && (
                <>
                  <button
                    onClick={() => pan(0, 100)}
                    className="absolute left-1/2 -translate-x-1/2 top-2 bg-white bg-opacity-90 rounded-full p-2 shadow-lg hover:bg-opacity-100 transition-all"
                  >
                    <ArrowUp className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => pan(0, -100)}
                    className="absolute left-1/2 -translate-x-1/2 bottom-2 bg-white bg-opacity-90 rounded-full p-2 shadow-lg hover:bg-opacity-100 transition-all"
                  >
                    <ArrowDown className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center bg-gradient-to-r from-blue-600 to-purple-700 text-white p-8 rounded-3xl">
        <div className="flex items-center justify-center mb-4">
          <Globe className="h-8 w-8 text-blue-200" />
        </div>
        <h3 className="text-2xl font-bold mb-4">נשמח לעזור לכם</h3>
        <p className="text-blue-100 max-w-2xl mx-auto leading-relaxed">
          הצוות שלנו מורכב ממומחים מנוסים בתחום הטכנולוgia וניהול מערכות. 
          אנחנו כאן כדי להבטיח שתקבלו את השירות הטוב ביותר.
        </p>
        <div className="mt-6 text-sm text-blue-200">
          © 2025 SeatFlow.tech - כל הזכויות שמורות
        </div>
      </div>
    </div>
  );
};

export default Contact;
