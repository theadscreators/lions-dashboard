import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

export function useRequests() {
  const { profile, isAdmin, isProducer } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("requests")
        .select(`
          *,
          club:clubs!club_id(name, logo_url),
          creator:user_profiles!creator_id(name, role),
          comments:request_comments(
            id, 
            content, 
            created_at, 
            author:user_profiles!author_id(name, role)
          )
        `)
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      
      // Sort comments by created_at (oldest first or newest first, let's do oldest first so it reads top-to-bottom like a chat)
      const formattedData = data.map(req => ({
        ...req,
        comments: req.comments ? req.comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) : []
      }));
      
      setRequests(formattedData);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchRequests();
    }
  }, [profile]);

  const createRequest = async (requestData) => {
    try {
      const { error } = await supabase.from("requests").insert([{
        ...requestData,
        creator_id: profile.id
      }]);
      if (error) throw error;
      await fetchRequests();
      return { success: true };
    } catch (err) {
      console.error("Error creating request:", err);
      return { success: false, error: err.message };
    }
  };

  const updateRequestStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from("requests")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await fetchRequests();
      return { success: true };
    } catch (err) {
      console.error("Error updating request:", err);
      return { success: false, error: err.message };
    }
  };

  const addComment = async (requestId, content) => {
    try {
      const { error } = await supabase.from("request_comments").insert([{
        request_id: requestId,
        author_id: profile.id,
        content
      }]);
      if (error) throw error;
      await fetchRequests();
      return { success: true };
    } catch (err) {
      console.error("Error adding comment:", err);
      return { success: false, error: err.message };
    }
  };

  return { requests, loading, error, refetch: fetchRequests, createRequest, updateRequestStatus, addComment };
}
