// ===== N8N DATA EXTRACTION & CONTEXT NODE =====
// This code runs in the n8n Code node that preprocesses
// incoming webhook data before passing it to the AI agent.
// Copy this into your n8n Code node.

// ===== PROGRAM RESOLUTION =====
// Maps generic sport keywords + child age to specific database program names.
// Age ranges use exclusive upper bound matching the DB's int4range format:
//   [2,4) = ages 2-3, [4,7) = ages 4-6, etc.

const PROGRAM_MAP = {
  soccer: [
    { name: 'Mini Soccer', ageMin: 2, ageMaxExcl: 4, price: 20800 },
    { name: 'Junior Soccer', ageMin: 4, ageMaxExcl: 7, price: 22400 },
    { name: 'Classic Soccer', ageMin: 4, ageMaxExcl: 8, price: 29900 },
    { name: 'Premier Soccer', ageMin: 7, ageMaxExcl: 13, price: 24000 },
    { name: 'Teen Soccer', ageMin: 10, ageMaxExcl: 15, price: 22900 },
    { name: 'High School Soccer', ageMin: 15, ageMaxExcl: 19, price: 20183 },
  ],
  basketball: [
    { name: 'Youth Basketball', ageMin: 5, ageMaxExcl: 9, price: 20233 },
    { name: 'Teen Basketball', ageMin: 9, ageMaxExcl: 14, price: 25002 },
    { name: 'High School Basketball', ageMin: 14, ageMaxExcl: 19, price: 25735 },
  ],
  swimming: [
    { name: 'Learn to Swim', ageMin: 4, ageMaxExcl: 9, price: 23242 },
    { name: 'Intermediate Swimming', ageMin: 8, ageMaxExcl: 13, price: 20315 },
    { name: 'Advanced Swimming', ageMin: 11, ageMaxExcl: 17, price: 24504 },
  ],
  art: [
    { name: 'Creative Arts Studio', ageMin: 6, ageMaxExcl: 15, price: 25310 },
  ],
};

PROGRAM_MAP['swim'] = PROGRAM_MAP['swimming'];
PROGRAM_MAP['arts'] = PROGRAM_MAP['art'];
PROGRAM_MAP['creative arts'] = PROGRAM_MAP['art'];
PROGRAM_MAP['football'] = PROGRAM_MAP['soccer'];

// ===== CITY → LOCATION MAPPING =====

const CITY_LOCATIONS = {
  'Irvine': ['Beacon Park', 'Milestones Montessori', 'Oakwood Recreation Center'],
  'Orange': ['East Park Athletic Fields', 'Main Sports Complex', 'Westside Sports Complex'],
  'Fullerton': ['North Field Location', 'Rosary High School'],
  'Rancho Santa Margarita': ['Central Park', 'RSM Community Center'],
  'San Juan Capistrano': ['Sendero Field'],
  'Tustin': ['Cedar Grove Park'],
  'Yorba Linda': ['Messiah Lutheran'],
  'Anaheim': ['Ponderosa Elementary Park'],
};

const LOCATION_ALIASES = {
  'rsm': 'Rancho Santa Margarita',
  'sjc': 'San Juan Capistrano',
  'santa margarita': 'Rancho Santa Margarita',
  'san juan': 'San Juan Capistrano',
  'yorba': 'Yorba Linda',
};

function resolvePrograms(sport, age) {
  if (!sport) return [];
  const key = sport.toLowerCase().trim();
  const programs = PROGRAM_MAP[key] || [];
  if (age === null || age === undefined) return programs;
  return programs.filter(p => age >= p.ageMin && age < p.ageMaxExcl);
}

function resolveLocationCity(location) {
  if (!location) return null;
  const lower = location.toLowerCase().trim();
  if (LOCATION_ALIASES[lower]) return LOCATION_ALIASES[lower];
  const cityMatch = Object.keys(CITY_LOCATIONS).find(
    c => c.toLowerCase() === lower
  );
  return cityMatch || location;
}

function getLocationsForCity(city) {
  if (!city) return [];
  return CITY_LOCATIONS[city] || [];
}

function formatPrice(priceCents) {
  return '$' + Math.round(priceCents / 100);
}

// ===== EXTRACTION FUNCTIONS =====

