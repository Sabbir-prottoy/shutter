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

// Reviews (public)
export function getPhotographerReviews(id) {
  return api.get('/reviews', { params: { photographerId: id } }).then((res) => res.data)
}

// Portfolio (photographer dashboard, own images)
export function getMyPortfolio() {
  return api.get('/portfolio').then((res) => res.data)
}

export function uploadPortfolioImage(file, category) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', category)
  // No explicit Content-Type here — axios/the browser sets the multipart
  // boundary automatically for FormData; overriding it manually drops the
  // boundary parameter and breaks the upload.
  return api.post('/portfolio', formData).then((res) => res.data)
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

export default api
