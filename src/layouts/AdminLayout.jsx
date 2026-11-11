import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  PieChart, 
  Tags, 
  Bed, 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Users, 
  Settings,
  LogOut,
  CalendarCheck
} from 'lucide-react';

import { clearAuth } from '../services/api/apiBase';
import { useSettings } from '../context/SettingsContext';

export default function AdminLayout() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearAuth();
    navigate('/admin');
  };

  const navItems = [
    { name: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Guest Feedback', path: '/admin/feedback', icon: MessageSquare },
    { name: 'Sentiment Analysis', path: '/admin/sentiment', icon: PieChart },
    { name: 'Feedback Themes', path: '/admin/themes', icon: Tags },
    { name: 'Room Management', path: '/admin/rooms', icon: Bed },
    { name: 'Booking Management', path: '/admin/booking-management', icon: CalendarCheck },
    { name: 'Booking Analytics', path: '/admin/bookings', icon: BarChart3 },
    { name: 'Pricing Recommendations', path: '/admin/pricing', icon: TrendingUp },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-hotel-navy text-white flex-shrink-0 flex flex-col h-screen sticky top-0 overflow-y-auto">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold font-serif">
            {settings.hotelName || 'Travellers Inn'}
            <span className="block text-hotel-gold text-sm font-sans mt-1">Admin Dashboard</span>
          </h1>
        </div>
        
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-3 py-2.5 rounded-lg transition-colors group ${
                      isActive 
                        ? 'bg-hotel-gold text-hotel-navy font-medium' 
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-hotel-navy' : 'text-gray-400 group-hover:text-white'}`} />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold">
              A
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-400">System Admin</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8 sticky top-0 z-10 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
          </h2>
          <div className="flex items-center space-x-4">
          </div>
        </header>
        
        <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
