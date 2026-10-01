export function formatMoney(value) {
  if (value === undefined || value === null || value === "") {
    return "—";
  }
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatSalary(min, max) {
  return `${formatMoney(min)} – ${formatMoney(max)}`;
}

export function formatLabel(value) {
  if (!value) {
    return "";
  }
  return String(value)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

export function formatDate(value) {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function companyName(company) {
  if (!company || typeof company === "string") {
    return "Company";
  }
  return company.name || "Company";
}

export function statusTone(status) {
  if (status === "hired" || status === "open") {
    return "pine";
  }
  if (status === "shortlisted") {
    return "amber";
  }
  if (status === "rejected" || status === "closed") {
    return "rose";
  }
  if (status === "applied") {
    return "sky";
  }
  return "neutral";
}

export function initials(name) {
  const parts = String(name || "H")
    .trim()
    .split(/\s+/)
    .slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}
