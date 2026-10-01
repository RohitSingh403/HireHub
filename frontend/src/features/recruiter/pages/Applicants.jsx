import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Alert from "../../../components/Alert.jsx";
import Badge from "../../../components/Badge.jsx";
import MatchBreakdown from "../../../components/MatchBreakdown.jsx";
import PageHeader from "../../../components/PageHeader.jsx";
import {
  fetchJobApplications,
  updateApplicationStatus,
} from "../../applications/services/applicationService.js";
import { fetchJob } from "../../jobs/services/jobService.js";
import apiError from "../../../utils/apiError.js";
import { formatDate, formatLabel, statusTone } from "../../../utils/format.js";

const stages = [
  "all",
  "applied",
  "screening",
  "shortlisted",
  "interview",
  "offer",
  "hired",
  "rejected",
];

function Applicants() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [rowError, setRowError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [stage, setStage] = useState("all");

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
          setApplications(nextApplications.applications);
          setNextCursor(nextApplications.nextCursor);
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

  async function loadMore() {
    if (!nextCursor || loadingMore) {
      return;
    }
    setLoadingMore(true);
    setError("");
    try {
      const page = await fetchJobApplications(id, nextCursor);
      setApplications((current) => [...current, ...page.applications]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(apiError(err, "Could not load applicants."));
    } finally {
      setLoadingMore(false);
    }
  }

  async function changeStatus(applicationId, status) {
    setRowError("");
    setSavingId(applicationId);
    try {
      const response = await updateApplicationStatus(applicationId, status);
      setApplications((current) =>
        current.map((application) =>
          application._id === applicationId
            ? {
                ...application,
                status: response.application.status,
                statusHistory: response.application.statusHistory,
                nextStatuses: response.application.nextStatuses,
              }
            : application,
        ),
      );
    } catch (err) {
      setRowError(apiError(err, "Could not update the status."));
    } finally {
      setSavingId("");
    }
  }

  const visible =
    stage === "all"
      ? applications
      : applications.filter((application) => application.status === stage);

  return (
    <div>
      <Link to="/recruiter/jobs" className="text-sm font-medium text-pine">
        ← Jobs
      </Link>
      <div className="mt-4">
        <PageHeader
          eyebrow="Applicants"
          title={job?.title || "Applicants"}
          text="Sorted by match. Move one legal stage forward, or reject."
        />
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {stages.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setStage(item)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
              stage === item ? "bg-ink text-paper" : "bg-card text-muted"
            }`}
          >
            {item === "all" ? "All" : formatLabel(item)}
          </button>
        ))}
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
      {!loading && applications.length > 0 && visible.length === 0 ? (
        <p className="text-sm text-muted">No applicants in this stage on the loaded pages.</p>
      ) : null}
      <ul className="grid gap-3">
        {visible.map((application) => {
          const candidate = application.candidate;
          const percent = application.match?.overall;
          return (
            <li
              key={application._id}
              className="rounded-3xl border border-line bg-card px-5 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{candidate?.name || "Candidate"}</p>
                  <p className="text-sm text-muted">
                    Applied {formatDate(application.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-display text-3xl text-pine-dark">
                    {percent === undefined || percent === null ? "—" : `${percent}%`}
                  </p>
                  <Badge tone={statusTone(application.status)}>
                    {formatLabel(application.status)}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(application.nextStatuses || []).map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={savingId === application._id}
                    onClick={() => changeStatus(application._id, status)}
                    className={
                      status === "rejected"
                        ? "rounded-full border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-800 disabled:opacity-60"
                        : "rounded-full bg-pine px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                    }
                  >
                    {formatLabel(status)}
                  </button>
                ))}
                {(application.nextStatuses || []).length === 0 ? (
                  <p className="text-sm text-muted">No further changes</p>
                ) : null}
              </div>
              <div className="mt-4 border-t border-line pt-4">
                <MatchBreakdown match={application.match} />
              </div>
            </li>
          );
        })}
      </ul>
      {nextCursor ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-full border border-line bg-card px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default Applicants;
