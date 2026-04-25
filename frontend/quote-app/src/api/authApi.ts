import axiosInstance from './axiosInstance';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types';

export const loginApi = (payload: LoginPayload) =>
  axiosInstance.post<AuthResponse>('/auth/login/', payload);

export const registerApi = (payload: RegisterPayload) =>
  axiosInstance.post<AuthResponse>('/auth/register/', payload);

export const logoutApi = () =>
  axiosInstance.post('/auth/logout/');

export const getProfileApi = () =>
  axiosInstance.get<User>('/auth/profile/');
