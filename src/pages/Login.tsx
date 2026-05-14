"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Lock, UserPlus, EyeOff, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isHidden, setIsHidden] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // سيتم ربطها لاحقاً بنظام المصادقة
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 rtl">
      <div className="mb-8 text-center">
        <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20">
          <span className="text-white text-4xl font-bold">D</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">دردشة دياد العربية</h1>
        <p className="text-slate-500 mt-2">أهلاً بك في مجتمعنا المتكامل</p>
      </div>

      <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl overflow-hidden">
        <div className="bg-primary h-2 w-full"></div>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-primary font-medium">
              <Users size={20} />
              <span>المتواجدون الآن: 1,245</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="visitor" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100 p-1 rounded-2xl">
              <TabsTrigger value="visitor" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">دخول زائر</TabsTrigger>
              <TabsTrigger value="member" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">دخول عضو</TabsTrigger>
              <TabsTrigger value="register" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">تسجيل</TabsTrigger>
            </TabsList>

            <TabsContent value="visitor">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <User className="absolute right-3 top-3 text-slate-400" size={20} />
                  <Input placeholder="اكتب الاسم المستعار..." className="pr-10 h-12 rounded-xl border-slate-200 focus:ring-primary" />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/30">دخول الآن</Button>
              </form>
            </TabsContent>

            <TabsContent value="member">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <User className="absolute right-3 top-3 text-slate-400" size={20} />
                  <Input placeholder="اسم المستخدم" className="pr-10 h-12 rounded-xl border-slate-200" />
                </div>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 text-slate-400" size={20} />
                  <Input type="password" placeholder="كلمة المرور" className="pr-10 h-12 rounded-xl border-slate-200" />
                </div>
                <div className="flex items-center gap-2 py-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsHidden(!isHidden)}
                    className={`flex items-center gap-2 rounded-lg ${isHidden ? 'text-primary bg-primary/10' : 'text-slate-500'}`}
                  >
                    <EyeOff size={18} />
                    <span>دخول مخفي</span>
                  </Button>
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/30">تسجيل الدخول</Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <UserPlus className="absolute right-3 top-3 text-slate-400" size={20} />
                  <Input placeholder="اسم المستخدم الجديد" className="pr-10 h-12 rounded-xl border-slate-200" />
                </div>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 text-slate-400" size={20} />
                  <Input type="password" placeholder="كلمة المرور" className="pr-10 h-12 rounded-xl border-slate-200" />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/30">إنشاء حساب ودخول</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="mt-8 text-slate-400 text-sm">
        جميع الحقوق محفوظة &copy; 2024
      </div>
    </div>
  );
};

export default Login;