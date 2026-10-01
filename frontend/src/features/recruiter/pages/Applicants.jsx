import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Alert from "../../../components/Alert.jsx";
import Badge from "../../../components/Badge.jsx";
import MatchBreakdown from "../../../components/MatchBreakdown.jsx";
import PageHeader from "../../../components/PageHeader.jsx";
import { inputClass } from "../../../components/Field.jsx";
import {
  fetchJobApplications,
  updateApplicationStatus,
} from "../../applications/services/applicationService.js";
import { fetchJob } from "../../jobs/services/jobService.js";
import apiError from "../../../utils/apiError.js";
import { formatDate, formatLabel, statusTone } from "../../../utils/format.js";

const statuses = ["applied", "shortlisted", "rejected", "hired"];

function Applicants() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rowError, setRowError] = useState("");
  const [savingId, setSavingId] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [nextJob, nextApplications] = await Promise.all([
          fetchJob(id),
          fetchJobApplications(id),
        ]);
        if (!cancelled) {
          setJob(nextJob);
          setApplications(nextApplications);
        }
      } catch (err) {
        if (!cancelled) {
          setError(apiError(err, "Could not load applicants."));
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

  async function changeStatus(applicationId, status) {
    setRowError("");
    setSavingId(applicationId);
    try {
      await updateApplicationStatus(applicationId, status);
      setApplications((current) =>
        current.map((application) =>
          application._id === applicationId
            ? { ...application, status }
            : application,
        ),
      );
    } catch (err) {
      setRowError(apiError(err, "Could not update the status."));
    } finally {
      setSavingId("");
    }
  }

  return (
    <div>
      <Link to="/recruiter" className="text-sm font-medium text-pine">
        ← Overview
      </Link>
      <div className="mt-4">
        <PageHeader
          eyebrow="Applicants"
          title={job?.title || "Applicants"}
          text="Ranked with the same match as the candidate feed. Highest percent first. Status is still applied, shortlisted, rejected, or hired."
        />
      </div>
      <Alert>{error || rowError}</Alert>
      {loading ? <p className="text-muted">Loading applicants…</p> : null}
      {!loading && !error && applications.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-card px-6 py-12 text-center">
          <p className="font-display text-2xl">No applicants yet</p>
          <p className="mt-2 text-sm text-muted">
            Candidates only see this role when its status is open.
          </p>
        </div>
      ) : null}
      <ul className="grid gap-3">
        {applications.map((application) => {
          const candidate = application.candidate;
          return (
            <li
              key={application._id}
              className="grid gap-4 rounded-3xl border border-line bg-card px-5 py-4 lg:grid-cols-[minmax(0,1fr)_280px]"
            >
              <div>
                <p className="font-medium">{candidate?.name || "Candidate"}</p>
                <p className="text-sm text-muted">{candidate?.email}</p>
                <p className="mt-1 text-xs text-muted">
                  Applied {formatDate(application.createdAt)}
                </p>
                <div className="mt-4">
                  <MatchBreakdown match={application.match} />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge tone={statusTone(application.status)}>
                  {formatLabel(application.status)}
                </Badge>
                <label className="sr-only" htmlFor={`status-${application._id}`}>
                  Status for {candidate?.name || "candidate"}
                </label>
                <select
                  id={`status-${application._id}`}
                  className={inputClass}
                  value={application.status}
                  disabled={savingId === application._id}
                  onChange={(event) =>
                    changeStatus(application._id, event.target.value)
                  }
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {formatLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Applicants;
