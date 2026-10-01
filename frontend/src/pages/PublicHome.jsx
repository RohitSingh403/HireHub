import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogoLockup } from "../components/Logo.jsx";
import Badge from "../components/Badge.jsx";
import Alert from "../components/Alert.jsx";
import { fetchJobs } from "../features/jobs/services/jobService.js";
import apiError from "../utils/apiError.js";
import { companyName, formatLabel, formatSalary } from "../utils/format.js";

const steps = [
  {
    title: "Profile",
    text: "A candidate saves skills, years, location, work mode, and a salary range.",
  },
  {
    title: "Explainable match",
    text: "Open roles get a percent from those signals, with the skills that matched and the ones that did not.",
  },
  {
    title: "Hiring pipeline",
    text: "A recruiter moves an application one stage at a time, from applied through hired, and every change stays on the timeline.",
  },
];

function PublicHome() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const page = await fetchJobs({ limit: 6 });
        if (!cancelled) {
          setJobs(page.jobs);
        }
      } catch (err) {
        if (!cancelled) {
          setError(apiError(err, "Could not load open roles."));
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
    <div className="min-h-screen">
      <header className="border-b border-line bg-card/90">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4">
          <LogoLockup to="/" />
          <a href="#open-roles" className="text-sm font-medium text-ink">
            Explore jobs
          </a>
          <Link
            to="/login"
            className="ml-auto rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pine">
          HireHub
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-5xl leading-tight">
          Match candidates to jobs, then run the pipeline.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-7 text-muted">
          Candidates see why a role fits. Recruiters rank the people who applied
          and move each application one stage at a time.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/register"
            className="rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-white"
          >
            Create an account
          </Link>
          <a
            href="#open-roles"
            className="rounded-full border border-line bg-card px-5 py-2.5 text-sm font-semibold"
          >
            Explore jobs
          </a>
        </div>

        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-3xl border border-line bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pine">
                Step {index + 1}
              </p>
              <h2 className="mt-2 font-display text-2xl">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
            </li>
          ))}
        </ol>

        <section id="open-roles" className="mt-14">
          <h2 className="font-display text-3xl">Open roles</h2>
          <p className="mt-2 text-sm text-muted">
            A few roles that are open right now. Sign in to filter the full list
            and apply.
          </p>
          <Alert>{error}</Alert>
          {loading ? <p className="mt-4 text-muted">Loading open roles…</p> : null}
          {!loading && !error && jobs.length === 0 ? (
            <p className="mt-4 text-muted">No open roles yet.</p>
          ) : null}
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <li key={job._id} className="rounded-3xl border border-line bg-card p-5">
                <h3 className="font-display text-2xl leading-tight">{job.title}</h3>
                <p className="mt-1 text-sm text-muted">
                  {companyName(job.company)} · {job.location}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{formatLabel(job.workMode)}</Badge>
                  <Badge tone="neutral">{formatLabel(job.employmentType)}</Badge>
                </div>
                <p className="mt-4 text-sm font-medium">
                  {formatSalary(job.salaryMin, job.salaryMax)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

export default PublicHome;
