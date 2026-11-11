import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';

import { clearAuth } from '../services/api/apiBase';
import { useSettings } from '../context/SettingsContext';

export default function CustomerLayout() {
  const { settings } = useSettings();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Real auth state check
  const isAuthenticated = localStorage.getItem('customerAuth') === 'true' && !!localStorage.getItem('authToken');

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-hotel-light">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to={isAuthenticated ? "/customer/dashboard" : "/"} className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-serif font-bold text-hotel-navy tracking-tight">{settings.hotelName || 'Travellers Inn'} <span className="text-hotel-gold">Sense</span></span>
              </Link>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
              {!isAuthenticated ? (
                <>
                  <Link to="/" className="text-gray-600 hover:text-hotel-navy px-3 py-2 text-sm font-medium transition-colors">Home</Link>
                  <Link to="/rooms" className="text-gray-600 hover:text-hotel-navy px-3 py-2 text-sm font-medium transition-colors">Rooms</Link>
                  <a href="/#about" className="text-gray-600 hover:text-hotel-navy px-3 py-2 text-sm font-medium transition-colors">About Us</a>
                  <a href="#contact" className="text-gray-600 hover:text-hotel-navy px-3 py-2 text-sm font-medium transition-colors">Contact</a>
                  
                  <div className="flex space-x-4 ml-4 pl-4 border-l border-gray-200">
                    <Link to="/login" className="text-hotel-navy font-medium hover:text-hotel-gold px-3 py-2 transition-colors">Login</Link>
                    <Link to="/register" className="bg-hotel-navy text-white px-5 py-2 rounded-md font-medium hover:bg-opacity-90 transition-all shadow-sm">Register</Link>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/customer/dashboard" className="flex items-center text-hotel-navy hover:text-hotel-gold font-medium px-3 py-2 text-sm transition-colors">
                    <User className="w-5 h-5 mr-1.5 text-hotel-gold" />
                    Dashboard
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="flex items-center gap-1.5 text-gray-500 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-red-50"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="sm:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full">
            <div className="pt-2 pb-3 space-y-1">
              {!isAuthenticated ? (
                <>
                  <Link to="/" onClick={() => setIsMenuOpen(false)} className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300">Home</Link>
                  <Link to="/rooms" onClick={() => setIsMenuOpen(false)} className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300">Rooms</Link>
                  <a href="/#about" onClick={() => setIsMenuOpen(false)} className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300">About Us</a>
                  <a href="#contact" onClick={() => setIsMenuOpen(false)} className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300">Contact</a>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-hotel-navy hover:bg-gray-50">Login</Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)} className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-hotel-navy hover:bg-gray-50">Register</Link>
                </>
              ) : (
                <>
                  <Link to="/customer/dashboard" onClick={() => setIsMenuOpen(false)} className="block pl-3 pr-4 py-2 border-l-4 border-hotel-navy text-base font-medium text-hotel-navy bg-hotel-light">Dashboard</Link>
                  <button onClick={() => { setIsMenuOpen(false); handleLogout(); }} className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-red-600 hover:bg-red-50">Logout</button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer - only shown for public unauthenticated visitors */}
      {!isAuthenticated && (
        <footer id="contact" className="bg-hotel-navy text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-serif font-bold mb-4">{settings.hotelName || 'Travellers Inn'} <span className="text-hotel-gold">Sense</span></h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Experience comfort and luxury with intelligent guest services. We combine traditional hospitality with smart technology to ensure your perfect stay.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-hotel-gold uppercase tracking-wider text-sm">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/rooms" className="hover:text-white transition-colors">Our Rooms</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Guest Portal</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-hotel-gold uppercase tracking-wider text-sm">Contact Us</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>{settings.address || '123 Hospitality Ave, Resort City'}</li>
                <li>{settings.contactEmail || 'contact@travellersinn.com'}</li>
                <li>+1 (555) 123-4567</li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
            &copy; 2026 {settings.hotelName || 'Travellers Inn'}. All rights reserved.
          </div>
        </footer>
      )}
    </div>
  );
}
