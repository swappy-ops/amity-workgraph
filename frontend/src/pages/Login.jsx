import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorToast from '../components/ErrorToast';

const UX_2023 = /^A021142924\d{3}$/;
const GENERIC  = /^A0\d{10,11}$/;

function isValidEnroll(e) {
  return UX_2023.test(e) || GENERIC.test(e);
}

// Faculty enrollment: deterministic from name — same name = same ID
function facultyEnroll(name) {
  return 'FAC_' + name.trim().toLowerCase().replace(/\s+/g, '_');
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole]           = useState('student');
  const [name, setName]           = useState('');
  const [enrollNo, setEnrollNo]   = useState('');
  const [password, setPassword]   = useState('');
  const [enrollError, setEnrollError] = useState(false);
  const [showPw, setShowPw]       = useState(false);
  const [toast, setToast]         = useState({ msg: '', type: 'success' });
  const [loading, setLoading]     = useState(false);

  const handleEnrollInput = (val) => {
    setEnrollNo(val);
    setEnrollError(val.length > 0 && !isValidEnroll(val.trim().toUpperCase()));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast({ msg: '', type: 'success' });

    if (!name.trim()) {
      setToast({ msg: 'Please enter your full name.', type: 'error' }); return;
    }
    if (password.length < 6) {
      setToast({ msg: 'Password must be at least 6 characters.', type: 'error' }); return;
    }
    if (role === 'student' && !isValidEnroll(enrollNo.trim().toUpperCase())) {
      setToast({ msg: 'Invalid enrollment number format.', type: 'error' }); return;
    }

    const enrollToSend = role === 'faculty'
      ? facultyEnroll(name)
      : enrollNo.trim().toUpperCase();

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment_no: enrollToSend,
          name: name.trim(),
          password,
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed.');

      if (data.message) {
        setToast({ msg: data.message, type: 'success' });
      }
      // Small delay so user sees the success toast before redirect
      setTimeout(() => {
        login(data.user);
        navigate('/');
      }, data.message ? 800 : 0);
    } catch (err) {
      setToast({ msg: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">N</div>
          <h1>Nexus</h1>
          <p>Amity · Campus Freelance &amp; Opportunity Platform</p>
        </div>

        <hr className="login-divider" />

        {/* Role toggle */}
        <div className="role-toggle">
          <button
            id="role-student"
            className={`role-btn ${role === 'student' ? 'active' : ''}`}
            type="button"
            onClick={() => setRole('student')}
          >
            Student
          </button>
          <button
            id="role-faculty"
            className={`role-btn ${role === 'faculty' ? 'active' : ''}`}
            type="button"
            onClick={() => setRole('faculty')}
          >
            Faculty
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name — always required */}
          <div className="form-group">
            <label htmlFor="login-name">Full Name</label>
            <input
              id="login-name"
              type="text"
              placeholder="e.g. Rohan Kapoor"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Enrollment — students only */}
          {role === 'student' && (
            <div className="form-group" id="enroll-group">
              <label htmlFor="login-enroll">Enrollment Number</label>
              <input
                id="login-enroll"
                type="text"
                placeholder="A021142924XXX"
                autoComplete="off"
                value={enrollNo}
                onChange={(e) => handleEnrollInput(e.target.value)}
                style={{ textTransform: 'uppercase' }}
              />
              <div className="form-hint">UX batch: A021142924XXX · Other: A0 + 10–11 digits</div>
              {enrollError && (
                <div className="form-error" id="enroll-error">
                  That doesn't look like a valid Amity enrollment number.
                </div>
              )}
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'var(--muted)', cursor: 'pointer',
                  fontSize: 13, padding: 0,
                }}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            <div className="form-hint">
              First time? Set your password. Returning? Enter your password.
            </div>
          </div>

          <button
            id="login-submit"
            className="btn-primary gold"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Please wait…' : 'Enter Platform →'}
          </button>
        </form>

        <div className="login-footer">
          Restricted to Amity members<br />
          <span style={{ marginTop: 6, display: 'inline-block', opacity: 0.7 }}>
            Made by Swapnil Karki
          </span>
        </div>
      </div>

      <ErrorToast
        message={toast.msg}
        type={toast.type}
        onDismiss={() => setToast({ msg: '', type: 'success' })}
      />
    </div>
  );
}
