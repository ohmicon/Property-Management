import axios from 'axios';
// import { cookies } from 'next/headers'

export const axiosPublic = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_HOST,
});

export const axiosPrivate = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_HOST,
  withCredentials: true
})

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const refreshAccessToken = async () => {
  await axiosPrivate.get('/api/auth/refresh-token').catch((err) => err);
}

axiosPrivate.interceptors.response.use((response) => {
  return response
}, async function (error) {
  const originalRequest = error.config;

  if (error.response.status === 401 && error.response.data.message === 'Token is expired' && !originalRequest._retry) {
    originalRequest._retry = true;
    await refreshAccessToken();   
    // axios.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;
    return axiosPrivate(originalRequest);
  }
  // if (error.response.status === 401) {
  //   window.location.href = `/login?next=${window.location.pathname}${window.location.search}`
  // }
  return Promise.reject(error);
});