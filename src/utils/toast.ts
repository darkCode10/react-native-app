// This file is now a placeholder for backward compatibility
// The actual toast implementation is in components/Toast.tsx
// Import and use useToast() hook from components/Toast.tsx instead

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
    type: ToastType;
    message: string;
    duration?: number;
}

// For non-hook contexts, we'll create a singleton toast manager
let toastInstance: ((config: ToastConfig) => void) | null = null;

export const setToastInstance = (instance: (config: ToastConfig) => void) => {
    toastInstance = instance;
};

export const toast = {
    success: (message: string, duration?: number) => {
        if (toastInstance) {
            toastInstance({ type: 'success', message, duration });
        } else {
            console.warn('Toast instance not initialized');
        }
    },
    error: (message: string, duration?: number) => {
        if (toastInstance) {
            toastInstance({ type: 'error', message, duration });
        } else {
            console.warn('Toast instance not initialized');
        }
    },
    warning: (message: string, duration?: number) => {
        if (toastInstance) {
            toastInstance({ type: 'warning', message, duration });
        } else {
            console.warn('Toast instance not initialized');
        }
    },
    info: (message: string, duration?: number) => {
        if (toastInstance) {
            toastInstance({ type: 'info', message, duration });
        } else {
            console.warn('Toast instance not initialized');
        }
    },
};