function extractChildName(text) {
  const patterns = [
    /(?:his|her|their)\s+name\s+is\s+([A-Z][a-zA-Z]+)/,
    /name\s+is\s+([A-Z][a-zA-Z]+)/,
    /(?:my\s+)?(?:son|daughter|child|kid)\s+(?:is\s+)?([A-Z][a-zA-Z]+)/,
    /([A-Z][a-zA-Z]+)\s+is\s+\d{1,2}\s*(?:years?\s*old|yrs?\s*old|yo\b)/,
    /(?:sign\s*up|register|enroll)\s+([A-Z][a-zA-Z]+)/,
    /(?:it's|it\s+is|that's|that\s+is)\s+([A-Z][a-zA-Z]+)/,
    /(?:call\s+(?:him|her))\s+([A-Z][a-zA-Z]+)/
  ];
  const falsePositives = [
    'saturday','sunday','monday','tuesday','wednesday','thursday','friday',
    'morning','afternoon','evening','soccer','basketball','baseball',
    'football','tennis','volleyball','swimming','gymnastics','hockey',
    'lacrosse','golf','dance','ballet','wrestling','rugby','cricket',
    'cheerleading','karate','taekwondo','judo','softball',
    'not','the','and','for','with','this','that','from','have','has',
    'mini','junior','classic','premier','teen','youth','advanced',
    'intermediate','creative','learn','high','school'
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1];
      if (name[0] === name[0].toUpperCase() && !falsePositives.includes(name.toLowerCase())) {
        return name;
      }
    }
  }
  return null;
}

