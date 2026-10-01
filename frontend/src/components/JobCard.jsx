import { Link } from "react-router-dom";
import Badge from "./Badge.jsx";
import { companyName, formatLabel, formatSalary } from "../utils/format.js";

function JobCard({ job, match }) {
  return (
    <Link
      to={`/jobs/${job._id}`}
      className="flex h-full flex-col rounded-3xl border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:border-pine/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-2xl leading-tight">{job.title}</h2>
          <p className="mt-1 text-sm text-muted">
            {companyName(job.company)} · {job.location}
          </p>
        </div>
        {match === undefined || match === null ? null : (
          <p className="shrink-0 font-display text-2xl text-pine-dark">{match}%</p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge>{formatLabel(job.workMode)}</Badge>
        <Badge tone="neutral">{formatLabel(job.employmentType)}</Badge>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {(job.skills || []).slice(0, 4).map((skill) => (
          <li key={skill}>
            <Badge tone="pine">{skill}</Badge>
          </li>
        ))}
      </ul>
      <p className="mt-auto pt-4 text-sm font-medium">
        {formatSalary(job.salaryMin, job.salaryMax)}
      </p>
    </Link>
  );
}

export default JobCard;
