import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shuttershot_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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

export default api
