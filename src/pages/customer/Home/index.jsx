import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Star, MapPin } from 'lucide-react';
import { roomsApi } from '../../../services/api';
import { useSettings } from '../../../context/SettingsContext';

const Home = () => {
  const { formatPrice, settings } = useSettings();
  const [featuredRooms, setFeaturedRooms] = useState([]);

  useEffect(() => {
    roomsApi.list()
      .then(rooms => {
        if (rooms && rooms.length > 0) {
          setFeaturedRooms(rooms.slice(0, 3));
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542314831-c53cd3816002?q=80&w=2070&auto=format&fit=crop')" }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-serif">{settings.hotelName}</h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-10 font-light">Experience luxury and comfort in every stay.</p>
          <Link to="/rooms" className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors text-lg">
            Explore Rooms
          </Link>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-serif">Featured Rooms</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Handpicked accommodations for your perfect getaway.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredRooms.length > 0 ? featuredRooms.map(room => (
            <div key={room.id} className="bg-white rounded-xl shadow-lg overflow-hidden group cursor-pointer border border-gray-100 flex flex-col">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={room.image_url || room.imageUrl || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80'} 
                  alt={room.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
                  {formatPrice(room.current_price || room.base_price || 0)}/night
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{room.name}</h3>
                    <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      <Users className="h-4 w-4 mr-1" /> {room.capacity || 2} Max
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{room.description || 'A beautiful room for your stay.'}</p>
                </div>
                <Link to={`/rooms/${room.id}`} className="text-amber-600 font-semibold flex items-center hover:text-amber-700 transition-colors mt-2">
                  View Details <span className="ml-2">→</span>
                </Link>
              </div>
            </div>
          )) : (
            <div className="col-span-3 text-center text-gray-500 py-10">Loading featured accommodations...</div>
          )}
        </div>
        
        <div className="text-center mt-12">
          <Link to="/rooms" className="inline-block border-2 border-gray-900 text-gray-900 font-semibold py-3 px-8 rounded-lg hover:bg-gray-900 hover:text-white transition-colors">
            View All Rooms
          </Link>
        </div>
      </section>

      {/* About Us */}
      <section id="about" className="bg-gray-50 py-20 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2 relative">
            <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80" alt="Hotel Exterior" className="rounded-2xl shadow-xl w-full h-[500px] object-cover" />
          </div>
          <div className="w-full md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-serif">Welcome to {settings.hotelName}</h2>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
              Nestled in the heart of the city, {settings.hotelName} offers a perfect blend of modern luxury and timeless elegance. Whether you're traveling for business or leisure, our exceptional service and exquisite amenities ensure an unforgettable stay.
            </p>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-amber-100 p-2 rounded-full mr-4 text-amber-600">
                  <Star className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">5-Star Accommodations</h4>
                  <p className="text-sm text-gray-500">Premium quality rooms and suites.</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-amber-100 p-2 rounded-full mr-4 text-amber-600">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Prime Location</h4>
                  <p className="text-sm text-gray-500">Close to major attractions and transit.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
