import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchQuotesApi, createQuoteApi, updateQuoteApi, deleteQuoteApi } from '../api/quotesApi';
import type { Quote, CreateQuotePayload } from '../types';

interface FetchParams {
  search?: string;
  mine?: boolean;
  ordering?: string;
  page?: number;
}

interface QuotesState {
  items: Quote[];
  count: number;
  loading: boolean;
  error: string | null;
}

const initialState: QuotesState = {
  items: [],
  count: 0,
  loading: false,
  error: null,
};

export const fetchQuotes = createAsyncThunk(
  'quotes/fetch',
  async (params?: FetchParams) => {
    const res = await fetchQuotesApi(params);
    return res.data;
  }
);

export const createQuote = createAsyncThunk(
  'quotes/create',
  async (payload: CreateQuotePayload, { rejectWithValue }) => {
    try {
      const res = await createQuoteApi(payload);
      return res.data;
    } catch {
      return rejectWithValue('Failed to create quote');
    }
  }
);

export const updateQuote = createAsyncThunk(
  'quotes/update',
  async ({ id, payload }: { id: number; payload: Partial<CreateQuotePayload> }, { rejectWithValue }) => {
    try {
      const res = await updateQuoteApi(id, payload);
      return res.data;
    } catch {
      return rejectWithValue('Failed to update quote');
    }
  }
);

export const deleteQuote = createAsyncThunk(
  'quotes/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await deleteQuoteApi(id);
      return id;
    } catch {
      return rejectWithValue('Failed to delete quote');
    }
  }
);

const quotesSlice = createSlice({
  name: 'quotes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuotes.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchQuotes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.results;
        state.count = action.payload.count;
      })
      .addCase(fetchQuotes.rejected, (state) => { state.loading = false; state.error = 'Failed to load quotes'; })
      .addCase(createQuote.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.count += 1;
      })
      .addCase(updateQuote.fulfilled, (state, action) => {
        const idx = state.items.findIndex((q) => q.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteQuote.fulfilled, (state, action) => {
        state.items = state.items.filter((q) => q.id !== action.payload);
        state.count -= 1;
      });
  },
});

export default quotesSlice.reducer;
