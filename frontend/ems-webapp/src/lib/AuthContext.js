"use client"
import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, deleteUser } from "firebase/auth";
import { auth } from "./../../firebase.config.js";
import { useRouter, usePathname } from "next/navigation";
import { useNotification } from "./NotificationContext";
export const AuthContext = createContext();

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isGoogleUser, setIsGoogleUser] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const { addNotification } = useNotification();

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

    const login = async (email, password) => {
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setUser(userCredential.user);
            const username = userCredential.user.uid; // Using UID is safer for routing than email prefix
            router.push(`/${username}/dashboard`);
            return userCredential;
        } catch (error) {
            console.error("Login error:", error);
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                addNotification("Invalid email or password.", "error");
            } else {
                addNotification("Failed to log in: " + error.message, "error");
            }
        }
        finally {
            setLoading(false);
        }
    };

    const signup = async (email, password) => {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            setUser(userCredential.user);
            router.push(`/${userCredential.user.uid}/dashboard`);
            return userCredential;
        } catch (error) {
            console.error("Signup error:", error);
            if (error.code === 'auth/email-already-in-use') {
                addNotification("This email is already registered. Please try logging in.", "error");
            } else {
                addNotification("Failed to sign up: " + error.message, "error");
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
            addNotification("Failed to sign in with Google: " + error.message, "error");
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
            addNotification("Failed to delete account. You may need to re-authenticate.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, login, signup, logout, loginWithGoogle, deleteAccount, loading, isGoogleUser }}>{children}</AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
};
export const getUsernameFromEmail = (email) => {
    return email.split('@')[0];
};
