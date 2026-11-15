import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto w-[95%] max-w-md soft-shadow animate-fade">
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/70 text-red-500 dark:text-red-400 mx-auto flex items-center justify-center text-xl mb-3">
            <i className="fa-solid fa-circle-exclamation"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">خد بالك!</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer"
          >
            لأ، تراجع
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-bold text-sm transition shadow-lg shadow-red-500/30 cursor-pointer"
          >
            أيوه، متأكد
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
