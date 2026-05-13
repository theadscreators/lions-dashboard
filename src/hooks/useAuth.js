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

  // Listen for auth state changes
  useEffect(() => {
    // Get initial session
    const checkSession = async () => {
      try {
        // Set a safety timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Auth session check timed out")), 5000);
        });

        const getSessionPromise = supabase.auth.getSession();
        
        const { data: { session }, error } = await Promise.race([
          getSessionPromise,
          timeoutPromise
        ]);

        if (error) throw error;

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
        }
      } catch (err) {
        console.error("Error checking auth session:", err);
        // If it timed out or failed, clear local storage to fix potential corruption
        localStorage.removeItem('sb-snjtpmtzfeqpkuxnxxjg-auth-token');
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
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
