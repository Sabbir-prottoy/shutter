import axios from 'axios'

export const AUTH_STORAGE_KEY = 'shuttershot_auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
})

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    const token = raw ? JSON.parse(raw).token : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {
    // malformed/corrupt storage — proceed unauthenticated rather than throw
  }
  return config
})

// Auth
export function loginRequest(payload) {
  return api.post('/auth/login', payload).then((res) => res.data)
}

export function registerRequest(payload) {
  return api.post('/auth/register', payload).then((res) => res.data)
}

export function registerCustomerRequest(payload) {
  return api.post('/auth/register-customer', payload).then((res) => res.data)
}

export function forgotPasswordRequest(payload) {
  return api.post('/auth/forgot-password', payload).then((res) => res.data)
}

export function verifyResetOtp(payload) {
  return api.post('/auth/verify-reset-otp', payload).then((res) => res.data)
}

export function resetPasswordRequest(payload) {
  return api.post('/auth/reset-password', payload).then((res) => res.data)
}

// Account (customer, own profile)
export function getMyAccount() {
  return api.get('/account/me').then((res) => res.data)
}

export function updateMyAccount(payload) {
  return api.put('/account/me', payload).then((res) => res.data)
}

export function uploadAccountPhoto(file) {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/account/me/photo', formData).then((res) => res.data)
}

// Photographer (dashboard, own profile)
export function getMyProfile() {
  return api.get('/photographers/me').then((res) => res.data)
}

export function updateMyProfile(photographerProfileId, payload) {
  return api.put(`/photographers/${photographerProfileId}`, payload).then((res) => res.data)
}

export function uploadProfilePhoto(file) {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/photographers/me/photo', formData).then((res) => res.data)
}

// Photographer (public)
export function searchPhotographers({ q, district, category } = {}) {
  return api
    .get('/photographers', {
      params: { q: q || undefined, district: district || undefined, category: category || undefined },
    })
    .then((res) => res.data)
}

// One portion of the search at a time: { items, page, size, total, hasMore }.
export function searchPhotographersPage({ q, district, category, page = 0, size = 12 } = {}) {
  return api
    .get('/photographers/search', {
      params: {
        q: q || undefined,
        district: district || undefined,
        category: category || undefined,
        page,
        size,
      },
    })
    .then((res) => res.data)
}

export function getPhotographer(id) {
  return api.get(`/photographers/${id}`).then((res) => res.data)
}

export function getPhotographerPortfolio(id) {
  return api.get(`/photographers/${id}/portfolio`).then((res) => res.data)
}

export function getPhotographerPackages(id) {
  return api.get(`/photographers/${id}/packages`).then((res) => res.data)
}

export function getPhotographerAvailability(id, { from, to } = {}) {
  return api.get(`/photographers/${id}/availability`, { params: { from, to } }).then((res) => res.data)
}

export function setAvailability(date, status) {
  return api.put(`/availability/${date}`, { status }).then((res) => res.data)
}

// Reviews (public)
export function getPhotographerReviews(id) {
  return api.get('/reviews', { params: { photographerId: id } }).then((res) => res.data)
}

export function submitReview({ bookingId, rating, comment }) {
  return api.post('/reviews', { bookingId, rating, comment }).then((res) => res.data)
}

// Reviews (photographer dashboard: ratings about my profile, and my replies)
export function getMyReviews() {
  return api.get('/reviews/mine').then((res) => res.data)
}

export function replyToReview(id, reply) {
  return api.put(`/reviews/${id}/reply`, { reply }).then((res) => res.data)
}

// Portfolio (photographer dashboard, own images)
export function getMyPortfolio() {
  return api.get('/portfolio').then((res) => res.data)
}

export function uploadPortfolioImage(file, category, caption) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', category)
  if (caption) {
    formData.append('caption', caption)
  }
  // No explicit Content-Type here — axios/the browser sets the multipart
  // boundary automatically for FormData; overriding it manually drops the
  // boundary parameter and breaks the upload.
  return api.post('/portfolio', formData).then((res) => res.data)
}

