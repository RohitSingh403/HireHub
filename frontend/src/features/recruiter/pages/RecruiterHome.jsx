import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../components/PageHeader.jsx";
import Alert from "../../../components/Alert.jsx";
import Badge from "../../../components/Badge.jsx";
import { fetchJobApplications } from "../../applications/services/applicationService.js";
import { fetchMyCompany } from "../services/companyService.js";
import { fetchMyJobs } from "../../jobs/services/jobService.js";
import apiError from "../../../utils/apiError.js";
import { formatLabel, statusTone } from "../../../utils/format.js";

async function applicationTotals(jobId) {
  let applicants = 0;
  let hired = 0;
  let cursor;
  do {
    const page = await fetchJobApplications(jobId, cursor);
    applicants += page.applications.length;
    hired += page.applications.filter((item) => item.status === "hired").length;
    cursor = page.nextCursor;
  } while (cursor);
  return { applicants, hired };
}

function RecruiterHome({ mode = "overview" }) {
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [totals, setTotals] = useState({ applicants: 0, hired: 0 });
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [companyResult, jobResult] = await Promise.allSettled([
          fetchMyCompany(),
          fetchMyJobs(),
        ]);
        if (cancelled) {
          return;
        }
        if (companyResult.status === "fulfilled") {
          setCompany(companyResult.value);
        } else if (companyResult.reason?.response?.status !== 404) {
          setError(apiError(companyResult.reason, "Could not load your company."));
        }
        if (jobResult.status !== "fulfilled") {
          setError(apiError(jobResult.reason, "Could not load your jobs."));
          return;
        }
        const nextJobs = jobResult.value;
        setJobs(nextJobs);
        const perJob = await Promise.all(
          nextJobs.map(async (job) => {
            const total = await applicationTotals(job._id);
            return [job._id, total];
          }),
        );
        if (cancelled) {
          return;
        }
        const nextCounts = {};
        let applicants = 0;
        let hired = 0;
        for (const [jobId, total] of perJob) {
          nextCounts[jobId] = total.applicants;
          applicants += total.applicants;
          hired += total.hired;
        }
        setCounts(nextCounts);
        setTotals({ applicants, hired });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const openJobs = jobs.filter((job) => job.status === "open").length;
  const statCards = [
    { label: "Roles", value: jobs.length },
    { label: "Open", value: openJobs },
    { label: "Applicants", value: totals.applicants },
    { label: "Hired", value: totals.hired },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Recruiters"
        title={mode === "jobs" ? "Jobs" : company?.name || "Overview"}
        text={
          mode === "jobs"
            ? "Every role you posted, with the people who applied."
            : "Counts come from your jobs and their applications. Drafts and closed roles stay off the public list."
        }
        action={
          <Link
            to={company ? "/recruiter/jobs/new" : "/recruiter/company"}
            className="rounded-full bg-pine px-4 py-2.5 text-sm font-semibold text-white"
          >
            {company ? "Post a job" : "Create company"}
          </Link>
        }
      />
      <Alert>{error}</Alert>
      {loading ? <p className="text-muted">Loading your desk…</p> : null}

      {!loading && mode === "overview" ? (
        <ul className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <li key={card.label} className="rounded-3xl border border-line bg-card px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {card.label}
              </p>
              <p className="mt-2 font-display text-4xl">{card.value}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && !company ? (
        <div className="rounded-3xl border border-dashed border-line bg-card px-6 py-12">
          <p className="font-display text-2xl">No company yet</p>
          <p className="mt-2 max-w-xl text-sm text-muted">
            A job has to point at a company you own. Create the company first, then post a role.
          </p>
          <Link to="/recruiter/company" className="mt-4 inline-block text-sm font-semibold text-pine">
            Create company
          </Link>
        </div>
      ) : null}

      {!loading && company && jobs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-card px-6 py-12 text-center">
          <p className="font-display text-2xl">No jobs posted</p>
          <Link to="/recruiter/jobs/new" className="mt-3 inline-block text-sm font-semibold text-pine">
            Post the first role
          </Link>
        </div>
      ) : null}

      {!loading && jobs.length > 0 ? (
        <div className="overflow-x-auto rounded-3xl border border-line bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Title</th>
                <th className="px-5 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 font-semibold">Work mode</th>
                <th className="px-5 py-3 font-semibold">Applicants</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold"> </th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job._id} className="border-b border-line last:border-0">
                  <td className="px-5 py-4 font-medium">{job.title}</td>
                  <td className="px-5 py-4 text-muted">{job.location}</td>
                  <td className="px-5 py-4">{formatLabel(job.workMode)}</td>
                  <td className="px-5 py-4">{counts[job._id] ?? "…"}</td>
                  <td className="px-5 py-4">
                    <Badge tone={statusTone(job.status)}>{formatLabel(job.status)}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/recruiter/jobs/${job._id}/applicants`}
                        className="rounded-full bg-ink px-3 py-1.5 text-sm font-medium text-paper"
                      >
                        Applicants
                      </Link>
                      <Link
                        to={`/recruiter/jobs/${job._id}/edit`}
                        className="rounded-full border border-line px-3 py-1.5 text-sm font-medium"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export default RecruiterHome;
