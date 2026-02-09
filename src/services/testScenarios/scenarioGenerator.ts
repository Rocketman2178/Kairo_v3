import type { SessionData } from './sessionDataFetcher';

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

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function $(cents: number): string {
  return `$${Math.round(cents / 100)}`;
}

function t(time: string): string {
  const [h, m] = time.split(':');
  const hr = parseInt(h);
  return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m}${hr >= 12 ? 'pm' : 'am'}`;
}

function spots(s: SessionData): number {
  return Math.max(0, s.capacity - s.enrolled_count);
}

function urgTag(s: SessionData): string {
  const r = spots(s);
  if (s.urgency_level === 'full') return 'FULL';
  if (s.urgency_level === 'filling_fast') return `${r} spot${r === 1 ? '' : 's'}, filling fast`;
  if (s.urgency_level === 'moderate') return `${r} spots`;
  return `${r} spots open`;
}

function line(s: SessionData): string {
  return `${s.location_name} ${DAYS[s.day_of_week]} ${t(s.start_time)}: ${s.enrolled_count}/${s.capacity} (${urgTag(s)})`;
}

function brief(s: SessionData): string {
  const ff = s.urgency_level === 'filling_fast' ? ', filling fast' : '';
  return `${DAYS[s.day_of_week]} ${t(s.start_time)} at ${s.location_name} (${spots(s)} spots${ff})`;
}

function byProgram(all: SessionData[], name: string): SessionData[] {
  return all.filter(s => s.program_name === name);
}

function byCity(all: SessionData[], city: string): SessionData[] {
  return all.filter(s => s.city === city);
}

function notFull(all: SessionData[]): SessionData[] {
  return all.filter(s => s.urgency_level !== 'full');
}

function soccerRegistration(all: SessionData[]): TestScenario[] {
  const configs = [
    { prog: 'Mini Soccer', age: 3, name: 'Liam', g: 'son', city: 'Irvine', pref: 'Saturday mornings work best' },
    { prog: 'Junior Soccer', age: 5, name: 'Emma', g: 'daughter', city: 'Orange', pref: 'any day after school works' },
    { prog: 'Classic Soccer', age: 6, name: 'Charlotte', g: 'daughter', city: 'Irvine', pref: 'Wednesday evening or weekends' },
    { prog: 'Premier Soccer', age: 9, name: 'Jake', g: 'son', city: 'Rancho Santa Margarita', pref: 'weekends' },
    { prog: 'Teen Soccer', age: 12, name: 'Marcus', g: 'son', city: 'Orange', pref: 'weekday afternoons preferred' },
    { prog: 'High School Soccer', age: 16, name: 'Sophia', g: 'daughter', city: 'Fullerton', pref: 'after school on weekdays' },
  ];

  return configs.map(c => {
    const match = byProgram(all, c.prog).filter(s => c.age >= s.age_min && c.age <= s.age_max);
    const inCity = byCity(match, c.city);
    const show = (inCity.length > 0 ? inCity : match).slice(0, 5);
    if (show.length === 0) return null;

    const s0 = show[0];
    const open = notFull(show);
    const full = show.filter(s => s.urgency_level === 'full');

    let expected = `Should recommend ${c.prog} in ${c.city}. `;
    if (open.length > 0) expected += open.map(brief).join('. ') + '.';
    if (full.length > 0) expected += ` ${full.map(s => `${DAYS[s.day_of_week]} ${t(s.start_time)} is FULL`).join('. ')}.`;

    const pro = c.g === 'son' ? 'His' : 'Her';
    const he = c.g === 'son' ? "he's" : "she's";

    return {
      id: `${c.prog.toLowerCase().replace(/ /g, '-')}-age-${c.age}`,
      title: `${c.prog} (Age ${c.age})`,
      description: `Should route to ${c.prog} (${$(s0.price_cents)}, ages ${s0.age_min}-${s0.age_max}).`,
      prompts: [
        `Hi, I'd like to sign up my ${c.g} for soccer`,
        `${pro} name is ${c.name} and ${he} ${c.age} years old`,
        `We're in ${c.city}, ${c.pref}`
      ],
      expectedBehavior: expected,
      dataPoints: [
        `${c.prog}: ages ${s0.age_min}-${s0.age_max}, ${$(s0.price_cents)}/season`,
        ...show.map(line)
      ],
      tags: [c.prog.toLowerCase().replace(/ /g, '-'), `age-${c.age}`, c.city.toLowerCase().replace(/ /g, '-')]
    };
  }).filter(Boolean) as TestScenario[];
}

