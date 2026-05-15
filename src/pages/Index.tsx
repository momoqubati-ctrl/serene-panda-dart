"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Eye, EyeOff, Loader2, CheckCircle, ShieldCheck } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("guest");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [onlineCount, setOnlineCount] = useState(5847);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount((prev) => prev + Math.floor(Math.random() * 21) - 10);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem("user", JSON.stringify({ id: 1, name: username || "زائر", role: "admin" }));
      setLoading(false);
      navigate("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col rtl bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-black text-lg">د</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800">دردشة دياد</h1>
              <p className="text-[10px] text-slate-500 font-bold">المجتمع العربي الأول</p>
            </div>
          </div>
          <div className="bg-green-50 text-green-600 rounded-full px-4 py-1.5 flex items-center gap-2 border border-green-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold">{onlineCount.toLocaleString('ar-SA')} متصل الآن</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
        <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl rounded-3xl overflow-hidden">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="flex flex-col items-center pt-8 pb-4">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
              <Users size={32} className="text-primary" />
            </div>
            <CardTitle className="text-2xl font-black text-slate-800">أهلاً بك في دياد</CardTitle>
            <p className="text-xs text-slate-500 font-medium">سجل دخولك وابدأ الدردشة فوراً</p>
          </CardHeader>

          <CardContent className="px-8">
            <Tabs defaultValue="guest" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-11 mb-6 bg-slate-100 rounded-xl p-1">
                <TabsTrigger value="guest" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">زائر</TabsTrigger>
                <TabsTrigger value="member" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">عضو</TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">تسجيل</TabsTrigger>
              </TabsList>

              <div className="space-y-4">
                <div className="relative">
                  <Input
                    placeholder="اسم المستخدم"
                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:ring-primary"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                
                {activeTab !== "guest" && (
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="كلمة المرور"
                      className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:ring-primary"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                )}

                <Button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "دخول الآن"}
                </Button>
              </div>
            </Tabs>
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-4 pb-8 pt-4">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
              <ShieldCheck size={14} />
              <span>نظام محمي ومشفر بالكامل</span>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default Index;