import React from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div className="fixed top-20 left-4 right-4 z-50 flex flex-col gap-2 max-w-sm mx-auto pointer-events-none">
      {toasts.map((toast) => {
        const bg =
          toast.type === 'success'
            ? 'bg-emerald-600'
            : toast.type === 'error'
            ? 'bg-red-600'
            : 'bg-slate-800';
        const icon =
          toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-xmark';

        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white animate-fade text-sm font-bold ${bg} pointer-events-auto`}
          >
            <i className={`fa-solid ${icon} text-lg`}></i>
            <div>{toast.message}</div>
          </div>
        );
      })}
    </div>
  );
};
