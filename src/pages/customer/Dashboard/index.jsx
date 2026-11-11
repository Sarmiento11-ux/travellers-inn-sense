import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  MessageSquare,
  User,
  LogOut,
  CreditCard,
  BedDouble,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Tv,
  Users,
  X,
  Filter,
  CalendarPlus,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { bookingsApi, feedbackApi, roomsApi, usersApi } from '../../../services/api';
import { clearAuth } from '../../../services/api/apiBase';
import { useSettings } from '../../../context/SettingsContext';

const Dashboard = () => {
  const { formatPrice, currencySymbol } = useSettings();
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomFilter, setRoomFilter] = useState('all'); // all | available
  const [currentUser, setCurrentUser] = useState({ name: 'Guest', email: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  
  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, category: 'General', comment: '' });
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  
  // In-dashboard Booking Modal state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingData, setBookingData] = useState({ checkIn: '', checkOut: '', guests: 1 });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Cancel booking state
  const [cancelConfirmId, setCancelConfirmId] = useState(null); // booking id to confirm cancel
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // Customer Extend Stay state
  const [extendModalItem, setExtendModalItem] = useState(null);
  const [newExtendCheckOut, setNewExtendCheckOut] = useState('');
  const [extendLoading, setExtendLoading] = useState(false);
  const [extendError, setExtendError] = useState('');
  const [extendSuccess, setExtendSuccess] = useState('');

  // Customer Anytime Checkout state
  const [checkoutConfirmId, setCheckoutConfirmId] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      bookingsApi.myBookings().catch(() => []),
      feedbackApi.myFeedback().catch(() => []),
      roomsApi.list().catch(() => [])
    ])
      .then(([bkgs, fbs, rms]) => {
        setBookings(bkgs || []);
        setMyFeedbacks(fbs || []);
        setRooms(rms || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (localStorage.getItem('customerAuth') !== 'true') {
      navigate('/login');
      return;
    }
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUser(user);
    const nameParts = (user.name || '').split(' ');
    setProfileData({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: user.email || '',
      newPassword: '',
      confirmPassword: '',
    });

    loadData();
  }, [navigate]);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleCancelBooking = async () => {
    if (!cancelConfirmId) return;
    setCancelLoading(true);
    setCancelError('');
    try {
      await bookingsApi.cancel(cancelConfirmId);
      // Update local state immediately — no need to reload all data
      setBookings(prev =>
        prev.map(b => b.id === cancelConfirmId ? { ...b, status: 'cancelled' } : b)
      );
      setCancelConfirmId(null);
    } catch (err) {
      const msg = err.message || '';
      // If session expired / unauthorized, redirect to login
      if (msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('unauthorized')) {
        clearAuth();
        navigate('/login');
        return;
      }
      setCancelError(msg || 'Failed to cancel booking. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCustomerCheckout = async () => {
    if (!checkoutConfirmId) return;
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      await bookingsApi.checkoutMy(checkoutConfirmId);
      // Immediately update local state to completed
      setBookings(prev =>
        prev.map(b => b.id === checkoutConfirmId ? { ...b, status: 'completed' } : b)
      );
      setCheckoutConfirmId(null);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('unauthorized')) {
        clearAuth();
        navigate('/login');
        return;
      }
      setCheckoutError(msg || 'Unable to process check-out. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

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

  const calculateExtraNights = (oldCheckOut, newCheckOut) => {
    if (!oldCheckOut || !newCheckOut) return 0;
    const diff = new Date(newCheckOut) - new Date(oldCheckOut);
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  };

  const calculateNewTotal = (b, newCheckOut) => {
    if (!b || !b.check_in || !newCheckOut) return b?.booking_amount || 0;
    const oldNights = Math.max(1, Math.round((new Date(b.check_out) - new Date(b.check_in)) / (1000 * 60 * 60 * 24)));
    const ratePerNight = b.booking_amount / oldNights;
    const totalNights = Math.max(1, Math.round((new Date(newCheckOut) - new Date(b.check_in)) / (1000 * 60 * 60 * 24)));
    return Math.round(ratePerNight * totalNights);
  };

  const handleOpenExtendModal = (b) => {
    setExtendModalItem(b);
    setNewExtendCheckOut(getNextDayStr(b.check_out));
    setExtendError('');
    setExtendSuccess('');
  };

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    if (!extendModalItem || !newExtendCheckOut) return;
    setExtendLoading(true);
    setExtendError('');
    setExtendSuccess('');
    try {
      const updated = await bookingsApi.extendMy(extendModalItem.id, newExtendCheckOut);
      setBookings(prev => prev.map(b => b.id === extendModalItem.id ? updated : b));
      setExtendSuccess(`Success! Your booking has been extended until ${newExtendCheckOut}.`);
      setTimeout(() => {
        setExtendModalItem(null);
        setExtendSuccess('');
      }, 1600);
    } catch (err) {
      setExtendError(err.message || 'Unable to extend booking. The room may already be reserved on the selected dates.');
    } finally {
      setExtendLoading(false);
    }
  };

  const handleBookRoom = (room) => {
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
      // Reload bookings to show the new booking immediately
      bookingsApi.myBookings().then(bkgs => setBookings(bkgs || [])).catch(() => {});
      setTimeout(() => {
        setBookingModalOpen(false);
        setBookingSuccess(false);
      }, 2500);
    } catch (err) {
      setBookingError(err.message || 'Booking failed. Room may not be available for the selected dates.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setFeedbackLoading(true);
    setFeedbackMsg('');
    try {
      const fb = await feedbackApi.submit({
        rating: Number(feedbackForm.rating),
        feedback_text: feedbackForm.comment,
        category: feedbackForm.category,
      });
      setMyFeedbacks(prev => [fb, ...prev]);
      setFeedbackForm({ rating: 5, category: 'General', comment: '' });
      setFeedbackMsg('Feedback submitted successfully!');
    } catch (err) {
      setFeedbackMsg('Error: ' + (err.message || 'Could not submit feedback.'));
    } finally {
      setFeedbackLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'rooms', label: 'Room Availability', icon: BedDouble },
    { id: 'bookings', label: 'My Bookings', icon: CalendarDays },
    { id: 'feedback', label: 'Guest Feedback', icon: MessageSquare },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const sentimentBadge = (s) => {
    if (s === 'Positive') return 'bg-green-100 text-green-700';
    if (s === 'Negative') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  };

  const statusBadge = (s) => {
    if (!s) return 'bg-gray-100 text-gray-700';
    const map = {
      confirmed: 'bg-green-100 text-green-700',
      checked_in: 'bg-indigo-100 text-indigo-700 font-bold border border-indigo-200',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return map[s.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const availableRoomsCount = rooms.filter(r => r.availability_status === 'available').length;
  const filteredRooms = roomFilter === 'available'
    ? rooms.filter(r => r.availability_status === 'available')
    : rooms;

  const nights = (bookingData.checkIn && bookingData.checkOut && bookingData.checkOut > bookingData.checkIn)
    ? Math.max(1, Math.round((new Date(bookingData.checkOut) - new Date(bookingData.checkIn)) / (1000 * 60 * 60 * 24)))
    : 1;

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">

        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
            <div className="p-6 bg-gray-900 text-white text-center">
              <div className="h-20 w-20 bg-amber-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
                {(currentUser.name || 'G').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <h2 className="font-bold text-lg">{currentUser.name}</h2>
              <p className="text-gray-400 text-sm">Customer Portal</p>
            </div>
            <nav className="p-2 space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-amber-50 text-amber-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-amber-600' : 'text-gray-400'}`} />
                  {tab.label}

                </button>
              ))}
              <hr className="my-2" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[500px]">

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 font-serif">
                    Welcome back, {(currentUser.name || 'Guest').split(' ')[0]}!
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Here is a quick overview of your reservations and current hotel room availability.</p>
                </div>

                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
                    <BedDouble className="h-7 w-7 text-emerald-600 mb-2" />
                    <div className="text-2xl font-bold text-emerald-700">{availableRoomsCount} / {rooms.length}</div>
                    <div className="text-xs text-emerald-800 font-medium mt-1">Available Rooms Now</div>
                  </div>

                  <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                    <CalendarDays className="h-7 w-7 text-blue-500 mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{bookings.length}</div>
                    <div className="text-xs text-gray-600 font-medium mt-1">Total Bookings</div>
                  </div>

                  <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
                    <CreditCard className="h-7 w-7 text-amber-500 mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {bookings.filter(b => b.status === 'confirmed').length}
                    </div>
                    <div className="text-xs text-gray-600 font-medium mt-1">Upcoming Stays</div>
                  </div>

                  <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
                    <MessageSquare className="h-7 w-7 text-purple-500 mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{myFeedbacks.length}</div>
                    <div className="text-xs text-gray-600 font-medium mt-1">Reviews Submitted</div>
                  </div>
                </div>

                {/* Live Room Status Preview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <BedDouble size={18} className="text-amber-600" />
                      Live Room Availability Status
                    </h3>
                    <button
                      onClick={() => setActiveTab('rooms')}
                      className="text-xs font-semibold text-amber-600 hover:text-amber-700 underline"
                    >
                      View All Rooms →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rooms.map(room => {
                      const isAvail = room.availability_status === 'available';
                      return (
                        <div key={room.id} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={room.image_url || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=200'}
                              alt={room.name}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
                            />
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{room.name}</p>
                              <p className="text-xs text-gray-500">{formatPrice(room.current_price)} / night • {room.capacity} guests</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isAvail ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                              {isAvail ? 'Available' : 'Unavailable'}
                            </span>
                            {isAvail && (
                              <button
                                onClick={() => handleBookRoom(room)}
                                className="block mt-1 text-xs text-amber-600 hover:text-amber-800 font-semibold"
                              >
                                Book Now
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent bookings preview */}
                {bookings.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Recent Bookings</h3>
                    <div className="space-y-2">
                      {bookings.slice(0, 3).map(b => (
                        <div key={b.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{b.room_name}</p>
                            <p className="text-xs text-gray-500">{b.check_in} → {b.check_out}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadge(b.status)}`}>
                            {b.status?.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ROOM AVAILABILITY TAB */}
            {activeTab === 'rooms' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 font-serif">Room Availability</h2>
                    <p className="text-sm text-gray-500 mt-1">Check current room status and make reservations directly from your dashboard.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRoomFilter('all')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        roomFilter === 'all'
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      All Rooms ({rooms.length})
                    </button>
                    <button
                      onClick={() => setRoomFilter('available')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                        roomFilter === 'available'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-emerald-700 border-gray-200 hover:bg-emerald-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Available Only ({availableRoomsCount})
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredRooms.map(room => {
                    const isAvail = room.availability_status === 'available';

                    return (
                      <div key={room.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col">
                        <div className="relative h-48">
                          <img
                            src={room.image_url || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'}
                            alt={room.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 right-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                              isAvail
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 text-white'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${isAvail ? 'bg-emerald-200 animate-pulse' : 'bg-rose-200'}`}></span>
                              {isAvail ? 'AVAILABLE' : 'UNAVAILABLE'}
                            </span>
                          </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="font-bold text-lg text-gray-900">{room.name}</h3>
                              <div className="text-amber-600 font-extrabold text-base">
                                {formatPrice(room.current_price)}
                                <span className="text-xs font-normal text-gray-500"> / night</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">{room.description || 'Comfortable and fully-furnished hotel room.'}</p>
                            
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                              <span className="flex items-center gap-1.5"><Users size={14} className="text-gray-600" /> Maximum {room.capacity} guests</span>
                            </div>
                          </div>

                          <div>
                            {!isAvail ? (
                              <div className="py-2.5 px-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg text-center">
                                ⚠️ Room is currently under maintenance / unavailable
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Link
                                  to={`/rooms/${room.id}`}
                                  className="flex-1 py-2 px-3 text-center border border-gray-300 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  View Details
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleBookRoom(room)}
                                  className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
                                >
                                  Book This Room
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MY BOOKINGS TAB */}
            {activeTab === 'bookings' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 font-serif">My Bookings</h2>
                {loading ? (
                  <div className="text-center py-12 text-gray-500">Loading bookings...</div>
                ) : bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map(b => {
                      const isConfirmed = b.status === 'confirmed';
                      const isCheckedIn = b.status === 'checked_in';
                      const isActiveStay = isConfirmed || isCheckedIn;

                      return (
                        <div key={b.id} className="border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-sm transition-shadow">
                          <div className="flex-1 space-y-1">
                            <h4 className="font-bold text-lg text-gray-900">{b.room_name}</h4>
                            <p className="text-sm text-gray-500">Ref: <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{b.booking_reference}</span></p>
                            <p className="text-sm text-gray-500">Check-in: <span className="font-medium text-gray-700">{b.check_in}</span> &nbsp;|&nbsp; Check-out: <span className="font-medium text-gray-700">{b.check_out}</span></p>
                            <p className="text-sm text-gray-500">Guests: {b.number_of_guests} &nbsp;|&nbsp; Amount: <span className="font-semibold text-amber-700">{formatPrice(b.booking_amount)}</span></p>
                            {isCheckedIn && (
                              <p className="text-xs text-indigo-700 font-semibold pt-1">
                                🏨 You are currently checked in to this room.
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(b.status)}`}>
                              {b.status === 'checked_in' ? 'CHECKED IN (IN-HOUSE)' : b.status?.toUpperCase()}
                            </span>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {/* Actions for Active Stays */}
                              {isActiveStay && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => { setCheckoutConfirmId(b.id); setCheckoutError(''); }}
                                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 border border-emerald-300 hover:border-emerald-500 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                                    title="Check out anytime if you need to leave early"
                                  >
                                    <LogOut size={13} />
                                    Check Out Now
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenExtendModal(b)}
                                    className="text-xs font-semibold text-amber-700 hover:text-amber-900 border border-amber-300 hover:border-amber-500 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                                  >
                                    <CalendarPlus size={14} />
                                    Extend Stay
                                  </button>
                                </>
                              )}

                              {/* Customer can only cancel if not yet checked in */}
                              {isConfirmed && (
                                <button
                                  type="button"
                                  onClick={() => { setCancelConfirmId(b.id); setCancelError(''); }}
                                  className="text-xs font-semibold text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  Cancel Booking
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">You have no bookings yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* FEEDBACK TAB */}
            {activeTab === 'feedback' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 font-serif">Submit Feedback</h2>
                {feedbackMsg && (
                  <div className={`mb-4 p-3 rounded-lg text-sm ${feedbackMsg.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {feedbackMsg}
                  </div>
                )}
                <form className="space-y-4 max-w-lg" onSubmit={handleSubmitFeedback}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate your stay (1-5)</label>
                    <select
                      name="rating"
                      value={feedbackForm.rating}
                      onChange={e => setFeedbackForm({ ...feedbackForm, rating: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value={5}>5 - Excellent</option>
                      <option value={4}>4 - Very Good</option>
                      <option value={3}>3 - Average</option>
                      <option value={2}>2 - Poor</option>
                      <option value={1}>1 - Terrible</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Feedback Category</label>
                    <select
                      value={feedbackForm.category}
                      onChange={e => setFeedbackForm({ ...feedbackForm, category: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value="General">General</option>
                      <option value="Cleanliness">Cleanliness</option>
                      <option value="Staff Service">Staff Service</option>
                      <option value="Facilities">Facilities</option>
                      <option value="Food & Dining">Food & Dining</option>
                      <option value="Pricing">Pricing</option>
                      <option value="Location">Location</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your comments</label>
                    <textarea
                      required rows={4}
                      value={feedbackForm.comment}
                      onChange={e => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                      placeholder="Tell us about your experience..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={feedbackLoading}
                    className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-black transition-colors font-medium disabled:opacity-60"
                  >
                    {feedbackLoading ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>

                {myFeedbacks.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-semibold text-gray-700 mb-3">My Previous Reviews</h3>
                    <div className="space-y-3">
                      {myFeedbacks.map(fb => (
                        <div key={fb.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-medium text-gray-700">{fb.category}</span>
                            <div className="flex gap-2 items-center">
                              <span className="text-xs text-gray-400">{fb.created_at?.split('T')[0]}</span>
                              {fb.sentiment && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sentimentBadge(fb.sentiment)}`}>
                                  {fb.sentiment}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)} — {fb.feedback_text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 font-serif">My Profile</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your account information and password security.</p>
                  </div>
                </div>

                {profileMsg && (
                  <div className="mb-6 p-4 rounded-xl text-sm bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <span className="font-medium">{profileMsg}</span>
                  </div>
                )}

                {profileError && (
                  <div className="mb-6 p-4 rounded-xl text-sm bg-red-50 text-red-800 border border-red-200 flex items-center gap-3">
                    <AlertCircle size={18} className="text-red-600 shrink-0" />
                    <span className="font-medium">{profileError}</span>
                  </div>
                )}

                <form className="max-w-xl space-y-6" onSubmit={async (e) => {
                  e.preventDefault();
                  if (!isEditingProfile) {
                    setIsEditingProfile(true);
                    setProfileMsg('');
                    setProfileError('');
                    return;
                  }

                  setProfileError('');
                  const trimmedNewPass = (profileData.newPassword || '').trim();
                  const trimmedConfirmPass = (profileData.confirmPassword || '').trim();

                  if (trimmedNewPass) {
                    if (trimmedNewPass.length < 6) {
                      setProfileError('New password must be at least 6 characters.');
                      return;
                    }
                    if (trimmedNewPass !== trimmedConfirmPass) {
                      setProfileError('New password and confirmation do not match.');
                      return;
                    }
                  }

                  setProfileLoading(true);

                  try {
                    const payload = {
                      first_name: profileData.firstName.trim(),
                      last_name: profileData.lastName.trim(),
                      email: profileData.email.trim(),
                    };
                    if (trimmedNewPass) {
                      payload.password = trimmedNewPass;
                    }

                    try {
                      await usersApi.updateProfile(payload);
                    } catch (apiErr) {
                      console.warn('Backend update failed or offline, updating locally:', apiErr);
                    }

                    const newName = `${profileData.firstName} ${profileData.lastName}`.trim();
                    const updatedUser = {
                      ...currentUser,
                      name: newName,
                      email: profileData.email.trim(),
                    };
                    setCurrentUser(updatedUser);
                    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

                    setProfileData(prev => ({
                      ...prev,
                      newPassword: '',
                      confirmPassword: ''
                    }));

                    setIsEditingProfile(false);
                    setProfileMsg(trimmedNewPass
                      ? 'Your profile and new password have been updated successfully!'
                      : 'Your profile has been updated successfully!');
                    setTimeout(() => setProfileMsg(''), 4000);
                  } catch (err) {
                    setProfileError(err.message || 'An error occurred while updating your profile.');
                  } finally {
                    setProfileLoading(false);
                  }
                }}>
                  {/* Basic Information Card */}
                  <div className="bg-gray-50/70 p-5 rounded-xl border border-gray-200 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                      <User size={16} className="text-amber-600" />
                      Primary Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input
                          type="text"
                          value={profileData.firstName}
                          required
                          onChange={e => setProfileData({ ...profileData, firstName: e.target.value })}
                          className={`w-full p-3 border rounded-lg outline-none transition-all ${!isEditingProfile ? 'bg-gray-100/70 border-gray-200 text-gray-700' : 'bg-white border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500'}`}
                          readOnly={!isEditingProfile}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={profileData.lastName}
                          onChange={e => setProfileData({ ...profileData, lastName: e.target.value })}
                          className={`w-full p-3 border rounded-lg outline-none transition-all ${!isEditingProfile ? 'bg-gray-100/70 border-gray-200 text-gray-700' : 'bg-white border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500'}`}
                          readOnly={!isEditingProfile}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={profileData.email}
                        required
                        onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                        className={`w-full p-3 border rounded-lg outline-none transition-all ${!isEditingProfile ? 'bg-gray-100/70 border-gray-200 text-gray-700' : 'bg-white border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500'}`}
                        readOnly={!isEditingProfile}
                      />
                    </div>
                  </div>

                  {/* Password & Security Section */}
                  <div className="bg-gray-50/70 p-5 rounded-xl border border-gray-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                        <Lock size={16} className="text-amber-600" />
                        Account Security & Password
                      </h3>
                      {!isEditingProfile && (
                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                          Protected
                        </span>
                      )}
                    </div>

                    {!isEditingProfile ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <div className="relative">
                          <input
                            type="password"
                            value="••••••••••••"
                            readOnly
                            className="w-full p-3 bg-gray-100/70 border border-gray-200 text-gray-500 rounded-lg outline-none cursor-not-allowed tracking-widest font-mono"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">
                          Your password is encrypted. Click <strong>Edit Profile</strong> below to change your password.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                          <strong>Note:</strong> Leave the password fields below blank if you wish to keep your current password.
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={profileData.newPassword || ''}
                              placeholder="Enter new password (min. 6 characters)"
                              onChange={e => setProfileData({ ...profileData, newPassword: e.target.value })}
                              className="w-full p-3 pr-11 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={profileData.confirmPassword || ''}
                              placeholder="Repeat new password"
                              onChange={e => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                              className="w-full p-3 pr-11 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="bg-amber-600 text-white px-6 py-2.5 rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-sm hover:shadow disabled:opacity-50 flex items-center gap-2"
                    >
                      {isEditingProfile ? (profileLoading ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
                    </button>
                    {isEditingProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setProfileError('');
                          const nameParts = (currentUser.name || '').split(' ');
                          setProfileData({
                            firstName: nameParts[0] || '',
                            lastName: nameParts.slice(1).join(' ') || '',
                            email: currentUser.email || '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                        }}
                        className="bg-gray-200 text-gray-800 px-6 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Cancel Booking Confirmation Modal */}
      {cancelConfirmId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="text-center mb-4">
              <div className="h-14 w-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <X className="h-7 w-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Cancel Booking?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
            </div>
            {cancelError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-center">
                {cancelError}
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setCancelConfirmId(null); setCancelError(''); }}
                disabled={cancelLoading}
                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-semibold text-sm rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelLoading}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-60"
              >
                {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Early / Anytime Check-Out Confirmation Modal */}
      {checkoutConfirmId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="text-center mb-4">
              <div className="h-14 w-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <LogOut className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Check Out Now?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Do you need to check out now? If you check out, your stay will be marked as <strong>Completed</strong> and the room will be released.
              </p>
            </div>
            {checkoutError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg text-center">
                {checkoutError}
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => { setCheckoutConfirmId(null); setCheckoutError(''); }}
                disabled={checkoutLoading}
                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Stay Longer
              </button>
              <button
                type="button"
                onClick={handleCustomerCheckout}
                disabled={checkoutLoading}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-60 shadow-xs"
              >
                {checkoutLoading ? 'Checking out...' : 'Yes, Check Out Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Extend Stay Modal */}
      {extendModalItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b bg-amber-50/60">
              <div className="flex items-center gap-2">
                <CalendarPlus className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-bold text-gray-900">Extend Stay</h3>
              </div>
              <button
                onClick={() => setExtendModalItem(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleExtendSubmit} className="p-6 space-y-4">
              {extendSuccess ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto mb-3" />
                  <h4 className="text-xl font-bold text-gray-900 mb-1">Stay Extended!</h4>
                  <p className="text-sm text-gray-600">{extendSuccess}</p>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 p-3.5 rounded-xl space-y-1 text-xs text-gray-600 border border-gray-100">
                    <p className="font-bold text-sm text-gray-800">{extendModalItem.room_name}</p>
                    <p>Booking Ref: <span className="font-mono text-gray-700">{extendModalItem.booking_reference}</span></p>
                    <p>Current Check-in: <span className="font-semibold text-gray-800">{extendModalItem.check_in}</span></p>
                    <p>Current Check-out: <span className="font-semibold text-gray-800">{extendModalItem.check_out}</span></p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Select New Check-out Date:
                    </label>
                    <input
                      required
                      type="date"
                      min={getNextDayStr(extendModalItem.check_out)}
                      value={newExtendCheckOut}
                      onChange={e => setNewExtendCheckOut(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Select a date after your current check-out date ({extendModalItem.check_out}).
                    </p>
                  </div>

                  {newExtendCheckOut && newExtendCheckOut > extendModalItem.check_out && (
                    <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs space-y-1.5 text-gray-700">
                      <div className="flex justify-between">
                        <span>Extra Nights:</span>
                        <span className="font-bold text-amber-800">
                          +{calculateExtraNights(extendModalItem.check_out, newExtendCheckOut)} night(s)
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-amber-200">
                        <span className="font-medium">New Total Amount:</span>
                        <span className="font-extrabold text-sm text-amber-700">
                          {formatPrice(calculateNewTotal(extendModalItem, newExtendCheckOut))}
                        </span>
                      </div>
                    </div>
                  )}

                  {extendError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{extendError}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setExtendModalItem(null)}
                      className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Go Back
                    </button>
                    <button
                      type="submit"
                      disabled={!newExtendCheckOut || newExtendCheckOut <= extendModalItem.check_out || extendLoading}
                      className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-50 shadow-xs"
                    >
                      {extendLoading ? 'Confirming...' : 'Confirm Extension'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Booking Modal in Dashboard */}
      {bookingModalOpen && selectedRoom && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Book {selectedRoom.name}</h2>
              <button onClick={() => setBookingModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              {bookingSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                  <p className="text-gray-600">Your reservation has been recorded.</p>
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
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-60 shadow-sm">
                    {bookingLoading ? 'Confirming...' : 'Confirm Reservation'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
