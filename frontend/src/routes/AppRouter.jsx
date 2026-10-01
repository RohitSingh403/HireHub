import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PublicHome from "../pages/PublicHome.jsx";
import CandidateHome from "../pages/CandidateHome.jsx";
import Login from "../features/auth/pages/Login.jsx";
import AdminLogin from "../features/auth/pages/AdminLogin.jsx";
import Register from "../features/auth/pages/Register.jsx";
import JobList from "../features/jobs/pages/JobList.jsx";
import JobDetail from "../features/jobs/pages/JobDetail.jsx";
import RecommendedJobs from "../features/jobs/pages/RecommendedJobs.jsx";
import ProfileForm from "../features/profile/pages/ProfileForm.jsx";
import MyApplications from "../features/applications/pages/MyApplications.jsx";
import ApplicationDetail from "../features/applications/pages/ApplicationDetail.jsx";
import RecruiterHome from "../features/recruiter/pages/RecruiterHome.jsx";
import CompanyForm from "../features/recruiter/pages/CompanyForm.jsx";
import JobForm from "../features/recruiter/pages/JobForm.jsx";
import Applicants from "../features/recruiter/pages/Applicants.jsx";
import AdminOverview from "../features/admin/pages/AdminOverview.jsx";
import AdminUsers from "../features/admin/pages/AdminUsers.jsx";
import AdminJobs from "../features/admin/pages/AdminJobs.jsx";
import AdminCompanies from "../features/admin/pages/AdminCompanies.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import AdminRoute from "../components/AdminRoute.jsx";
import { homePath } from "../utils/homePath.js";
import useAuthStore, { useAuthHydrated } from "../store/authStore.js";

function HomeGate() {
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!hydrated) {
    return (
      <p className="grid min-h-screen place-items-center text-muted">Loading HireHub…</p>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={homePath(user?.role)} replace />;
  }

  return <PublicHome />;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute role="candidate" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/home" element={<CandidateHome />} />
            <Route path="/jobs" element={<JobList />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/recommended" element={<RecommendedJobs />} />
            <Route path="/profile" element={<ProfileForm />} />
            <Route path="/applications" element={<MyApplications />} />
            <Route path="/applications/:id" element={<ApplicationDetail />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute role="recruiter" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/recruiter" element={<RecruiterHome />} />
            <Route path="/recruiter/jobs" element={<RecruiterHome mode="jobs" />} />
            <Route path="/recruiter/company" element={<CompanyForm />} />
            <Route path="/recruiter/jobs/new" element={<JobForm />} />
            <Route path="/recruiter/jobs/:id/edit" element={<JobForm />} />
            <Route path="/recruiter/jobs/:id/applicants" element={<Applicants />} />
          </Route>
        </Route>

        <Route element={<AdminRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/jobs" element={<AdminJobs />} />
            <Route path="/admin/companies" element={<AdminCompanies />} />
          </Route>
        </Route>

        <Route path="/" element={<HomeGate />} />
        <Route path="*" element={<HomeGate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