function nonSoccerPrograms(all: SessionData[]): TestScenario[] {
  const configs = [
    {
      prog: 'Youth Basketball', age: 7, name: 'Ryan', g: 'son', city: 'Orange',
      p1: 'Does Soccer Shots offer basketball too?',
      p2: 'My son is 7 and loves basketball',
      p3: "We're in Orange, Wednesday or Thursday works"
    },
    {
      prog: 'Learn to Swim', age: 6, name: 'Sofia', g: 'daughter', city: 'Orange',
      p1: 'I want my 6-year-old to learn swimming',
      p2: 'Her name is Sofia',
      p3: 'Any location near Orange is fine'
    },
    {
      prog: 'Creative Arts Studio', age: 10, name: 'Lily', g: 'daughter', city: 'Orange',
      p1: "My daughter is interested in art classes, not sports",
      p2: "She's 10 years old",
      p3: 'Any day works for us'
    },
    {
      prog: 'Teen Basketball', age: 12, name: 'Tyler', g: 'son', city: 'Orange',
      p1: 'My 12-year-old wants to play basketball',
      p2: "We're in Orange",
      p3: 'After school or weekends'
    },
    {
      prog: 'Intermediate Swimming', age: 10, name: 'Aiden', g: 'son', city: 'Orange',
      p1: 'My son already knows how to swim but wants to improve',
      p2: "He's 10, looking for intermediate level",
      p3: 'Orange area, any day'
    },
    {
      prog: 'Advanced Swimming', age: 14, name: 'Maya', g: 'daughter', city: 'Irvine',
      p1: 'My daughter is on the swim team and wants extra training',
      p2: "She's 14",
      p3: 'Irvine, evenings or weekends'
    },
  ];

  return configs.map(c => {
    const match = byProgram(all, c.prog).filter(s => c.age >= s.age_min && c.age <= s.age_max);
    const inCity = byCity(match, c.city);
    const show = (inCity.length > 0 ? inCity : match).slice(0, 5);
    if (show.length === 0) return null;

    const s0 = show[0];
    const open = notFull(show);
    const full = show.filter(s => s.urgency_level === 'full');

    let expected = `Should recommend ${c.prog} in ${c.city}. `;
    if (open.length > 0) expected += open.map(brief).join('. ') + '.';
    if (full.length > 0) expected += ` Note: ${full.map(s => `${DAYS[s.day_of_week]} ${t(s.start_time)} at ${s.location_name} is FULL`).join('. ')}.`;

    const coach = show.find(s => s.coach_name)?.coach_name;
    const rating = show.find(s => s.coach_rating)?.coach_rating;

    return {
      id: c.prog.toLowerCase().replace(/ /g, '-'),
      title: `${c.prog} (Age ${c.age})`,
      description: `${c.prog} (${$(s0.price_cents)}, ages ${s0.age_min}-${s0.age_max}).${coach ? ` Coach: ${coach}${rating ? ` (${rating})` : ''}.` : ''}`,
      prompts: [c.p1, c.p2, c.p3],
      expectedBehavior: expected,
      dataPoints: [
        `${c.prog}: ages ${s0.age_min}-${s0.age_max}, ${$(s0.price_cents)}/season, ${s0.capacity}-person classes`,
        ...show.map(line),
        ...(coach ? [`Coach: ${coach}${rating ? ` (${rating} rating)` : ''}`] : [])
      ],
      tags: [c.prog.toLowerCase().replace(/ /g, '-'), `age-${c.age}`, c.city.toLowerCase().replace(/ /g, '-')]
    };
  }).filter(Boolean) as TestScenario[];
}

