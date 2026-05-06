"use client"
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, deleteUser, User, UserCredential } from "firebase/auth";
import { auth } from "../../firebase.config.js";
import { useRouter, usePathname } from "next/navigation";
import { useNotification } from "./NotificationContext.js";

interface AuthContextType {
    user: User | null;
    profile: any | null;
    login: (email: string, password: string) => Promise<UserCredential | undefined>;
    signup: (email: string, password: string) => Promise<UserCredential | undefined>;
    logout: () => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    loading: boolean;
    isGoogleUser: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null); // for Firebase
    const [profile, setProfile] = useState<any | null>(null); // for supabase
    const [isGoogleUser, setIsGoogleUser] = useState(false); 
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const notificationContext = useNotification();
    const addNotification = notificationContext?.addNotification;

    // Listen for Auth changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setIsGoogleUser(currentUser.providerData.some(p => p.providerId === 'google.com'));
            } else {
                setUser(null);
                setIsGoogleUser(false);
                setProfile(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (loading) return;

        // If not logged in and trying to access a dashboard route
        if (!user && pathname !== '/' && pathname !== '/login' && pathname !== '/signup') {
            router.push('/login');
        }

        // If logged in and trying to access home/login/signup, redirect to dashboard
        if (user && (pathname === '/login' || pathname === '/signup')) {
            router.push(`/${user.email}/dashboard`);
        }
        if (user && pathname !== '/' && !pathname.startsWith(`/${user.email}`)) {
            router.push(`/${user.email}/dashboard`);
        }
    }, [user, loading, pathname, router]);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setUser(userCredential.user);
            const username = userCredential.user.uid; // Using UID is safer for routing than email prefix
            router.push(`/${username}/dashboard`);
            return userCredential;
        } catch (error) {
            console.error("Login error:", error);
            if ((error as any).code === 'auth/invalid-credential' || (error as any).code === 'auth/user-not-found' || (error as any).code === 'auth/wrong-password') {
                addNotification?.("Invalid email or password.", "error");
            } else {
                addNotification?.("Failed to log in: " + (error as Error).message, "error");
            }
        }
        finally {
            setLoading(false);
        }
    };

    const signup = async (email: string, password: string) => {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            setUser(userCredential.user);
            router.push(`/${userCredential.user.uid}/dashboard`);
            return userCredential;
        } catch (error) {
            console.error("Signup error:", error);
            if ((error as any).code === 'auth/email-already-in-use') {
                addNotification?.("This email is already registered. Please try logging in.", "error");
            } else {
                addNotification?.("Failed to sign up: " + (error as Error).message, "error");
            }
        }
        finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            router.push('/');
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setLoading(false);
        }
    };

    const loginWithGoogle = async () => {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            router.push(`/${user.uid}/dashboard`);
        } catch (error) {
            console.error("Google sign-in error:", error);
            addNotification?.("Failed to sign in with Google: " + (error as Error).message, "error");
        } finally {
            setLoading(false);
        }
    };

    const deleteAccount = async () => {
        if (!user) return;
        const confirmDelete = window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.");
        if (!confirmDelete) return;

        setLoading(true);
        try {
            await deleteUser(user);

            router.push('/');
        } catch (error) {
            console.error("Delete account error:", error);
            addNotification?.("Failed to delete account. You may need to re-authenticate.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, login, signup, logout, loginWithGoogle, deleteAccount, loading, isGoogleUser }}>{children}</AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
export const getUsernameFromEmail = (email: string) => {
    return email.split('@')[0];
};
