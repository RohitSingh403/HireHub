import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "../features/auth/pages/Login.jsx";
import Register from "../features/auth/pages/Register.jsx";
import JobList from "../features/jobs/pages/JobList.jsx";
import JobDetail from "../features/jobs/pages/JobDetail.jsx";
import MyApplications from "../features/applications/pages/MyApplications.jsx";
import RecruiterHome from "../features/recruiter/pages/RecruiterHome.jsx";
import CompanyForm from "../features/recruiter/pages/CompanyForm.jsx";
import JobForm from "../features/recruiter/pages/JobForm.jsx";
import Applicants from "../features/recruiter/pages/Applicants.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import { homePath } from "../utils/homePath.js";
import useAuthStore, { useAuthHydrated } from "../store/authStore.js";

function HomeRedirect() {
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!hydrated) {
    return (
      <p className="grid min-h-screen place-items-center text-muted">Loading HireHub…</p>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={homePath(user?.role)} replace />;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute role="candidate" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/jobs" element={<JobList />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/applications" element={<MyApplications />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute role="recruiter" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/recruiter" element={<RecruiterHome />} />
            <Route path="/recruiter/company" element={<CompanyForm />} />
            <Route path="/recruiter/jobs/new" element={<JobForm />} />
            <Route path="/recruiter/jobs/:id/edit" element={<JobForm />} />
            <Route path="/recruiter/jobs/:id/applicants" element={<Applicants />} />
          </Route>
        </Route>

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