function locationScenarios(all: SessionData[]): TestScenario[] {
  const configs = [
    { city: 'Irvine', age: 4, name: 'Noah', pronoun: 'His', pref: 'Weekend mornings preferred' },
    { city: 'Orange', age: 8, name: 'Olivia', pronoun: 'Her', pref: 'What options do you have?' },
    { city: 'Fullerton', age: 6, name: 'Ethan', pronoun: 'His', pref: 'Weekdays after 3pm' },
    { city: 'Rancho Santa Margarita', age: 3, name: 'Ava', pronoun: 'Her', pref: 'Saturday morning if possible' },
    { city: 'San Juan Capistrano', age: 8, name: 'Lucas', pronoun: 'His', pref: 'When are classes available?' },
  ];

  return configs.map(c => {
    const inCity = byCity(all, c.city);
    if (inCity.length === 0) return null;

    const locations = [...new Set(inCity.map(s => s.location_name))];
    const programs = [...new Set(inCity.map(s => s.program_name))];
    const eligible = inCity.filter(s => c.age >= s.age_min && c.age <= s.age_max);
    const eligiblePrograms = [...new Set(eligible.map(s => s.program_name))];
    const display = eligible.slice(0, 4);

    return {
      id: `location-${c.city.toLowerCase().replace(/ /g, '-')}`,
      title: `${c.city} Family`,
      description: `${c.city} has ${locations.length} location(s): ${locations.join(', ')}`,
      prompts: [
        `We live in ${c.city} and want to sign up our ${c.age}-year-old for something`,
        `${c.pronoun} name is ${c.name}`,
        c.pref
      ],
      expectedBehavior: `Should show age-appropriate programs in ${c.city}: ${eligiblePrograms.join(', ')}. ${display.length > 0 ? display.map(brief).join('. ') + '.' : 'Limited options at this location.'}`,
      dataPoints: [
        `${c.city} locations: ${locations.join(', ')}`,
        `${inCity.length} total sessions, ${eligible.length} age-appropriate for age ${c.age}`,
        `All programs: ${programs.join(', ')}`,
        ...display.map(line)
      ],
      tags: ['location', c.city.toLowerCase().replace(/ /g, '-')]
    };
  }).filter(Boolean) as TestScenario[];
}

