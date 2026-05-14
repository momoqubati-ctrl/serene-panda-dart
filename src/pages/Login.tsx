"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, User, Lock, UserPlus, EyeOff } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: connect to authentication backend
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-indigo-800 p-4 rtl">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-primary/20">
        <CardHeader className="flex flex-col items-center space-y-2 pt-8">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white text-3xl font-bold">D</span>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">دردشة دياد العربية</CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="اسم المستخدم أو البريد الإلكتروني"
                className="pl-10 pr-4 h-12 rounded-xl border-gray-300 focus:border-primary focus:ring-primary"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="كلمة المرور"
                className="pl-10 pr-10 h-12 rounded-xl border-gray-300 focus:border-primary focus:ring-primary"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                <EyeOff size={18} />
              </button>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white text-lg font-semibold shadow-md">
              تسجيل الدخول
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600">
            ليس لديك حساب؟ <a href="/login?tab=register" className="text-primary hover:underline">إنشاء حساب</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
