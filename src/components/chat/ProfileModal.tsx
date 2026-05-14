"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Bell, 
  UserPlus, 
  MessageCircle, 
  Gift, 
  Shield, 
  Crown, 
  MapPin,
  Settings,
  Ban,
  Trash2,
  MoveRight,
  Edit3
} from 'lucide-react';

interface ProfileModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

const ProfileModal = ({ user, isOpen, onClose, isAdmin = true }: ProfileModalProps) => {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-3xl rtl">
        {/* Cover & Avatar */}
        <div className="relative h-32 bg-gradient-to-r from-primary to-blue-600">
          <div className="absolute -bottom-12 right-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
          </div>
        </div>

        <div className="pt-14 px-6 pb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
                {user.role === 'admin' && <Crown className="text-red-500" size={20} />}
                <Badge className="bg-blue-50 text-blue-600 border-blue-100">موثق</Badge>
              </div>
              <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                <MapPin size={14} /> {user.country} • {user.room}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="outline" className="rounded-full w-10 h-10">
                <Bell size={18} />
              </Button>
              <Button size="icon" variant="outline" className="rounded-full w-10 h-10">
                <UserPlus size={18} />
              </Button>
            </div>
          </div>

          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            "هذا النص هو مثال لحالة العضو أو الزخرفة الخاصة به، يمكن للعضو كتابة ما يريد هنا."
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-2xl">
            <StatItem label="إعجاب" value={user.rep} />
            <StatItem label="نقاط" value={user.points} />
            <StatItem label="هدايا" value="24" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-8">
            <Button className="flex-1 h-12 rounded-xl gap-2 font-bold">
              <MessageCircle size={18} /> خاص
            </Button>
            <Button variant="secondary" className="flex-1 h-12 rounded-xl gap-2 font-bold">
              <Gift size={18} /> إهداء
            </Button>
          </div>

          {/* Admin Tools */}
          {isAdmin && (
            <div className="border-t pt-6">
              <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">أدوات الإدارة</h4>
              <div className="grid grid-cols-2 gap-2">
                <AdminButton icon={<Edit3 size={16} />} label="تعديل البيانات" />
                <AdminButton icon={<MoveRight size={16} />} label="نقل لغرفة" />
                <AdminButton icon={<Shield size={16} />} label="تعديل الرتبة" />
                <AdminButton icon={<Ban size={16} />} label="حظر العضو" danger />
                <AdminButton icon={<Trash2 size={16} />} label="طرد عام" danger />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const StatItem = ({ label, value }: any) => (
  <div className="text-center">
    <div className="text-lg font-bold text-slate-900">{value}</div>
    <div className="text-[10px] text-slate-500 font-medium uppercase">{label}</div>
  </div>
);

const AdminButton = ({ icon, label, danger }: any) => (
  <Button 
    variant="ghost" 
    size="sm" 
    className={`justify-start gap-2 h-10 rounded-xl text-xs font-bold ${danger ? 'text-red-500 hover:bg-red-50 hover:text-red-600' : 'text-slate-600 hover:bg-slate-100'}`}
  >
    {icon}
    {label}
  </Button>
);

export default ProfileModal;