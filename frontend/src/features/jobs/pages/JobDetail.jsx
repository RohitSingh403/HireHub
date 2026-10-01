import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Alert from "../../../components/Alert.jsx";
import Badge from "../../../components/Badge.jsx";
import { applyToJob } from "../../applications/services/applicationService.js";
import { fetchJob } from "../services/jobService.js";
import apiError from "../../../utils/apiError.js";
import {
  companyName,
  formatLabel,
  formatSalary,
  initials,
} from "../../../utils/format.js";

function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const nextJob = await fetchJob(id);
        if (!cancelled) {
          setJob(nextJob);
        }
      } catch (err) {
        if (!cancelled) {
          setError(apiError(err, "Job not found"));
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
  }, [id]);

  async function handleApply() {
    setApplyError("");
    setApplySuccess("");
    setSubmitting(true);
    try {
      const response = await applyToJob(id);
      setApplySuccess(response.msg || "Application submitted.");
    } catch (err) {
      setApplyError(apiError(err, "Could not apply."));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-muted">Loading role…</p>;
  }

  if (error || !job) {
    return (
      <div className="rounded-3xl border border-line bg-card p-8">
        <Alert>{error || "Job not found"}</Alert>
        <Link to="/jobs" className="mt-4 inline-block text-sm font-semibold text-pine">
          Back to open roles
        </Link>
      </div>
    );
  }

  const company = job.company;

  return (
    <div>
      <Link to="/jobs" className="text-sm font-medium text-pine">
        ← Open roles
      </Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="rounded-3xl border border-line bg-card p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-pine/10 font-semibold text-pine-dark">
              {initials(companyName(company))}
            </div>
            <div>
              <h1 className="font-display text-4xl leading-tight">{job.title}</h1>
              <p className="mt-1 text-muted">
                {companyName(company)} · {job.location}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>{formatLabel(job.employmentType)}</Badge>
            <Badge>{formatLabel(job.workMode)}</Badge>
            <Badge>{job.experience}</Badge>
          </div>
          <p className="mt-6 whitespace-pre-wrap leading-7 text-ink/90">
            {job.description}
          </p>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-muted">
            Skills
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {(job.skills || []).map((skill) => (
              <li key={skill}>
                <Badge tone="pine">{skill}</Badge>
              </li>
            ))}
          </ul>
          {company && typeof company === "object" ? (
            <div className="mt-8 border-t border-line pt-6">
              <h2 className="font-display text-2xl">{company.name}</h2>
              {company.description ? (
                <p className="mt-2 text-sm leading-6 text-muted">
                  {company.description}
                </p>
              ) : null}
              <p className="mt-2 text-sm text-muted">
                {[company.industry, company.location].filter(Boolean).join(" · ")}
              </p>
            </div>
          ) : null}
        </article>

        <aside className="h-fit rounded-3xl border border-line bg-card p-5 lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Salary
          </p>
          <p className="mt-1 font-display text-3xl">
            {formatSalary(job.salaryMin, job.salaryMax)}
          </p>
          <button
            type="button"
            onClick={handleApply}
            disabled={submitting}
            className="mt-5 w-full rounded-full bg-pine px-4 py-3 text-sm font-semibold text-white hover:bg-pine-dark disabled:opacity-60"
          >
            {submitting ? "Applying…" : "Apply"}
          </button>
          <div className="mt-4 flex flex-col gap-3">
            <Alert tone="success">{applySuccess}</Alert>
            <Alert>{applyError}</Alert>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">
            You can apply once. If this role already has your application, the
            reason shows here.
          </p>
        </aside>
      </div>
    </div>
  );
}

export default JobDetail;
