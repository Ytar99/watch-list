import { Routes, Route } from "react-router-dom";
import { useAuthToken } from "@convex-dev/auth/react";
import { HomePage } from "@/pages/Home/HomePage.jsx";
import { LoginPage } from "@/pages/Login/LoginPage.jsx";
import { BoardPage } from "@/pages/Board/BoardPage.jsx";
import { ProfilePage } from "@/pages/Profile/ProfilePage.jsx";

function ProtectedRoute({ children }) {
  const token = useAuthToken();
  if (!token) {
    return <LoginPage />;
  }
  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/board/:boardId"
        element={
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
