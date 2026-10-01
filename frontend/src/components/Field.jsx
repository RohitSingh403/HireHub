export const inputClass =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-ink outline-none transition focus:border-pine focus:ring-2 focus:ring-pine/20";

function Field({ label, htmlFor, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}

export default Field;
