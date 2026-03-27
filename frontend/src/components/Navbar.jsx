import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <>
      <div className="inst-strip">
        ◆ Nexus · Amity — Internal Campus Network · Authorised Personnel Only ◆
      </div>
      <nav className="navbar">
        <div className="nav-inner">
          <div className="nav-brand" onClick={() => navigate('/')}>
            <div className="nav-logo">N</div>
            <div>
              <div className="nav-title">Nexus</div>
              <div className="nav-sub">Amity</div>
            </div>
          </div>

          <div className="nav-links">
            <button className={isActive('/')} onClick={() => navigate('/')} id="nav-feed">
              Opportunities
            </button>
            <button className={isActive('/dashboard')} onClick={() => navigate('/dashboard')} id="nav-dash">
              My Dashboard
            </button>
            <button className="nav-link post-btn" onClick={() => navigate('/post')} id="nav-post">
              + Post Work
            </button>
          </div>

          <div className="nav-user">
            <div className="nav-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div className="nav-user-info">
              <div className="nav-user-name">{user.name}</div>
              <button className="nav-logout" onClick={handleLogout} title="Click to sign out" id="nav-logout">
                {user.enrollment_no} ↩
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
