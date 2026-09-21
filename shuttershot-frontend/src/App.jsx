import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import SearchResults from './pages/SearchResults'
import PhotographerProfile from './pages/PhotographerProfile'
import BookingFlow from './pages/BookingFlow'
import VerifyBookingQr from './pages/VerifyBookingQr'
import Entertainment from './pages/Entertainment'
import PhotographerDashboard from './pages/PhotographerDashboard'
import PortfolioManager from './pages/PortfolioManager'
import ProfileSettings from './pages/ProfileSettings'
import CalendarManager from './pages/CalendarManager'
import PackageManager from './pages/PackageManager'
import BookingRequests from './pages/BookingRequests'
import VerifiedBadge from './pages/VerifiedBadge'
import AdminPanel from './pages/AdminPanel/AdminPanel'
import Overview from './pages/AdminPanel/Overview'
import ReviewModeration from './pages/AdminPanel/ReviewModeration'
import PhotoModeration from './pages/AdminPanel/PhotoModeration'
import UserManagement from './pages/AdminPanel/UserManagement'
import StaffManagement from './pages/AdminPanel/StaffManagement'
import AccountHistory from './pages/AdminPanel/AccountHistory'
import BlueBadgeManagement from './pages/AdminPanel/BlueBadgeManagement'
import {
  getPhotographerHistory,
  removeAllPhotographerHistory,
  removePhotographerHistoryEntry,
  getUserHistory,
  removeAllUserHistory,
  removeUserHistoryEntry,
} from './services/api'
import FAQ from './pages/FAQ'
import Login from './pages/Login'
import Register from './pages/Register'
import RegisterUser from './pages/RegisterUser'
import AccountSettings from './pages/AccountSettings'
import AdminLogin from './pages/AdminLogin'
import ForgotPassword from './pages/ForgotPassword'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import AdminLayout from './components/AdminLayout'
import ChatWidget from './components/ChatWidget'
import ClickBurstLayer from './components/ClickBurstLayer'
import VoiceAgent from './components/VoiceAgent'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/photographers/:id" element={<PhotographerProfile />} />
        <Route path="/book/:photographerId" element={<BookingFlow />} />
        <Route path="/verify-booking/:token" element={<VerifyBookingQr />} />
        <Route path="/entertainment" element={<Entertainment />} />
        <Route path="/faq" element={<FAQ />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/user" element={<RegisterUser />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<ProtectedRoute requiredRole="PHOTOGRAPHER" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<PhotographerDashboard />} />
            <Route path="/dashboard/portfolio" element={<PortfolioManager />} />
            <Route path="/dashboard/calendar" element={<CalendarManager />} />
            <Route path="/dashboard/packages" element={<PackageManager />} />
            <Route path="/dashboard/bookings" element={<BookingRequests />} />
            <Route path="/dashboard/profile" element={<ProfileSettings />} />
            <Route path="/dashboard/verified-badge" element={<VerifiedBadge />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute requiredRole="CUSTOMER" />}>
          <Route path="/account" element={<AccountSettings />} />
        </Route>

        <Route element={<ProtectedRoute requiredRole={['ADMIN', 'MODERATOR']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/overview" element={<Overview />} />
            <Route path="/admin/reviews" element={<ReviewModeration />} />
            <Route path="/admin/photos" element={<PhotoModeration />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route
              path="/admin/manage-admins"
              element={<StaffManagement role="ADMIN" title="Manage Admin" roleLabel="admin" />}
            />
            <Route
              path="/admin/manage-moderators"
              element={<StaffManagement role="MODERATOR" title="Manage Moderator" roleLabel="moderator" />}
            />
            <Route
              path="/admin/photographer-history"
              element={
                <AccountHistory
                  title="Photographers Profile History"
                  entityLabel="photographer"
                  pluralLabel="photographers"
                  getHistory={getPhotographerHistory}
                  removeEntry={removePhotographerHistoryEntry}
                  removeAll={removeAllPhotographerHistory}
                />
              }
            />
            <Route
              path="/admin/user-history"
              element={
                <AccountHistory
                  title="Users Profile History"
                  entityLabel="user"
                  pluralLabel="users"
                  getHistory={getUserHistory}
                  removeEntry={removeUserHistoryEntry}
                  removeAll={removeAllUserHistory}
                />
              }
            />
            <Route path="/admin/blue-badge" element={<BlueBadgeManagement />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <ChatWidget />
      <VoiceAgent />
      <ClickBurstLayer />
    </>
  )
}
