"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Shield, Zap, Globe, Heart } from 'lucide-react';
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white rtl">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-slate-900 py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.900),theme(colors.slate.900))] opacity-20"></div>
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <div className="mx-auto max-w-2xl">
            <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/40 rotate-3">
              <span className="text-white text-4xl font-bold">D</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              دردشة دياد العربية
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              أكبر تجمع عربي للدردشة الصوتية والكتابية. تواصل مع أصدقائك، شارك لحظاتك، واستمتع بأجواء الغرف المميزة.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button 
                onClick={() => navigate('/login')}
                className="h-14 px-8 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
              >
                ابدأ الدردشة الآن
              </Button>
              <Button 
                variant="ghost" 
                className="text-white hover:text-primary text-lg font-bold"
                onClick={() => {
                  const features = document.getElementById('features');
                  features?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                اكتشف المميزات <span className="mr-2">←</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-primary">لماذا تختارنا؟</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              كل ما تحتاجه في منصة واحدة
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <FeatureCard 
                icon={<MessageSquare className="text-blue-500" />}
                title="دردشة فورية"
                description="نظام دردشة سريع جداً يدعم النصوص، الصور، والرسائل الصوتية بجودة عالية."
              />
              <FeatureCard 
                icon={<Users className="text-purple-500" />}
                title="غرف متنوعة"
                description="مئات الغرف العامة والخاصة التي تناسب جميع الاهتمامات والمجتمعات."
              />
              <FeatureCard 
                icon={<Shield className="text-green-500" />}
                title="حماية وخصوصية"
                description="نظام إشراف متطور يضمن بيئة آمنة ومحترمة لجميع المستخدمين."
              />
            </dl>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-y-16 text-center lg:grid-cols-3">
            <StatItem label="مستخدم نشط" value="+50,000" />
            <StatItem label="غرفة دردشة" value="+1,200" />
            <StatItem label="رسالة يومياً" value="+1M" />
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 py-12 text-center text-slate-400">
        <p>© 2024 دردشة دياد العربية. جميع الحقوق محفوظة.</p>
        <MadeWithDyad />
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: any) => (
  <div className="flex flex-col items-center text-center p-8 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="mb-6 p-4 bg-slate-50 rounded-2xl">
      {React.cloneElement(icon, { size: 32 })}
    </div>
    <dt className="text-xl font-bold leading-7 text-slate-900 mb-4">{title}</dt>
    <dd className="text-base leading-7 text-slate-600">{description}</dd>
  </div>
);

const StatItem = ({ label, value }: any) => (
  <div className="mx-auto flex max-w-xs flex-col gap-y-4">
    <dt className="text-base leading-7 text-slate-600">{label}</dt>
    <dd className="order-first text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">{value}</dd>
  </div>
);

export default Index;