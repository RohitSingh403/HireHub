import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../components/Alert.jsx";
import Badge from "../components/Badge.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { fetchMyApplications } from "../features/applications/services/applicationService.js";
import { fetchRecommendedJobs } from "../features/jobs/services/jobService.js";
import useAuthStore from "../store/authStore.js";
import apiError from "../utils/apiError.js";
import { companyName, formatDate, formatLabel, statusTone } from "../utils/format.js";

function CandidateHome() {
  const user = useAuthStore((state) => state.user);
  const [applications, setApplications] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [applicationResult, recommendedResult] = await Promise.allSettled([
          fetchMyApplications(),
          fetchRecommendedJobs({ limit: 3 }),
        ]);
        if (cancelled) {
          return;
        }
        if (applicationResult.status === "fulfilled") {
          setApplications(applicationResult.value);
        } else {
          setError(apiError(applicationResult.reason, "Could not load your home."));
        }
        if (recommendedResult.status === "fulfilled") {
          setRecommended(recommendedResult.value.jobs);
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

  const hired = applications.filter((item) => item.status === "hired").length;
  const rejected = applications.filter((item) => item.status === "rejected").length;
  const inProgress = applications.length - hired - rejected;
  const counts = [
    { label: "Applications", value: applications.length },
    { label: "In progress", value: inProgress },
    { label: "Hired", value: hired },
    { label: "Rejected", value: rejected },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Candidates"
        title={`Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        text="Your applications, and open roles scored from the profile you saved."
      />
      <Alert>{error}</Alert>
      {loading ? <p className="text-muted">Loading your home…</p> : null}
      {!loading ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {counts.map((count) => (
            <li key={count.label} className="rounded-3xl border border-line bg-card px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {count.label}
              </p>
              <p className="mt-2 font-display text-4xl">{count.value}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-display text-3xl">Recent applications</h2>
          <Link to="/applications" className="text-sm font-semibold text-pine">
            View all
          </Link>
        </div>
        {applications.length === 0 && !loading ? (
          <p className="text-sm text-muted">You have not applied yet.</p>
        ) : null}
        <ul className="grid gap-3">
          {applications.slice(0, 4).map((application) => (
            <li key={application._id}>
              <Link
                to={`/applications/${application._id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-card px-5 py-4"
              >
                <div>
                  <p className="font-medium">{application.job?.title || "Role unavailable"}</p>
                  <p className="text-sm text-muted">
                    {companyName(application.job?.company)} · Applied{" "}
                    {formatDate(application.createdAt)}
                  </p>
                </div>
                <Badge tone={statusTone(application.status)}>
                  {formatLabel(application.status)}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-display text-3xl">Recommended</h2>
          <Link to="/recommended" className="text-sm font-semibold text-pine">
            See the match
          </Link>
        </div>
        {recommended.length === 0 && !loading ? (
          <p className="text-sm text-muted">
            Recommendations appear for open roles that list skills.
          </p>
        ) : null}
        <ul className="grid gap-3 md:grid-cols-3">
          {recommended.map(({ job, match }) => (
            <li key={job._id}>
              <Link
                to={`/jobs/${job._id}`}
                className="block h-full rounded-3xl border border-line bg-card p-5"
              >
                <p className="font-display text-3xl text-pine-dark">{match.overall}%</p>
                <h3 className="mt-2 font-display text-2xl leading-tight">{job.title}</h3>
                <p className="mt-1 text-sm text-muted">
                  {companyName(job.company)} · {job.location}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default CandidateHome;
