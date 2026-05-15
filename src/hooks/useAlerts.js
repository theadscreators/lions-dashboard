import { useMemo } from "react";
import { calcStats } from "../lib/calcStats";
import { parseISO, differenceInHours } from "date-fns";

/**
 * Generates contextual alerts based on upcoming matches, requests, and club data.
 *
 * IMPORTANT: This hook does NOT fetch data itself. It receives pre-fetched data
 * as parameters. The previous version called useMatches() and useClubs() internally
 * without auth guards, which caused unauthenticated requests to Supabase that
 * either hung forever or were blocked by RLS policies.
 *
 * @param {object} profile - The authenticated user's profile
 * @param {Array} matches - Pre-fetched matches array (from useMatches)
 * @param {Array} requests - Pre-fetched requests array (from useRequests)
 * @param {Array} paises - Pre-fetched paises array (from useClubs)
 */
export function useAlerts(profile, matches = [], requests = [], paises = []) {
  const allEquipos = useMemo(() => paises.flatMap(p => p.equipos), [paises]);

  const alerts = useMemo(() => {
    if (!profile || !matches.length) return [];

    const newAlerts = [];
    const now = new Date();

    // Filtramos partidos que aún no suceden y son relevantes para el usuario
    const upcomingMatches = matches.filter(m => {
      const isRelevant = profile.role === 'admin' || profile.role === 'producer' || profile.club_ids?.includes(m.home_club_id);
      return isRelevant && new Date(m.match_date) > now;
    });

    upcomingMatches.forEach(match => {
      const matchDate = parseISO(match.match_date);
      const hoursUntil = differenceInHours(matchDate, now);
      
      const homeClub = allEquipos.find(e => e.id === match.home_club_id);
      const isHighAudience = ['Colo-Colo', 'U. de Chile', 'Barcelona SC', 'Alianza Lima'].some(t => 
        match.away_team_name?.includes(t) || match.away_club?.name?.includes(t)
      );

      // 1. Partido < 72hs + playlist no subida -> Urgente (Solo Admin/Producer)
      if (hoursUntil <= 72 && hoursUntil > 0 && match.current_status !== 'playlist_ready' && match.current_status !== 'approved' && match.current_status !== 'delivered') {
        if (profile.role === 'admin' || profile.role === 'producer') {
          newAlerts.push({
            id: `urgent_playlist_${match.id}`,
            type: 'urgent',
            title: `Playlist pendiente a ${hoursUntil}hs del partido`,
            description: `${homeClub?.nombre || 'Club'} vs ${match.away_team_name || 'Rival'}`,
            actionLink: '/agenda'
          });
        }
      }

      // 2. Partido < 48hs + sin confirmación club -> High (Para Club y Admins)
      const isClubConfirmed = match.events?.some(e => e.event_type === 'club_confirmed');
      if (hoursUntil <= 48 && hoursUntil > 0 && !isClubConfirmed) {
        if (profile.role === 'admin' || profile.role === 'producer' || profile.role === 'club_staff') {
          newAlerts.push({
            id: `high_unconfirmed_${match.id}`,
            type: 'warning',
            title: `Falta confirmación a ${hoursUntil}hs`,
            description: `El club debe confirmar la pauta para ${homeClub?.nombre} vs ${match.away_team_name}`,
            actionLink: '/agenda'
          });
        }
      }

      // Solo si tenemos los stats del club
      if (homeClub && (profile.role === 'admin' || profile.role === 'producer')) {
        const stats = calcStats(homeClub.clientes);

        // 3. Equipo con min disponibles + alta audiencia -> Opportunity
        if (stats.disponibles > 0 && isHighAudience) {
          newAlerts.push({
            id: `opp_audience_${match.id}`,
            type: 'opportunity',
            title: `Oportunidad: Alta Audiencia (${stats.disponibles}' libres)`,
            description: `Venta recomendada para el partido contra ${match.away_team_name || 'Rival'}`,
            actionLink: '/clientes'
          });
        }

        // 4. Partido de local + 0 minutos -> Sold Out Info
        if (stats.disponibles <= 0 && hoursUntil < 168) { // Muestra sold out si el partido es esta semana
          newAlerts.push({
            id: `info_soldout_${match.id}`,
            type: 'info',
            title: `Sold Out: ${homeClub.nombre}`,
            description: `Inventario completo para el partido de esta semana.`,
            actionLink: null
          });
        }
      }
    });

    // 5. Nueva solicitud + prioridad urgente -> Inmediata (Solo Admin/Producer)
    if (profile.role === 'admin' || profile.role === 'producer') {
      const urgentRequests = requests.filter(r => r.status === 'abierta' && r.priority === 'urgente');
      urgentRequests.forEach(req => {
        newAlerts.push({
          id: `req_urgent_${req.id}`,
          type: 'urgent',
          title: `Solicitud Urgente: ${req.club?.name || 'Club'}`,
          description: req.title,
          actionLink: '/ajustes'
        });
      });
    }

    return newAlerts;
  }, [matches, requests, allEquipos, profile]);

  return { alerts };
}