function scheduleScenarios(all: SessionData[]): TestScenario[] {
  const scenarios: TestScenario[] = [];

  const morningWeekday = all.filter(s =>
    s.day_of_week >= 1 && s.day_of_week <= 5 &&
    parseInt(s.start_time) < 12 &&
    s.age_min <= 3 && s.age_max >= 3
  ).slice(0, 4);

  if (morningWeekday.length > 0) {
    scenarios.push({
      id: 'weekday-morning',
      title: 'Weekday Morning Only (Preschool Parent)',
      description: 'Parent needs morning sessions on weekdays for a toddler.',
      prompts: [
        'I need a Tuesday or Wednesday morning class for my 3-year-old',
        "We're in Orange",
        'Before noon please'
      ],
      expectedBehavior: `Mini Soccer morning options: ${morningWeekday.map(brief).join('. ')}. Should filter to only morning weekday sessions.`,
      dataPoints: morningWeekday.map(line),
      tags: ['morning', 'weekday', 'mini', 'schedule']
    });
  }

  const evening = all.filter(s =>
    parseInt(s.start_time) >= 17 &&
    s.age_min <= 5 && s.age_max >= 5 &&
    s.city === 'Irvine'
  ).slice(0, 4);

  if (evening.length > 0) {
    scenarios.push({
      id: 'evening-only',
      title: 'Evening Sessions (Working Parent)',
      description: 'Parent can only do after 5pm. Tests evening availability filtering.',
      prompts: [
        'I work until 5pm so I need evening classes',
        "My son is 5, we're in Irvine",
        'Monday or Friday preferred'
      ],
      expectedBehavior: `Evening options for age 5 in Irvine: ${evening.map(brief).join('. ')}. Should flag urgency on sessions with limited spots.`,
      dataPoints: [
        ...evening.map(line),
        'Evening options in Irvine are limited'
      ],
      tags: ['evening', 'working-parent', 'irvine', 'schedule']
    });
  }

  const saturday = all.filter(s =>
    s.day_of_week === 6 &&
    s.age_min <= 6 && s.age_max >= 6
  ).sort((a, b) => spots(b) - spots(a)).slice(0, 5);

  if (saturday.length > 0) {
    scenarios.push({
      id: 'saturday-only',
      title: 'Saturday Only Family',
      description: 'Many sessions run on Saturdays. Tests sorting by availability.',
      prompts: [
        'We can only do Saturdays',
        'I have a 6-year-old who wants soccer',
        'Orange or Irvine area'
      ],
      expectedBehavior: `Saturday options for age 6: ${saturday.map(brief).join('. ')}. Should prioritize by availability and location proximity.`,
      dataPoints: [
        `${all.filter(s => s.day_of_week === 6).length} total Saturday sessions across all programs`,
        ...saturday.map(line)
      ],
      tags: ['saturday', 'weekend', 'schedule']
    });
  }

  const sunday = all.filter(s =>
    s.day_of_week === 0 &&
    s.age_min <= 8 && s.age_max >= 8
  ).slice(0, 4);

  if (sunday.length > 0) {
    scenarios.push({
      id: 'sunday-options',
      title: 'Sunday Availability Check',
      description: 'Parent wants Sunday options. Fewer sessions available.',
      prompts: [
        'Are there any Sunday classes?',
        'My child is 8, looking for soccer or basketball',
        'Orange County area'
      ],
      expectedBehavior: `Sunday options for age 8: ${sunday.map(brief).join('. ')}.`,
      dataPoints: [
        `${all.filter(s => s.day_of_week === 0).length} total Sunday sessions`,
        ...sunday.map(line)
      ],
      tags: ['sunday', 'weekend', 'schedule']
    });
  }

  return scenarios;
}

function fullSessionScenarios(all: SessionData[]): TestScenario[] {
  const fullSessions = all.filter(s => s.urgency_level === 'full');

  return fullSessions.slice(0, 5).map(s => {
    const sameProgram = byProgram(all, s.program_name).filter(a => a.urgency_level !== 'full');
    const sameCityAlts = byCity(sameProgram, s.city).slice(0, 2);
    const otherCityAlts = sameProgram.filter(a => a.city !== s.city).slice(0, 2);
    const alternatives = [...sameCityAlts, ...otherCityAlts].slice(0, 3);

    return {
      id: `full-${s.program_name.toLowerCase().replace(/ /g, '-')}-${DAYS[s.day_of_week].toLowerCase()}`,
      title: `Full: ${s.program_name} ${DAYS[s.day_of_week]} ${t(s.start_time)}`,
      description: `${s.program_name} ${DAYS[s.day_of_week]} ${t(s.start_time)} at ${s.location_name} is FULL (${s.capacity}/${s.capacity}).`,
      prompts: [
        `I want to sign up for ${s.program_name}`,
        `${DAYS[s.day_of_week]} at ${t(s.start_time)} in ${s.city}`,
        'Is it available?'
      ],
      expectedBehavior: `Should inform that ${DAYS[s.day_of_week]} ${t(s.start_time)} at ${s.location_name} is full. ${alternatives.length > 0 ? `Suggest alternatives: ${alternatives.map(brief).join('. ')}.` : ''} Should offer waitlist option.`,
      dataPoints: [
        `${s.program_name} ${DAYS[s.day_of_week]} ${t(s.start_time)}: FULL (${s.capacity}/${s.capacity})`,
        ...alternatives.map(a => `Alternative: ${line(a)}`),
        'Waitlist should be offered'
      ],
      tags: ['full', 'waitlist', s.program_name.toLowerCase().replace(/ /g, '-')]
    };
  });
}

