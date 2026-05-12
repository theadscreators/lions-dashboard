import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

export function useWorkLog() {
  const { profile, isAdmin, isProducer } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      // Admins see net_value, others don't (handled by columns select)
      const columns = isAdmin 
        ? "*, club:clubs(name), worker:user_profiles(name), match:matches(match_date, home_club:clubs!home_club_id(name), away_club:clubs!away_club_id(name), away_team_name)"
        : "id, request_id, worker_id, club_id, description, date_done, currency, billing_type, task_type, dropbox_link, match_id, status, created_at, club:clubs(name), worker:user_profiles(name), match:matches(match_date, home_club:clubs!home_club_id(name), away_club:clubs!away_club_id(name), away_team_name)";

      let query = supabase
        .from("work_entries")
        .select(columns)
        .order("date_done", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setEntries(data);
    } catch (err) {
      console.error("Error fetching work log:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile && (isAdmin || isProducer)) {
      fetchEntries();
    }
  }, [profile, isAdmin, isProducer]);

  const addEntry = async (entryData) => {
    try {
      const { error } = await supabase.from("work_entries").insert([{
        ...entryData,
        worker_id: profile.id
      }]);
      if (error) throw error;
      await fetchEntries();
      return { success: true };
    } catch (err) {
      console.error("Error adding work entry:", err);
      return { success: false, error: err.message };
    }
  };

  const updateEntry = async (id, updates) => {
    try {
      const { error } = await supabase
        .from("work_entries")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
      await fetchEntries();
      return { success: true };
    } catch (err) {
      console.error("Error updating work entry:", err);
      return { success: false, error: err.message };
    }
  };

  const deleteEntry = async (id) => {
    try {
      const { error } = await supabase
        .from("work_entries")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await fetchEntries();
      return { success: true };
    } catch (err) {
      console.error("Error deleting work entry:", err);
      return { success: false, error: err.message };
    }
  };

  return { entries, loading, error, refetch: fetchEntries, addEntry, updateEntry, deleteEntry };
}
