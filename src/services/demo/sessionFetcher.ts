import { supabase } from '../../lib/supabase';

export interface SessionSearchCriteria {
  ageMin?: number;
  ageMax?: number;
  dayOfWeek?: string;
  programName?: string;
  location?: string;
  coachName?: string;
  limit?: number;
}

export interface SessionRecommendation {
  sessionId: string;
  programName: string;
  programDescription: string;
  price: number;
  durationWeeks: number;
  ageRange?: string;
  locationName: string;
  locationAddress: string;
  locationId?: string;
  locationRating?: number | null;
  coachName: string;
  coachId?: string;
  coachRating: number | null;
  sessionRating?: number | null;
  dayOfWeek: string;
  startTime: string;
  startDate: string;
  capacity: number;
  enrolledCount: number;
  spotsRemaining: number;
  fillRatePercent?: number;
  urgencyLevel?: 'full' | 'filling_fast' | 'moderate' | 'available';
}

const DAY_MAP: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday'
};

export async function fetchSessionRecommendations(
  organizationId: string,
  criteria: SessionSearchCriteria
): Promise<SessionRecommendation[]> {
  try {
    let query = supabase
      .from('sessions')
      .select(`
        id,
        start_date,
        start_time,
        day_of_week,
        capacity,
        enrolled_count,
        programs!inner (
          name,
          description,
          age_range,
          price_cents,
          duration_weeks
        ),
        locations (
          id,
          name,
          address
        ),
        staff (
          id,
          name,
          rating
        )
      `)
      .eq('status', 'active')
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true });

    if (criteria.dayOfWeek) {
      const dayNumber = Object.entries(DAY_MAP).find(([_, day]) => day === criteria.dayOfWeek)?.[0];
      if (dayNumber) {
        query = query.eq('day_of_week', parseInt(dayNumber));
      }
    }

    if (criteria.programName) {
      query = query.ilike('programs.name', `%${criteria.programName}%`);
    }

    const { data, error } = await query.limit(criteria.limit || 10);

    if (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }

    if (!data) return [];

    // Filter by age if criteria provided
    let filtered = data;
    if (criteria.ageMin !== undefined || criteria.ageMax !== undefined) {
      filtered = data.filter((session: any) => {
        if (!session.programs?.age_range) return true;

        const match = session.programs.age_range.match(/\[(\d+),(\d+)\)/);
        if (!match) return true;

        const programAgeMin = parseInt(match[1]);
        const programAgeMax = parseInt(match[2]) - 1;

        if (criteria.ageMin && criteria.ageMin < programAgeMin) return false;
        if (criteria.ageMax && criteria.ageMax > programAgeMax) return false;

        return true;
      });
    }

    // Fetch location ratings
    const locationRatings = await fetchLocationRatings(organizationId);

    // Fetch session ratings
    const sessionIds = filtered.map((s: any) => s.id);
    const sessionRatings = await fetchSessionRatings(sessionIds);

    const recommendations: SessionRecommendation[] = filtered.map((session: any) => {
      const program = session.programs;
      const location = session.locations;
      const coach = session.staff;
      const spotsRemaining = session.capacity - session.enrolled_count;
      const fillRate = (session.enrolled_count / session.capacity) * 100;

      return {
        sessionId: session.id,
        programName: program?.name || 'Unknown Program',
        programDescription: program?.description || '',
        price: program?.price_cents || 0,
        durationWeeks: program?.duration_weeks || 8,
        ageRange: program?.age_range,
        locationName: location?.name || 'TBD',
        locationAddress: location?.address || '',
        locationId: location?.id,
        locationRating: locationRatings[location?.id] || null,
        coachName: coach?.name || 'TBD',
        coachId: coach?.id,
        coachRating: coach?.rating || null,
        sessionRating: sessionRatings[session.id] || null,
        dayOfWeek: DAY_MAP[session.day_of_week] || 'TBD',
        startTime: session.start_time,
        startDate: session.start_date,
        capacity: session.capacity,
        enrolledCount: session.enrolled_count,
        spotsRemaining,
        fillRatePercent: fillRate,
        urgencyLevel: fillRate >= 100 ? 'full' : fillRate >= 75 ? 'filling_fast' : fillRate >= 50 ? 'moderate' : 'available'
      };
    });

    return recommendations;
  } catch (error) {
    console.error('Error in fetchSessionRecommendations:', error);
    return [];
  }
}

async function fetchLocationRatings(organizationId: string): Promise<Record<string, number>> {
  const { data } = await supabase
    .from('session_reviews')
    .select('location_rating, sessions!inner(location_id)')
    .not('location_rating', 'is', null);

  const ratings: Record<string, number[]> = {};
  data?.forEach((review: any) => {
    const locationId = review.sessions?.location_id;
    if (locationId && review.location_rating) {
      if (!ratings[locationId]) ratings[locationId] = [];
      ratings[locationId].push(review.location_rating);
    }
  });

  const averages: Record<string, number> = {};
  Object.entries(ratings).forEach(([locationId, ratingArray]) => {
    averages[locationId] = ratingArray.reduce((a, b) => a + b, 0) / ratingArray.length;
  });

  return averages;
}

async function fetchSessionRatings(sessionIds: string[]): Promise<Record<string, number>> {
  if (sessionIds.length === 0) return {};

  const { data } = await supabase
    .from('session_reviews')
    .select('session_id, overall_rating')
    .in('session_id', sessionIds)
    .not('overall_rating', 'is', null);

  const ratings: Record<string, number[]> = {};
  data?.forEach((review: any) => {
    if (!ratings[review.session_id]) ratings[review.session_id] = [];
    ratings[review.session_id].push(review.overall_rating);
  });

  const averages: Record<string, number> = {};
  Object.entries(ratings).forEach(([sessionId, ratingArray]) => {
    averages[sessionId] = ratingArray.reduce((a, b) => a + b, 0) / ratingArray.length;
  });

  return averages;
}
