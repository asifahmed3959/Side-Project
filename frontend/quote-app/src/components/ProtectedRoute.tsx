import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const token = useSelector((s: RootState) => s.auth.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
