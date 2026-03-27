import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorToast from '../components/ErrorToast';

export default function PostJob() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '', description: '', department: '',
    type: '', compensation_type: '', compensation_amount: '', timeline: '',
  });
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.type || !form.compensation_type) {
      setToast({ msg: 'Please fill all required fields.', type: 'error' }); return;
    }
    if (form.compensation_type === 'unpaid' && !form.timeline.trim()) {
      setToast({ msg: 'Unpaid roles require a description of what collaborators receive.', type: 'error' }); return;
    }
    if ((form.compensation_type === 'paid' || form.compensation_type === 'stipend') && !form.compensation_amount) {
      setToast({ msg: `A compensation amount is required for ${form.compensation_type} roles.`, type: 'error' }); return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-enrollment-no': user.enrollment_no,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          department: form.department.trim() || undefined,
          type: form.type,
          compensation_type: form.compensation_type,
          compensation_amount: form.compensation_amount ? parseFloat(form.compensation_amount) : undefined,
          timeline: form.compensation_type === 'unpaid' ? form.timeline.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post.');
      setToast({ msg: 'Opportunity posted!', type: 'success' });
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      setToast({ msg: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const showAmount = form.compensation_type === 'paid' || form.compensation_type === 'stipend';
  const showTimeline = form.compensation_type === 'unpaid';

  return (
    <div className="container-narrow page-animate">
      <div className="page-header">
        <h1>Post an Opportunity</h1>
        <p>All departments welcome — design, engineering, AI/ML, marketing, and more.</p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="pj-title">Title *</label>
            <input
              id="pj-title"
              type="text"
              placeholder="e.g. Research Assistant – NLP Project"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="pj-desc">Description *</label>
            <textarea
              id="pj-desc"
              rows={5}
              placeholder="What does this involve? What skills are needed? What will the collaborator gain?"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pj-dept">Department</label>
              <input
                id="pj-dept"
                type="text"
                placeholder="e.g. AI/ML, Design, Marketing…"
                value={form.department}
                onChange={(e) => set('department', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="pj-type">Type *</label>
              <select id="pj-type" value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="">Select…</option>
                <option value="internship">Internship</option>
                <option value="freelance">Freelance</option>
                <option value="part-time">Part-time</option>
                <option value="project">Project</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="pj-comp">Compensation *</label>
            <select
              id="pj-comp"
              value={form.compensation_type}
              onChange={(e) => set('compensation_type', e.target.value)}
            >
              <option value="">Select…</option>
              <option value="paid">Paid (Cash)</option>
              <option value="stipend">Stipend</option>
              <option value="unpaid">Unpaid / Portfolio / Certificate</option>
            </select>
          </div>

          {showAmount && (
            <div className="form-group" id="pj-amount-group">
              <label htmlFor="pj-amount">Amount (₹)</label>
              <input
                id="pj-amount"
                type="number"
                min="0"
                placeholder="e.g. 5000"
                value={form.compensation_amount}
                onChange={(e) => set('compensation_amount', e.target.value)}
              />
            </div>
          )}

          {showTimeline && (
            <div className="form-group" id="pj-timeline-group">
              <label htmlFor="pj-timeline">What will the collaborator receive? *</label>
              <input
                id="pj-timeline"
                type="text"
                placeholder="e.g. 6 weeks, certificate + recommendation letter"
                value={form.timeline}
                onChange={(e) => set('timeline', e.target.value)}
              />
              <div className="form-hint">Required for unpaid opportunities — be specific and honest.</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn-view" onClick={() => navigate('/')}>Cancel</button>
            <button type="submit" className="btn-submit" id="post-job-submit" disabled={loading}>
              {loading ? 'Posting…' : 'Post Opportunity'}
            </button>
          </div>
        </form>
      </div>

      <ErrorToast message={toast.msg} type={toast.type} onDismiss={() => setToast({ msg: '', type: 'success' })} />
    </div>
  );
}
