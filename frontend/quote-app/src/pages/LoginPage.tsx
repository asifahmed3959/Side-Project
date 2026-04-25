import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import type { AppDispatch, RootState } from '../store';
import { login, clearError } from '../store/authSlice';

const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, token } = useSelector((s: RootState) => s.auth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (token) navigate('/quotes');
    return () => { dispatch(clearError()); };
  }, [token, navigate, dispatch]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(login({ username, password }));
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <h2 style={{ marginBottom: 24, color: '#cdd6f4', fontWeight: 700 }}>Welcome back</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={input} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={input} required />
          {error && <p style={{ color: '#f38ba8', margin: 0, fontSize: 14 }}>{error}</p>}
          <button type="submit" disabled={loading} style={submitBtn}>
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>
        <p style={{ marginTop: 18, textAlign: 'center', color: '#a6adc8', fontSize: 14 }}>
          No account?{' '}
          <Link to="/register" style={{ color: '#89b4fa', textDecoration: 'none', fontWeight: 600 }}>Register</Link>
        </p>
      </div>
    </div>
  );
};

const wrap: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#1e1e2e' };
const card: React.CSSProperties = { background: '#313244', padding: '40px 36px', borderRadius: 16, width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' };
const input: React.CSSProperties = { padding: '10px 14px', borderRadius: 8, border: '1px solid #45475a', background: '#1e1e2e', color: '#cdd6f4', fontSize: 15, outline: 'none' };
const submitBtn: React.CSSProperties = { padding: '12px', borderRadius: 8, border: 'none', background: '#89b4fa', color: '#1e1e2e', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 4 };

export default LoginPage;
