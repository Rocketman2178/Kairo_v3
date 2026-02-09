import { supabase } from '@/lib/supabase';

export interface SessionData {
  session_id: string;
  program_name: string;
  age_min: number;
  age_max: number;
  price_cents: number;
  location_name: string;
  city: string;
  coach_name: string | null;
  day_of_week: number;
  start_time: string;
  enrolled_count: number;
  capacity: number;
  urgency_level: string;
  status: string;
}

export interface TestScenario {
  id: string;
  title: string;
  description: string;
  prompts: string[];
  expectedBehavior: string;
  dataPoints: string[];
  tags: string[];
}

export interface ScenarioCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  scenarios: TestScenario[];
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatPrice(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(0)}`;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes}${ampm}`;
}

function getSpotsRemaining(enrolled: number, capacity: number): number {
  return Math.max(0, capacity - enrolled);
}

function getUrgencyText(urgencyLevel: string, spotsRemaining: number): string {
  if (urgencyLevel === 'full') return 'FULL';
  if (urgencyLevel === 'filling_fast') return `${spotsRemaining} spot${spotsRemaining === 1 ? '' : 's'} left, filling fast`;
  if (urgencyLevel === 'moderate') return `${spotsRemaining} spots available`;
  return `${spotsRemaining} spots open`;
}

export async function fetchAllSessions(): Promise<SessionData[]> {
  const { data: sessions, error: sessionsError } = await supabase
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
        price_cents
      ),
      locations:location_id (
        name,
        city
      ),
      staff:coach_id (
        name
      )
    `)
    .eq('status', 'active')
    .order('day_of_week')
    .order('start_time');

  if (sessionsError) {
    console.error('Error fetching sessions:', sessionsError);
    return [];
  }

  if (!sessions) return [];

  const transformedData: SessionData[] = sessions.map((session: any) => ({
    session_id: session.id,
    program_name: session.programs?.name || 'Unknown Program',
    age_min: session.programs?.age_min || 0,
    age_max: session.programs?.age_max || 0,
    price_cents: session.programs?.price_cents || 0,
    location_name: session.locations?.name || 'Unknown Location',
    city: session.locations?.city || 'Unknown City',
    coach_name: session.staff?.name || null,
    day_of_week: session.day_of_week,
    start_time: session.start_time,
    enrolled_count: session.enrolled_count,
    capacity: session.capacity,
    urgency_level: session.urgency_level,
    status: session.status
  }));

  transformedData.sort((a, b) => {
    if (a.program_name !== b.program_name) return a.program_name.localeCompare(b.program_name);
    if (a.city !== b.city) return a.city.localeCompare(b.city);
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
    return a.start_time.localeCompare(b.start_time);
  });

  return transformedData;
}

function generateBasicRegistrationScenarios(sessions: SessionData[]): TestScenario[] {
  const scenarios: TestScenario[] = [];

  const programGroups = [
    { program: 'Mini Soccer', age: 3, childName: 'Liam', gender: 'son' },
    { program: 'Junior Soccer', age: 5, childName: 'Emma', gender: 'daughter' },
    { program: 'Premier Soccer', age: 9, childName: 'Jake', gender: 'son' },
    { program: 'Teen Soccer', age: 12, childName: 'Marcus', gender: 'son' },
    { program: 'High School Soccer', age: 16, childName: 'Sophia', gender: 'daughter' },
  ];

  for (const group of programGroups) {
    const matchingSessions = sessions.filter(
      s => s.program_name === group.program && group.age >= s.age_min && group.age <= s.age_max
    );

    if (matchingSessions.length === 0) continue;

    const cityGroups = matchingSessions.reduce((acc, session) => {
      if (!acc[session.city]) acc[session.city] = [];
      acc[session.city].push(session);
      return acc;
    }, {} as Record<string, SessionData[]>);

    const primaryCity = Object.keys(cityGroups)[0];
    const citySessions = cityGroups[primaryCity].slice(0, 3);

    const dataPoints = [
      `${group.program}: ages ${citySessions[0].age_min}-${citySessions[0].age_max}, ${formatPrice(citySessions[0].price_cents)}/season`,
      ...citySessions.map(s =>
        `${s.location_name} ${DAY_NAMES[s.day_of_week]} ${formatTime(s.start_time)}: ${getUrgencyText(s.urgency_level, getSpotsRemaining(s.enrolled_count, s.capacity))}`
      )
    ];

    scenarios.push({
      id: `${group.program.toLowerCase().replace(/ /g, '-')}-${group.age}`,
      title: `${group.program} (Age ${group.age})`,
      description: `Should route to ${group.program}. Ages ${citySessions[0].age_min}-${citySessions[0].age_max}, ${formatPrice(citySessions[0].price_cents)}/season.`,
      prompts: [
        `Hi, I'd like to sign up my ${group.gender} for soccer`,
        `${group.gender === 'son' ? 'His' : 'Her'} name is ${group.childName} and ${group.gender === 'son' ? 'he' : 'she'}'s ${group.age} years old`,
        `We're in ${primaryCity}, any day works`
      ],
      expectedBehavior: `Should recommend ${group.program} sessions in ${primaryCity}. ${citySessions.map(s =>
        `${s.location_name} ${DAY_NAMES[s.day_of_week]} ${formatTime(s.start_time)} (${getSpotsRemaining(s.enrolled_count, s.capacity)} spots)`
      ).join(', ')}.`,
      dataPoints,
      tags: [group.program.toLowerCase().replace(/ /g, '-'), 'age-' + group.age, primaryCity.toLowerCase()]
    });
  }

  return scenarios;
}

