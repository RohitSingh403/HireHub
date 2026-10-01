import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Alert from "../../../components/Alert.jsx";
import Badge from "../../../components/Badge.jsx";
import PageHeader from "../../../components/PageHeader.jsx";
import ApplicationTimeline from "../components/ApplicationTimeline.jsx";
import { fetchMyApplication } from "../services/applicationService.js";
import apiError from "../../../utils/apiError.js";
import { companyName, formatLabel, statusTone } from "../../../utils/format.js";

function ApplicationDetail() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const next = await fetchMyApplication(id);
        if (!cancelled) {
          setApplication(next);
        }
      } catch (err) {
        if (!cancelled) {
          setError(apiError(err, "Could not load this application."));
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

  if (loading) {
    return <p className="text-muted">Loading application…</p>;
  }

  if (error || !application) {
    return (
      <div>
        <Alert>{error || "Application not found"}</Alert>
        <Link to="/applications" className="mt-4 inline-block text-sm font-semibold text-pine">
          Back to my applications
        </Link>
      </div>
    );
  }

  const job = application.job;

  return (
    <div>
      <Link to="/applications" className="text-sm font-medium text-pine">
        ← My applications
      </Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <PageHeader
            eyebrow="Application"
            title={job?.title || "Role unavailable"}
            text={`${companyName(job?.company)}${job?.location ? ` · ${job.location}` : ""}`}
          />
          <Badge tone={statusTone(application.status)}>
            {formatLabel(application.status)}
          </Badge>
          <p className="mt-4 max-w-xl text-sm text-muted">
            The recruiter moves this one stage at a time. You can read the
            timeline. You cannot change it.
          </p>
        </div>
        <section className="rounded-3xl border border-line bg-card p-5">
          <h2 className="font-display text-2xl">Timeline</h2>
          <div className="mt-4">
            <ApplicationTimeline
              status={application.status}
              createdAt={application.createdAt}
              statusHistory={application.statusHistory}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export default ApplicationDetail;
