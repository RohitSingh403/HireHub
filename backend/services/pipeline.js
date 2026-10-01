const APPLICATION_STATUSES = [
  "applied",
  "screening",
  "shortlisted",
  "interview",
  "offer",
  "hired",
  "rejected",
];

const NEXT_STATUSES = {
  applied: ["screening", "rejected"],
  screening: ["shortlisted", "rejected"],
  shortlisted: ["interview", "rejected"],
  interview: ["offer", "rejected"],
  offer: ["hired", "rejected"],
  hired: [],
  rejected: [],
};

function legalNextStatuses(status) {
  return NEXT_STATUSES[status] ? [...NEXT_STATUSES[status]] : [];
}

function transitionError(current, nextStatus) {
  if (!APPLICATION_STATUSES.includes(nextStatus)) {
    return "Please input a valid status";
  }
  const allowed = legalNextStatuses(current);
  if (allowed.length === 0) {
    return "This application can no longer change status";
  }
  if (!allowed.includes(nextStatus)) {
    return "That stage cannot be skipped";
  }
  return null;
}

export { APPLICATION_STATUSES, legalNextStatuses, transitionError };
