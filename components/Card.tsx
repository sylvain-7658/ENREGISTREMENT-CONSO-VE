import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden ${className}`}>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;