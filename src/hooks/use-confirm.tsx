"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, HelpCircle, CheckCircle2 } from "lucide-react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "success";
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleClose = (value: boolean) => {
    setIsOpen(false);
    if (resolvePromise) resolvePromise(value);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="max-w-[400px] rounded-3xl border-none p-0 overflow-hidden shadow-2xl rtl">
          <div className={`h-2 w-full ${
            options?.variant === 'destructive' ? 'bg-red-500' : 
            options?.variant === 'success' ? 'bg-green-500' : 'bg-primary'
          }`} />
          
          <div className="p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className={`p-4 rounded-2xl ${
                options?.variant === 'destructive' ? 'bg-red-50 text-red-500' : 
                options?.variant === 'success' ? 'bg-green-50 text-green-500' : 'bg-blue-50 text-primary'
              }`}>
                {options?.variant === 'destructive' ? <AlertCircle size={32} /> : 
                 options?.variant === 'success' ? <CheckCircle2 size={32} /> : <HelpCircle size={32} />}
              </div>
              
              <div className="space-y-2">
                <AlertDialogTitle className="text-xl font-black text-slate-800">
                  {options?.title}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm font-bold text-slate-500 leading-relaxed">
                  {options?.message}
                </AlertDialogDescription>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button 
                variant="outline" 
                onClick={() => handleClose(false)}
                className="flex-1 h-12 rounded-2xl font-black border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                {options?.cancelText || "إلغاء"}
              </Button>
              <Button 
                onClick={() => handleClose(true)}
                className={`flex-1 h-12 rounded-2xl font-black shadow-lg ${
                  options?.variant === 'destructive' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 
                  options?.variant === 'success' ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20' : 
                  'bg-primary hover:bg-primary/90 shadow-primary/20'
                }`}
              >
                {options?.confirmText || "حسناً"}
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm must be used within a ConfirmProvider");
  return context;
};