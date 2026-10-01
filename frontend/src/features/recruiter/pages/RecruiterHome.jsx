import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../components/PageHeader.jsx";
import Alert from "../../../components/Alert.jsx";
import Badge from "../../../components/Badge.jsx";
import { fetchMyCompany } from "../services/companyService.js";
import { fetchMyJobs } from "../../jobs/services/jobService.js";
import apiError from "../../../utils/apiError.js";
import { formatLabel, formatSalary, initials, statusTone } from "../../../utils/format.js";

function RecruiterHome() {
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
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
        if (jobResult.status === "fulfilled") {
          setJobs(jobResult.value);
        } else {
          setError(apiError(jobResult.reason, "Could not load your jobs."));
        }
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

  return (
    <div>
      <PageHeader
        eyebrow="Recruiters"
        title="Your hiring desk"
        text="Draft and closed roles stay off the public list. Open roles can receive one application per candidate."
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

      {!loading ? (
        <section className="mb-8 rounded-3xl border border-line bg-card p-5">
          {company ? (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-sm font-semibold text-paper">
                  {initials(company.name)}
                </div>
                <div>
                  <h2 className="font-display text-2xl">{company.name}</h2>
                  <p className="text-sm text-muted">
                    {company.industry} · {company.location} · {company.companySize}{" "}
                    people
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/80">
                    {company.description}
                  </p>
                </div>
              </div>
              <Link
                to="/recruiter/company"
                className="rounded-full border border-line px-4 py-2 text-sm font-medium"
              >
                Edit company
              </Link>
            </div>
          ) : (
            <div>
              <h2 className="font-display text-2xl">No company yet</h2>
              <p className="mt-2 max-w-xl text-sm text-muted">
                A job has to point at a company you own. Create the company
                first, then post a role.
              </p>
            </div>
          )}
        </section>
      ) : null}

      {!loading && company && jobs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-card px-6 py-12 text-center">
          <p className="font-display text-2xl">No jobs posted</p>
          <Link
            to="/recruiter/jobs/new"
            className="mt-3 inline-block text-sm font-semibold text-pine"
          >
            Post the first role
          </Link>
        </div>
      ) : null}

      <ul className="grid gap-3">
        {jobs.map((job) => (
          <li
            key={job._id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-card px-5 py-4"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-2xl">{job.title}</h3>
                <Badge tone={statusTone(job.status)}>{formatLabel(job.status)}</Badge>
              </div>
              <p className="text-sm text-muted">
                {job.location} · {formatLabel(job.employmentType)} ·{" "}
                {formatLabel(job.workMode)} · {formatSalary(job.salaryMin, job.salaryMax)}
              </p>
            </div>
            <div className="flex gap-2">
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
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RecruiterHome;
