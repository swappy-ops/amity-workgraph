import { useState, useEffect, useCallback } from 'react';
import JobCard from '../components/JobCard';
import FilterBar from '../components/FilterBar';
import ErrorToast from '../components/ErrorToast';

const DEFAULT_FILTERS = {
  source: { faculty: true, student: true },
  type:   { internship: true, freelance: true, 'part-time': true, project: true },
  comp:   { paid: true, stipend: true, unpaid: true },
};

const SORT_OPTIONS = [
  { value: 'default', label: 'Best Match' },
  { value: 'newest',  label: 'Newest' },
  { value: 'amount',  label: 'Amount ↓' },
];

export default function HomeFeed() {
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState('default');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/jobs');
        const data = await res.json();
        setAllJobs(data.jobs || []);
      } catch {
        setToast('Failed to load opportunities.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleFilterChange = (group, key, value) => {
    setFilters((f) => ({ ...f, [group]: { ...f[group], [key]: value } }));
  };

  const handleClear = () => setFilters(DEFAULT_FILTERS);

  const visibleJobs = useCallback(() => {
    let list = allJobs.filter((j) => {
      const sourceOk = (j.poster_role === 'faculty' && filters.source.faculty)
                    || (j.poster_role === 'student' && filters.source.student);
      const typeOk   = filters.type[j.type];
      const compOk   = filters.comp[j.compensation_type];
      return sourceOk && typeOk && compOk;
    });

    if (sort === 'newest') {
      list = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sort === 'amount') {
      list = [...list].sort((a, b) => (b.compensation_amount || 0) - (a.compensation_amount || 0));
    } else {
      list = [...list].sort((a, b) => {
        if (a.poster_role === 'faculty' && b.poster_role !== 'faculty') return -1;
        if (b.poster_role === 'faculty' && a.poster_role !== 'faculty') return 1;
        if (a.compensation_type === 'unpaid' && b.compensation_type !== 'unpaid') return 1;
        if (b.compensation_type === 'unpaid' && a.compensation_type !== 'unpaid') return -1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }
    return list;
  }, [allJobs, filters, sort]);

  const jobs = visibleJobs();

  return (
    <div className="container page-animate">
      <div className="feed-layout">
        <FilterBar filters={filters} onChange={handleFilterChange} onClear={handleClear} />

        <div>
          <div className="jobs-header">
            <h2>
              Latest Opportunities{' '}
              <span className="jobs-header-count">({jobs.length})</span>
            </h2>
            <div className="sort-select">
              Sort by:
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <p>No opportunities match the selected filters.</p>
            </div>
          ) : (
            <div className="job-list">
              {jobs.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </div>
      </div>

      <ErrorToast message={toast} type="error" onDismiss={() => setToast('')} />
    </div>
  );
}
