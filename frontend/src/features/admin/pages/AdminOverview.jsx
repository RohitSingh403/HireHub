import { useEffect, useState } from "react";
import Alert from "../../../components/Alert.jsx";
import PageHeader from "../../../components/PageHeader.jsx";
import { fetchAdminStats } from "../services/adminService.js";
import apiError from "../../../utils/apiError.js";
import { formatLabel } from "../../../utils/format.js";

const roleOrder = ["candidate", "recruiter", "admin"];
const jobStatusOrder = ["open", "closed", "draft"];
const applicationStatusOrder = [
  "applied",
  "screening",
  "shortlisted",
  "interview",
  "offer",
  "hired",
  "rejected",
];

function orderedCounts(counts, order) {
  const keys = [...order];
  for (const key of Object.keys(counts || {})) {
    if (!keys.includes(key)) {
      keys.push(key);
    }
  }
  return keys.map((key) => ({
    key,
    label: formatLabel(key),
    value: Number(counts?.[key] ?? 0),
  }));
}

function CountGrid({ items }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <li key={item.key} className="rounded-3xl border border-line bg-card px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {item.label}
          </p>
          <p className="mt-2 font-display text-4xl">{item.value}</p>
        </li>
      ))}
    </ul>
  );
}

function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const next = await fetchAdminStats();
        if (!cancelled) {
          setStats(next);
        }
      } catch (err) {
        if (!cancelled) {
          setError(apiError(err, "Could not load the report."));
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
        eyebrow="Admin"
        title="Overview"
        text="A report of stored records: users by role, companies, jobs by status, and applications by status."
      />
      <Alert>{error}</Alert>
      {loading ? <p className="text-muted">Loading the admin home…</p> : null}
      {!loading && stats ? (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-3 font-display text-2xl">Users by role</h2>
            <CountGrid items={orderedCounts(stats.usersByRole, roleOrder)} />
          </section>
          <section>
            <h2 className="mb-3 font-display text-2xl">Companies</h2>
            <CountGrid items={[{ key: "companies", label: "Companies", value: stats.companies }]} />
          </section>
          <section>
            <h2 className="mb-3 font-display text-2xl">Jobs by status</h2>
            <CountGrid items={orderedCounts(stats.jobsByStatus, jobStatusOrder)} />
          </section>
          <section>
            <h2 className="mb-3 font-display text-2xl">Applications by status</h2>
            <CountGrid
              items={orderedCounts(stats.applicationsByStatus, applicationStatusOrder)}
            />
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default AdminOverview;
