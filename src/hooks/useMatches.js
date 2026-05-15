import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

/**
 * Fetches matches from Supabase with status and events.
 * @param {string|null} clubId - Filter by club ID, or null for all matches.
 * @param {boolean} ready - Only fetch when true (i.e., user is authenticated).
 */
export function useMatches(clubId = null, ready = true) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Define a window of time for the agenda (e.g., -7 days to +30 days)
      const now = new Date();
      const pastLimit = new Date(now);
      pastLimit.setDate(now.getDate() - 7);
      const futureLimit = new Date(now);
      futureLimit.setDate(now.getDate() + 30);

      // Fetch matches within the time window
      let query = supabase
        .from("matches")
        .select(`
          *,
          home_club:clubs!home_club_id(id, name, logo_url, clients(*)),
          away_club:clubs!away_club_id(id, name, logo_url)
        `)
        .gte("match_date", pastLimit.toISOString())
        .lte("match_date", futureLimit.toISOString())
        .order("match_date", { ascending: true })
        .limit(100);

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
      let eventsData = [];
      if (matchIds.length > 0) {
        const { data, error: eventsError } = await supabase
          .from("match_events")
          .select("*")
          .in("match_id", matchIds);
        if (eventsError) throw eventsError;
        eventsData = data || [];
      }

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
  }, [clubId]);

  useEffect(() => {
    if (ready) {
      fetchMatches();
    } else {
      setMatches([]);
      setLoading(false);
    }
  }, [ready, fetchMatches]);

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
