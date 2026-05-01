"use client"
import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../../firebase.config";
import { useRouter, usePathname } from "next/navigation";
export const AuthContext = createContext();

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);

            // If not logged in and trying to access a dashboard route
            if (!user && pathname !== '/' && pathname !== '/login' && pathname !== '/signup') {
                router.push('/login');
            }

            // If logged in and trying to access home/login/signup, redirect to dashboard
            if (user && (pathname === '/' || pathname === '/login' || pathname === '/signup')) {
                router.push(`/${user.uid}/dashboard`);
            }
        });
        return () => unsubscribe();
    }, [pathname, router]);

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
                alert("Invalid email or password.");
            } else {
                alert("Failed to log in: " + error.message);
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
                alert("This email is already registered. Please try logging in.");
            } else {
                alert("Failed to sign up: " + error.message);
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

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>{children}</AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
};
export const getUsernameFromEmail = (email) => {
    return email.split('@')[0];
};
