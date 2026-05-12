import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

export function useUsers() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select(`
          *,
          user_club_assignments(club_id)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const formattedUsers = data.map(u => ({
        ...u,
        club_ids: u.user_club_assignments?.map(a => a.club_id) || []
      }));
      
      setUsers(formattedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isAdmin]);

  const updateUserRole = async (userId, role) => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) throw error;
      await fetchUsers();
      return { success: true };
    } catch (err) {
      console.error("Error updating user role:", err);
      return { success: false, error: err.message };
    }
  };

  const updateUserClubs = async (userId, clubIds) => {
    try {
      // First delete all existing assignments
      const { error: deleteError } = await supabase
        .from("user_club_assignments")
        .delete()
        .eq("user_id", userId);
        
      if (deleteError) throw deleteError;
      
      // Then insert new assignments if any
      if (clubIds && clubIds.length > 0) {
        const assignments = clubIds.map(clubId => ({
          user_id: userId,
          club_id: clubId
        }));
        const { error: insertError } = await supabase
          .from("user_club_assignments")
          .insert(assignments);
          
        if (insertError) throw insertError;
      }
      
      await fetchUsers();
      return { success: true };
    } catch (err) {
      console.error("Error updating user clubs:", err);
      return { success: false, error: err.message };
    }
  };

  return { users, loading, error, refetch: fetchUsers, updateUserRole, updateUserClubs };
}
