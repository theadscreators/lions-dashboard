import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from user_profiles table
  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select(`
        *,
        user_club_assignments(club_id)
      `)
      .eq("id", userId)
      .single();
      
    if (!error && data) {
      const profileData = {
        ...data,
        club_ids: data.user_club_assignments?.map(a => a.club_id) || []
      };
      setProfile(profileData);
      return profileData;
    }
    return data;
  }, []);

  // Initial session check and auth change listener
  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id).catch(e => console.error("Profile fetch error:", e));
        }
      } catch (e) {
        console.error("Init error:", e);
      } finally {
        if (active) setLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await fetchProfile(currentUser.id).catch(e => console.error("Auth change profile fetch error:", e));
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Login with email/password
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  // Logout
  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error during logout:", err);
    } finally {
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  };

  // Derived state
  const role = profile?.role || "pending";
  const isAdmin = role === "admin";
  const isProducer = role === "producer";
  const isStaff = role === "admin" || role === "producer";

  return {
    user,
    profile,
    role,
    isAdmin,
    isProducer,
    isStaff,
    loading,
    login,
    logout,
  };
}
