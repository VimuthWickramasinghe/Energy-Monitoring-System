"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { client as supabase } from "../utils/supabase/client";

export interface Profile {
    user_id: string;
    user_name: string | null;
    firebase_uid: string;
    phone: string | null;
    [key: string]: any;
}

export interface ProfileContextType {
    profile: Profile | null;
    loadingProfile: boolean;
    error: string | null;
    fetchProfile: () => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
    uploadAvatar: (file: File) => Promise<string>;
}

export const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
    const { user, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const updateProfile = async (updates: Partial<Profile>) => {
        if (!profile?.user_id) {
            throw new Error("No profile found to update.");
        }

        const { error: updateError } = await supabase
            .from("PROFILE")
            .update(updates)
            .eq("user_id", profile.user_id);

        if (updateError) {
            throw updateError;
        }

        setProfile((prev) => prev ? { ...prev, ...updates } : null);
    };

    const uploadAvatar = async (file: File) => {
        if (!profile?.user_id) throw new Error("No profile found.");

        const fileExt = file.name.split('.').pop();
        const fileName = `${profile.user_id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('profile_avatar')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError || !uploadData) throw uploadError || new Error("Failed to upload image to storage.");

        const { data: { publicUrl } } = supabase.storage
            .from('profile_avatar')
            .getPublicUrl(filePath);

        await updateProfile({
            avatar_url: publicUrl
        });

        return publicUrl;
    };

    const fetchProfile = async () => {
        if (!user?.uid) {
            setProfile(null);
            setError("No authenticated user.");
            setLoadingProfile(false);
            return;
        }

        setLoadingProfile(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from("PROFILE")
                .select("*")
                .eq("firebase_uid", user.uid)
                .single();

            if (fetchError && fetchError.code === 'PGRST116') {
                // Profile doesn't exist, create it
                const { data: newData, error: insertError } = await supabase
                    .from("PROFILE")
                    .insert([{ 
                        firebase_uid: user.uid,
                        user_name: user.displayName || user.email?.split('@')[0] || 'New User'
                    }])
                    .select()
                    .single();

                if (insertError) throw new Error(insertError.message);
                setProfile(newData);
            } else if (fetchError) {
                throw new Error(fetchError.message);
            } else {
                setProfile(data);
            }

        } catch (err: any) {
            console.error("Error fetching profile:", err);
            setError(err.message || "Failed to load profile.");
            setProfile(null);
        } finally {
            setLoadingProfile(false);
        }
    };
    useEffect(() => {
        if (authLoading) return;

        if (user) {
            fetchProfile();
        } else {
            setProfile(null);
            setLoadingProfile(false);
            setError(null);
        }
    }, [user, authLoading]);

    return (
        <ProfileContext.Provider value={{ profile, loadingProfile, error, fetchProfile, updateProfile, uploadAvatar }}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error("useProfile must be used within a ProfileProvider");
    }
    return context;
};
