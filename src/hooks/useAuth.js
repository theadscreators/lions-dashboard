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

  // Auth initialization
  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        // Race getSession against a 3-second timeout.
        // Why: If there's an expired token in localStorage, the Supabase client
        // tries to refresh it via network. On slow connections or cold-start
        // of the Supabase project, this can hang for 10-30 seconds.
        // We'd rather show the Login screen and let onAuthStateChange
        // pick up the refreshed session in the background.
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve({ data: { session: null }, timedOut: true }), 3000)
        );

        const result = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (!active) return;

        if (result.timedOut) {
          console.warn("getSession timed out after 3s — showing Login. onAuthStateChange will restore session if token refreshes.");
          setLoading(false);
          return;
        }

        const session = result.data.session;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchProfile(currentUser.id).catch(e => 
            console.error("Profile fetch error:", e)
          );
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        if (active) setLoading(false);
      }
    };

    initialize();

    // Listen for future auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!active) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id).catch(e =>
            console.error("Auth change profile fetch error:", e)
          );
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

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
