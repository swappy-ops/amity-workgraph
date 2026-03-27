import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorToast from '../components/ErrorToast';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 7)  return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

const compBadge = (type, amount) => {
  if (type === 'paid')
    return <span className="badge badge-paid">₹{amount?.toLocaleString('en-IN') || '—'} Paid</span>;
  if (type === 'stipend')
    return <span className="badge badge-stipend">₹{amount?.toLocaleString('en-IN') || '—'} Stipend</span>;
  return <span className="badge badge-unpaid">Unpaid</span>;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('posts');
  const [myPosts, setMyPosts] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [feedRes, appsRes] = await Promise.all([
          fetch('/api/jobs', { headers: { 'x-enrollment-no': user.enrollment_no } }),
          fetch('/api/applications/mine', { headers: { 'x-enrollment-no': user.enrollment_no } }),
        ]);
        const feedData = await feedRes.json();
        const appsData = await appsRes.json();
        setMyPosts((feedData.jobs || []).filter((j) => j.created_by === user.id));
        setMyApps(appsData.applications || []);
      } catch {
        setToast('Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <div className="container page-animate">
      <div className="page-header">
        <h1>Welcome back, {user.name.split(' ')[0]}</h1>
        <p>Enrollment: {user.enrollment_no} · {user.role}</p>
      </div>

      <div className="tabs">
        <button
          id="tab-posts"
          className={`tab-btn ${tab === 'posts' ? 'active' : ''}`}
          onClick={() => setTab('posts')}
        >
          My Posts
        </button>
        <button
          id="tab-apps"
          className={`tab-btn ${tab === 'applications' ? 'active' : ''}`}
          onClick={() => setTab('applications')}
        >
          My Applications
        </button>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : tab === 'posts' ? (
        myPosts.length === 0 ? (
          <div className="empty-state">
            <p>
              You haven't posted anything yet.<br />
              <button className="empty-state-link" onClick={() => navigate('/post')}>
                Post your first opportunity →
              </button>
            </p>
          </div>
        ) : (
          myPosts.map((job) => (
            <div
              key={job.id}
              className="dashboard-row"
              onClick={() => navigate(`/jobs/${job.id}`)}
              id={`dash-post-${job.id}`}
            >
              <div className="dashboard-row-info">
                <div className="dashboard-row-title">{job.title}</div>
                <div className="dashboard-row-sub">
                  {job.department || 'General'} · {job.type} · posted {timeAgo(job.created_at)}
                </div>
              </div>
              <div className="dashboard-row-right">
                {compBadge(job.compensation_type, job.compensation_amount)}
                <span className="applicant-count-pill">
                  {job.applicant_count} applicant{job.applicant_count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))
        )
      ) : (
        myApps.length === 0 ? (
          <div className="empty-state">
            <p>
              You haven't applied to anything yet.<br />
              <button className="empty-state-link" onClick={() => navigate('/')}>
                Browse opportunities →
              </button>
            </p>
          </div>
        ) : (
          myApps.map((app) => (
            <div
              key={app.id}
              className="dashboard-row"
              onClick={() => navigate(`/jobs/${app.job_id}`)}
              id={`dash-app-${app.id}`}
            >
              <div className="dashboard-row-info">
                <div className="dashboard-row-title">{app.job_title || 'Opportunity'}</div>
                <div className="dashboard-row-sub">Applied {timeAgo(app.created_at)}</div>
              </div>
              <div className="dashboard-row-right">
                <span className={`badge badge-${app.status}`} style={{ textTransform: 'capitalize' }}>
                  {app.status}
                </span>
              </div>
            </div>
          ))
        )
      )}

      <ErrorToast message={toast} type="error" onDismiss={() => setToast('')} />
    </div>
  );
}
