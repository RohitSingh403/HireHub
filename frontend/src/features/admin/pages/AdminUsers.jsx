import { useEffect, useState } from "react";
import Alert from "../../../components/Alert.jsx";
import Badge from "../../../components/Badge.jsx";
import PageHeader from "../../../components/PageHeader.jsx";
import useAuthStore from "../../../store/authStore.js";
import apiError from "../../../utils/apiError.js";
import { formatDate, formatLabel } from "../../../utils/format.js";
import { fetchAdminUsers, updateUserRole } from "../services/adminService.js";

function isSelf(user, currentUser) {
  return String(user._id) === String(currentUser?.id);
}

function EmptyUsers() {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-card px-6 py-12 text-center">
      <p className="font-display text-2xl">No users yet</p>
      <p className="mt-2 text-sm text-muted">Accounts appear here after someone registers.</p>
    </div>
  );
}

function AdminUsers() {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingId, setPendingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const page = await fetchAdminUsers();
        if (cancelled) {
          return;
        }
        setUsers(page.users);
        setNextCursor(page.nextCursor);
      } catch (err) {
        if (!cancelled) {
          setError(apiError(err, "Could not load users."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadMore() {
    setLoadingMore(true);
    setError("");
    try {
      const page = await fetchAdminUsers(nextCursor);
      setUsers((current) => [...current, ...page.users]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(apiError(err, "Could not load more users."));
    } finally {
      setLoadingMore(false);
    }
  }

  async function changeRole(user, role) {
    if (role === user.role) {
      return;
    }
    setPendingId(user._id);
    setError("");
    try {
      const updated = await updateUserRole(user._id, role);
      setUsers((current) =>
        current.map((item) => (item._id === user._id ? updated : item)),
      );
    } catch (err) {
      setError(apiError(err, "Could not change that role."));
    } finally {
      setPendingId("");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Users"
        text="Candidate and recruiter roles can be changed. Your own role stays admin."
      />
      <Alert>{error}</Alert>
      {loading ? <p className="text-muted">Loading users…</p> : null}
      {!loading && users.length === 0 ? <EmptyUsers /> : null}
      {!loading && users.length > 0 ? (
        <div className="overflow-x-auto rounded-3xl border border-line bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const mine = isSelf(user, currentUser);
                const assignable = user.role === "candidate" || user.role === "recruiter";
                return (
                  <tr key={user._id} className="border-b border-line last:border-0">
                    <td className="px-5 py-4 font-medium">{user.name}</td>
                    <td className="px-5 py-4 text-muted">{user.email}</td>
                    <td className="px-5 py-4 text-muted">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-4">
                      {assignable && !mine ? (
                        <select
                          aria-label={`Role for ${user.name}`}
                          value={user.role}
                          disabled={pendingId === user._id}
                          onChange={(event) => changeRole(user, event.target.value)}
                          className="rounded-full border border-line bg-white px-3 py-1.5 text-sm"
                        >
                          <option value="candidate">Candidate</option>
                          <option value="recruiter">Recruiter</option>
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <Badge tone={user.role === "admin" ? "pine" : "neutral"}>
                            {formatLabel(user.role)}
                          </Badge>
                          {mine ? (
                            <span className="text-xs text-muted">Your role</span>
                          ) : null}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
      {nextCursor ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-full border border-line bg-card px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default AdminUsers;
