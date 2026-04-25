import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import type { AppDispatch, RootState } from '../store';
import { register, clearError } from '../store/authSlice';

const RegisterPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, token } = useSelector((s: RootState) => s.auth);

  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '' });
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (token) navigate('/quotes');
    return () => { dispatch(clearError()); };
  }, [token, navigate, dispatch]);

  const change = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (form.password !== form.password2) {
      setLocalError('Passwords do not match');
      return;
    }
    dispatch(register(form));
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <h2 style={{ marginBottom: 24, color: '#cdd6f4', fontWeight: 700 }}>Create account</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input name="username" placeholder="Username" value={form.username} onChange={change} style={input} required />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={change} style={input} required />
          <input name="password" type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={change} style={input} required minLength={8} />
          <input name="password2" type="password" placeholder="Confirm password" value={form.password2} onChange={change} style={input} required />
          {(error || localError) && <p style={{ color: '#f38ba8', margin: 0, fontSize: 14 }}>{localError || error}</p>}
          <button type="submit" disabled={loading} style={submitBtn}>
            {loading ? 'Creating…' : 'Register'}
          </button>
        </form>
        <p style={{ marginTop: 18, textAlign: 'center', color: '#a6adc8', fontSize: 14 }}>
          Have an account?{' '}
          <Link to="/login" style={{ color: '#89b4fa', textDecoration: 'none', fontWeight: 600 }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

const wrap: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#1e1e2e' };
const card: React.CSSProperties = { background: '#313244', padding: '40px 36px', borderRadius: 16, width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' };
const input: React.CSSProperties = { padding: '10px 14px', borderRadius: 8, border: '1px solid #45475a', background: '#1e1e2e', color: '#cdd6f4', fontSize: 15, outline: 'none' };
const submitBtn: React.CSSProperties = { padding: '12px', borderRadius: 8, border: 'none', background: '#89b4fa', color: '#1e1e2e', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 4 };

export default RegisterPage;