export function updatePortfolioCaption(id, caption) {
  return api.put(`/portfolio/${id}`, { caption }).then((res) => res.data)
}

export function deletePortfolioImage(id) {
  return api.delete(`/portfolio/${id}`).then((res) => res.data)
}

// Packages (photographer dashboard, own packages)
export function getMyPackages() {
  return api.get('/packages').then((res) => res.data)
}

export function createPackage(payload) {
  return api.post('/packages', payload).then((res) => res.data)
}

export function updatePackage(id, payload) {
  return api.put(`/packages/${id}`, payload).then((res) => res.data)
}

export function deletePackage(id) {
  return api.delete(`/packages/${id}`).then((res) => res.data)
}

// Booking (public, guest flow)
export function createBooking(payload) {
  return api.post('/bookings', payload).then((res) => res.data)
}

export function confirmBookingOtp(bookingId, otpCode) {
  return api.post(`/bookings/${bookingId}/confirm-otp`, { otpCode }).then((res) => res.data)
}

export function getBooking(id) {
  return api.get(`/bookings/${id}`).then((res) => res.data)
}

export function initiateBookingDeposit(bookingId) {
  return api.post(`/bookings/${bookingId}/deposit/initiate`).then((res) => res.data)
}

export function setBookingVerificationMethod(bookingId, method) {
  return api.post(`/bookings/${bookingId}/verification-method`, { method }).then((res) => res.data)
}

export function verifyBookingByQr(token) {
  return api.post(`/bookings/verify-qr/${token}`).then((res) => res.data)
}

// Bookings (photographer dashboard, own bookings)
export function getMyBookings(photographerId) {
  return api.get('/bookings', { params: { photographerId } }).then((res) => res.data)
}

export function getBookingQrCode(bookingId) {
  return api.get(`/bookings/${bookingId}/qr-code`).then((res) => res.data)
}

// Bookings (customer account, bookings I made while logged in)
export function getMyBookingsAsCustomer() {
  return api.get('/bookings/mine').then((res) => res.data)
}

export function updateBookingStatus(id, status) {
  return api.put(`/bookings/${id}/status`, { status }).then((res) => res.data)
}

// Admin (requires ROLE_ADMIN)
export function getAdminReviews() {
  return api.get('/admin/reviews').then((res) => res.data)
}

export function removeReview(id) {
  return api.put(`/admin/reviews/${id}/remove`).then((res) => res.data)
}

export function getModerationPhotos(status) {
  return api.get('/admin/photos', { params: { status } }).then((res) => res.data)
}

export function approvePhoto(id) {
  return api.put(`/admin/photos/${id}/approve`).then((res) => res.data)
}

export function rejectPhoto(id) {
  return api.put(`/admin/photos/${id}/reject`).then((res) => res.data)
}

export function checkPhotoForAi(id) {
  return api.post(`/admin/photos/${id}/ai-check`).then((res) => res.data)
}

export function sendAiChatMessage({ message, conversationId, history, mode }) {
  return api
    .post('/ai-chat/messages', { message, conversationId, history, mode })
    .then((res) => res.data)
}

export function getAiChatConversations(mode) {
  return api.get('/ai-chat/conversations', { params: { mode } }).then((res) => res.data)
}

export function transcribeAudio(blob) {
  const formData = new FormData()
  // The extension matters: Whisper picks its decoder from the filename.
  const extension = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'mp4' : 'webm'
  formData.append('audio', blob, `speech.${extension}`)
  return api.post('/ai-chat/transcribe', formData).then((res) => res.data)
}

export function getAiChatMessages(conversationId) {
  return api.get(`/ai-chat/conversations/${conversationId}/messages`).then((res) => res.data)
}

