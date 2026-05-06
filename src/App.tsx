import { useEffect, useState } from 'react';

type Job = {
  id: number;
  company: string;
  position: string;
  status: string;
  salary: string;
  date: string;
  notes: string;
};

const defaultJobs: Job[] = [];

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Job>({
    id: 0,
    company: '',
    position: '',
    status: 'Applied',
    salary: '',
    date: '',
    notes: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('cv_jobs');
    if (saved) {
      setJobs(JSON.parse(saved));
    } else {
      setJobs(defaultJobs);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cv_jobs', JSON.stringify(jobs));
  }, [jobs]);

  const addJob = () => {
    if (!form.company || !form.position) return;

    setJobs([
      {
        ...form,
        id: Date.now()
      },
      ...jobs
    ]);

    setForm({
      id: 0,
      company: '',
      position: '',
      status: 'Applied',
      salary: '',
      date: '',
      notes: ''
    });
  };

  const filtered = jobs.filter(
    j =>
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      j.position.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: jobs.length,
    interviews: jobs.filter(j => j.status === 'Interview').length,
    offers: jobs.filter(j => j.status === 'Offer').length,
    rejected: jobs.filter(j => j.status === 'Rejected').length
  };

  return (
    <div className="container">
      <h1>CV Application Tracker</h1>

      <div className="stats">
        <div className="card">Total: {stats.total}</div>
        <div className="card">Interview: {stats.interviews}</div>
        <div className="card">Offer: {stats.offers}</div>
        <div className="card">Rejected: {stats.rejected}</div>
      </div>

      <div className="form">
        <input
          placeholder="Company"
          value={form.company}
          onChange={e => setForm({ ...form, company: e.target.value })}
        />

        <input
          placeholder="Position"
          value={form.position}
          onChange={e => setForm({ ...form, position: e.target.value })}
        />

        <select
          value={form.status}
          onChange={e => setForm({ ...form, status: e.target.value })}
        >
          <option>Applied</option>
          <option>Interview</option>
          <option>Offer</option>
          <option>Rejected</option>
        </select>

        <input
          placeholder="Salary"
          value={form.salary}
          onChange={e => setForm({ ...form, salary: e.target.value })}
        />

        <input
          type="date"
          value={form.date}
          onChange={e => setForm({ ...form, date: e.target.value })}
        />

        <textarea
          placeholder="Notes"
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
        />

        <button onClick={addJob}>Add Application</button>
      </div>

      <input
        className="search"
        placeholder="Search..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="job-list">
        {filtered.map(job => (
          <div className="job-card" key={job.id}>
            <h3>{job.company}</h3>
            <p>{job.position}</p>
            <span className="status">{job.status}</span>
            <p>{job.salary}</p>
            <p>{job.date}</p>
            <small>{job.notes}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