function generateLocationScenarios(sessions: SessionData[]): TestScenario[] {
  const scenarios: TestScenario[] = [];

  const cityGroups = sessions.reduce((acc, session) => {
    if (!acc[session.city]) acc[session.city] = [];
    acc[session.city].push(session);
    return acc;
  }, {} as Record<string, SessionData[]>);

  const topCities = Object.entries(cityGroups)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 4);

  for (const [city, citySessions] of topCities) {
    const locations = [...new Set(citySessions.map(s => s.location_name))];
    const programs = [...new Set(citySessions.map(s => s.program_name))].slice(0, 3);

    scenarios.push({
      id: `location-${city.toLowerCase().replace(/ /g, '-')}`,
      title: `${city} Family`,
      description: `${city} has ${locations.length} location(s): ${locations.join(', ')}`,
      prompts: [
        `We live in ${city}`,
        `Looking for activities for my kids`,
        `What options do you have?`
      ],
      expectedBehavior: `Should show programs available in ${city}: ${programs.join(', ')}. Multiple locations: ${locations.join(', ')}.`,
      dataPoints: [
        `${city} locations: ${locations.join(', ')}`,
        `${citySessions.length} active sessions in ${city}`,
        `Programs available: ${programs.join(', ')}`
      ],
      tags: ['location', city.toLowerCase().replace(/ /g, '-')]
    });
  }

  return scenarios;
}

function generateUrgencyScenarios(sessions: SessionData[]): TestScenario[] {
  const scenarios: TestScenario[] = [];

  const fillingFast = sessions.filter(s => s.urgency_level === 'filling_fast').slice(0, 2);
  const fullSessions = sessions.filter(s => s.urgency_level === 'full').slice(0, 2);

  for (const session of fillingFast) {
    const spotsLeft = getSpotsRemaining(session.enrolled_count, session.capacity);

    scenarios.push({
      id: `urgent-${session.session_id}`,
      title: `${session.program_name} - ${spotsLeft} Spot${spotsLeft === 1 ? '' : 's'} Left`,
      description: `${session.program_name} at ${session.location_name} is filling fast with only ${spotsLeft} spot(s) remaining.`,
      prompts: [
        `I want ${session.program_name.toLowerCase()} for my child`,
        `${session.city}, ${DAY_NAMES[session.day_of_week]} preferred`,
        `Around ${formatTime(session.start_time)} works`
      ],
      expectedBehavior: `Should show ${session.program_name} ${DAY_NAMES[session.day_of_week]} ${formatTime(session.start_time)} at ${session.location_name} with strong urgency messaging (${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left!). Price: ${formatPrice(session.price_cents)}.`,
      dataPoints: [
        `${session.program_name}: ${formatPrice(session.price_cents)}`,
        `${session.location_name}, ${session.city}`,
        `${DAY_NAMES[session.day_of_week]} ${formatTime(session.start_time)}: ${session.enrolled_count}/${session.capacity} enrolled`,
        `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} remaining - FILLING FAST`
      ],
      tags: ['urgency', 'filling-fast', session.program_name.toLowerCase().replace(/ /g, '-')]
    });
  }

  for (const session of fullSessions) {
    const alternativeSessions = sessions.filter(
      s => s.program_name === session.program_name &&
      s.urgency_level !== 'full' &&
      s.city === session.city
    ).slice(0, 2);

    scenarios.push({
      id: `full-${session.session_id}`,
      title: `Full ${session.program_name} - ${session.city}`,
      description: `${session.program_name} ${DAY_NAMES[session.day_of_week]} ${formatTime(session.start_time)} at ${session.location_name} is FULL.`,
      prompts: [
        `I want to sign up for ${session.program_name}`,
        `${DAY_NAMES[session.day_of_week]} at ${formatTime(session.start_time)} in ${session.city}`,
        `Is it available?`
      ],
      expectedBehavior: `Should inform that ${DAY_NAMES[session.day_of_week]} ${formatTime(session.start_time)} at ${session.location_name} is full (${session.capacity}/${session.capacity}). ${alternativeSessions.length > 0 ? `Offer alternatives: ${alternativeSessions.map(s => `${DAY_NAMES[s.day_of_week]} ${formatTime(s.start_time)} at ${s.location_name} (${getSpotsRemaining(s.enrolled_count, s.capacity)} spots)`).join(', ')}. ` : ''}Should offer waitlist option.`,
      dataPoints: [
        `${session.program_name} ${DAY_NAMES[session.day_of_week]} ${formatTime(session.start_time)}: FULL (${session.capacity}/${session.capacity})`,
        ...alternativeSessions.map(s =>
          `Alternative: ${DAY_NAMES[s.day_of_week]} ${formatTime(s.start_time)} at ${s.location_name}: ${getSpotsRemaining(s.enrolled_count, s.capacity)} spots`
        ),
        'Waitlist should be offered'
      ],
      tags: ['full', 'waitlist', session.program_name.toLowerCase().replace(/ /g, '-')]
    });
  }

  return scenarios;
}

export function generateScenariosFromSessions(sessions: SessionData[]): ScenarioCategory[] {
  return [
    {
      id: 'basic-registration',
      title: 'Basic Registration Flows',
      description: 'Standard age-based registration paths through different programs',
      icon: 'users',
      color: 'emerald',
      scenarios: generateBasicRegistrationScenarios(sessions)
    },
    {
      id: 'location-specific',
      title: 'Location-Specific Requests',
      description: 'Testing city/location preference handling with real data',
      icon: 'map-pin',
      color: 'cyan',
      scenarios: generateLocationScenarios(sessions)
    },
    {
      id: 'urgency-scenarios',
      title: 'Urgency & Capacity',
      description: 'Sessions with limited spots and full sessions from real enrollment data',
      icon: 'zap',
      color: 'orange',
      scenarios: generateUrgencyScenarios(sessions)
    }
  ];
}
