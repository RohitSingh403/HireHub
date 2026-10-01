import { Link } from "react-router-dom";

const ink = "#172033";
const pine = "#1c6b56";
const paper = "#fffdf8";

function LogoMark({ className = "h-9 w-9", title = "HireHub" }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label={title}
    >
      <rect
        x="5.5"
        y="16"
        width="28"
        height="22"
        rx="4"
        fill="none"
        stroke={ink}
        strokeWidth="2.5"
      />
      <path
        d="M16 16.2V13a5.5 5.5 0 0 1 11 0v3.2"
        fill="none"
        stroke={ink}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M5.5 23.5h28"
        fill="none"
        stroke={ink}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="34.5" cy="34.5" r="10" fill={pine} />
      <path
        d="M29.2 34.6l3.3 3.3 6.4-6.8"
        fill="none"
        stroke={paper}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoLockup({ to = "/", className = "" }) {
  const classNames = `inline-flex items-center gap-2.5 text-ink ${className}`;
  const mark = (
    <>
      <LogoMark />
      <span className="font-display text-2xl leading-none tracking-tight">
        HireHub
      </span>
    </>
  );

  if (!to) {
    return <span className={classNames}>{mark}</span>;
  }

  return (
    <Link to={to} className={classNames}>
      {mark}
    </Link>
  );
}

export { LogoMark, LogoLockup };