function extractChildAge(text) {
  const patterns = [
    /(?:he(?:'s|\s+is)|she(?:'s|\s+is)|they(?:'re|\s+are)|child\s+is|kid\s+is)\s+(\d{1,2})\s*(?:years?[-\s]*old|yrs?[-\s]*old|yo\b)/i,
    /(?:my|our|a)\s+(\d{1,2})[-\s]*(?:year|yr)[-\s]*old/i,
    /(\d{1,2})\s*[-\s]?\s*(?:years?[-\s]*old|yrs?[-\s]*old|yo\b)/i,
    /age\s*(?:is\s*)?(\d{1,2})/i,
    /(\d{1,2})\s*[-\s]*(?:year|yr)[-\s]*old/i,
    /(?:he(?:'s|\s+is)|she(?:'s|\s+is))\s+(\d{1,2})\b/i,
    /[A-Z][a-z]+\s+is\s+(\d{1,2})\b/
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const age = parseInt(match[1], 10);
      if (age >= 2 && age <= 18) {
        return age;
      }
    }
  }
  return null;
}

function extractPreferredDays(text) {
  const dayMap = {
    'sunday': 0, 'sundays': 0,
    'monday': 1, 'mondays': 1,
    'tuesday': 2, 'tuesdays': 2,
    'wednesday': 3, 'wednesdays': 3,
    'thursday': 4, 'thursdays': 4,
    'friday': 5, 'fridays': 5,
    'saturday': 6, 'saturdays': 6
  };
  const days = new Set();
  const lowerText = text.toLowerCase();
  if (/\bweekends?\b/.test(lowerText)) {
    days.add(0);
    days.add(6);
  }
  if (/\bweekdays?\b/.test(lowerText)) {
    [1, 2, 3, 4, 5].forEach(d => days.add(d));
  }
  for (const [name, index] of Object.entries(dayMap)) {
    const regex = new RegExp('\\b' + name + '\\b', 'i');
    if (regex.test(text)) {
      days.add(index);
    }
  }
  return days.size > 0 ? Array.from(days).sort((a, b) => a - b) : null;
}

function extractPreferredTimeOfDay(text) {
  const lowerText = text.toLowerCase();
  if (/\bmornings?\b/.test(lowerText)) return 'morning';
  if (/\bafternoons?\b/.test(lowerText)) return 'afternoon';
  if (/\bevenings?\b/.test(lowerText)) return 'evening';
  if (/\bafter\s+school\b/.test(lowerText)) return 'afternoon';
  if (/\bafter\s+work\b/.test(lowerText)) return 'evening';
  return null;
}

function extractTimeConstraints(text) {
  let minStartTime = null;
  let maxStartTime = null;

  function toHHMM(hourStr, minuteStr, ampm) {
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr ? parseInt(minuteStr, 10) : 0;
    if (ampm) {
      if (/pm/i.test(ampm) && hour < 12) hour += 12;
      if (/am/i.test(ampm) && hour === 12) hour = 0;
    }
    return String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
  }

  const betweenMatch = text.match(/between\s+(\d{1,2})(?::(\d{2}))?\s*(?:am|pm)?\s*and\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (betweenMatch) {
    minStartTime = toHHMM(betweenMatch[1], betweenMatch[2], betweenMatch[5]);
    maxStartTime = toHHMM(betweenMatch[3], betweenMatch[4], betweenMatch[5]);
    return { minStartTime, maxStartTime };
  }

  const afterMatch = text.match(/(?:after|from|starting(?:\s+at)?)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
    || text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s+or\s+later/i);
  if (afterMatch) {
    minStartTime = toHHMM(afterMatch[1], afterMatch[2], afterMatch[3]);
  }

  const beforeMatch = text.match(/(?:before|by|until|no\s+later\s+than)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (beforeMatch) {
    maxStartTime = toHHMM(beforeMatch[1], beforeMatch[2], beforeMatch[3]);
  }

  return { minStartTime, maxStartTime };
}

function extractPreferredProgram(text) {
  const programs = [
    'track and field', 'flag football', 'martial arts', 'creative arts',
    'tee ball', 't-ball',
    'cheerleading', 'taekwondo',
    'soccer', 'basketball', 'baseball', 'softball',
    'football', 'tennis', 'volleyball', 'swimming', 'swim',
    'gymnastics', 'hockey', 'lacrosse', 'golf', 'cricket',
    'rugby', 'wrestling', 'dance', 'ballet', 'cheer',
    'karate', 'judo', 'track', 'tball', 'art', 'arts'
  ];
  const lowerText = text.toLowerCase();
  for (const program of programs) {
    const escaped = program.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp('\\b' + escaped + '\\b', 'i');
    if (regex.test(text)) {
      if (program === 'swim') return 'swimming';
      if (program === 'tee ball' || program === 'tball') return 't-ball';
      if (program === 'cheer') return 'cheerleading';
      if (program === 'arts' || program === 'creative arts') return 'art';
      return program;
    }
  }
  return null;
}

function extractLocation(text) {
  const knownCities = [
    'Rancho Santa Margarita', 'San Juan Capistrano',
    'Yorba Linda', 'Anaheim', 'Fullerton',
    'Irvine', 'Orange', 'Tustin'
  ];
  for (const city of knownCities) {
    const escaped = city.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp('\\b' + escaped + '\\b', 'i');
    if (regex.test(text)) {
      return city;
    }
  }
  const aliasKeys = Object.keys(LOCATION_ALIASES);
  for (const alias of aliasKeys) {
    const regex = new RegExp('\\b' + alias.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'i');
    if (regex.test(text) && LOCATION_ALIASES[alias]) {
      return LOCATION_ALIASES[alias];
    }
  }
  const patterns = [
    /(?:live|located|based|we(?:'re|\s+are))\s+in\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/,
    /(?:from|near|around|close\s+to)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/,
    /in\s+the\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+area/
  ];
  const locationFalsePositives = [
    'saturday','sunday','monday','tuesday','wednesday','thursday','friday',
    'morning','afternoon','evening','soccer','basketball','baseball',
    'football','tennis','volleyball','swimming','gymnastics','hockey'
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1] && !locationFalsePositives.includes(match[1].toLowerCase())) {
      return match[1];
    }
  }
  return null;
}

// ===== MAIN LOGIC =====

const body = $json.body || $json;
const message = body.message || '';
const incomingContext = body.context || {};
const conversationId = body.conversationId || null;

const userMessagesText = (incomingContext.messages || [])
  .filter(m => m.role === 'user')
  .map(m => m.content)
  .join('\n');
const allUserText = userMessagesText + '\n' + message;

const extractedName = extractChildName(allUserText);
const extractedAge = extractChildAge(allUserText);
const extractedDays = extractPreferredDays(allUserText);
const extractedTime = extractPreferredTimeOfDay(allUserText);
const extractedTimeConstraints = extractTimeConstraints(allUserText);
const extractedProgram = extractPreferredProgram(allUserText);
const extractedLocation = extractLocation(allUserText);

const resolvedChildName = incomingContext.childName || extractedName || null;
const resolvedChildAge = incomingContext.childAge || extractedAge || null;
const resolvedPreferredDays = incomingContext.preferredDays || extractedDays || null;
const resolvedPreferredTimeOfDay = incomingContext.preferredTimeOfDay || extractedTime || null;
const resolvedMinStartTime = incomingContext.minStartTime || extractedTimeConstraints.minStartTime || null;
const resolvedMaxStartTime = incomingContext.maxStartTime || extractedTimeConstraints.maxStartTime || null;
const resolvedPreferredProgram = incomingContext.preferredProgram || extractedProgram || null;
const resolvedPreferredLocation = resolveLocationCity(
  incomingContext.preferredLocation || extractedLocation || null
);

// ===== PROGRAM RESOLUTION =====
const matchingPrograms = resolvePrograms(resolvedPreferredProgram, resolvedChildAge);
const resolvedProgramNames = matchingPrograms.map(p => p.name);
const cityLocations = getLocationsForCity(resolvedPreferredLocation);

// ===== SEARCH READINESS =====
const missingInfo = [];
if (!resolvedChildName) missingInfo.push('child name');
if (!resolvedChildAge) missingInfo.push('child age');
if (!resolvedPreferredDays || resolvedPreferredDays.length === 0) missingInfo.push('preferred days');
if (!resolvedPreferredProgram) missingInfo.push('sport/activity preference');
const searchReady = resolvedChildAge && resolvedPreferredDays && resolvedPreferredDays.length > 0;

// ===== BUILD CONTEXT SUMMARY =====
const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const messageHistory = (incomingContext.messages || []).slice(-8);
const historyText = messageHistory.map(m =>
  `${m.role === 'user' ? 'Parent' : 'Kai'}: ${m.content}`
).join('\n');

let programInfo;
if (matchingPrograms.length > 0) {
  programInfo = matchingPrograms.map(p =>
    `${p.name} (ages ${p.ageMin}-${p.ageMaxExcl - 1}, ${formatPrice(p.price)}/season)`
  ).join(', ');
} else if (resolvedPreferredProgram && resolvedChildAge) {
  programInfo = `No ${resolvedPreferredProgram} programs found for age ${resolvedChildAge}`;
} else if (resolvedPreferredProgram) {
  programInfo = `${resolvedPreferredProgram} (age needed to determine specific program)`;
} else {
  programInfo = 'NOT PROVIDED YET';
}

const contextSummary = `
CURRENT REGISTRATION DATA:
- Child Name: ${resolvedChildName || 'NOT PROVIDED YET'}
- Child Age: ${resolvedChildAge || 'NOT PROVIDED YET'}
- Sport/Activity Interest: ${resolvedPreferredProgram || 'NOT PROVIDED YET'}
- MATCHING PROGRAM(S): ${programInfo}
- Location: ${resolvedPreferredLocation || 'NOT PROVIDED YET'}${cityLocations.length > 0 ? `\n- VENUES IN ${resolvedPreferredLocation.toUpperCase()}: ${cityLocations.join(', ')}` : ''}
- Preferred Days: ${resolvedPreferredDays ? resolvedPreferredDays.map(d => dayNames[d]).join(', ') : 'NOT PROVIDED YET'}
- Preferred Time: ${resolvedPreferredTimeOfDay || 'NOT PROVIDED YET'}
- Min Start Time: ${resolvedMinStartTime || 'NOT SET'}
- Max Start Time: ${resolvedMaxStartTime || 'NOT SET'}
- Organization ID: ${incomingContext.organizationId}
${searchReady && resolvedProgramNames.length > 0 ? `
SESSION SEARCH INSTRUCTIONS:
When searching for sessions, use these exact parameters:
- program_name IN (${resolvedProgramNames.map(n => "'" + n + "'").join(', ')})
- city = '${resolvedPreferredLocation || 'any'}'
- day_of_week IN (${resolvedPreferredDays ? resolvedPreferredDays.join(', ') : 'any'})${resolvedPreferredTimeOfDay && resolvedPreferredTimeOfDay !== 'any' ? `\n- time_of_day = '${resolvedPreferredTimeOfDay}' (morning < 12:00, afternoon 12:00-17:00, evening >= 17:00)` : ''}
- status = 'active'
- enrolled_count < capacity (has spots available)
` : ''}
SEARCH READINESS: ${searchReady ? 'READY - search for sessions now' : `NOT READY - still need: ${missingInfo.join(', ')}`}

CONVERSATION HISTORY:
${historyText || 'This is the start of the conversation'}
`;

const fullPrompt = `${contextSummary}\n\n---\n\nPARENT'S MESSAGE: ${message}`;

return {
  guardrailsInput: fullPrompt,
  userMessage: message,
  contextSummary: contextSummary,
  conversationId: conversationId,

  context: {
    organizationId: incomingContext.organizationId,
    childName: resolvedChildName,
    childAge: resolvedChildAge,
    preferredDays: resolvedPreferredDays,
    preferredTimeOfDay: resolvedPreferredTimeOfDay,
    minStartTime: resolvedMinStartTime,
    maxStartTime: resolvedMaxStartTime,
    preferredProgram: resolvedPreferredProgram,
    resolvedPrograms: resolvedProgramNames,
    preferredLocation: resolvedPreferredLocation,
    cityLocations: cityLocations,
    searchReady: searchReady,
    missingInfo: missingInfo,
    currentState: incomingContext.currentState || 'greeting',
    messages: incomingContext.messages || []
  }
};
