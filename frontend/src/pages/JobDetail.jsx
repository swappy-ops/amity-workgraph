import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ApplicationForm from '../components/ApplicationForm';
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

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [updatingId, setUpdatingId] = useState(null);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        headers: { 'x-enrollment-no': user.enrollment_no },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJob(data.job);
      setApplicants(data.applicants || []);
    } catch (err) {
      setToast({ msg: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJob(); }, [id]);

  const updateStatus = async (appId, status) => {
    setUpdatingId(appId);
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-enrollment-no': user.enrollment_no,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setApplicants((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: data.application.status } : a))
      );
      setToast({ msg: `Application ${status}.`, type: 'success' });
    } catch (err) {
      setToast({ msg: err.message, type: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!job) return null;

  const isPoster = user.id === job.created_by;
  const alreadyApplied = applicants.some((a) => a.applicant_id === user.id);

  const compBadge = () => {
    if (job.compensation_type === 'paid')
      return <span className="badge badge-paid">₹ Paid</span>;
    if (job.compensation_type === 'stipend')
      return <span className="badge badge-stipend">₹ Stipend</span>;
    return <span className="badge badge-unpaid">Unpaid</span>;
  };

  return (
    <div className="container-narrow page-animate">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back to Opportunities</button>

      {/* Detail Card */}
      <div className="detail-card">
        <div className="detail-meta">
          {job.poster_role === 'faculty'
            ? <span className="badge badge-faculty">Faculty</span>
            : <span className="badge badge-student">Student</span>}
          <span className="badge badge-type">{job.type}</span>
          {compBadge()}
          {job.department && <span className="badge badge-dept">{job.department}</span>}
        </div>

        <h1>{job.title}</h1>
        <div className="detail-desc">{job.description}</div>

        {/* Amount block for paid/stipend */}
        {job.compensation_type !== 'unpaid' && job.compensation_amount && (
          <div className="detail-amount-block">
            <div className="detail-amount-num">
              ₹{job.compensation_amount.toLocaleString('en-IN')}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--navy)' }}>
                {job.compensation_type === 'paid' ? 'Fixed Pay' : 'Stipend'}
              </div>
              <div className="detail-amount-label">Total compensation for this role</div>
            </div>
          </div>
        )}

        {/* Timeline for unpaid */}
        {job.compensation_type === 'unpaid' && job.timeline && (
          <div className="detail-timeline">
            <strong>What you'll receive:</strong>
            {job.timeline}
          </div>
        )}

        {/* Poster info */}
        <div className="detail-poster">
          <div className="poster-avatar">{job.poster_name.charAt(0)}</div>
          <div className="poster-info">
            <strong>{job.poster_name}</strong>
            {job.poster_role} · posted {timeAgo(job.created_at)}
          </div>
        </div>
      </div>

      {/* Apply / Applicants Section */}
      <div className="apply-section">
        {isPoster ? (
          <>
            <h2>Applicants ({applicants.length})</h2>
            {applicants.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>No applications yet.</p>
            ) : (
              applicants.map((a) => (
                <div className="applicant-row" key={a.id}>
                  <div className="poster-avatar">{a.applicant_name.charAt(0)}</div>
                  <div className="applicant-info">
                    <div className="applicant-name">{a.applicant_name}</div>
                    <div className="applicant-enroll">{a.enrollment_no}</div>
                    <div className="applicant-proposal">{a.proposal_text}</div>
                    {a.bid_amount && (
                      <div className="applicant-bid">
                        Bid: ₹{a.bid_amount.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                  <div className="applicant-actions">
                    {a.status === 'pending' ? (
                      <>
                        <button
                          className="btn-accept"
                          disabled={updatingId === a.id}
                          onClick={() => updateStatus(a.id, 'accepted')}
                          id={`accept-${a.id}`}
                        >
                          Accept
                        </button>
                        <button
                          className="btn-reject"
                          disabled={updatingId === a.id}
                          onClick={() => updateStatus(a.id, 'rejected')}
                          id={`reject-${a.id}`}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className={`badge badge-${a.status}`}
                        style={{ textTransform: 'capitalize' }}>
                        {a.status}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        ) : alreadyApplied ? (
          <p style={{ color: 'var(--muted)', fontSize: 14, padding: '8px 0' }}>
            ✓ You've already applied to this opportunity.
          </p>
        ) : (
          <>
            <h2>Apply for this Opportunity</h2>
            <ApplicationForm jobId={id} onSuccess={fetchJob} />
          </>
        )}
      </div>

      <ErrorToast message={toast.msg} type={toast.type} onDismiss={() => setToast({ msg: '', type: 'success' })} />
    </div>
  );
}
