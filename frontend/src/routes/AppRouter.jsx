import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../features/auth/pages/Login.jsx";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
