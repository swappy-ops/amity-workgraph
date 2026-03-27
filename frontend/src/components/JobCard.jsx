import { useNavigate } from 'react-router-dom';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 7)  return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export default function JobCard({ job }) {
  const navigate = useNavigate();

  const compBadge = () => {
    if (job.compensation_type === 'paid')
      return <span className="badge badge-paid">₹ Paid</span>;
    if (job.compensation_type === 'stipend')
      return <span className="badge badge-stipend">₹ Stipend</span>;
    return <span className="badge badge-unpaid">Unpaid</span>;
  };

  const roleBadge = () =>
    job.poster_role === 'faculty'
      ? <span className="badge badge-faculty">Faculty</span>
      : <span className="badge badge-student">Student</span>;

  return (
    <div className="job-row" onClick={() => navigate(`/jobs/${job.id}`)} id={`job-row-${job.id}`}>
      <div className="job-row-main">
        <div className="job-row-top">
          {roleBadge()}
          <span className="job-row-time">{timeAgo(job.created_at)}</span>
          {job.department && <span className="badge badge-dept">{job.department}</span>}
        </div>

        <div className="job-row-title">{job.title}</div>

        <div className="job-row-sub">
          <span className="poster-mini-avatar">{job.poster_name.charAt(0)}</span>
          {job.poster_name}
          <span className="divider">|</span>
          <span className="badge badge-type">{job.type}</span>
          <span className="divider">|</span>
          {timeAgo(job.created_at)}
        </div>

        <div className="job-row-desc">{job.description}</div>
      </div>

      <div className="job-row-right">
        <div className="job-row-badges">
          {job.compensation_amount && (
            <span className="amount-badge">
              ₹ {job.compensation_amount.toLocaleString('en-IN')}
            </span>
          )}
          {compBadge()}
        </div>
        <button
          className="btn-apply"
          onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}
          id={`apply-btn-${job.id}`}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
