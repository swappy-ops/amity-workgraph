import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ApplicationForm({ jobId, onSuccess }) {
  const { user } = useAuth();
  const [proposal, setProposal] = useState('');
  const [bid, setBid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proposal.trim()) { setError('Please write a proposal.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-enrollment-no': user.enrollment_no,
        },
        body: JSON.stringify({
          proposal_text: proposal,
          bid_amount: bid ? parseFloat(bid) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply.');
      setDone(true);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <p style={{ color: 'var(--muted)', fontSize: 14, padding: '8px 0' }}>
        ✓ Application submitted successfully!
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="apply-proposal">Your Proposal *</label>
        <textarea
          id="apply-proposal"
          rows={5}
          placeholder="Introduce yourself, highlight relevant skills, and explain why you're a great fit…"
          value={proposal}
          onChange={(e) => setProposal(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="apply-bid">Proposed Bid (₹) — optional</label>
        <input
          id="apply-bid"
          type="number"
          min="0"
          placeholder="Leave blank to match posted amount"
          value={bid}
          onChange={(e) => setBid(e.target.value)}
        />
        <div className="form-hint">Only relevant for freelance / project types.</div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

      <button className="btn-submit" type="submit" id="submit-application" disabled={loading}>
        {loading ? 'Submitting…' : 'Submit Application'}
      </button>
    </form>
  );
}
