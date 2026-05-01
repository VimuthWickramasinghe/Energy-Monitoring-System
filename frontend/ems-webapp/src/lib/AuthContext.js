"use client"
import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "./../../firebase.config.js";
import { useRouter, usePathname } from "next/navigation";
export const AuthContext = createContext();

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                await fetchUserProfile(currentUser.uid);
            } else {
                setUser(null);
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
        if (user && (pathname === '/' || pathname === '/login' || pathname === '/signup')) {
            router.push(`/${user.uid}/dashboard`);
        }
    }, [user, loading, pathname, router]);

    const fetchUserProfile = async (uid) => {
        try {
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setProfile(docSnap.data());
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

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

    const signup = async (email, password, extraData = {}) => {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Create user profile in Firestore
            await setDoc(doc(db, "users", userCredential.user.uid), {
                email,
                uid: userCredential.user.uid,
                createdAt: new Date().toISOString(),
                ...extraData
            });

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

    const loginWithGoogle = async () => {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user profile exists, if not create it
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                await setDoc(docRef, {
                    email: user.email,
                    uid: user.uid,
                    createdAt: new Date().toISOString(),
                    displayName: user.displayName,
                    photoURL: user.photoURL
                });
            }

            router.push(`/${user.uid}/dashboard`);
        } catch (error) {
            console.error("Google sign-in error:", error);
            alert("Failed to sign in with Google: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, login, signup, logout, loginWithGoogle, loading, fetchUserProfile }}>{children}</AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
};
export const getUsernameFromEmail = (email) => {
    return email.split('@')[0];
};
