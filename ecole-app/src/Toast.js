import React, { useState, useCallback } from 'react';

let toastId = 0;
let globalAddToast = null;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = 'success') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  globalAddToast = addToast;
  return { toasts, addToast };
};

export const showToast = (msg, type = 'success') => {
  if (globalAddToast) globalAddToast(msg, type);
};

export const ToastContainer = ({ toasts }) => (
  <div className="toast-container">
    {toasts.map(t => (
      <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
    ))}
  </div>
);
