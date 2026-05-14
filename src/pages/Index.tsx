"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("guest");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [onlineCount, setOnlineCount] = useState(5847);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Simulate online count fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount((prev) => prev + Math.floor(Math.random() * 21) - 10);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleGuestLogin = () => {
    if (!username.trim()) return;
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem("user", JSON.stringify({
        id: Date.now(),
        name: username,
        role: "guest",
        avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
      }));
      setLoading(false);
      navigate("/dashboard");
    }, 1000);
  };

  const handleMemberLogin = () => {
    if (!username.trim() || !password) return;
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem("user", JSON.stringify({
        id: 1,
        name: username,
        role: "admin",
        avatar: "https://i.pravatar.cc/150?u=1",
      }));
      setLoading(false);
      navigate("/dashboard");
    }, 1200);
  };

  const handleRegister = () => {
    if (!username.trim() || !password) return;
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem("user", JSON.stringify({
        id: Date.now(),
        name: username,
        role: "member",
        avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
      }));
      setLoading(false);
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col rtl bg-[#0f0f1a] text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-slate-900 to-[#0f0f1a]" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(120, 40, 200, 0.08) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(60, 100, 220, 0.06) 0%, transparent 50%)`
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] bg-[#0f0f1a]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-black text-lg">د</span>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">دردشة دياد</h1>
              <p className="text-[10px] text-slate-500 font-medium">المجتمع العربي الأول للدردشة المباشرة</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/5 rounded-xl px-4 py-1.5 flex items-center gap-2 border border-white/10">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-slate-300">{onlineCount.toLocaleString('ar-SA')} متصل الآن</span>
            </div>
          </div>
        </div>
      </header>

      {/* Banner */}
      <div className="relative z-10 overflow-hidden">
        <div className="bg-gradient-to-l from-primary/20 via-blue-900/20 to-transparent h-48 flex items-center justify-center">
          <div className="text-center px-4">
            <h2 className="text-3xl font-black mb-2 bg-gradient-to-l from-primary to-blue-400 bg-clip-text text-transparent">
              مرحباً بك في دردشة دياد
            </h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
              أكبر تجمع عربي للدردشة الصوتية والكتابية. تواصل مع أصدقائك، شارك لحظاتك، واستمتع بأجواء الغرف المميزة.
            </p>
          </div>
        </div>
      </div>

      {/* Login Card */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-md bg-white/[0.04] border-white/[0.08] backdrop-blur-xl shadow-2xl shadow-black/40 rounded-2xl">
          <CardHeader className="flex flex-col items-center pt-8 pb-2">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-primary/20">
              <Users size={32} className="text-white" />
            </div>
            <CardTitle className="text-2xl font-black">
              <span className="bg-gradient-to-l from-primary to-blue-400 bg-clip-text text-transparent">
                دردشة دياد
              </span>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">أهلاً بك، سجّل دخولك للبدء</p>
          </CardHeader>

          <CardContent className="px-8 pb-4">
            <Tabs defaultValue="guest" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-10 mb-5 bg-white/5 border border-white/[0.06] rounded-xl p-1">
                <TabsTrigger value="guest" className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-bold rounded-lg text-xs transition-all">
                  زائر
                </TabsTrigger>
                <TabsTrigger value="member" className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-bold rounded-lg text-xs transition-all">
                  عضو
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-bold rounded-lg text-xs transition-all">
                  تسجيل
                </TabsTrigger>
              </TabsList>

              {/* Guest Login */}
              <TabsContent value="guest">
                <div className="space-y-4">
                  <div className="relative">
                    <UserPlus className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <Input
                      dir="rtl"
                      placeholder="اكتب الاسم المستعار"
                      className="h-12 rounded-xl bg-white/5 border-white/[0.08] text-white placeholder:text-slate-500 pr-10 focus-visible:ring-primary/50"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      maxLength={20}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 text-center">
                    الدخول كزائر بدون كلمة مرور
                  </p>
                  <Button
                    onClick={handleGuestLogin}
                    disabled={!username.trim() || loading}
                    className="w-full h-12 rounded-xl text-base font-bold bg-gradient-to-l from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin mx-auto" /> : "دخول كزائر"}
                  </Button>
                </div>
              </TabsContent>

              {/* Member Login */}
              <TabsContent value="member">
                <div className="space-y-4">
                  <div className="relative">
                    <UserPlus className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <Input
                      dir="rtl"
                      placeholder="اسم العضو أو البريد الإلكتروني"
                      className="h-12 rounded-xl bg-white/5 border-white/[0.08] text-white placeholder:text-slate-500 pr-10 focus-visible:ring-primary/50"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <Input
                      dir="rtl"
                      type={showPassword ? "text" : "password"}
                      placeholder="كلمة المرور"
                      className="h-12 rounded-xl bg-white/5 border-white/[0.08] text-white placeholder:text-slate-500 pr-10 focus-visible:ring-primary/50"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-1.5 text-slate-500 cursor-pointer">
                      <input type="checkbox" className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-primary" />
                      <span>تذكرني</span>
                    </label>
                    <a href="#" className="text-primary text-xs hover:underline">نسيت كلمة المرور؟</a>
                  </div>
                  <Button
                    onClick={handleMemberLogin}
                    disabled={!username.trim() || !password || loading}
                    className="w-full h-12 rounded-xl text-base font-bold bg-gradient-to-l from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin mx-auto" /> : "تسجيل الدخول"}
                  </Button>
                </div>
              </TabsContent>

              {/* Register */}
              <TabsContent value="register">
                <div className="space-y-4">
                  <div className="relative">
                    <UserPlus className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <Input
                      dir="rtl"
                      placeholder="اختر اسم العضوية"
                      className="h-12 rounded-xl bg-white/5 border-white/[0.08] text-white placeholder:text-slate-500 pr-10 focus-visible:ring-primary/50"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <Input
                      dir="rtl"
                      type={showRegisterPassword ? "text" : "password"}
                      placeholder="كلمة المرور"
                      className="h-12 rounded-xl bg-white/5 border-white/[0.08] text-white placeholder:text-slate-500 pr-10 focus-visible:ring-primary/50"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-[11px] text-slate-500 leading-relaxed border border-white/[0.06]">
                    <CheckCircle className="inline-block text-green-400 mr-1.5" size={14} />
                    التسجيل مجاني ولا يتطلب أي رسوم
                  </div>
                  <Button
                    onClick={handleRegister}
                    disabled={!username.trim() || !password || loading}
                    className="w-full h-12 rounded-xl text-base font-bold bg-gradient-to-l from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin mx-auto" /> : "إنشاء حساب والدخول"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-3 pb-8">
            <div className="text-xs text-slate-600">
              بالدخول فأنت توافق على <a href="#" className="text-primary hover:underline">شروط الاستخدام</a> و{" "}
              <a href="#" className="text-primary hover:underline">سياسة الخصوصية</a>
            </div>
            <div className="text-[10px] text-slate-700">© 2025 دردشة دياد. جميع الحقوق محفوظة.</div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Index;