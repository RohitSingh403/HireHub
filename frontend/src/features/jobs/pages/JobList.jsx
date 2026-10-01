import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../../../components/PageHeader.jsx";
import Alert from "../../../components/Alert.jsx";
import JobCard from "../../../components/JobCard.jsx";
import Field, { inputClass } from "../../../components/Field.jsx";
import { fetchJobs, matchScoresFor } from "../services/jobService.js";
import useAuthStore from "../../../store/authStore.js";
import apiError from "../../../utils/apiError.js";
import { formatLabel } from "../../../utils/format.js";

const employmentTypes = ["full-time", "part-time", "contract", "internship"];
const workModes = ["remote", "hybrid", "onsite"];

function JobList() {
  const user = useAuthStore((state) => state.user);
  const hasProfile = (user?.skills || []).length > 0;
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState({
    keyword: params.get("keyword") ?? "",
    location: params.get("location") ?? "",
  });
  const [jobs, setJobs] = useState([]);
  const [scores, setScores] = useState({});
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const employmentType = params.get("employmentType") ?? "";
  const workMode = params.get("workMode") ?? "";

  useEffect(() => {
    const filters = {
      keyword: params.get("keyword") ?? "",
      location: params.get("location") ?? "",
      employmentType: params.get("employmentType") ?? "",
      workMode: params.get("workMode") ?? "",
    };
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const page = await fetchJobs(filters);
        if (cancelled) {
          return;
        }
        setJobs(page.jobs);
        setNextCursor(page.nextCursor);
        if (hasProfile) {
          setScores(await matchScoresFor(page.jobs.map((job) => job._id)));
        } else {
          setScores({});
        }
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
  }, [params, hasProfile]);

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function applySearch(event) {
    event.preventDefault();
    const next = Object.fromEntries(params.entries());
    for (const key of ["keyword", "location"]) {
      if (draft[key]) {
        next[key] = draft[key];
      } else {
        delete next[key];
      }
    }
    setParams(next);
  }

  function setFilter(key, value) {
    const next = Object.fromEntries(params.entries());
    if (next[key] === value) {
      delete next[key];
    } else if (value) {
      next[key] = value;
    } else {
      delete next[key];
    }
    setParams(next);
  }

  function clearFilters() {
    setDraft({ keyword: "", location: "" });
    setParams({});
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) {
      return;
    }
    setLoadingMore(true);
    setError("");
    try {
      const page = await fetchJobs({
        keyword: params.get("keyword") ?? "",
        location: params.get("location") ?? "",
        employmentType,
        workMode,
        cursor: nextCursor,
      });
      const combined = [...jobs, ...page.jobs];
      setJobs(combined);
      setNextCursor(page.nextCursor);
      if (hasProfile) {
        setScores(await matchScoresFor(combined.map((job) => job._id)));
      }
    } catch (err) {
      setError(apiError(err, "Could not load jobs."));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Candidates"
        title="Open roles"
        text="Search by keyword or city. Narrow by work mode and employment type. The percent shows when your profile has skills."
      />

      <form
        onSubmit={applySearch}
        className="mb-6 grid gap-3 rounded-3xl border border-line bg-card p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
      >
        <Field label="Keyword" htmlFor="keyword">
          <input
            id="keyword"
            className={inputClass}
            value={draft.keyword}
            onChange={(event) => updateDraft("keyword", event.target.value)}
            placeholder="Title, skill, or description"
          />
        </Field>
        <Field label="Location" htmlFor="location">
          <input
            id="location"
            className={inputClass}
            value={draft.location}
            onChange={(event) => updateDraft("location", event.target.value)}
            placeholder="City"
          />
        </Field>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-full bg-pine px-4 py-2.5 text-sm font-semibold text-white"
          >
            Search
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full px-3 py-2.5 text-sm text-muted"
          >
            Clear
          </button>
        </div>
      </form>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="h-fit rounded-3xl border border-line bg-card p-4">
          <fieldset>
            <legend className="text-sm font-semibold">Work mode</legend>
            <div className="mt-2 grid gap-1">
              {workModes.map((mode) => (
                <label key={mode} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={workMode === mode}
                    onChange={() => setFilter("workMode", mode)}
                  />
                  {formatLabel(mode)}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-5">
            <legend className="text-sm font-semibold">Employment type</legend>
            <div className="mt-2 grid gap-1">
              {employmentTypes.map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={employmentType === type}
                    onChange={() => setFilter("employmentType", type)}
                  />
                  {formatLabel(type)}
                </label>
              ))}
            </div>
          </fieldset>
        </aside>

        <div>
          <Alert>{error}</Alert>
          {loading ? <p className="text-muted">Loading open roles…</p> : null}
          {!loading && !error && jobs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line bg-card px-6 py-12 text-center">
              <p className="font-display text-2xl">No open roles match</p>
              <p className="mt-2 text-muted">Try a broader keyword, or clear the filters.</p>
            </div>
          ) : null}
          <ul className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <li key={job._id}>
                <JobCard job={job} match={hasProfile ? scores[job._id] : undefined} />
              </li>
            ))}
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
          {!hasProfile && !loading ? (
            <p className="mt-4 text-sm text-muted">
              <Link to="/profile" className="font-semibold text-pine">
                Save a profile
              </Link>{" "}
              to see a match percent on each role.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default JobList;
