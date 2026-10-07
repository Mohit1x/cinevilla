import axios from "axios"

const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_ACCESS_TOKEN = process.env.API_KEY

if (!TMDB_ACCESS_TOKEN) {
  console.warn("TMDB API_KEY is not set in environment variables")
}

export const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  headers: {
    Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
})

tmdbClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("TMDB API Error:", error?.response?.status, error?.response?.data)
    return Promise.reject(error)
  }
)
