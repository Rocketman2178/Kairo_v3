import { supabase } from '@/lib/supabase';

export interface SessionData {
  session_id: string;
  program_name: string;
  age_min: number;
  age_max: number;
  price_cents: number;
  level: string;
  location_name: string;
  city: string;
  coach_name: string | null;
  coach_rating: number | null;
  day_of_week: number;
  start_time: string;
  enrolled_count: number;
  capacity: number;
  urgency_level: string;
  status: string;
}

export {
  type TestScenario,
  type ScenarioCategory,
  generateScenariosFromSessions
} from './scenarioGenerator';

export async function fetchAllSessions(): Promise<SessionData[]> {
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      id,
      day_of_week,
      start_time,
      enrolled_count,
      capacity,
      urgency_level,
      status,
      programs:program_id (
        name,
        age_min,
        age_max,
        price_cents,
        level
      ),
      locations:location_id (
        name,
        city
      ),
      staff:coach_id (
        name,
        rating
      )
    `)
    .eq('status', 'active')
    .order('day_of_week')
    .order('start_time');

  if (error || !sessions) return [];

  return sessions.map((s: any) => ({
    session_id: s.id,
    program_name: s.programs?.name || 'Unknown',
    age_min: s.programs?.age_min || 0,
    age_max: s.programs?.age_max || 0,
    price_cents: s.programs?.price_cents || 0,
    level: s.programs?.level || '',
    location_name: s.locations?.name || 'Unknown',
    city: s.locations?.city || 'Unknown',
    coach_name: s.staff?.name || null,
    coach_rating: s.staff?.rating ? parseFloat(s.staff.rating) : null,
    day_of_week: s.day_of_week,
    start_time: s.start_time,
    enrolled_count: s.enrolled_count,
    capacity: s.capacity,
    urgency_level: s.urgency_level,
    status: s.status
  })).sort((a: SessionData, b: SessionData) => {
    if (a.program_name !== b.program_name) return a.program_name.localeCompare(b.program_name);
    if (a.city !== b.city) return a.city.localeCompare(b.city);
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
    return a.start_time.localeCompare(b.start_time);
  });
}
