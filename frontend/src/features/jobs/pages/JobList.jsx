import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../../../components/PageHeader.jsx";
import Alert from "../../../components/Alert.jsx";
import Badge from "../../../components/Badge.jsx";
import Field, { inputClass } from "../../../components/Field.jsx";
import { fetchJobs } from "../services/jobService.js";
import apiError from "../../../utils/apiError.js";
import {
  companyName,
  formatLabel,
  formatSalary,
  initials,
} from "../../../utils/format.js";

const employmentTypes = ["full-time", "part-time", "contract", "internship"];
const workModes = ["remote", "hybrid", "onsite"];

function JobList() {
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState({
    keyword: params.get("keyword") ?? "",
    location: params.get("location") ?? "",
    employmentType: params.get("employmentType") ?? "",
    workMode: params.get("workMode") ?? "",
  });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const filters = {
      keyword: params.get("keyword") ?? "",
      location: params.get("location") ?? "",
      employmentType: params.get("employmentType") ?? "",
      workMode: params.get("workMode") ?? "",
    };
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const nextJobs = await fetchJobs(filters);
        if (!cancelled) {
          setJobs(nextJobs);
        }
      } catch (err) {
        if (!cancelled) {
          setError(apiError(err, "Could not load jobs."));
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
  }, [params]);

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function applyFilters(event) {
    event.preventDefault();
    const next = {};
    for (const [key, value] of Object.entries(draft)) {
      if (value) {
        next[key] = value;
      }
    }
    setParams(next);
  }

  function clearFilters() {
    setDraft({
      keyword: "",
      location: "",
      employmentType: "",
      workMode: "",
    });
    setParams({});
  }

  return (
    <div>
      <PageHeader
        eyebrow="Candidates"
        title="Open roles"
        text="Only jobs marked open are listed. Search by keyword, or narrow by location, employment type, and work mode."
      />

      <form
        onSubmit={applyFilters}
        className="mb-6 grid gap-4 rounded-3xl border border-line bg-card p-4 sm:grid-cols-2 lg:grid-cols-6"
      >
        <div className="lg:col-span-2">
          <Field label="Keyword" htmlFor="keyword">
            <input
              id="keyword"
              className={inputClass}
              value={draft.keyword}
              onChange={(event) => updateDraft("keyword", event.target.value)}
              placeholder="Title, skill, or description"
            />
          </Field>
        </div>
        <Field label="Location" htmlFor="location">
          <input
            id="location"
            className={inputClass}
            value={draft.location}
            onChange={(event) => updateDraft("location", event.target.value)}
            placeholder="City"
          />
        </Field>
        <Field label="Employment type" htmlFor="employmentType">
          <select
            id="employmentType"
            className={inputClass}
            value={draft.employmentType}
            onChange={(event) =>
              updateDraft("employmentType", event.target.value)
            }
          >
            <option value="">Any</option>
            {employmentTypes.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Work mode" htmlFor="workMode">
          <select
            id="workMode"
            className={inputClass}
            value={draft.workMode}
            onChange={(event) => updateDraft("workMode", event.target.value)}
          >
            <option value="">Any</option>
            {workModes.map((mode) => (
              <option key={mode} value={mode}>
                {formatLabel(mode)}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-paper"
          >
            Search
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full px-3 py-2.5 text-sm text-muted"
          >
            Clear
          </button>
        </div>
      </form>

      <Alert>{error}</Alert>

      {loading ? <p className="text-muted">Loading open roles…</p> : null}

      {!loading && !error && jobs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-card px-6 py-12 text-center">
          <p className="font-display text-2xl">No open roles match</p>
          <p className="mt-2 text-muted">
            Try a broader keyword, or clear the filters.
          </p>
        </div>
      ) : null}

      <ul className="grid gap-4">
        {jobs.map((job) => (
          <li key={job._id}>
            <Link
              to={`/jobs/${job._id}`}
              className="block rounded-3xl border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:border-pine/40"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-pine/10 font-semibold text-pine-dark">
                  {initials(companyName(job.company))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display text-2xl leading-tight">
                        {job.title}
                      </h2>
                      <p className="text-sm text-muted">
                        {companyName(job.company)} · {job.location}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {formatSalary(job.salaryMin, job.salaryMax)}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge>{formatLabel(job.employmentType)}</Badge>
                    <Badge>{formatLabel(job.workMode)}</Badge>
                    <Badge tone="neutral">{job.experience}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(job.skills || []).slice(0, 4).map((skill) => (
                      <span key={skill} className="text-xs text-muted">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default JobList;
