import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../components/PageHeader.jsx";
import Alert from "../../../components/Alert.jsx";
import Badge from "../../../components/Badge.jsx";
import MatchBreakdown from "../../../components/MatchBreakdown.jsx";
import { fetchRecommendedJobs } from "../services/jobService.js";
import apiError from "../../../utils/apiError.js";
import { companyName, formatLabel, initials } from "../../../utils/format.js";

function RecommendedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const nextJobs = await fetchRecommendedJobs();
        if (!cancelled) {
          setJobs(nextJobs);
        }
      } catch (err) {
        if (!cancelled) {
          setError(apiError(err, "Could not load recommendations."));
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
        eyebrow="Candidates"
        title="Recommended"
        text="Open roles with at least one skill, scored from your profile. Highest match first. The percent is the weighted sum, rounded to the nearest integer."
        action={
          <Link
            to="/profile"
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium"
          >
            Edit profile
          </Link>
        }
      />
      <Alert>{error}</Alert>
      {loading ? <p className="text-muted">Scoring open roles…</p> : null}
      {!loading && !error && jobs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-card px-6 py-12 text-center">
          <p className="font-display text-2xl">No roles to score</p>
          <p className="mt-2 text-muted">
            Recommendations skip jobs that have no skills.
          </p>
        </div>
      ) : null}
      <ul className="grid gap-4">
        {jobs.map(({ job, match }) => (
          <li
            key={job._id}
            className="rounded-3xl border border-line bg-card p-5"
          >
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div>
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-pine/10 font-semibold text-pine-dark">
                    {initials(companyName(job.company))}
                  </div>
                  <div>
                    <Link to={`/jobs/${job._id}`} className="font-display text-2xl leading-tight">
                      {job.title}
                    </Link>
                    <p className="text-sm text-muted">
                      {companyName(job.company)} · {job.location}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge>{formatLabel(job.employmentType)}</Badge>
                      <Badge>{formatLabel(job.workMode)}</Badge>
                    </div>
                  </div>
                </div>
              </div>
              <MatchBreakdown match={match} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RecommendedJobs;
