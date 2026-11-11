import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';

// Customer Pages
import Home from './pages/customer/Home';
import Rooms from './pages/customer/Rooms';
import RoomDetails from './pages/customer/RoomDetails';
import CustomerDashboard from './pages/customer/Dashboard';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import Feedback from './pages/admin/Feedback';
import Sentiment from './pages/admin/Sentiment';
import Themes from './pages/admin/Themes';
import AdminRooms from './pages/admin/Rooms';
import Analytics from './pages/admin/Analytics';
import Pricing from './pages/admin/Pricing';
import Reports from './pages/admin/Reports';
import Users from './pages/admin/Users';
import Settings from './pages/admin/Settings';
import BookingManagement from './pages/admin/BookingManagement';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminLogin from './pages/auth/AdminLogin';

function RequireAdminAuth({ children }) {
  const isAuth = localStorage.getItem('adminAuth') === 'true';
  if (!isAuth) {
    return <Navigate to="/admin" replace />;
  }
  return children;
}

function RequireCustomerAuth({ children }) {
  const isAuth = localStorage.getItem('customerAuth') === 'true';
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
        {/* Admin Login Route */}
        <Route path="/admin" element={<AdminLogin />} />

        {/* Admin Protected Routes */}
        <Route path="/admin/*" element={
          <RequireAdminAuth>
            <AdminLayout />
          </RequireAdminAuth>
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="sentiment" element={<Sentiment />} />
          <Route path="themes" element={<Themes />} />
          <Route path="rooms" element={<AdminRooms />} />
          <Route path="booking-management" element={<BookingManagement />} />
          <Route path="bookings" element={<Analytics />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* Customer Routes */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<Home />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="rooms/:id" element={<RoomDetails />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          
          <Route path="customer/dashboard" element={
            <RequireCustomerAuth>
              <CustomerDashboard />
            </RequireCustomerAuth>
          } />
          {/* Aliases for customer routes to map to dashboard tabs for now */}
          <Route path="customer/bookings" element={<RequireCustomerAuth><CustomerDashboard /></RequireCustomerAuth>} />
          <Route path="customer/feedback" element={<RequireCustomerAuth><CustomerDashboard /></RequireCustomerAuth>} />
          <Route path="customer/profile" element={<RequireCustomerAuth><CustomerDashboard /></RequireCustomerAuth>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </SettingsProvider>
  );
}

export default App;
