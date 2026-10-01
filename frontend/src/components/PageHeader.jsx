function PageHeader({ eyebrow, title, text, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pine">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-4xl leading-tight text-ink">{title}</h1>
        {text ? <p className="mt-2 text-muted">{text}</p> : null}
      </div>
      {action}
    </div>
  );
}

export default PageHeader;
