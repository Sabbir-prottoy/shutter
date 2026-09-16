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
export function searchPhotographers({ location, category } = {}) {
  return api
    .get('/photographers', { params: { location: location || undefined, category: category || undefined } })
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

export function resendOtp(contact) {
  return api.post('/otp/send', { contact }).then((res) => res.data)
}

// Bookings (photographer dashboard, own bookings)
export function getMyBookings(photographerId) {
  return api.get('/bookings', { params: { photographerId } }).then((res) => res.data)
}

// Bookings (customer account, bookings I made while logged in)
export function getMyBookingsAsCustomer() {
  return api.get('/bookings/mine').then((res) => res.data)
}

export function updateBookingStatus(id, status) {
  return api.put(`/bookings/${id}/status`, { status }).then((res) => res.data)
}

// Admin (requires ROLE_ADMIN)
export function getPendingReviews() {
  return api.get('/admin/reviews/pending').then((res) => res.data)
}

export function approveReview(id) {
  return api.put(`/admin/reviews/${id}/approve`).then((res) => res.data)
}

export function rejectReview(id) {
  return api.put(`/admin/reviews/${id}/reject`).then((res) => res.data)
}

export function getPendingPhotos() {
  return api.get('/admin/photos/pending').then((res) => res.data)
}

export function approvePhoto(id) {
  return api.put(`/admin/photos/${id}/approve`).then((res) => res.data)
}

export function rejectPhoto(id) {
  return api.put(`/admin/photos/${id}/reject`).then((res) => res.data)
}

export function getAdminUsers(role) {
  return api.get('/admin/users', { params: { role } }).then((res) => res.data)
}

export function verifyUser(id) {
  return api.put(`/admin/users/${id}/verify`).then((res) => res.data)
}

// Permanently removes the account — see AdminUserService.remove on the backend.
export function banUser(id) {
  return api.put(`/admin/users/${id}/ban`).then((res) => res.data)
}

// Staff management (admin/moderator accounts, ADMIN-only)
export function getAdminStaff(role) {
  return api.get('/admin/staff', { params: { role } }).then((res) => res.data)
}

export function createStaffAccount(payload) {
  return api.post('/admin/staff', payload).then((res) => res.data)
}

// Chatbot (public, site-wide)
export function askChatbot(message, history) {
  return api.post('/chatbot/ask', { message, history }).then((res) => res.data)
}

export default api
