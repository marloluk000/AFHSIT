import React, { useEffect } from 'react';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  isDestructive?: boolean;
}

const Modal: React.FC<ModalProps> = ({ title, children, onClose, onConfirm, confirmText = "Confirm", isDestructive = false }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const confirmButtonClass = isDestructive 
    ? "bg-red-600 hover:bg-red-700 text-white"
    : "bg-white hover:bg-gray-200 text-black";

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-fast"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl w-full max-w-md m-4 p-6 text-gray-200 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
        <div className="mb-6">{children}</div>
        <div className="flex justify-end gap-4">
          <button 
            onClick={onClose} 
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            {onConfirm ? "Cancel" : "Close"}
          </button>
          {onConfirm && (
            <button 
              onClick={onConfirm} 
              className={`${confirmButtonClass} font-bold py-2 px-4 rounded-lg transition-colors`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
