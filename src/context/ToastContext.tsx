import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextProps {
  showToast: (message: string, type?: ToastType) => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const [confirm, setConfirm] = useState<{ message: string, onConfirm: () => void } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const showConfirm = useCallback((message: string, onConfirm: () => void) => {
    setConfirm({ message, onConfirm });
  }, []);

  const handleConfirm = () => {
    if (confirm) {
      confirm.onConfirm();
      setConfirm(null);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}
      
      {/* Toast Notification */}
      {toast && (
        <div className={`custom-toast toast-${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'success' && '✅'}
            {toast.type === 'error' && '❌'}
            {toast.type === 'info' && 'ℹ️'}
          </div>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirm && (
        <div className="custom-modal-overlay" style={{zIndex: 9999}}>
          <div className="custom-modal-content glass-modal" style={{maxWidth: '400px'}}>
            <div className="custom-modal-body glass-modal-body" style={{padding: '24px'}}>
              <h3 style={{color: '#f1f0ff', marginBottom: '16px', marginTop: 0, fontSize: '18px', fontWeight: 600}}>Confirmar acción</h3>
              <p style={{color: 'rgba(196,181,253,0.9)', marginBottom: '24px', lineHeight: 1.5, fontSize: '15px'}}>{confirm.message}</p>
              <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                <button 
                  className="save-settings-btn" 
                  style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', width: 'auto', marginTop: 0, padding: '10px 20px', color: '#e8e4ff'}}
                  onClick={() => setConfirm(null)}
                >
                  Cancelar
                </button>
                <button 
                  className="save-settings-btn"
                  style={{background: 'linear-gradient(135deg, #ef4444, #b91c1c)', width: 'auto', marginTop: 0, padding: '10px 20px'}}
                  onClick={handleConfirm}
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
