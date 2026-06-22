import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../lib/supabase";

/**
 * Fetches all data from Supabase and transforms it into the
 * same PAISES shape that the existing components expect.
 * 
 * IMPORTANT: Only fetches when `ready` is true (i.e., user is authenticated).
 * This prevents unauthenticated requests from hanging due to RLS policies.
 */
export function useClubs(ready = false) {
  const [countries, setCountries] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Race the data fetch against a 10-second timeout.
      // Prevents the "Cargando datos de Supabase..." spinner from hanging forever
      // if Supabase is slow, RLS policies block silently, or the project is cold-starting.
      const fetchPromise = Promise.all([
        supabase.from("countries").select("*").order("name"),
        supabase.from("leagues").select("*"),
        supabase.from("clubs").select("*").order("name"),
        supabase.from("clients").select("*"),
      ]);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: Supabase no respondió en 10 segundos. Intentá recargar.")), 10000)
      );

      const [countriesRes, leaguesRes, clubsRes, clientsRes] = await Promise.race([
        fetchPromise,
        timeoutPromise,
      ]);

      if (countriesRes.error) throw countriesRes.error;
      if (leaguesRes.error) throw leaguesRes.error;
      if (clubsRes.error) throw clubsRes.error;
      if (clientsRes.error) throw clientsRes.error;

      if (countriesRes.data?.length === 0) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn("Detected expired session. Redirecting to login...");
          await supabase.auth.signOut();
          window.location.reload();
          return;
        }
      }

      setCountries(countriesRes.data || []);
      setLeagues(leaguesRes.data || []);
      setClubs(clubsRes.data || []);
      setClients(clientsRes.data || []);
    } catch (err) {
      console.error("Error fetching data from Supabase:", err);
      setError(err.message || "Error al cargar datos");
      
      const errMsg = err.message || "";
      const isAuthError = 
        errMsg.toLowerCase().includes("jwt") || 
        errMsg.toLowerCase().includes("expired") || 
        errMsg.toLowerCase().includes("invalid signature") ||
        err.status === 401 ||
        err.status === 403;
        
      if (isAuthError) {
        console.warn("Detected expired or invalid session in useClubs. Cleaning and reloading...");
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
  }, []);

  // Only fetch when ready (authenticated). No onAuthStateChange listener needed
  // because App.jsx will pass ready=true/false based on auth state.
  useEffect(() => {
    if (ready) {
      fetchAll();
    } else {
      // Reset state when not ready (logged out)
      setCountries([]);
      setLeagues([]);
      setClubs([]);
      setClients([]);
      setLoading(false);
      setError(null);
    }
  }, [ready, fetchAll]);

  // Transform into the PAISES format the UI expects
  const paises = useMemo(() => {
    if (!countries.length) return [];

    // Pre-index leagues by country_id
    const leaguesByCountry = {};
    leagues.forEach(l => {
      if (!leaguesByCountry[l.country_id]) leaguesByCountry[l.country_id] = [];
      leaguesByCountry[l.country_id].push(l);
    });

    // Pre-index clubs by league_id
    const clubsByLeague = {};
    clubs.forEach(c => {
      if (!clubsByLeague[c.league_id]) clubsByLeague[c.league_id] = [];
      clubsByLeague[c.league_id].push(c);
    });

    // Pre-index clients by club_id
    const clientsByClub = {};
    clients.forEach(cl => {
      if (!clientsByClub[cl.club_id]) clientsByClub[cl.club_id] = [];
      clientsByClub[cl.club_id].push(cl);
    });

    return countries.map(country => {
      const countryLeagues = leaguesByCountry[country.id] || [];
      const primaryLeague = countryLeagues[0]; // Each country has one main league

      // All clubs for all leagues in this country
      const allClubs = countryLeagues.flatMap(l => clubsByLeague[l.id] || []);

      return {
        id: country.code, // "cl", "ec", "pe"
        nombre: country.name,
        bandera: country.flag_emoji || "",
        codigo: country.code,
        activo: country.active,
        leagueId: primaryLeague?.api_id?.toString() || null,
        equipos: allClubs.map(club => ({
          id: club.id, // UUID now instead of slug
          nombre: club.name,
          logo: club.logo_url,
          estado: club.status || "activo",
          notas: club.notes || "",
          tsdbName: "", // Not used anymore
          clientes: (clientsByClub[club.id] || []).map(cl => ({
            id: cl.id,
            categoria: cl.category, // 'LIONS', 'CLUB', 'OTROS'
            nombre: cl.name,
            minutos: Number(cl.minutes) || 0,
            bonificados: Number(cl.bonified) || 0,
          })),
        })),
      };
    });
  }, [countries, leagues, clubs, clients]);

  // Actions for Admin
  const addCountry = async (name, code, flag_emoji) => {
    try {
      const { data, error } = await supabase.from("countries").insert({ name, code, flag_emoji, active: true }).select().single();
      if (error) throw error;
      // Auto-create a default league for the country
      const { error: leagueError } = await supabase.from("leagues").insert({ country_id: data.id, name: `Primera ${name}` });
      if (leagueError) console.error("Error creating default league:", leagueError);
      await fetchAll();
      return true;
    } catch (err) {
      console.error("Error adding country:", err);
      return false;
    }
  };

  const addClub = async (countryCode, name, logoUrl) => {
    try {
      const country = countries.find(c => c.code === countryCode);
      if (!country) throw new Error("Country not found");
      const league = leagues.find(l => l.country_id === country.id);
      if (!league) throw new Error("No league found for this country");

      const { error } = await supabase.from("clubs").insert({
        league_id: league.id,
        name,
        logo_url: logoUrl || "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg",
        status: "activo"
      });
      if (error) throw error;
      await fetchAll();
      return true;
    } catch (err) {
      console.error("Error adding club:", err);
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

      await fetchAll();
      return true;
    } catch (err) {
      console.error("Error updating club clients:", err?.message || err?.details || err);
      return false;
    }
  };

  return { paises, loading, error, refetch: fetchAll, addCountry, addClub, updateClubClients };
}
