import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft } from 'lucide-react';
import { Button } from './Button';
import { useDemoModal } from '../../contexts/DemoModalContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const { containerRef, isDemo } = useDemoModal();

  useEffect(() => {
    if (isOpen && !isDemo) {
      document.body.style.overflow = 'hidden';
    } else if (!isDemo) {
      document.body.style.overflow = 'unset';
    }

    return () => {
      if (!isDemo) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isOpen, isDemo]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  if (isDemo && containerRef?.current) {
    return createPortal(
      <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700 bg-slate-800">
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          </button>
          <h2 className="text-lg font-semibold text-white flex-1">{title}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>,
      containerRef.current
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        <div
          className={`relative bg-[#1a2332] border border-gray-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col`}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <Button
              onClick={onClose}
              className="p-2 hover:bg-[#0f1419] rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
