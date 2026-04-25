import React, { useEffect, useState } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { configureStore, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { useNavigate } from "react-router-dom";
import axios from "axios";



// ================= TYPES =================
interface Quote {
  id: number;
  quote: string;
  created_by: string;
}

interface QuotesResponse {
  results: Quote[];
}

interface QuotesState {
  items: Quote[];
  loading: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// ================= AUTH =================
export const loginUser = createAsyncThunk(
  "auth/login",
  async (payload: { username: string; password: string }) => {
    await axios.post("http://localhost:8000/api/v1/auth/login/", payload);
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: { isAuthenticated: false, loading: false, error: null } as AuthState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state) => {
        state.loading = false;
        state.error = "Invalid credentials";
      });
  },
});

// ================= QUOTES =================
export const fetchQuotes = createAsyncThunk<Quote[]>(
  "quotes/fetch",
  async () => {
    const res = await axios.get<QuotesResponse>(
      "http://localhost:8000/api/v1/quotes/"
    );
    return res.data.results;
  }
);

const quotesSlice = createSlice({
  name: "quotes",
  initialState: { items: [], loading: false } as QuotesState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuotes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchQuotes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      });
  },
});

// ================= STORE =================
const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    quotes: quotesSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;



// ================= COMPONENTS =================
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, isAuthenticated } = useSelector((s: RootState) => s.auth);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/quotes");
    }
  }, [isAuthenticated, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginUser({ username, password }));
  };

  return (
    <form onSubmit={submit} style={{ maxWidth: 400, margin: "100px auto" }}>
      <h2>Login</h2>
      <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button disabled={loading}>Login</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};

const QuotesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading } = useSelector((s: RootState) => s.quotes);
  const dispatchLogout = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchQuotes());
  }, [dispatch]);

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <button onClick={() => dispatchLogout(authSlice.actions.logout())}>Logout</button>
      <h1>Quotes</h1>
      {loading ? "Loading…" : items.map((q) => (
        <blockquote key={q.id}>{q.quote} — {q.created_by}</blockquote>
      ))}
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated);
  return isAuth ? <>{children}</> : <Navigate to="/login" />;
};

// ================= APP =================
const App: React.FC = () => (
  <Provider store={store}>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/quotes" element={
          <ProtectedRoute>
            <QuotesPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  </Provider>
);

export default App;