function urgencyScenarios(all: SessionData[]): TestScenario[] {
  const filling = all
    .filter(s => s.urgency_level === 'filling_fast')
    .sort((a, b) => spots(a) - spots(b))
    .slice(0, 4);

  return filling.map(s => {
    const r = spots(s);
    const saferAlts = byProgram(all, s.program_name)
      .filter(a => a.urgency_level === 'available' || a.urgency_level === 'moderate')
      .slice(0, 2);

    return {
      id: `urgent-${s.program_name.toLowerCase().replace(/ /g, '-')}-${DAYS[s.day_of_week].toLowerCase()}`,
      title: `${s.program_name} - ${r} Spot${r === 1 ? '' : 's'} Left`,
      description: `${s.program_name} at ${s.location_name} ${DAYS[s.day_of_week]} ${t(s.start_time)} has only ${r} spot(s).`,
      prompts: [
        `I want ${s.program_name.toLowerCase()} for my child`,
        `${s.city}, ${DAYS[s.day_of_week]} preferred`,
        `Around ${t(s.start_time)} works`
      ],
      expectedBehavior: `Should show ${DAYS[s.day_of_week]} ${t(s.start_time)} at ${s.location_name} with strong urgency messaging (${r} spot${r === 1 ? '' : 's'} left!). ${saferAlts.length > 0 ? `Safer alternatives: ${saferAlts.map(brief).join(', ')}.` : ''}`,
      dataPoints: [
        line(s),
        `${r} spot${r === 1 ? '' : 's'} remaining - FILLING FAST`,
        ...saferAlts.map(a => `Safer option: ${line(a)}`)
      ],
      tags: ['urgency', 'filling-fast', s.program_name.toLowerCase().replace(/ /g, '-')]
    };
  });
}

