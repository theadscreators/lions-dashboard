import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

/**
 * Fetches matches from Supabase with status and events.
 * @param {string|null} clubId - Filter by club ID, or null for all matches.
 * @param {boolean} ready - Only fetch when true (i.e., user is authenticated).
 */
export function useMatches(clubId = null, ready = true, startDate = null, endDate = null) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Convert Date objects to string primitives to avoid infinite re-render loops in useCallback
  const startStr = startDate instanceof Date ? startDate.toISOString() : (startDate || "");
  const endStr = endDate instanceof Date ? endDate.toISOString() : (endDate || "");

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Define a window of time for the agenda
      let pastLimit, futureLimit;
      if (startStr && endStr) {
        // Use the displayed week bounds, but pad them slightly for safety (e.g., 1 day)
        pastLimit = new Date(startStr);
        pastLimit.setDate(pastLimit.getDate() - 1);
        
        futureLimit = new Date(endStr);
        futureLimit.setDate(futureLimit.getDate() + 1);
      } else {
        const now = new Date();
        futureLimit = new Date();
        futureLimit.setDate(futureLimit.getDate() + 30);
        
        pastLimit = new Date();
        pastLimit.setDate(pastLimit.getDate() - 10);
      }

      // Fetch matches within the time window
      let query = supabase
        .from("matches")
        .select(`
          *,
          leagues(id, name, countries(id, name, flag_emoji, code)),
          home_club:clubs!home_club_id(
            id, name, logo_url, status,
            clientes:clients(*),
            leagues(id, name, countries(id, name, flag_emoji, code))
          ),
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
        const matchEvents = eventsData.filter(e => e.match_id === m.id);
        
        // Robust status calculation in JS as fallback/override for the view
        let status = "scheduled";
        const hasDelivered = matchEvents.some(e => e.event_type === 'delivered');
        const hasApproved = matchEvents.some(e => e.event_type === 'producer_approved') && 
                            matchEvents.some(e => e.event_type === 'club_approved');
        const hasPlaylist = matchEvents.some(e => e.event_type === 'playlist_uploaded');
        const hasProdConfirmed = matchEvents.some(e => e.event_type === 'producer_confirmed');
        const hasClubConfirmed = matchEvents.some(e => e.event_type === 'club_confirmed');

        if (m.status === 'delivered' || hasDelivered) status = 'delivered';
        else if (hasApproved) status = 'approved';
        else if (hasPlaylist) status = 'playlist_ready';
        else if (hasProdConfirmed && hasClubConfirmed) status = 'all_confirmed';
        else if (hasProdConfirmed) status = 'producer_confirmed';
        else if (hasClubConfirmed) status = 'club_confirmed';

        const clubLeague = Array.isArray(m.home_club?.leagues) ? m.home_club.leagues[0] : m.home_club?.leagues;
        const matchLeague = Array.isArray(m.leagues) ? m.leagues[0] : m.leagues;
        const league = clubLeague || matchLeague;
        
        const country = Array.isArray(league?.countries) ? league.countries[0] : league?.countries;
        
        let flag = country?.flag_emoji;
        if (!flag && country?.code) {
          const flagMap = { cl: '🇨🇱', ec: '🇪🇨', pe: '🇵🇪', py: '🇵🇾' };
          flag = flagMap[country.code.toLowerCase()];
        }
        flag = flag || "⚽";

        let home_club = m.home_club;
        if (home_club && home_club.clientes) {
          home_club = {
            ...home_club,
            clientes: home_club.clientes.map(cl => ({
              id: cl.id,
              categoria: cl.category,
              nombre: cl.name,
              minutos: Number(cl.minutes) || 0,
              bonificados: Number(cl.bonified) || 0
            }))
          };
        }
        
        return {
          ...m,
          home_club,
          current_status: status,
          playlist_url: m.playlist_url || [...matchEvents].reverse().find(e => e.event_type === 'playlist_uploaded')?.payload?.playlist_url || null,
          events: matchEvents,
          // Flattened data for easier access
          country_flag: flag,
          country_code: country?.code || "",
          league_name: league?.name || "Liga",
          display_home_name: home_club?.name || m.home_team_name || "Equipo Local",
          display_away_name: m.away_club?.name || m.away_team_name || "Equipo Visitante",
          display_home_logo: home_club?.logo_url || m.home_team_logo,
          display_away_logo: m.away_club?.logo_url || m.away_team_logo
        };
      });

      setMatches(merged);
    } catch (err) {
      console.error("Error fetching matches:", err);
      setError(err.message);
      
      const errMsg = err.message || "";
      const isAuthError = 
        errMsg.toLowerCase().includes("jwt") || 
        errMsg.toLowerCase().includes("expired") || 
        errMsg.toLowerCase().includes("invalid signature") ||
        err.status === 401 ||
        err.status === 403;
        
      if (isAuthError) {
        console.warn("Detected expired or invalid session in useMatches. Cleaning session and reloading...");
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
          }
        });
        supabase.auth.signOut().catch(() => {}).then(() => {
          window.location.reload();
        });
      }
    } finally {
      setLoading(false);
    }
  }, [clubId, startStr, endStr]);

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

  const addMatch = async (homeClubId, awayTeamName, matchDate, venue, operationalNotes = "", pautaOverride = "default") => {
    try {
      const { error } = await supabase.from("matches").insert({
        home_club_id: homeClubId,
        away_team_name: awayTeamName,
        match_date: matchDate,
        venue: venue || null,
        operational_notes: operationalNotes || null,
        current_status: "scheduled",
        pauta_override: pautaOverride
      });
      if (error) throw error;
      await fetchMatches();
      return true;
    } catch (err) {
      console.error("Error adding match:", err);
      return false;
    }
  };

  const updateMatch = async (matchId, updates) => {
    try {
      const { error } = await supabase
        .from("matches")
        .update(updates)
        .eq("id", matchId);
      if (error) throw error;

      if (updates.pauta_override === 'vallas_led' && updates.home_club_id) {
        const { error: clubErr } = await supabase
          .from("clubs")
          .update({ status: 'activo' })
          .eq("id", updates.home_club_id);
        if (clubErr) console.error("Error updating club status:", clubErr);
      }

      await fetchMatches();
      return true;
    } catch (err) {
      console.error("Error updating match:", err);
      return false;
    }
  };

  const updateClubClients = async (clubId, newClients) => {
    try {
      const { data: current, error: fetchErr } = await supabase
        .from("clients")
        .select("id")
        .eq("club_id", clubId);
      if (fetchErr) throw fetchErr;

      const currentIds = (current || []).map(c => c.id);
      const newIds = newClients.filter(c => c.id).map(c => c.id);
      const deletedIds = currentIds.filter(id => !newIds.includes(id));

      if (deletedIds.length > 0) {
        const { error: delErr } = await supabase
          .from("clients")
          .delete()
          .in("id", deletedIds);
        if (delErr) throw delErr;
      }

      const toInsert = newClients.filter(c => !c.id).map(c => ({
        club_id: clubId,
        name: c.nombre,
        category: c.categoria.toUpperCase(),
        minutes: Number(c.minutos) || 0,
        bonified: Number(c.bonificados) || 0
      }));

      const toUpdate = newClients.filter(c => c.id).map(c => ({
        id: c.id,
        club_id: clubId,
        name: c.nombre,
        category: c.categoria.toUpperCase(),
        minutes: Number(c.minutos) || 0,
        bonified: Number(c.bonificados) || 0
      }));

      if (toInsert.length > 0) {
        const { error: insErr } = await supabase
          .from("clients")
          .insert(toInsert);
        if (insErr) throw insErr;
      }

      if (toUpdate.length > 0) {
        const { error: upsertErr } = await supabase
          .from("clients")
          .upsert(toUpdate);
        if (upsertErr) throw upsertErr;
      }

      await fetchMatches();
      return true;
    } catch (err) {
      console.error("Error updating club clients:", err?.message || err?.details || err);
      return false;
    }
  };

  return { matches, loading, error, refetch: fetchMatches, addMatchEvent, addMatch, updateMatch, updateClubClients };
}

