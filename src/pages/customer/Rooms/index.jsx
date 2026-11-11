import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Filter, Users, Wifi, Tv, CheckCircle2, X, AlertCircle, Lock, LogIn, UserPlus } from 'lucide-react';
import { roomsApi, bookingsApi } from '../../../services/api';
import { useSettings } from '../../../context/SettingsContext';

const Rooms = () => {
  const { formatPrice } = useSettings();
  const navigate = useNavigate();
  const [allRooms, setAllRooms] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState({ type: 'all', capacity: 'all', priceSort: 'asc', availability: 'all' });
  const [loading, setLoading] = useState(true);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingData, setBookingData] = useState({ checkIn: '', checkOut: '', guests: 1 });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    roomsApi.list()
      .then(data => { setAllRooms(data || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let filtered = [...allRooms];
    if (filters.type !== 'all') filtered = filtered.filter(r => r.type?.toLowerCase() === filters.type);
    if (filters.capacity !== 'all') filtered = filtered.filter(r => r.capacity >= parseInt(filters.capacity));
    if (filters.availability === 'available') filtered = filtered.filter(r => r.availability_status === 'available');
    if (filters.availability === 'unavailable') filtered = filtered.filter(r => r.availability_status !== 'available');
    filtered.sort((a, b) => filters.priceSort === 'asc' ? a.current_price - b.current_price : b.current_price - a.current_price);
    setRooms(filtered);
  }, [allRooms, filters]);

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

  const handleBookClick = (room) => {
    const isAuth = localStorage.getItem('customerAuth') === 'true' && !!localStorage.getItem('authToken');
    if (!isAuth) {
      setSelectedRoom(room);
      setAuthModalOpen(true);
      return;
    }
    setSelectedRoom(room);
    setBookingModalOpen(true);
    setBookingSuccess(false);
    setBookingError('');
    setBookingData({ checkIn: '', checkOut: '', guests: 1 });
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
    const isAuth = localStorage.getItem('customerAuth') === 'true' && !!localStorage.getItem('authToken');
    if (!isAuth) {
      setBookingModalOpen(false);
      setAuthModalOpen(true);
      return;
    }
    setBookingLoading(true);
    setBookingError('');

    if (!bookingData.checkIn || !bookingData.checkOut) {
      setBookingError('Please choose both check-in and check-out dates.');
      setBookingLoading(false);
      return;
    }

    if (bookingData.checkOut <= bookingData.checkIn) {
      setBookingError('Check-out date must be after check-in date (at least 1 night stay).');
      setBookingLoading(false);
      return;
    }

    try {
      await bookingsApi.create({
        room_id: selectedRoom.id,
        check_in: bookingData.checkIn,
        check_out: bookingData.checkOut,
        number_of_guests: Number(bookingData.guests),
      });
      setBookingSuccess(true);
      setTimeout(() => { setBookingModalOpen(false); setBookingSuccess(false); }, 2500);
    } catch (err) {
      setBookingError(err.message || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const nights = (bookingData.checkIn && bookingData.checkOut && bookingData.checkOut > bookingData.checkIn)
    ? Math.max(1, Math.round((new Date(bookingData.checkOut) - new Date(bookingData.checkIn)) / (1000 * 60 * 60 * 24)))
    : 1;

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 font-serif">Browse Our Rooms</h1>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between border border-gray-100">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Filter className="h-5 w-5" /> Filters
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <select className="p-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm bg-white"
              value={filters.availability} onChange={e => setFilters({ ...filters, availability: e.target.value })}>
              <option value="all">All Status</option>
              <option value="available">🟢 Available Only</option>
              <option value="unavailable">🔴 Unavailable</option>
            </select>
            <select className="p-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm bg-white"
              value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
              <option value="all">All Room Types</option>
              <option value="standard">Standard</option>
              <option value="deluxe">Deluxe</option>
              <option value="suite">Suite</option>
            </select>
            <select className="p-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm bg-white"
              value={filters.capacity} onChange={e => setFilters({ ...filters, capacity: e.target.value })}>
              <option value="all">Any Guests</option>
              <option value="1">1+ Guests</option>
              <option value="2">2+ Guests</option>
              <option value="4">4+ Guests</option>
            </select>
            <select className="p-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm bg-white"
              value={filters.priceSort} onChange={e => setFilters({ ...filters, priceSort: e.target.value })}>
              <option value="asc">Price: Low to High</option>
              <option value="desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Room List */}
        {loading ? (
          <div className="text-center py-20 text-gray-500 text-lg">Loading rooms...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map(room => {
              const isAvailable = room.availability_status === 'available';

              return (
                <div key={room.id} className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-shadow border border-gray-100">
                  <div className="relative">
                    <img src={room.image_url || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'} alt={room.name} className="w-full h-56 object-cover" />
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                        isAvailable
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-200 animate-pulse' : 'bg-rose-200'}`}></span>
                        {isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{room.name}</h3>
                      <div className="text-lg font-bold text-amber-600">{formatPrice(room.current_price)}<span className="text-sm font-normal text-gray-500">/nt</span></div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 flex-1">{room.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 border-t border-b py-3">
                      <div className="flex items-center"><Users className="h-4 w-4 mr-1.5 text-gray-600" /> Up to {room.capacity} Guests</div>
                    </div>
                    
                    {!isAvailable && (
                      <div className="mb-3 text-xs font-semibold text-center py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                        ⚠️ Currently Unavailable for Booking
                      </div>
                    )}

                    <div className="flex gap-4 mt-auto">
                      <Link to={`/rooms/${room.id}`}
                        className="flex-1 bg-white border border-gray-900 hover:bg-gray-50 text-gray-900 text-center font-semibold py-3 rounded-lg transition-colors">
                        View Details
                      </Link>
                      <button onClick={() => handleBookClick(room)}
                        disabled={!isAvailable}
                        className={`flex-1 font-semibold py-3 rounded-lg transition-colors ${
                          isAvailable
                            ? 'bg-gray-900 hover:bg-black text-white'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}>
                        {isAvailable ? 'Book Now' : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {rooms.length === 0 && (
              <div className="col-span-full text-center py-20 text-gray-500 text-lg">No rooms found matching your filters.</div>
            )}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingModalOpen && selectedRoom && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Book {selectedRoom.name}</h2>
              <button onClick={() => setBookingModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X className="h-6 w-6" /></button>
            </div>
            <div className="p-6">
              {bookingSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                  <p className="text-gray-600">Your reservation has been saved.</p>
                </div>
              ) : (
                <form onSubmit={submitBooking}>
                  {bookingError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
                      <AlertCircle size={16} />{bookingError}
                    </div>
                  )}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
                      <input required type="date" min={getTodayStr()} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm"
                        value={bookingData.checkIn} onChange={e => handleCheckInChange(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
                      <input required type="date"
                        min={bookingData.checkIn ? getNextDayStr(bookingData.checkIn) : getNextDayStr(getTodayStr())}
                        disabled={!bookingData.checkIn}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                        value={bookingData.checkOut} onChange={e => handleCheckOutChange(e.target.value)} />
                      {!bookingData.checkIn && (
                        <p className="text-[11px] text-gray-400 mt-1">Please select a check-in date first.</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
                      <input required type="number" min="1" max={selectedRoom.capacity} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm"
                        value={bookingData.guests} onChange={e => setBookingData({ ...bookingData, guests: e.target.value })} />
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{formatPrice(selectedRoom.current_price)} × {nights} night{nights !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-amber-600">{formatPrice(selectedRoom.current_price * nights)}</span>
                    </div>
                  </div>
                  <button type="submit" disabled={bookingLoading}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-60">
                    {bookingLoading ? 'Confirming...' : 'Confirm Reservation'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Authentication Required Modal */}
      {authModalOpen && selectedRoom && (
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
                Before booking <span className="font-semibold text-gray-900">{selectedRoom.name}</span>, you need to register or sign in to your customer account.
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
                  Cancel & Browse Rooms
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
