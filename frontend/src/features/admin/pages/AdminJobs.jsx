import { useEffect, useState } from "react";
import Alert from "../../../components/Alert.jsx";
import Badge from "../../../components/Badge.jsx";
import PageHeader from "../../../components/PageHeader.jsx";
import apiError from "../../../utils/apiError.js";
import { companyName, formatLabel, statusTone } from "../../../utils/format.js";
import { fetchAdminJobs, updateJobStatus } from "../services/adminService.js";

function nextStatus(status) {
  return status === "open" ? "closed" : "open";
}

function actionLabel(status) {
  if (status === "open") {
    return "Close";
  }
  if (status === "closed") {
    return "Reopen";
  }
  return "Open";
}

function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingId, setPendingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const page = await fetchAdminJobs();
        if (cancelled) {
          return;
        }
        setJobs(page.jobs);
        setNextCursor(page.nextCursor);
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
  }, []);

  async function loadMore() {
    setLoadingMore(true);
    setError("");
    try {
      const page = await fetchAdminJobs(nextCursor);
      setJobs((current) => [...current, ...page.jobs]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(apiError(err, "Could not load more jobs."));
    } finally {
      setLoadingMore(false);
    }
  }

  async function changeStatus(job) {
    const status = nextStatus(job.status);
    setPendingId(job._id);
    setError("");
    try {
      const updated = await updateJobStatus(job._id, status);
      setJobs((current) =>
        current.map((item) => (item._id === job._id ? updated : item)),
      );
    } catch (err) {
      setError(apiError(err, "Could not update that job."));
    } finally {
      setPendingId("");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Jobs"
        text="Every role in HireHub, with the status stored on the job."
      />
      <Alert>{error}</Alert>
      {loading ? <p className="text-muted">Loading jobs…</p> : null}
      {!loading && jobs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-card px-6 py-12 text-center">
          <p className="font-display text-2xl">No jobs yet</p>
          <p className="mt-2 text-sm text-muted">
            Jobs appear here after a recruiter posts one.
          </p>
        </div>
      ) : null}
      {!loading && jobs.length > 0 ? (
        <div className="overflow-x-auto rounded-3xl border border-line bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Title</th>
                <th className="px-5 py-3 font-semibold">Company</th>
                <th className="px-5 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold"> </th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job._id} className="border-b border-line last:border-0">
                  <td className="px-5 py-4 font-medium">{job.title}</td>
                  <td className="px-5 py-4 text-muted">{companyName(job.company)}</td>
                  <td className="px-5 py-4 text-muted">{job.location}</td>
                  <td className="px-5 py-4">
                    <Badge tone={statusTone(job.status)}>{formatLabel(job.status)}</Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => changeStatus(job)}
                      disabled={pendingId === job._id}
                      className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium hover:border-ink disabled:opacity-60"
                    >
                      {pendingId === job._id ? "Saving…" : actionLabel(job.status)}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
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

export default AdminJobs;
