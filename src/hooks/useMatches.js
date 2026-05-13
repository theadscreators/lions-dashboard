import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useMatches(clubId = null) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      // Fetch matches with home and away club details
      let query = supabase
        .from("matches")
        .select(`
          *,
          home_club:clubs!home_club_id(id, name, logo_url, clients(*)),
          away_club:clubs!away_club_id(id, name, logo_url)
        `)
        .order("match_date", { ascending: true });

      if (clubId) {
        query = query.or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`);
      }

      const { data: matchesData, error: matchesError } = await query;
      if (matchesError) throw matchesError;

      // Fetch statuses from the view
      const { data: statusData, error: statusError } = await supabase
        .from("match_status")
        .select("*");
      if (statusError) throw statusError;

      // Fetch all events for these matches to know who approved/confirmed
      const matchIds = matchesData.map(m => m.id);
      const { data: eventsData, error: eventsError } = await supabase
        .from("match_events")
        .select("*")
        .in("match_id", matchIds);
      if (eventsError) throw eventsError;

      // Merge data
      const merged = matchesData.map(m => {
        const statusRecord = statusData.find(s => s.match_id === m.id);
        const matchEvents = eventsData.filter(e => e.match_id === m.id);
        return {
          ...m,
          current_status: statusRecord?.status || "scheduled",
          playlist_url: statusRecord?.playlist_url || null,
          events: matchEvents
        };
      });

      setMatches(merged);
    } catch (err) {
      console.error("Error fetching matches:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [clubId]);

  // Function to add a new event (change status)
  const addMatchEvent = async (matchId, eventType, actorId, actorName, payload = {}, notes = "") => {
    try {
      const { error } = await supabase.from("match_events").insert({
        match_id: matchId,
        event_type: eventType,
        actor_id: actorId,
        actor_name: actorName,
        payload,
        notes
      });
      if (error) throw error;
      await fetchMatches(); // Refresh data
      return true;
    } catch (err) {
      console.error("Error adding match event:", err);
      return false;
    }
  };

  const addMatch = async (homeClubId, awayTeamName, matchDate, venue, operationalNotes = "") => {
    try {
      const { error } = await supabase.from("matches").insert({
        home_club_id: homeClubId,
        away_team_name: awayTeamName,
        match_date: matchDate,
        venue: venue || null,
        operational_notes: operationalNotes || null,
        current_status: "scheduled"
      });
      if (error) throw error;
      await fetchMatches();
      return true;
    } catch (err) {
      console.error("Error adding match:", err);
      return false;
    }
  };

  return { matches, loading, error, refetch: fetchMatches, addMatchEvent, addMatch };
}