export function deleteAiChatConversation(conversationId) {
  return api.delete(`/ai-chat/conversations/${conversationId}`).then((res) => res.data)
}

export function getAdminUsers(role) {
  return api.get('/admin/users', { params: { role } }).then((res) => res.data)
}

export function verifyUser(id) {
  return api.put(`/admin/users/${id}/verify`).then((res) => res.data)
}

// Permanently removes the account AND blocks this email from ever
// registering again — see AdminUserService.ban on the backend.
export function banUser(id) {
  return api.put(`/admin/users/${id}/ban`).then((res) => res.data)
}

// Same permanent deletion, but leaves the email free to sign up again —
// see AdminUserService.justDelete on the backend.
export function justDeleteUser(id) {
  return api.delete(`/admin/users/${id}`).then((res) => res.data)
}

// Staff management (admin/moderator accounts, ADMIN-only)
export function getAdminStaff(role) {
  return api.get('/admin/staff', { params: { role } }).then((res) => res.data)
}

export function createStaffAccount(payload) {
  return api.post('/admin/staff', payload).then((res) => res.data)
}

// Permanently removes an admin/moderator account (the main admin is
// protected on the backend regardless of what's sent here).
export function removeStaffAccount(id) {
  return api.delete(`/admin/staff/${id}`).then((res) => res.data)
}

// Photographers Profile History (main-admin-only)
export function getPhotographerHistory() {
  return api.get('/admin/photographer-history').then((res) => res.data)
}

export function removePhotographerHistoryEntry(id, password) {
  return api.delete(`/admin/photographer-history/${id}`, { data: { password } }).then((res) => res.data)
}

export function removeAllPhotographerHistory(password) {
  return api.delete('/admin/photographer-history', { data: { password } }).then((res) => res.data)
}

// Users Profile History (main-admin-only)
export function getUserHistory() {
  return api.get('/admin/user-history').then((res) => res.data)
}

export function removeUserHistoryEntry(id, password) {
  return api.delete(`/admin/user-history/${id}`, { data: { password } }).then((res) => res.data)
}

export function removeAllUserHistory(password) {
  return api.delete('/admin/user-history', { data: { password } }).then((res) => res.data)
}

// Blue badge (photographer, own status/purchase)
export function getBlueBadgeStatus() {
  return api.get('/blue-badge/status').then((res) => res.data)
}

export function purchaseBlueBadge() {
  return api.post('/blue-badge/purchase').then((res) => res.data)
}

// Blue badge management (admin, main-admin-only)
export function getBlueBadgeSettings() {
  return api.get('/admin/blue-badge/settings').then((res) => res.data)
}

export function updateBlueBadgeSettings(price) {
  return api.put('/admin/blue-badge/settings', { price }).then((res) => res.data)
}

export function getBlueBadgeHolders() {
  return api.get('/admin/blue-badge/holders').then((res) => res.data)
}

export function revokeBlueBadge(userId) {
  return api.put(`/admin/blue-badge/holders/${userId}/revoke`).then((res) => res.data)
}

// Admin overview (analytics dashboard, any ADMIN/MODERATOR)
export function getAdminOverview() {
  return api.get('/admin/overview').then((res) => res.data)
}

// Photoshoot poses (public gallery on the Suggestions page)
export function getPoses() {
  return api.get('/poses').then((res) => res.data)
}

// Manage pose (admin, any ADMIN/MODERATOR)
export function getAdminPoses() {
  return api.get('/admin/poses').then((res) => res.data)
}

export function uploadPoseImage(file, subsection) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('subsection', subsection)
  return api.post('/admin/poses', formData).then((res) => res.data)
}

export function deletePoseImage(id) {
  return api.delete(`/admin/poses/${id}`).then((res) => res.data)
}

// Chatbot (public, site-wide)
export function askChatbot(message, history) {
  return api.post('/chatbot/ask', { message, history }).then((res) => res.data)
}

export default api
