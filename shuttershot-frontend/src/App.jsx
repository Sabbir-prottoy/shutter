import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import SearchResults from './pages/SearchResults'
import {
  getPhotographerHistory,
  removeAllPhotographerHistory,
  removePhotographerHistoryEntry,
  getUserHistory,
  removeAllUserHistory,
  removeUserHistoryEntry,
} from './services/api'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import ChatWidget from './components/ChatWidget'
import ClickBurstLayer from './components/ClickBurstLayer'
import VoiceAgent from './components/VoiceAgent'

// Loaded on demand, so a visitor only downloads the pages they open.
const PhotographerProfile = lazy(() => import('./pages/PhotographerProfile'))
const BookingFlow = lazy(() => import('./pages/BookingFlow'))
const VerifyBookingQr = lazy(() => import('./pages/VerifyBookingQr'))
const Suggestions = lazy(() => import('./pages/Suggestions'))
const AiChat = lazy(() => import('./pages/AiChat'))
const VoiceChat = lazy(() => import('./pages/VoiceChat'))
const PhotographerDashboard = lazy(() => import('./pages/PhotographerDashboard'))
const PortfolioManager = lazy(() => import('./pages/PortfolioManager'))
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'))
const CalendarManager = lazy(() => import('./pages/CalendarManager'))
const PackageManager = lazy(() => import('./pages/PackageManager'))
const BookingRequests = lazy(() => import('./pages/BookingRequests'))
const FeedbackManager = lazy(() => import('./pages/FeedbackManager'))
const VerifiedBadge = lazy(() => import('./pages/VerifiedBadge'))
const AdminPanel = lazy(() => import('./pages/AdminPanel/AdminPanel'))
const Overview = lazy(() => import('./pages/AdminPanel/Overview'))
const ReviewModeration = lazy(() => import('./pages/AdminPanel/ReviewModeration'))
const PhotoModeration = lazy(() => import('./pages/AdminPanel/PhotoModeration'))
const PoseManager = lazy(() => import('./pages/AdminPanel/PoseManager'))
const UserManagement = lazy(() => import('./pages/AdminPanel/UserManagement'))
const StaffManagement = lazy(() => import('./pages/AdminPanel/StaffManagement'))
const AccountHistory = lazy(() => import('./pages/AdminPanel/AccountHistory'))
const BlueBadgeManagement = lazy(() => import('./pages/AdminPanel/BlueBadgeManagement'))
const FAQ = lazy(() => import('./pages/FAQ'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const RegisterUser = lazy(() => import('./pages/RegisterUser'))
const AccountSettings = lazy(() => import('./pages/AccountSettings'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const DashboardLayout = lazy(() => import('./components/DashboardLayout'))
const AdminLayout = lazy(() => import('./components/AdminLayout'))

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <p className="text-ink-muted">Loading…</p>
    </div>
  )
}

export default function App() {
  return (
    <>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/photographers/:id" element={<PhotographerProfile />} />
          <Route path="/book/:photographerId" element={<BookingFlow />} />
          <Route path="/verify-booking/:token" element={<VerifyBookingQr />} />
          <Route path="/suggestions" element={<Suggestions />} />
          <Route path="/chat" element={<AiChat />} />
          <Route path="/speak" element={<VoiceChat />} />
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
              <Route path="/dashboard/reviews" element={<FeedbackManager />} />
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
              <Route path="/admin/poses" element={<PoseManager />} />
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
      </Suspense>
      <ChatWidget />
      <VoiceAgent />
      <ClickBurstLayer />
    </>
  )
}