function edgeCaseScenarios(all: SessionData[]): TestScenario[] {
  const scenarios: TestScenario[] = [];

  const age4Programs = [...new Set(
    all.filter(s => s.age_min <= 4 && s.age_max >= 4).map(s => s.program_name)
  )];

  scenarios.push({
    id: 'age-boundary-4',
    title: 'Age Boundary - 4 Year Old (Multiple Programs)',
    description: `Age 4 qualifies for ${age4Programs.length} programs: ${age4Programs.join(', ')}.`,
    prompts: [
      'My child just turned 4',
      'What programs are available?',
      "We're open to anything in Irvine"
    ],
    expectedBehavior: `Should present multiple program options: ${age4Programs.join(', ')}. Let the parent choose based on skill level and interest.`,
    dataPoints: [
      `Age 4 eligible programs: ${age4Programs.join(', ')}`,
      ...age4Programs.map(p => {
        const s = all.find(x => x.program_name === p);
        return s ? `${p}: ages ${s.age_min}-${s.age_max}, ${$(s.price_cents)}/season` : p;
      })
    ],
    tags: ['age-boundary', 'multiple-programs', 'decision-help']
  });

  const minAge = Math.min(...all.map(s => s.age_min));
  const youngestProg = all.find(s => s.age_min === minAge);
  scenarios.push({
    id: 'too-young',
    title: 'Too Young (Age 1)',
    description: 'No programs available for children under 2.',
    prompts: [
      'My baby is 1 year old, do you have any programs?',
      'We want to get her started early'
    ],
    expectedBehavior: `Should gracefully explain that the youngest program (${youngestProg?.program_name || 'Mini Soccer'}) starts at age ${minAge}. Suggest coming back when the child turns ${minAge}.`,
    dataPoints: [
      `Minimum age across all programs: ${minAge}`,
      'No programs for under 2',
      'Should handle gracefully without errors'
    ],
    tags: ['too-young', 'no-match', 'graceful-handling']
  });

  const maxAge = Math.max(...all.map(s => s.age_max));
  scenarios.push({
    id: 'too-old',
    title: 'Too Old (Age 20)',
    description: `No programs available for adults (max age is ${maxAge}).`,
    prompts: [
      "I'm 20, can I join a soccer program?",
      'Or maybe basketball?'
    ],
    expectedBehavior: `Should explain that programs go up to age ${maxAge}. No adult programs available.`,
    dataPoints: [
      `Maximum age: ${maxAge}`,
      'No adult programs exist'
    ],
    tags: ['too-old', 'no-match', 'adult']
  });

  const programCount = [...new Set(all.map(s => s.program_name))].length;
  const locationCount = [...new Set(all.map(s => s.location_name))].length;
  scenarios.push({
    id: 'vague-request',
    title: 'Vague Request - No Age or Location',
    description: "User gives minimal information. Tests Kai's follow-up questions.",
    prompts: ['I want to sign my kid up for something'],
    expectedBehavior: "Should ask for child's name, age, and location/schedule preferences before making recommendations. Should NOT dump all programs.",
    dataPoints: [
      `${programCount} programs across all ages`,
      `${locationCount} locations across Orange County`,
      'Kai should collect info before recommending'
    ],
    tags: ['vague', 'follow-up-needed', 'information-gathering']
  });

  const topCoach = all
    .filter(s => s.coach_name && s.coach_rating)
    .sort((a, b) => (b.coach_rating || 0) - (a.coach_rating || 0))[0];

  if (topCoach) {
    const coachSessions = all.filter(s => s.coach_name === topCoach.coach_name);
    const coachPrograms = [...new Set(coachSessions.map(s => s.program_name))];
    const age6Sessions = coachSessions.filter(s => s.age_min <= 6 && s.age_max >= 6);

    scenarios.push({
      id: 'specific-coach',
      title: `Specific Coach Request - ${topCoach.coach_name}`,
      description: `Parent asks for ${topCoach.coach_name} by name (${topCoach.coach_rating} rating).`,
      prompts: [
        `My friend recommended ${topCoach.coach_name}`,
        'We want to sign up our 6-year-old with them',
        'What sessions do they teach?'
      ],
      expectedBehavior: `${topCoach.coach_name} (${topCoach.coach_rating} rating) teaches: ${coachPrograms.join(', ')}. For a 6-year-old, should recommend age-appropriate programs only.`,
      dataPoints: [
        `${topCoach.coach_name}: ${topCoach.coach_rating} rating`,
        `Teaches: ${coachPrograms.join(', ')}`,
        ...age6Sessions.slice(0, 3).map(line)
      ],
      tags: ['coach-request', 'specific']
    });
  }

  const mini = all.find(s => s.program_name === 'Mini Soccer');
  const premier = all.find(s => s.program_name === 'Premier Soccer');
  const miniSat = all.find(s => s.program_name === 'Mini Soccer' && s.city === 'Irvine' && s.day_of_week === 6);
  const premierSat = all.find(s => s.program_name === 'Premier Soccer' && s.city === 'Irvine' && s.day_of_week === 6);

  scenarios.push({
    id: 'sibling-registration',
    title: 'Sibling Registration (Two Kids)',
    description: 'Parent wants to register two children of different ages. Tests sibling discount.',
    prompts: [
      'I have two kids - one is 3 and the other is 7',
      "I'd like to sign both up for soccer",
      "We're in Irvine, Saturday mornings"
    ],
    expectedBehavior: 'Should recognize different programs needed: Mini Soccer (age 3) and Premier Soccer (age 7). Both at Oakwood Rec Center on Saturdays. Should mention 10% sibling discount.',
    dataPoints: [
      mini ? `Age 3 -> Mini Soccer (${$(mini.price_cents)})` : 'Age 3 -> Mini Soccer',
      premier ? `Age 7 -> Premier Soccer (${$(premier.price_cents)})` : 'Age 7 -> Premier Soccer',
      'Sibling discount: 10%',
      ...(miniSat ? [line(miniSat)] : []),
      ...(premierSat ? [line(premierSat)] : [])
    ],
    tags: ['siblings', 'discount', 'two-kids', 'different-ages']
  });

  return scenarios;
}

