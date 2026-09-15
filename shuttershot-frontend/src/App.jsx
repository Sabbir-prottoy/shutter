import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import SearchResults from './pages/SearchResults'
import PhotographerProfile from './pages/PhotographerProfile'
import BookingFlow from './pages/BookingFlow'
import PhotographerDashboard from './pages/PhotographerDashboard'
import PortfolioManager from './pages/PortfolioManager'
import ProfileSettings from './pages/ProfileSettings'
import CalendarManager from './pages/CalendarManager'
import PackageManager from './pages/PackageManager'
import BookingRequests from './pages/BookingRequests'
import AdminPanel from './pages/AdminPanel/AdminPanel'
import ReviewModeration from './pages/AdminPanel/ReviewModeration'
import PhotoModeration from './pages/AdminPanel/PhotoModeration'
import UserManagement from './pages/AdminPanel/UserManagement'
import FAQ from './pages/FAQ'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminLogin from './pages/AdminLogin'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import AdminLayout from './components/AdminLayout'
import ChatWidget from './components/ChatWidget'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/photographers/:id" element={<PhotographerProfile />} />
        <Route path="/book/:photographerId" element={<BookingFlow />} />
        <Route path="/faq" element={<FAQ />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<ProtectedRoute requiredRole="PHOTOGRAPHER" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<PhotographerDashboard />} />
            <Route path="/dashboard/portfolio" element={<PortfolioManager />} />
            <Route path="/dashboard/calendar" element={<CalendarManager />} />
            <Route path="/dashboard/packages" element={<PackageManager />} />
            <Route path="/dashboard/bookings" element={<BookingRequests />} />
            <Route path="/dashboard/profile" element={<ProfileSettings />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/reviews" element={<ReviewModeration />} />
            <Route path="/admin/photos" element={<PhotoModeration />} />
            <Route path="/admin/users" element={<UserManagement />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <ChatWidget />
    </>
  )
}
