import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Users, Plus, Check, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const UserSwitcher = () => {
    const { users, currentUser, switchUser, addUser } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsAddingUser(false);
                setNewUserName('');
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);
    
    useEffect(() => {
        if (isAddingUser && isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isAddingUser, isOpen]);

    const handleAddUser = () => {
        if (newUserName.trim() !== '') {
            addUser(newUserName.trim());
            setNewUserName('');
            setIsAddingUser(false);
            setIsOpen(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleAddUser();
        } else if (e.key === 'Escape') {
            setIsAddingUser(false);
            setNewUserName('');
        }
    };
    
    const handleSwitchUser = (id: string) => {
        switchUser(id);
        setIsOpen(false);
    };

    if (!currentUser) return null;

    return (
        <div className="relative" ref={wrapperRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <Users size={16} />
                <span className="font-semibold hidden sm:inline">{currentUser.name}</span>
                <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 origin-top-left"
                >
                    <div className="p-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
                        <div className="px-3 py-2 text-xs font-semibold text-slate-400 tracking-wider">PROFILS</div>
                        {users.map(user => (
                            <button 
                                key={user.id} 
                                onClick={() => handleSwitchUser(user.id)}
                                className="w-full text-left rounded-md px-3 py-2 text-sm flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                role="menuitem"
                            >
                                {user.name}
                                {user.id === currentUser.id && <Check size={16} className="text-blue-500" />}
                            </button>
                        ))}
                        <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                        
                        {isAddingUser ? (
                            <div className="p-2 space-y-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Nom du profil"
                                    className="w-full text-sm block px-3 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                                <div className="flex items-center justify-end space-x-2">
                                     <button onClick={() => { setIsAddingUser(false); setNewUserName(''); }} className="px-3 py-1 text-xs rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600">
                                        Annuler
                                    </button>
                                    <button onClick={handleAddUser} className="px-3 py-1 text-xs rounded-md text-white bg-blue-600 hover:bg-blue-700">
                                        Ajouter
                                    </button>
                                </div>
                            </div>
                        ) : (
                             <button
                                onClick={() => setIsAddingUser(true)}
                                className="w-full text-left rounded-md px-3 py-2 text-sm flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                role="menuitem"
                            >
                                <Plus size={16} />
                                <span>Ajouter un profil</span>
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};

export default UserSwitcher;