const tones = {
  neutral: "border-line bg-white text-ink",
  pine: "border-transparent bg-pine/10 text-pine-dark",
  amber: "border-transparent bg-amber-100 text-amber-950",
  rose: "border-transparent bg-rose-100 text-rose-900",
  sky: "border-transparent bg-sky-100 text-sky-900",
};

function Badge({ children, tone = "neutral" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone] || tones.neutral}`}
    >
      {children}
    </span>
  );
}

export default Badge;