function conversationFlowScenarios(all: SessionData[]): TestScenario[] {
  const juniorWed = all.find(s =>
    s.program_name === 'Junior Soccer' && s.city === 'Orange' && s.day_of_week === 3
  );

  const youthBball = byProgram(all, 'Youth Basketball').filter(s => s.city === 'Orange');

  return [
    {
      id: 'full-happy-path',
      title: 'Complete Happy Path - Registration',
      description: 'Full conversation from first message to session selection.',
      prompts: [
        "Hi! I'd like to register my child",
        "Her name is Sophie and she's 6",
        'We live in Orange and prefer Wednesday afternoons',
        'Soccer sounds great',
        juniorWed
          ? `The ${t(juniorWed.start_time)} session at ${juniorWed.location_name} works perfectly`
          : 'The Wednesday session works perfectly'
      ],
      expectedBehavior: `Should progress: greeting -> collect child info -> collect preferences -> show recommendations -> confirm selection. ${juniorWed ? `Junior Soccer ${DAYS[juniorWed.day_of_week]} ${t(juniorWed.start_time)} at ${juniorWed.location_name} has ${spots(juniorWed)} spots.` : ''}`,
      dataPoints: [
        'States: greeting -> collecting_child_info -> collecting_preferences -> showing_recommendations -> confirming_selection',
        ...(juniorWed ? [line(juniorWed)] : []),
        ...(juniorWed ? [`Price: ${$(juniorWed.price_cents)}`] : [])
      ],
      tags: ['happy-path', 'full-flow', 'end-to-end']
    },
    {
      id: 'change-mind',
      title: 'Parent Changes Mind Mid-Conversation',
      description: 'Parent initially asks for soccer then switches to basketball.',
      prompts: [
        "I want soccer for my 8-year-old",
        "Actually, he's more into basketball now",
        'What basketball options do you have?',
        "We're in Orange, any day works"
      ],
      expectedBehavior: `Should gracefully handle the switch from soccer to basketball. Age 8 qualifies for Youth Basketball (5-9). Show Orange options at Main Sports Complex.`,
      dataPoints: [
        ...(youthBball[0] ? [`Youth Basketball: ages ${youthBball[0].age_min}-${youthBball[0].age_max}, ${$(youthBball[0].price_cents)}/season`] : []),
        `${youthBball.length} Youth Basketball sessions in Orange`,
        ...youthBball.slice(0, 3).map(line)
      ],
      tags: ['change-mind', 'program-switch', 'flexibility']
    },
    {
      id: 'no-match-expand',
      title: 'No Exact Match - Expand Search',
      description: "Request with no exact match, requiring Kai to expand search criteria.",
      prompts: [
        'I need a Monday evening swimming class in Irvine for my 10-year-old'
      ],
      expectedBehavior: 'No exact match exists (Intermediate Swimming has no Monday sessions and no Irvine location). Should explain no exact match and suggest closest alternatives.',
      dataPoints: [
        'Intermediate Swimming (8-13): no sessions in Irvine or on Monday',
        ...byProgram(all, 'Intermediate Swimming').slice(0, 3).map(s => `Available: ${line(s)}`),
        'Should expand location or day preferences'
      ],
      tags: ['no-match', 'expand-search', 'swimming']
    }
  ];
}

