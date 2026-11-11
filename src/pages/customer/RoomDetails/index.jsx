import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Users, Wifi, Tv, CheckCircle2, ArrowLeft, XCircle, AlertCircle, Lock, LogIn, UserPlus, X } from 'lucide-react';
import { roomsApi, bookingsApi } from '../../../services/api';
import { useSettings } from '../../../context/SettingsContext';

const RoomDetails = () => {
  const { formatPrice } = useSettings();
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingData, setBookingData] = useState({ checkIn: '', checkOut: '', guests: 1 });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const isAuth = localStorage.getItem('customerAuth') === 'true' && !!localStorage.getItem('authToken');

  useEffect(() => {
    setLoading(true);
    roomsApi.get(id)
      .then(data => {
        if (data) {
          const amenitiesList = Array.isArray(data.amenities)
            ? data.amenities
            : (typeof data.amenities === 'string' && data.amenities.startsWith('[')
                ? JSON.parse(data.amenities)
                : (data.amenities ? data.amenities.split(',').map(s => s.trim()) : ["Free Wi-Fi", "Air Conditioning", "TV"]));

          setRoom({
            ...data,
            price: data.current_price || data.base_price,
            amenities: amenitiesList,
          });
        }
      })
      .catch(err => {
        setError(err.message || 'Failed to load room details.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getNextDayStr = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    const year = next.getFullYear();
    const month = String(next.getMonth() + 1).padStart(2, '0');
    const day = String(next.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleCheckInChange = (newCheckIn) => {
    let newCheckOut = bookingData.checkOut;
    if (!newCheckOut || newCheckOut <= newCheckIn) {
      newCheckOut = getNextDayStr(newCheckIn);
    }
    setBookingData(prev => ({
      ...prev,
      checkIn: newCheckIn,
      checkOut: newCheckOut,
    }));
    setBookingError('');
  };

  const handleCheckOutChange = (newCheckOut) => {
    if (bookingData.checkIn && newCheckOut <= bookingData.checkIn) {
      setBookingError('Check-out date must be after check-in date (at least 1 night stay).');
      return;
    }
    setBookingError('');
    setBookingData(prev => ({ ...prev, checkOut: newCheckOut }));
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!bookingData.checkIn || !bookingData.checkOut) {
      setBookingError('Please choose both check-in and check-out dates.');
      return;
    }

    if (bookingData.checkOut <= bookingData.checkIn) {
      setBookingError('Check-out date must be after check-in date (at least 1 night stay).');
      return;
    }

    if (!isAuth) {
      setAuthModalOpen(true);
      return;
    }

    setBookingLoading(true);
    try {
      await bookingsApi.create({
        room_id: parseInt(id),
        check_in: bookingData.checkIn,
        check_out: bookingData.checkOut,
        number_of_guests: parseInt(bookingData.guests),
      });
      setBookingSuccess(true);
    } catch (err) {
      setBookingError(err.message || 'Booking failed. The room might be unavailable for these dates.');
    } finally {
      setBookingLoading(false);
    }
  };

  const nights = (bookingData.checkIn && bookingData.checkOut && bookingData.checkOut > bookingData.checkIn)
    ? Math.max(1, Math.round((new Date(bookingData.checkOut) - new Date(bookingData.checkIn)) / (1000 * 60 * 60 * 24)))
    : 1;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 font-medium">Loading room details...</div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Room not found'}</h2>
          <Link to="/rooms" className="text-amber-600 hover:text-amber-700 font-medium">Return to Rooms</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <Link to="/rooms" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 font-medium transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Rooms
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Room Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <img 
                src={room.image_url || room.imageUrl || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200'} 
                alt={room.name} 
                className="w-full h-[400px] object-cover" 
              />
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-serif mb-2">{room.name}</h1>
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                        {room.type} Room
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                        room.availability_status === 'available'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${room.availability_status === 'available' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                        {room.availability_status === 'available' ? 'AVAILABLE' : 'CURRENTLY UNAVAILABLE'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-amber-600">{formatPrice(room.price)}</div>
                    <div className="text-gray-500">per night</div>
                  </div>
                </div>
                
                <p className="text-gray-600 text-lg leading-relaxed mb-8">
                  {room.description}
                </p>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4 font-serif">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(room.amenities || ["Free Wi-Fi", "Air Conditioning", "TV"]).map((amenity, idx) => (
                    <div key={idx} className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                      <span className="text-sm font-medium">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Booking Widget */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-28">
              <h3 className="text-xl font-bold text-gray-900 mb-6 font-serif">Book this room</h3>
              
              {bookingSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Booking Confirmed!</h4>
                  <p className="text-gray-600 mb-6">Your reservation has been recorded in the system.</p>
                  <div className="space-y-3">
                    <Link
                      to="/customer/dashboard"
                      className="block w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition-colors text-center"
                    >
                      View in Dashboard
                    </Link>
                    <button 
                      onClick={() => { setBookingSuccess(false); setBookingData({ checkIn: '', checkOut: '', guests: 1 }); }}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
                    >
                      Book Another Stay
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={submitBooking} className="space-y-4">
                  {room.availability_status !== 'available' && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl mb-4 flex items-start gap-2.5">
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600" />
                      <div>
                        <p className="font-bold">Room Currently Unavailable</p>
                        <p className="text-xs text-rose-600 mt-0.5">This room is under maintenance or temporarily unavailable for booking. Please check our other available rooms.</p>
                      </div>
                    </div>
                  )}

                  {!isAuth && (
                    <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl mb-4">
                      <div className="flex items-start gap-2.5">
                        <Lock className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
                        <div>
                          <p className="font-bold text-sm">Account Required to Book</p>
                          <p className="text-xs text-amber-800 mt-1">
                            Before booking this room, you need to register or sign in to your customer account.
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => navigate('/login')}
                          className="w-full text-center py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <LogIn className="w-3.5 h-3.5" /> Sign In
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/register')}
                          className="w-full text-center py-2 px-3 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Register
                        </button>
                      </div>
                    </div>
                  )}

                  {bookingError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        {bookingError}
                        {bookingError.includes('sign in') && (
                          <div className="mt-1">
                            <Link to="/login" className="underline font-bold">Click here to Sign In</Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
                    <input 
                      required 
                      type="date" 
                      min={getTodayStr()}
                      disabled={room.availability_status !== 'available'}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm" 
                      value={bookingData.checkIn} 
                      onChange={e => handleCheckInChange(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
                    <input 
                      required 
                      type="date" 
                      min={bookingData.checkIn ? getNextDayStr(bookingData.checkIn) : getNextDayStr(getTodayStr())}
                      disabled={room.availability_status !== 'available' || !bookingData.checkIn}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm" 
                      value={bookingData.checkOut} 
                      onChange={e => handleCheckOutChange(e.target.value)} 
                    />
                    {!bookingData.checkIn && (
                      <p className="text-[11px] text-gray-400 mt-1">Please select a check-in date first.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                    <input 
                      required 
                      type="number" 
                      min="1" 
                      max={room.capacity || 4} 
                      disabled={room.availability_status !== 'available'}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100 disabled:cursor-not-allowed" 
                      value={bookingData.guests} 
                      onChange={e => setBookingData({...bookingData, guests: e.target.value})} 
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum capacity: {room.capacity} guests</p>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 mt-6">
                    <div className="flex justify-between text-gray-600 mb-2">
                      <span>{formatPrice(room.price)} x {nights} night{nights > 1 ? 's' : ''}</span>
                      <span>{formatPrice(room.price * nights)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-gray-900 mt-4">
                      <span>Total Price</span>
                      <span>{formatPrice(room.price * nights)}</span>
                    </div>
                  </div>
                  
                  {isAuth ? (
                    <button
                      type="submit"
                      disabled={bookingLoading || room.availability_status !== 'available'}
                      className={`w-full font-bold py-3 rounded-lg transition-colors mt-6 shadow-md ${
                        room.availability_status === 'available'
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      } disabled:opacity-60`}
                    >
                      {bookingLoading ? 'Processing Booking...' : room.availability_status === 'available' ? 'Confirm Booking' : 'Room Unavailable'}
                    </button>
                  ) : (
                    <div className="mt-6 space-y-2">
                      <button
                        type="button"
                        onClick={() => setAuthModalOpen(true)}
                        disabled={room.availability_status !== 'available'}
                        className={`w-full font-bold py-3 rounded-lg transition-colors shadow-md ${
                          room.availability_status === 'available'
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                        }`}
                      >
                        {room.availability_status === 'available' ? 'Sign In / Register to Book' : 'Room Unavailable'}
                      </button>
                      <p className="text-[12px] text-center text-gray-500">
                        Need an account? <button type="button" onClick={() => navigate('/register')} className="text-amber-600 font-semibold underline">Register here</button>
                      </p>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Required Modal */}
      {authModalOpen && room && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                  <Lock className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Sign In or Register Required</h2>
              </div>
              <button 
                onClick={() => setAuthModalOpen(false)} 
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <Lock className="w-8 h-8 text-amber-600" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2 font-serif">
                Account Required to Book
              </h3>
              
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Before booking <span className="font-semibold text-gray-900">{room.name}</span>, you need to register or sign in to your customer account.
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-md shadow-amber-600/20 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In to Existing Account
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  Create New Account (Register)
                </button>

                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomDetails;
