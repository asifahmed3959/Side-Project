import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../store';
import { logout } from '../store/authSlice';

const Navbar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: '#181825', color: '#cdd6f4', borderBottom: '1px solid #313244' }}>
      <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: 0.5 }}>QuoteApp</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {user && <span style={{ fontSize: 14, opacity: 0.7 }}>@{user.username}</span>}
        <button onClick={handleLogout} style={{ padding: '6px 16px', cursor: 'pointer', borderRadius: 6, border: 'none', background: '#f38ba8', color: '#1e1e2e', fontWeight: 600, fontSize: 14 }}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
