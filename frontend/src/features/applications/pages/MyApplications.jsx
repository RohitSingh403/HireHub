import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../components/PageHeader.jsx";
import Alert from "../../../components/Alert.jsx";
import Badge from "../../../components/Badge.jsx";
import { fetchMyApplications } from "../services/applicationService.js";
import apiError from "../../../utils/apiError.js";
import {
  companyName,
  formatDate,
  formatLabel,
  statusTone,
} from "../../../utils/format.js";

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const next = await fetchMyApplications();
        if (!cancelled) {
          setApplications(next);
        }
      } catch (err) {
        if (!cancelled) {
          setError(apiError(err, "Could not load applications."));
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
        title="My applications"
        text="Each role can be applied to once. Status updates come from the recruiter who posted it."
      />
      <Alert>{error}</Alert>
      {loading ? <p className="text-muted">Loading applications…</p> : null}
      {!loading && !error && applications.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-card px-6 py-12 text-center">
          <p className="font-display text-2xl">No applications yet</p>
          <Link to="/jobs" className="mt-3 inline-block text-sm font-semibold text-pine">
            Browse open roles
          </Link>
        </div>
      ) : null}
      <ul className="grid gap-3">
        {applications.map((application) => {
          const job = application.job;
          return (
            <li
              key={application._id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-card px-5 py-4"
            >
              <div>
                <p className="font-display text-2xl">
                  {job?.title || "Role unavailable"}
                </p>
                <p className="text-sm text-muted">
                  {companyName(job?.company)}
                  {job?.location ? ` · ${job.location}` : ""}
                  {job?.employmentType
                    ? ` · ${formatLabel(job.employmentType)}`
                    : ""}
                  {job?.workMode ? ` · ${formatLabel(job.workMode)}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Applied {formatDate(application.createdAt)}
                </p>
              </div>
              <Badge tone={statusTone(application.status)}>
                {formatLabel(application.status)}
              </Badge>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default MyApplications;
