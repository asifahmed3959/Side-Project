import axiosInstance from './axiosInstance';
import type { Quote, PaginatedResponse, CreateQuotePayload } from '../types';

interface FetchParams {
  search?: string;
  mine?: boolean;
  ordering?: string;
  page?: number;
}

export const fetchQuotesApi = (params?: FetchParams) =>
  axiosInstance.get<PaginatedResponse<Quote>>('/quotes/', { params });

export const createQuoteApi = (payload: CreateQuotePayload) =>
  axiosInstance.post<Quote>('/quotes/', payload);

export const updateQuoteApi = (id: number, payload: Partial<CreateQuotePayload>) =>
  axiosInstance.patch<Quote>(`/quotes/${id}/`, payload);

export const deleteQuoteApi = (id: number) =>
  axiosInstance.delete(`/quotes/${id}/`);
