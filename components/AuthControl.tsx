
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const AuthControl = () => {
    const { user, logout } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);
    
    if (!user) return null;

    return (
        <div className="relative" ref={wrapperRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <UserIcon size={16} />
                <span className="font-semibold hidden sm:inline truncate max-w-[150px]">{user.email}</span>
                <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 origin-top-right"
                >
                    <div className="p-1" role="menu" aria-orientation="vertical">
                        <div className="px-3 py-2">
                            <p className="text-sm text-slate-700 dark:text-slate-200">Connecté en tant que</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{user.email}</p>
                        </div>
                        <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                        <button
                            onClick={logout}
                            className="w-full text-left rounded-md px-3 py-2 text-sm flex items-center space-x-2 text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            role="menuitem"
                        >
                            <LogOut size={16} />
                            <span>Déconnexion</span>
                        </button>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};

export default AuthControl;
