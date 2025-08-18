import React from 'react';
import { motion } from 'framer-motion';
import { X, WifiOff, CheckCircle } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: 'warning' | 'success';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const isWarning = type === 'warning';
  
  const icon = isWarning ? <WifiOff size={20} /> : <CheckCircle size={20} />;
  const colors = isWarning 
    ? "bg-amber-100 border-amber-400 text-amber-800 dark:bg-amber-900/50 dark:border-amber-600 dark:text-amber-200"
    : "bg-green-100 border-green-400 text-green-800 dark:bg-green-900/50 dark:border-green-600 dark:text-green-200";

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={`fixed bottom-4 right-4 z-50 max-w-sm w-full p-4 rounded-lg shadow-lg border ${colors} no-print`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">{icon}</div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={onClose}
            className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isWarning 
              ? 'hover:bg-amber-200 dark:hover:bg-amber-800 focus:ring-amber-500 focus:ring-offset-amber-100 dark:focus:ring-offset-amber-900/50' 
              : 'hover:bg-green-200 dark:hover:bg-green-800 focus:ring-green-500 focus:ring-offset-green-100 dark:focus:ring-offset-green-900/50'
            }`}
          >
            <span className="sr-only">Fermer</span>
            <X size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Notification;
