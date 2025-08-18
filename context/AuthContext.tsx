import React, { createContext, useContext, useState, useEffect, FC, PropsWithChildren } from 'react';
import { auth } from '../firebase/config';
import firebase from 'firebase/compat/app';

// The compat User type
type User = firebase.User;
// The compat Auth service type
type Auth = firebase.auth.Auth;

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signup: Auth['createUserWithEmailAndPassword'];
    login: Auth['signInWithEmailAndPassword'];
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const logout = () => auth.signOut();
    
    const value = {
        currentUser,
        loading,
        signup: auth.createUserWithEmailAndPassword.bind(auth),
        login: auth.signInWithEmailAndPassword.bind(auth),
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};