import Badge from "./Badge.jsx";

function formatScore(score) {
  const rounded = Math.round(score * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function SkillList({ label, skills, tone }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-2">
        {skills.length === 0 ? (
          <li className="text-sm text-muted">None</li>
        ) : (
          skills.map((skill) => (
            <li key={skill}>
              <Badge tone={tone}>{skill}</Badge>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function Signal({ label, signal }) {
  return (
    <li>
      <span className="font-medium text-ink">
        {label} {formatScore(signal.score)}%
      </span>
      <span className="text-muted"> · weight {signal.weight}</span>
      <span className="text-ink/80"> — {signal.reason}</span>
    </li>
  );
}

function MatchBreakdown({ match }) {
  if (!match) {
    return (
      <p className="text-sm text-muted">This role has no skills to score.</p>
    );
  }

  return (
    <div>
      <p className="font-display text-4xl leading-none text-pine-dark">
        {match.overall}%
      </p>
      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">
        Match
      </p>
      <div className="mt-3 grid gap-3">
        <SkillList label="Matched skills" skills={match.skills.matched} tone="pine" />
        <SkillList label="Missing skills" skills={match.skills.missing} tone="rose" />
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        <Signal label="Skills" signal={match.skills} />
        <Signal label="Experience" signal={match.experience} />
        <Signal label="Location" signal={match.location} />
        <Signal label="Salary" signal={match.salary} />
      </ul>
    </div>
  );
}

export default MatchBreakdown;
