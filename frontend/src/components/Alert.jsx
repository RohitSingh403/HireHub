const tones = {
  error: "border-rose-200 bg-rose-50 text-rose-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  info: "border-line bg-card text-ink",
};

function Alert({ tone = "error", children }) {
  if (!children) {
    return null;
  }

  return (
    <p className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`} role="alert">
      {children}
    </p>
  );
}

export default Alert;
