"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAdminHeaders } from '../utils';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, Plus } from 'lucide-react';

interface AddFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddFilterDialog = ({ isOpen, onClose, onSuccess }: AddFilterDialogProps) => {
  const [pattern, setPattern] = useState("");
  const [action, setAction] = useState("block");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pattern.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/filters', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ pattern, action })
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(data.message);
        setPattern("");
        onSuccess();
        onClose();
      } else {
        showError(data.message);
      }
    } catch (err) {
      showError("حدث خطأ أثناء الإضافة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-800 text-right">إضافة قانون جديد</DialogTitle>
          <DialogDescription className="sr-only">نموذج إضافة قانون فلترة جديد لمحتوى الدردشة.</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label className="font-bold text-slate-500 mr-1">الكلمة أو العبارة</Label>
            <Input 
              placeholder="مثال: كلمة_بذيئة" 
              className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-right"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-slate-500 mr-1">نوع الإجراء</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold">
                <SelectValue placeholder="اختر نوع الفلترة" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100">
                <SelectItem value="block" className="font-bold">ممنوعة (استبدال بنجوم)</SelectItem>
                <SelectItem value="watch" className="font-bold">مراقبة (تسجيل فقط)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              className="flex-1 h-12 rounded-2xl font-black text-slate-400"
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !pattern.trim()}
              className="flex-1 h-12 rounded-2xl font-black shadow-lg shadow-primary/20"
            >
              {loading ? <Loader2 className="animate-spin" /> : "إضافة الآن"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFilterDialog;