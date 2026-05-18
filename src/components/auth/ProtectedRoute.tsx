"use client";

import React from "react";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem("authToken");
  const location = useLocation();

  if (!token) {
    // تحويل المستخدم لصفحة الدخول مع حفظ المسار الذي كان يحاول الوصول إليه
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;