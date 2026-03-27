// FilterBar — sidebar with checkboxes matching the HTML design
// Props:
//   filters: { source: {faculty, student}, type: {internship, freelance, partTime, project}, comp: {paid, stipend, unpaid} }
//   onChange: (group, key, value) => void
//   onClear: () => void

export default function FilterBar({ filters, onChange, onClear }) {
  const check = (group, key) => (
    <label className="checkbox-row" key={key}>
      <input
        type="checkbox"
        id={`f-${key}`}
        checked={filters[group][key]}
        onChange={(e) => onChange(group, key, e.target.checked)}
      />
      <span style={{ textTransform: 'capitalize' }}>{key.replace('-', '-')}</span>
    </label>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-title">Filters</div>

      <div className="filter-section">
        <span className="filter-section-label">Source</span>
        {check('source', 'faculty')}
        {check('source', 'student')}
      </div>

      <div className="filter-section">
        <span className="filter-section-label">Type</span>
        {check('type', 'internship')}
        {check('type', 'freelance')}
        {['part-time'].map(k => (
          <label className="checkbox-row" key={k}>
            <input
              type="checkbox"
              id="f-part-time"
              checked={filters.type['part-time']}
              onChange={(e) => onChange('type', 'part-time', e.target.checked)}
            />
            <span>Part-Time</span>
          </label>
        ))}
        {check('type', 'project')}
      </div>

      <div className="filter-section">
        <span className="filter-section-label">Compensation</span>
        {check('comp', 'paid')}
        {check('comp', 'stipend')}
        {check('comp', 'unpaid')}
      </div>

      <button className="btn-clear-filters" onClick={onClear} id="filter-clear">
        Clear Filters
      </button>
    </aside>
  );
}
