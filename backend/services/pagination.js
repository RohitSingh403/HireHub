const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function parseLimit(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return DEFAULT_LIMIT;
  }
  const number = Number(raw);
  if (!Number.isInteger(number) || number < 1) {
    return null;
  }
  return Math.min(number, MAX_LIMIT);
}

function encodeCursor(payload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursor(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(String(raw), "base64url").toString("utf8"),
    );
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

function readPage(query) {
  const limit = parseLimit(query.limit);
  if (limit === null) {
    return { error: "Limit must be a positive integer" };
  }
  const cursor = decodeCursor(query.cursor);
  if (cursor === undefined) {
    return { error: "Invalid cursor" };
  }
  return { limit, cursor };
}

function isJobCursor(cursor) {
  if (!cursor) {
    return true;
  }
  const createdAt = new Date(cursor.createdAt);
  return (
    typeof cursor.createdAt === "string" &&
    !Number.isNaN(createdAt.getTime()) &&
    typeof cursor.id === "string" &&
    /^[a-f0-9]{24}$/i.test(cursor.id)
  );
}

function jobCursor(job) {
  return encodeCursor({
    createdAt: new Date(job.createdAt).toISOString(),
    id: String(job._id),
  });
}

function withJobCursor(filter, cursor) {
  if (!cursor) {
    return filter;
  }
  const createdAt = new Date(cursor.createdAt);
  return {
    $and: [
      filter,
      {
        $or: [
          { createdAt: { $lt: createdAt } },
          { createdAt, _id: { $lt: cursor.id } },
        ],
      },
    ],
  };
}

function isRankCursor(cursor) {
  if (!cursor) {
    return true;
  }
  return (
    typeof cursor.overall === "number" &&
    Number.isFinite(cursor.overall) &&
    typeof cursor.label === "string" &&
    typeof cursor.id === "string" &&
    cursor.id.length > 0
  );
}

function comesAfter(item, cursor) {
  if (item.overall !== cursor.overall) {
    return item.overall < cursor.overall;
  }
  const byLabel = item.label.localeCompare(cursor.label);
  if (byLabel !== 0) {
    return byLabel > 0;
  }
  return item.id.localeCompare(cursor.id) > 0;
}

function pageRanked(items, limit, cursor, keyOf) {
  let start = 0;
  if (cursor) {
    const index = items.findIndex((item) => comesAfter(keyOf(item), cursor));
    start = index === -1 ? items.length : index;
  }
  const window = items.slice(start, start + limit + 1);
  const page = window.slice(0, limit);
  const nextCursor =
    window.length > limit ? encodeCursor(keyOf(page[page.length - 1])) : null;
  return { page, nextCursor };
}

export {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  parseLimit,
  readPage,
  isJobCursor,
  jobCursor,
  withJobCursor,
  isRankCursor,
  pageRanked,
};
