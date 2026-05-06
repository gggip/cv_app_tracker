import { useEffect, useMemo, useState } from 'react';

type Job = {
  id: number;
  company: string;
  position: string;
  status: string;
  salary: string;
  date: string;
  link: string;
  notes: string;
};

const statusList = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'] as const;

const emptyForm: Job = {
  id: 0,
  company: '',
  position: '',
  status: 'Saved',
  salary: '',
  date: '',
  link: '',
  notes: ''
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(date: string) {
  if (!date) return 'No date';
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.max(0, Math.floor(diff / 86400000));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function normalizeStatus(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('interview') || lower.includes('面試')) return 'Interview';
  if (lower.includes('offer')) return 'Offer';
  if (lower.includes('reject') || lower.includes('rejected') || lower.includes('唔請')) return 'Rejected';
  if (lower.includes('applied') || lower.includes('send') || lower.includes('申請') || lower.includes('已send')) return 'Applied';
  return 'Saved';
}

function parseQuickAdd(text: string): Job {
  const cleaned = text.trim();
  const parts = cleaned.split('|').map(p => p.trim()).filter(Boolean);
  const linkMatch = cleaned.match(/https?:\/\/\S+/);

  if (parts.length >= 2) {
    return {
      id: 0,
      company: parts[0] || '',
      position: parts[1] || '',
      date: parts[2] || todayString(),
      status: normalizeStatus(parts.join(' ')),
      salary: parts.find(p => /\$|k|K|萬|薪|salary/i.test(p)) || '',
      link: linkMatch?.[0] || parts.find(p => p.startsWith('http')) || '',
      notes: parts.slice(3).join(' | ')
    };
  }

  const salaryMatch = cleaned.match(/(?:HK\$?\s*)?\d{2,3}\s?[kK]|\d+\s?萬|\$\s?\d+/);
  const dateMatch = cleaned.match(/\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\/?\d{1,2}/);
  const status = normalizeStatus(cleaned);
  const words = cleaned.replace(linkMatch?.[0] || '').replace(salaryMatch?.[0] || '').replace(dateMatch?.[0] || '').replace(/send咗|send左|applied|申請咗|申請左|已申請|cv|CV|expected|status|人工|薪金/g, '').trim();
  const tokens = words.split(/,|，|\s{2,}/).map(t => t.trim()).filter(Boolean);
  const first = tokens[0] || words;

  return {
    id: 0,
    company: first.split(' ')[0] || 'Unknown company',
    position: first.split(' ').slice(1).join(' ') || 'Position to confirm',
    status,
    salary: salaryMatch?.[0] || '',
    date: dateMatch?.[0]?.includes('/') ? `2026-${dateMatch[0].replace('/', '-')}` : dateMatch?.[0] || todayString(),
    link: linkMatch?.[0] || '',
    notes: cleaned
  };
}

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState<Job>(emptyForm);
  const [quickText, setQuickText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cv_jobs');
    if (saved) {
      const parsed = JSON.parse(saved).map((job: Partial<Job>) => ({ ...emptyForm, ...job }));
      setJobs(parsed);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cv_jobs', JSON.stringify(jobs));
  }, [jobs]);

  const saveJob = () => {
    if (!form.company.trim() || !form.position.trim()) return;
    if (editingId) {
      setJobs(jobs.map(job => job.id === editingId ? { ...form, id: editingId, date: form.date || todayString() } : job));
      setEditingId(null);
    } else {
      setJobs([{ ...form, id: Date.now(), date: form.date || todayString() }, ...jobs]);
    }
    setForm(emptyForm);
  };

  const editJob = (job: Job) => {
    setForm(job);
    setEditingId(job.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const addQuickJob = () => {
    if (!quickText.trim()) return;
    const parsed = parseQuickAdd(quickText);
    setJobs([{ ...parsed, id: Date.now() }, ...jobs]);
    setQuickText('');
  };

  const deleteJob = (id: number) => {
    setJobs(jobs.filter(job => job.id !== id));
  };

  const filtered = useMemo(() => {
    return jobs.filter(job => {
      const keyword = `${job.company} ${job.position} ${job.notes} ${job.link}`.toLowerCase();
      const matchSearch = keyword.includes(search.toLowerCase());
      const matchFilter = filter === 'All' || job.status === filter;
      return matchSearch && matchFilter;
    });
  }, [jobs, search, filter]);

  const stats = {
    total: jobs.length,
    saved: jobs.filter(j => j.status === 'Saved').length,
    applied: jobs.filter(j => j.status === 'Applied').length,
    interviews: jobs.filter(j => j.status === 'Interview').length
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Fresh Job Board</p>
          <h1>CV Application Tracker</h1>
          <p className="subtitle">Save interesting roles, record every CV sent, and keep your job search tidy.</p>
        </div>
        <div className="hero-badge">GG</div>
      </section>

      <section className="stats">
        <div className="stat-card"><span>Total</span><strong>{stats.total}</strong></div>
        <div className="stat-card"><span>Saved</span><strong>{stats.saved}</strong></div>
        <div className="stat-card"><span>Applied</span><strong>{stats.applied}</strong></div>
        <div className="stat-card"><span>Interview</span><strong>{stats.interviews}</strong></div>
      </section>

      <section className="quick-panel panel">
        <div>
          <h2>Quick Add</h2>
          <p>Paste a job quickly. Example: “HKSTP | Assistant Design Manager | 2026-05-06 | Saved | HK$35K | https://...”</p>
        </div>
        <div className="quick-row">
          <input value={quickText} onChange={e => setQuickText(e.target.value)} placeholder="未send：HKU Multimedia Officer HK$34K https://..." />
          <button className="primary-btn" onClick={addQuickJob}>Quick Add</button>
        </div>
      </section>

      <section className="workspace">
        <aside className="panel form-panel">
          <h2>{editingId ? 'Edit application' : 'Add application'}</h2>
          <div className="field-grid">
            <label>Company<input placeholder="e.g. HKSTP" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></label>
            <label>Position<input placeholder="e.g. Assistant Design Manager" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} /></label>
            <label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{statusList.map(s => <option key={s}>{s}</option>)}</select></label>
            <label>Salary<input placeholder="e.g. HK$35K" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></label>
            <label>Date<input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label>
            <label>Job Link<input placeholder="https://..." value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} /></label>
            <label className="wide">Notes<textarea placeholder="CV version, cover letter angle, follow-up notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
          </div>
          <button className="primary-btn" onClick={saveJob}>{editingId ? 'Save Changes' : 'Add Application'}</button>
          {editingId && <button className="ghost-btn" onClick={cancelEdit}>Cancel Edit</button>}
        </aside>

        <section className="panel list-panel">
          <div className="toolbar">
            <input className="search" placeholder="Search company, role, notes or link..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="filter" value={filter} onChange={e => setFilter(e.target.value)}><option>All</option>{statusList.map(s => <option key={s}>{s}</option>)}</select>
          </div>

          <div className="job-list">
            {filtered.length === 0 && <div className="empty-state">No jobs yet. Save a role you like, even before sending CV.</div>}
            {filtered.map(job => (
              <article className="job-card" key={job.id}>
                <div className="job-top">
                  <div>
                    <h3>{job.company}</h3>
                    <p>{job.position}</p>
                  </div>
                  <span className={`status status-${job.status.toLowerCase()}`}>{job.status}</span>
                </div>
                <div className="meta-row">
                  <span>{job.salary || 'Salary not set'}</span>
                  <span>{daysAgo(job.date)}</span>
                </div>
                {job.link && <a className="job-link" href={job.link} target="_blank" rel="noreferrer">Open job link</a>}
                {job.notes && <p className="notes">{job.notes}</p>}
                <div className="card-actions">
                  <button className="ghost-btn" onClick={() => editJob(job)}>Edit</button>
                  <button className="danger-btn" onClick={() => deleteJob(job.id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
