import Badge from "../../../components/Badge.jsx";
import { formatDateTime, formatLabel, statusTone } from "../../../utils/format.js";

function actorName(actor) {
  if (!actor) {
    return "Recorded earlier";
  }
  if (typeof actor === "string") {
    return "Team member";
  }
  return actor.name || "Team member";
}

function ApplicationTimeline({ status, createdAt, statusHistory }) {
  const history =
    Array.isArray(statusHistory) && statusHistory.length > 0
      ? statusHistory
      : [{ status, timestamp: createdAt, actor: null }];
  const entries = [...history].sort(
    (left, right) => new Date(left.timestamp) - new Date(right.timestamp),
  );

  return (
    <ol className="space-y-4">
      {entries.map((entry, index) => (
        <li key={`${entry.status}-${entry.timestamp}-${index}`} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-pine" />
            {index < entries.length - 1 ? (
              <span className="mt-1 w-px flex-1 bg-line" />
            ) : null}
          </div>
          <div className="pb-2">
            <Badge tone={statusTone(entry.status)}>{formatLabel(entry.status)}</Badge>
            <p className="mt-1 text-sm text-ink">{actorName(entry.actor)}</p>
            <p className="text-xs text-muted">{formatDateTime(entry.timestamp)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default ApplicationTimeline;