function dataExtractionScenarios(): TestScenario[] {
  return [
    {
      id: 'natural-language-age',
      title: 'Natural Language Age Expressions',
      description: 'Tests extraction of age from various natural language formats.',
      prompts: [
        'My daughter will be turning 5 next month',
        'My twins are about to be four',
        "He's in first grade, so he's 6",
        'She was born in 2020'
      ],
      expectedBehavior: 'Should correctly parse ages. "turning 5 next month" = age 4 or 5. "first grade" = likely 6. Birth year should calculate current age.',
      dataPoints: [
        'Age extraction is critical for program matching',
        'Should handle: turning X, about to be X, grade level, birth year',
        'Day of week values: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat'
      ],
      tags: ['data-extraction', 'age-parsing', 'natural-language']
    },
    {
      id: 'schedule-expressions',
      title: 'Natural Language Schedule Expressions',
      description: 'Tests extraction of day/time preferences from conversational input.',
      prompts: [
        "We're free on weekends only",
        'After school, so around 3-4pm',
        "Not Mondays - that's her dance class",
        'Tuesday through Thursday afternoons work'
      ],
      expectedBehavior: 'Should interpret: "weekends" = Sat/Sun, "after school" = ~3-4pm, "not Mondays" = exclude Mon, "Tuesday through Thursday" = Tue/Wed/Thu.',
      dataPoints: [
        'Day values: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat',
        'Time: morning (before noon), afternoon (12-5), evening (after 5)',
        'Exclusion handling ("not Mondays") is important'
      ],
      tags: ['data-extraction', 'schedule-parsing', 'time-preferences']
    }
  ];
}

export function generateScenariosFromSessions(sessions: SessionData[]): ScenarioCategory[] {
  return [
    {
      id: 'soccer-registration',
      title: 'Soccer Registration by Age',
      description: 'Standard age-based registration paths through soccer programs',
      icon: 'users',
      color: 'emerald',
      scenarios: soccerRegistration(sessions)
    },
    {
      id: 'non-soccer-programs',
      title: 'Non-Soccer Programs',
      description: 'Basketball, swimming, and arts programs',
      icon: 'star',
      color: 'blue',
      scenarios: nonSoccerPrograms(sessions)
    },
    {
      id: 'location-specific',
      title: 'Location-Specific Requests',
      description: 'Testing city/location preference handling',
      icon: 'map-pin',
      color: 'cyan',
      scenarios: locationScenarios(sessions)
    },
    {
      id: 'schedule-preferences',
      title: 'Schedule & Time Preferences',
      description: 'Testing day/time preference matching',
      icon: 'clock',
      color: 'amber',
      scenarios: scheduleScenarios(sessions)
    },
    {
      id: 'full-waitlist',
      title: 'Full Sessions & Waitlist',
      description: 'Testing behavior when sessions are full',
      icon: 'alert-triangle',
      color: 'red',
      scenarios: fullSessionScenarios(sessions)
    },
    {
      id: 'urgency-scenarios',
      title: 'Urgency & Filling Fast',
      description: 'Sessions with limited spots - testing urgency messaging',
      icon: 'zap',
      color: 'orange',
      scenarios: urgencyScenarios(sessions)
    },
    {
      id: 'edge-cases',
      title: 'Edge Cases & Special Scenarios',
      description: 'Age boundaries, no matches, coach requests, siblings',
      icon: 'help-circle',
      color: 'slate',
      scenarios: edgeCaseScenarios(sessions)
    },
    {
      id: 'conversation-flow',
      title: 'Multi-Turn Conversation Flow',
      description: 'Testing the full conversation journey',
      icon: 'message-square',
      color: 'teal',
      scenarios: conversationFlowScenarios(sessions)
    },
    {
      id: 'data-validation',
      title: 'Data Extraction Validation',
      description: 'Testing age and schedule parsing from natural language',
      icon: 'target',
      color: 'rose',
      scenarios: dataExtractionScenarios()
    }
  ].filter(cat => cat.scenarios.length > 0);
}
