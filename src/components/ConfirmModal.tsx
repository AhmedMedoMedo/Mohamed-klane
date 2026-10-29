import React from 'react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm soft-shadow">
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 mx-auto flex items-center justify-center text-xl mb-3">
            <i className="fa-solid fa-circle-exclamation"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">خد بالك!</h3>
          <p className="text-sm text-slate-600">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer"
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
    </div>
  );
};
