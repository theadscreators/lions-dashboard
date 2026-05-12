import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";

/**
 * Fetches all data from Supabase and transforms it into the
 * same PAISES shape that the existing components expect.
 * This way TeamCard, TeamDetail, Ligas, Clientes all work unchanged.
 */
export function useClubs() {
  const [countries, setCountries] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [countriesRes, leaguesRes, clubsRes, clientsRes] = await Promise.all([
        supabase.from("countries").select("*").order("name"),
        supabase.from("leagues").select("*"),
        supabase.from("clubs").select("*").order("name"),
        supabase.from("clients").select("*"),
      ]);

      if (countriesRes.error) throw countriesRes.error;
      if (leaguesRes.error) throw leaguesRes.error;
      if (clubsRes.error) throw clubsRes.error;
      if (clientsRes.error) throw clientsRes.error;

      setCountries(countriesRes.data || []);
      setLeagues(leaguesRes.data || []);
      setClubs(clubsRes.data || []);
      setClients(clientsRes.data || []);
    } catch (err) {
      console.error("Error fetching data from Supabase:", err);
      setError(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

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
            categoria: cl.category, // 'LIONS', 'CLUB', 'OTROS'
            nombre: cl.name,
            minutos: Number(cl.minutes) || 0,
            bonificados: Number(cl.bonified) || 0,
          })),
        })),
      };
    });
  }, [countries, leagues, clubs, clients]);

  return { paises, loading, error, refetch: fetchAll };
}
