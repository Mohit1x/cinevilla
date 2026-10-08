import axios from "axios"

const TMDB_BASE_URL = "https://api.themoviedb.org/3"

export const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  headers: { "Content-Type": "application/json" },
})

tmdbClient.interceptors.request.use((config) => {
  const token = process.env.NEXT_PUBLIC_API_KEY
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

tmdbClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error)
  }
)
