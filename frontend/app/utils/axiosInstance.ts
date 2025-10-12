import axios from 'axios'
import { BACKEND_URL } from './config'

export const api = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true
})


api.interceptors.response.use(undefined, async (error: any) => {
    throw error
})