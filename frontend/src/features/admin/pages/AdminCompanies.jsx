import { useEffect, useState } from "react";
import Alert from "../../../components/Alert.jsx";
import PageHeader from "../../../components/PageHeader.jsx";
import apiError from "../../../utils/apiError.js";
import { fetchAdminCompanies } from "../services/adminService.js";

function ownerName(owner) {
  if (!owner || typeof owner === "string") {
    return "—";
  }
  return owner.name || owner.email || "—";
}

function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const page = await fetchAdminCompanies();
        if (cancelled) {
          return;
        }
        setCompanies(page.companies);
        setNextCursor(page.nextCursor);
      } catch (err) {
        if (!cancelled) {
          setError(apiError(err, "Could not load companies."));
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
      const page = await fetchAdminCompanies(nextCursor);
      setCompanies((current) => [...current, ...page.companies]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(apiError(err, "Could not load more companies."));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Companies"
        text="Companies recruiters have saved."
      />
      <Alert>{error}</Alert>
      {loading ? <p className="text-muted">Loading companies…</p> : null}
      {!loading && companies.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-card px-6 py-12 text-center">
          <p className="font-display text-2xl">No companies yet</p>
          <p className="mt-2 text-sm text-muted">
            A company appears here after a recruiter creates one.
          </p>
        </div>
      ) : null}
      {!loading && companies.length > 0 ? (
        <div className="overflow-x-auto rounded-3xl border border-line bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Industry</th>
                <th className="px-5 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 font-semibold">Size</th>
                <th className="px-5 py-3 font-semibold">Owner</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company._id} className="border-b border-line last:border-0">
                  <td className="px-5 py-4 font-medium">{company.name}</td>
                  <td className="px-5 py-4 text-muted">{company.industry}</td>
                  <td className="px-5 py-4 text-muted">{company.location}</td>
                  <td className="px-5 py-4">{company.companySize}</td>
                  <td className="px-5 py-4 text-muted">{ownerName(company.owner)}</td>
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

export default AdminCompanies;
