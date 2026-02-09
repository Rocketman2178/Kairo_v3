import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Copy, Check, ChevronDown, ChevronRight, ArrowLeft,
  Users, MapPin, Clock, AlertTriangle, Star, Zap,
  HelpCircle, Target, MessageSquare, Loader2
} from 'lucide-react';
import {
  fetchAllSessions,
  generateScenariosFromSessions,
  type SessionData,
  type TestScenario,
  type ScenarioCategory as DataScenarioCategory
} from '@/services/testScenarios/sessionDataFetcher';

interface TestScenario {
  id: string;
  title: string;
  description: string;
  prompts: string[];
  expectedBehavior: string;
  dataPoints: string[];
  tags: string[];
}

interface ScenarioCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  scenarios: TestScenario[];
}

const iconMap: Record<string, React.ReactNode> = {
  'users': <Users className="w-5 h-5" />,
  'map-pin': <MapPin className="w-5 h-5" />,
  'clock': <Clock className="w-5 h-5" />,
  'alert-triangle': <AlertTriangle className="w-5 h-5" />,
  'star': <Star className="w-5 h-5" />,
  'zap': <Zap className="w-5 h-5" />,
  'help-circle': <HelpCircle className="w-5 h-5" />,
  'target': <Target className="w-5 h-5" />,
  'message-square': <MessageSquare className="w-5 h-5" />,
};

const fallbackCategories: ScenarioCategory[] = [
  {
    id: 'basic-registration',
    title: 'Basic Registration Flows',
    description: 'Standard age-based registration paths through different programs',
    icon: <Users className="w-5 h-5" />,
    color: 'emerald',
    scenarios: [
      {
        id: 'toddler-mini',
        title: 'Toddler (Age 3) - Mini Soccer',
        description: 'Youngest age group, should route to Mini Soccer ($208, ages 2-4)',
        prompts: [
          "Hi, I'd like to sign up my son for soccer",
          "His name is Liam and he's 3 years old",
          "We're in Irvine, Saturday mornings work best"
        ],
        expectedBehavior: 'Should recommend Mini Soccer sessions. Irvine Saturday options: Oakwood Recreation Center at 9:00am (3 spots) or 10:30am (1 spot). Coach Mike teaches both.',
        dataPoints: [
          'Mini Soccer: ages 2-4, $208/season',
          'Oakwood Rec Center Sat 9am: 6/8 enrolled (moderate)',
          'Oakwood Rec Center Sat 10:30am: 7/8 enrolled (filling fast)',
        ],
        tags: ['mini', 'toddler', 'irvine', 'saturday'],
      },
      {
        id: 'young-child-junior',
        title: 'Young Child (Age 5) - Junior Soccer',
        description: 'Should route to Junior Soccer ($224, ages 4-7). Multiple sessions available.',
        prompts: [
          "I want to register my daughter Emma for soccer",
          "She's 5 years old",
          "We live in Orange, any day after school works"
        ],
        expectedBehavior: 'Should recommend Junior Soccer sessions in Orange (Main Sports Complex). Weekday afternoon options: Mon 10am (3 spots), Wed 5pm (10 spots), Fri 5:30pm (6 spots). Also Sat morning options.',
        dataPoints: [
          'Junior Soccer: ages 4-7, $224/season',
          'Main Sports Complex Mon 10am: 9/12 enrolled',
          'Main Sports Complex Wed 5pm: 2/12 enrolled (plenty of room)',
          'Main Sports Complex Fri 5:30pm: 6/12 enrolled',
        ],
        tags: ['junior', 'child', 'orange', 'weekday'],
      },
      {
        id: 'older-child-premier',
        title: 'Older Child (Age 9) - Premier Soccer',
        description: 'Should route to Premier Soccer ($240, ages 7-11). Multiple locations.',
        prompts: [
          "My son Jake is 9 and wants to play soccer",
          "We prefer weekends",
          "Rancho Santa Margarita area"
        ],
        expectedBehavior: 'Should recommend Premier Soccer in RSM. Saturday options: RSM Community Center at 9am (4 spots) or 10:30am (2 spots, filling fast). Sunday at 9:45am (5 spots).',
        dataPoints: [
          'Premier Soccer: ages 7-11, $240/season',
          'RSM CC Sat 9am: 8/12 enrolled (moderate)',
          'RSM CC Sat 10:30am: 10/12 enrolled (filling fast)',
          'RSM CC Sun 9:45am: 7/12 enrolled (moderate)',
        ],
        tags: ['premier', 'older-child', 'rsm', 'weekend'],
      },
      {
        id: 'teen-soccer',
        title: 'Teen (Age 12) - Teen Soccer',
        description: 'Should route to Teen Soccer ($229, ages 10-15). All at Main Sports Complex, Orange.',
        prompts: [
          "I need to register my 12-year-old for soccer",
          "His name is Marcus",
          "Weekday afternoons preferred, we're near Orange"
        ],
        expectedBehavior: 'Should recommend Teen Soccer at Main Sports Complex. Weekday options: Mon 3:30pm (12 spots open), Tue 3:30pm (6 spots), Wed 4:30pm (12 spots open), Thu 3:30pm (7 spots), Fri 4pm (11 spots).',
        dataPoints: [
          'Teen Soccer: ages 10-15, $229/season',
          'All sessions at Main Sports Complex, Orange',
          'Most weekday sessions have plenty of availability',
          'Sat 10am is FULL (12/12) - should not be recommended',
        ],
        tags: ['teen', 'orange', 'weekday'],
      },
      {
        id: 'high-school',
        title: 'High Schooler (Age 16) - High School Soccer',
        description: 'Should route to High School Soccer ($201, ages 15-19). Multiple locations.',
        prompts: [
          "My daughter is 16 and looking for a soccer program",
          "She's available after school on weekdays",
          "Fullerton area"
        ],
        expectedBehavior: 'Should recommend High School Soccer in Fullerton. North Field Location options: Wed 7pm (5 spots), Fri 2pm (4 spots). Also RSM CC in RSM and other locations.',
        dataPoints: [
          'High School Soccer: ages 15-19, $201/season',
          'North Field Fullerton Wed 7pm: 7/12 enrolled',
          'North Field Fullerton Fri 2pm: 8/12 enrolled',
          'RSM CC Mon 3pm is FULL',
        ],
        tags: ['high-school', 'teen', 'fullerton', 'weekday'],
      },
    ],
  },
  {
    id: 'non-soccer-programs',
    title: 'Non-Soccer Programs',
    description: 'Basketball, swimming, and arts programs for different age groups',
    icon: <Star className="w-5 h-5" />,
    color: 'blue',
    scenarios: [
      {
        id: 'youth-basketball',
        title: 'Youth Basketball (Age 7)',
        description: 'Should find Youth Basketball ($202, ages 5-9). Lots of availability.',
        prompts: [
          "Does Soccer Stars offer basketball too?",
          "My son is 7 and loves basketball",
          "We're in Orange, Wednesday or Thursday works"
        ],
        expectedBehavior: 'Should recommend Youth Basketball at Main Sports Complex. Wed 4pm (9 spots), Wed 4:30pm (9 spots), Wed 5pm (11 spots), Thu 4pm (9 spots). Very available.',
        dataPoints: [
          'Youth Basketball: ages 5-9, $202/season',
          'Main Sports Complex has many open sessions',
          'RSM CC also has sessions in RSM',
        ],
        tags: ['basketball', 'youth', 'orange'],
      },
      {
        id: 'learn-swim',
        title: 'Learn to Swim (Age 6)',
        description: 'Swimming program for younger kids ($232, ages 4-9). Smaller class sizes (8 max).',
        prompts: [
          "I want my 6-year-old to learn swimming",
          "Her name is Sofia",
          "Any location near Orange is fine"
        ],
        expectedBehavior: 'Should recommend Learn to Swim. Orange area options: Westside Sports Complex Tue 9am (6 spots), East Park Wed 11am (4 spots). Note Fri at Oakwood in Irvine is FULL.',
        dataPoints: [
          'Learn to Swim: ages 4-9, $232/season, 8-person classes',
          'Westside Sports Complex Tue 9am: 2/8 enrolled',
          'East Park Wed 11am: 4/8 enrolled',
          'Oakwood Irvine Fri 9:30am: FULL (8/8)',
        ],
        tags: ['swimming', 'young-child', 'orange'],
      },
      {
        id: 'creative-arts',
        title: 'Creative Arts Studio (Age 10)',
        description: 'Arts program ($253, ages 6-15). All in Orange area with Coach Jenny Park.',
        prompts: [
          "My daughter is interested in art classes, not sports",
          "She's 10 years old",
          "Any day works for us"
        ],
        expectedBehavior: 'Should recommend Creative Arts Studio sessions in Orange. Options range from Tue-Sat. Coach Jenny Park teaches all sessions. Sat 3pm at Main Sports Complex most popular (4 spots left).',
        dataPoints: [
          'Creative Arts: ages 6-15, $253/season',
          'All sessions in Orange (various complexes)',
          'Jenny Park is the instructor for all sessions',
          'Most sessions have plenty of availability',
        ],
        tags: ['arts', 'creative', 'orange', 'non-sport'],
      },
    ],
  },
  {
    id: 'location-specific',
    title: 'Location-Specific Requests',
    description: 'Testing city/location preference handling',
    icon: <MapPin className="w-5 h-5" />,
    color: 'cyan',
    scenarios: [
      {
        id: 'irvine-family',
        title: 'Irvine Family - Multiple Options',
        description: 'Irvine has 3 locations: Beacon Park, Milestones Montessori, Oakwood Rec Center',
        prompts: [
          "We live in Irvine and want to sign up our 4-year-old for something",
          "His name is Noah",
          "Weekend mornings preferred"
        ],
        expectedBehavior: 'Should show Mini Soccer and Junior Soccer options at Oakwood Rec Center and Beacon Park in Irvine. Sat/Sun morning sessions.',
        dataPoints: [
          'Irvine locations: Beacon Park, Milestones Montessori, Oakwood Rec Center',
          'Mini Soccer Sun 9:45am at Oakwood: 5/8 (moderate)',
          'Junior Soccer Sat 9am at Oakwood: 8/12 (moderate)',
          'Classic Soccer Sun 9am at Beacon Park: 6/12 (available)',
        ],
        tags: ['irvine', 'weekend', 'multiple-programs'],
      },
      {
        id: 'rsm-family',
        title: 'Rancho Santa Margarita Family',
        description: 'RSM has RSM Community Center and Central Park',
        prompts: [
          "Looking for soccer for my 3-year-old in Rancho Santa Margarita",
          "Her name is Ava",
          "Saturday morning if possible"
        ],
        expectedBehavior: 'Mini Soccer in RSM. Central Park Sat 9am (3 spots), RSM CC Sat 9am (2 spots, moderate), RSM CC Sat 10:30am (1 spot, filling fast).',
        dataPoints: [
          'RSM locations: Central Park, RSM Community Center',
          'Central Park Sat 9am: 5/8 enrolled',
          'RSM CC Sat 9am: 6/8 enrolled',
          'RSM CC Sat 10:30am: 7/8 enrolled (filling fast)',
        ],
        tags: ['rsm', 'mini', 'saturday'],
      },
      {
        id: 'fullerton-family',
        title: 'Fullerton Family',
        description: 'Fullerton only has North Field Location. Tests when limited location options.',
        prompts: [
          "We're in Fullerton, need soccer for our 6-year-old",
          "His name is Ethan",
          "Weekdays after 3pm"
        ],
        expectedBehavior: 'Junior Soccer at North Field Location, Fullerton. Tue 3pm (4 spots), Wed 10:30am (too early), Thu 5pm (2 spots, filling fast). Sun 10am is FULL.',
        dataPoints: [
          'Fullerton location: North Field Location only',
          'Junior Soccer Tue 3pm: 8/12 enrolled',
          'Junior Soccer Thu 5pm: 10/12 enrolled (filling fast)',
          'Junior Soccer Sun 10am: FULL (12/12)',
        ],
        tags: ['fullerton', 'junior', 'weekday-afternoon'],
      },
      {
        id: 'san-juan-cap',
        title: 'San Juan Capistrano Family',
        description: 'Only one location: Sendero Field. Very limited options.',
        prompts: [
          "We live in San Juan Capistrano",
          "My 8-year-old wants soccer",
          "When are classes available?"
        ],
        expectedBehavior: 'Should find Premier Soccer at Sendero Field, Sat 10:30am (8 spots, very available). May also suggest nearby RSM locations. Limited options at this location.',
        dataPoints: [
          'SJC location: Sendero Field only',
          'Premier Soccer Sat 10:30am: 4/12 enrolled',
          'Only 1 session at this location',
        ],
        tags: ['sjc', 'limited-options', 'premier'],
      },
    ],
  },
  {
    id: 'schedule-preferences',
    title: 'Schedule & Time Preferences',
    description: 'Testing day/time preference matching',
    icon: <Clock className="w-5 h-5" />,
    color: 'amber',
    scenarios: [
      {
        id: 'weekday-morning',
        title: 'Weekday Morning Only (Preschool Parent)',
        description: 'Parent needs morning sessions on weekdays. Limited options.',
        prompts: [
          "I need a Tuesday or Wednesday morning class for my 3-year-old",
          "We're in Orange",
          "Before noon please"
        ],
        expectedBehavior: 'Mini Soccer at Main Sports Complex: Tue 10am (11 spots), Wed 4pm (too late). Only the Tue session fits the morning constraint.',
        dataPoints: [
          'Mini Soccer Tue 10am at Main Sports Complex: 1/12 enrolled',
          'Mini Soccer Thu 10am at Main Sports Complex: 11/12 (filling fast)',
          'Weekday morning options are limited for Mini Soccer',
        ],
        tags: ['morning', 'weekday', 'mini', 'orange'],
      },
      {
        id: 'evening-only',
        title: 'Evening Sessions (Working Parent)',
        description: 'Parent can only do after 5pm. Tests evening availability filtering.',
        prompts: [
          "I work until 5pm so I need evening classes",
          "My son is 5, we're in Irvine",
          "Monday or Friday preferred"
        ],
        expectedBehavior: 'Junior Soccer at Oakwood Rec Center: Mon 6:30pm (1 spot only, filling fast!), Fri 6pm at Mini Soccer level. Should flag urgency on Monday session.',
        dataPoints: [
          'Junior Soccer Mon 6:30pm at Oakwood: 11/12 (filling fast, 1 spot)',
          'Mini Soccer Fri 6pm at Oakwood: 4/8 (available)',
          'Evening options in Irvine are limited',
        ],
        tags: ['evening', 'working-parent', 'irvine', 'limited'],
      },
      {
        id: 'saturday-only',
        title: 'Saturday Only Family',
        description: 'Many sessions run on Saturdays. Tests sorting by time/availability.',
        prompts: [
          "We can only do Saturdays",
          "I have a 6-year-old who wants soccer",
          "Orange or Irvine area"
        ],
        expectedBehavior: 'Junior Soccer Saturday options: Main Sports Complex 9:30am (10 spots), 10am (6 spots), Oakwood Irvine 9am (4 spots), 10:30am (2 spots). Should prioritize by availability.',
        dataPoints: [
          'Saturday is the busiest day with 20+ sessions across programs',
          'Multiple locations and time slots available',
          'Some Sat sessions are filling fast or nearly full',
        ],
        tags: ['saturday', 'weekend', 'junior', 'multiple-options'],
      },
    ],
  },
  {
    id: 'full-waitlist',
    title: 'Full Sessions & Waitlist',
    description: 'Testing behavior when requested sessions are full',
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'red',
    scenarios: [
      {
        id: 'full-junior-sunday',
        title: 'Full Junior Soccer - Sunday Fullerton',
        description: 'Junior Soccer Sunday 10am at North Field is FULL (12/12). Should offer alternatives.',
        prompts: [
          "I want to sign up my 5-year-old for Junior Soccer",
          "Sunday morning in Fullerton please",
          "His name is Oliver"
        ],
        expectedBehavior: 'Should inform that Sunday 10am at North Field is full. Offer waitlist option. Suggest alternatives: Sunday 9:45am at Oakwood Irvine or RSM CC RSM (both have 5 spots).',
        dataPoints: [
          'Junior Soccer Sun 10am North Field: FULL (12/12)',
          'Alternative: Sun 9:45am Oakwood Irvine: 7/12',
          'Alternative: Sun 9:45am RSM CC RSM: 7/12',
          'Waitlist should be offered for the full session',
        ],
        tags: ['full', 'waitlist', 'junior', 'fullerton', 'alternatives'],
      },
      {
        id: 'full-learn-swim',
        title: 'Full Learn to Swim - Friday Irvine',
        description: 'Learn to Swim Friday 9:30am at Oakwood is FULL (8/8). Small class, high demand.',
        prompts: [
          "I want swimming lessons for my 5-year-old on Friday in Irvine",
          "Her name is Mia",
          "Morning time works best"
        ],
        expectedBehavior: 'Should report Fri 9:30am at Oakwood is full. Suggest: Mon 4pm at North Field Fullerton, or Thu 9am at RSM CC RSM. May need to expand location radius.',
        dataPoints: [
          'Learn to Swim Fri 9:30am Oakwood: FULL (8/8)',
          'Alternative: Mon 4pm North Field Fullerton: 2/8',
          'Alternative: Thu 9am RSM CC RSM: 1/8',
          'Learn to Swim classes have 8-person max (smaller)',
        ],
        tags: ['full', 'swimming', 'irvine', 'small-class'],
      },
      {
        id: 'full-teen-basketball',
        title: 'Full Teen Basketball - Thursday Orange',
        description: 'Teen Basketball Thursday 6pm at Main Sports Complex is FULL (12/12).',
        prompts: [
          "My 12-year-old wants basketball on Thursdays",
          "We're in Orange",
          "After school, around 5-6pm"
        ],
        expectedBehavior: 'Thu 6pm at Main Sports Complex is full. Alternatives: Sun 2pm at Westside (10 spots), Tue 3:30pm at Main Sports Complex (12 spots open!), Sat 1pm at Westside (10 spots).',
        dataPoints: [
          'Teen Basketball Thu 6pm Main Sports: FULL (12/12)',
          'Sun 2pm Westside: 2/12 enrolled (very available)',
          'Tue 3:30pm Main Sports: 0/12 enrolled (empty)',
          'Sat 1pm Westside: 2/12 enrolled (very available)',
        ],
        tags: ['full', 'basketball', 'teen', 'orange', 'alternatives'],
      },
    ],
  },
  {
    id: 'urgency-scenarios',
    title: 'Urgency & Filling Fast',
    description: 'Sessions with limited spots - testing urgency messaging',
    icon: <Zap className="w-5 h-5" />,
    color: 'orange',
    scenarios: [
      {
        id: 'one-spot-classic',
        title: 'Classic Soccer - 1 Spot Left',
        description: 'Classic Soccer Wed 7pm at Oakwood has only 1 spot remaining (11/12).',
        prompts: [
          "I'd like Classic Soccer for my 6-year-old",
          "Wednesday evenings in Irvine",
          "Her name is Charlotte"
        ],
        expectedBehavior: 'Should show the Wed 7pm session at Oakwood with strong urgency messaging (1 spot left!). Also suggest Sat 9am at Central Park RSM (2 spots) or Sun 9am at Beacon Park (6 spots) as safer alternatives.',
        dataPoints: [
          'Classic Soccer Wed 7pm Oakwood: 11/12 (1 SPOT LEFT)',
          'Classic Soccer Sat 9am Central Park RSM: 10/12 (2 spots)',
          'Classic Soccer Sun 9am Beacon Park Irvine: 6/12 (available)',
          'Coach Mike teaches the Wed session, Coach Alex on weekends',
        ],
        tags: ['urgency', 'one-spot', 'classic', 'irvine'],
      },
      {
        id: 'filling-fast-mini',
        title: 'Mini Soccer - Filling Fast Sessions',
        description: 'Several Mini Soccer sessions at 1 spot. Tests urgency across multiple options.',
        prompts: [
          "My 2-year-old is ready for Mini Soccer!",
          "Thursday or Friday, morning time",
          "We can go to Orange or Fullerton"
        ],
        expectedBehavior: 'Both Thu 10am at Main Sports Complex (1 spot!) and Fri 10am at North Field (1 spot!) are filling fast. Should emphasize urgency. Thu 4pm at Main Sports Complex has 6 spots as a safer alternative.',
        dataPoints: [
          'Mini Soccer Thu 10am Main Sports: 11/12 (1 spot, filling fast)',
          'Mini Soccer Fri 10am North Field: 11/12 (1 spot, filling fast)',
          'Mini Soccer Thu 4pm Main Sports: 6/12 (available)',
          'Urgency messaging critical for both top options',
        ],
        tags: ['urgency', 'filling-fast', 'mini', 'multiple-urgent'],
      },
    ],
  },
  {
    id: 'edge-cases',
    title: 'Edge Cases & Special Scenarios',
    description: 'Age boundaries, no matches, ambiguous requests',
    icon: <HelpCircle className="w-5 h-5" />,
    color: 'slate',
    scenarios: [
      {
        id: 'age-boundary-4',
        title: 'Age Boundary - 4 Year Old (Multiple Programs)',
        description: 'Age 4 qualifies for Mini Soccer (2-4), Junior Soccer (4-7), Classic Soccer (4-8), and Learn to Swim (4-9).',
        prompts: [
          "My child just turned 4",
          "What programs are available?",
          "We're open to anything in Irvine"
        ],
        expectedBehavior: 'Should present multiple program options: Mini Soccer, Junior Soccer, Classic Soccer, Learn to Swim. Let the parent choose based on skill level and interest. Explain the differences.',
        dataPoints: [
          'Age 4 eligible: Mini Soccer, Junior Soccer, Classic Soccer, Learn to Swim',
          'Mini Soccer: introductory, smaller classes (8 max), $208',
          'Junior Soccer: next step up, $224',
          'Classic Soccer: more structured, $299',
          'Learn to Swim: different sport option, $232',
        ],
        tags: ['age-boundary', 'multiple-programs', 'decision-help'],
      },
      {
        id: 'too-young',
        title: 'Too Young (Age 1)',
        description: 'No programs available for children under 2.',
        prompts: [
          "My baby is 1 year old, do you have any programs?",
          "We want to get her started early"
        ],
        expectedBehavior: 'Should gracefully explain that the youngest program (Mini Soccer) starts at age 2. Suggest coming back when the child turns 2. Could mention what to expect in Mini Soccer.',
        dataPoints: [
          'Minimum age across all programs: 2 (Mini Soccer)',
          'No programs for under 2',
          'Should handle gracefully without errors',
        ],
        tags: ['too-young', 'no-match', 'graceful-handling'],
      },
      {
        id: 'too-old',
        title: 'Too Old (Age 20)',
        description: 'No programs available for adults (max age is 19).',
        prompts: [
          "I'm 20, can I join a soccer program?",
          "Or maybe basketball?"
        ],
        expectedBehavior: 'Should explain that programs go up to age 19 (High School level). No adult programs available. Handle gracefully.',
        dataPoints: [
          'Maximum age: 19 (High School Soccer, High School Basketball)',
          'No adult programs exist',
        ],
        tags: ['too-old', 'no-match', 'adult'],
      },
      {
        id: 'vague-request',
        title: 'Vague Request - No Age or Location',
        description: 'User gives minimal information. Tests the AI\'s ability to ask follow-up questions.',
        prompts: [
          "I want to sign my kid up for something"
        ],
        expectedBehavior: 'Should ask for child\'s name, age, and location/schedule preferences before making recommendations. Should NOT just dump all programs.',
        dataPoints: [
          '15 programs across all ages',
          '20 locations across Orange County',
          'AI should collect info before recommending',
        ],
        tags: ['vague', 'follow-up-needed', 'information-gathering'],
      },
      {
        id: 'specific-coach',
        title: 'Specific Coach Request',
        description: 'Parent asks for a specific coach by name.',
        prompts: [
          "My friend recommended Coach Sarah Mitchell",
          "We want to sign up our 6-year-old with her",
          "What sessions does she teach?"
        ],
        expectedBehavior: 'Sarah Mitchell (5.0 rating) teaches Learn to Swim and Advanced Swimming. For a 6-year-old, Learn to Swim is the match. Mon 4pm North Field, Wed 11am East Park, Thu 9am RSM CC.',
        dataPoints: [
          'Sarah Mitchell: 5.0 rating (highest rated coach)',
          'Teaches: Learn to Swim, Advanced Swimming, Intermediate Swimming',
          'For age 6, only Learn to Swim qualifies',
        ],
        tags: ['coach-request', 'specific', 'sarah-mitchell'],
      },
      {
        id: 'sibling-registration',
        title: 'Sibling Registration (Two Kids)',
        description: 'Parent wants to register two children of different ages. Tests sibling discount awareness.',
        prompts: [
          "I have two kids - one is 3 and the other is 7",
          "I'd like to sign both up for soccer",
          "We're in Irvine, Saturday mornings"
        ],
        expectedBehavior: 'Should recognize different age programs needed: Mini Soccer (age 3) and Premier Soccer (age 7). Both at Oakwood Rec Center on Saturdays. Should mention 10% sibling discount.',
        dataPoints: [
          'Age 3 -> Mini Soccer ($208)',
          'Age 7 -> Premier Soccer ($240)',
          'Sibling discount: 10%',
          'Oakwood Irvine has Sat sessions for both programs',
          'Mini Soccer Sat 9am: 6/8, Premier Soccer Sat 9am: 8/12',
        ],
        tags: ['siblings', 'discount', 'two-kids', 'different-ages'],
      },
    ],
  },
  {
    id: 'conversation-flow',
    title: 'Multi-Turn Conversation Flow',
    description: 'Testing the full conversation journey from greeting to selection',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'teal',
    scenarios: [
      {
        id: 'full-happy-path',
        title: 'Complete Happy Path - Registration',
        description: 'Full conversation from first message to session selection.',
        prompts: [
          "Hi! I'd like to register my child",
          "Her name is Sophie and she's 6",
          "We live in Orange and prefer Wednesday afternoons",
          "Soccer sounds great",
          "The 5pm session at Main Sports Complex works perfectly"
        ],
        expectedBehavior: 'Should progress: greeting -> collect child info -> collect preferences -> show recommendations -> confirm selection. Junior Soccer Wed 5pm at Main Sports Complex has 10 spots open.',
        dataPoints: [
          'Conversation states: greeting -> collecting_child_info -> collecting_preferences -> showing_recommendations -> confirming_selection',
          'Junior Soccer Wed 5pm Main Sports: 2/12 enrolled',
          'Price: $224',
        ],
        tags: ['happy-path', 'full-flow', 'end-to-end'],
      },
      {
        id: 'change-mind',
        title: 'Parent Changes Mind Mid-Conversation',
        description: 'Parent initially asks for soccer then switches to basketball.',
        prompts: [
          "I want soccer for my 8-year-old",
          "Actually, he's more into basketball now",
          "What basketball options do you have?",
          "We're in Orange, any day works"
        ],
        expectedBehavior: 'Should gracefully handle the switch from soccer to basketball. Age 8 qualifies for Youth Basketball (5-9). Show Orange options at Main Sports Complex - many available sessions.',
        dataPoints: [
          'Age 8 soccer options: Premier Soccer, Classic Soccer',
          'Age 8 basketball: Youth Basketball ($202)',
          'Youth Basketball has 9 active sessions, most with lots of availability',
        ],
        tags: ['change-mind', 'program-switch', 'flexibility'],
      },
      {
        id: 'no-match-expand',
        title: 'No Exact Match - Expand Search',
        description: 'Request that has no exact match, requiring the AI to expand search criteria.',
        prompts: [
          "I need a Monday evening swimming class in Irvine for my 10-year-old",
        ],
        expectedBehavior: 'No exact match exists (Intermediate Swimming is in Orange/Fullerton, not Irvine, and no Monday swimming). Should explain no exact match and suggest closest alternatives: Tue 4:30pm Fullerton (FULL), Thu/Fri in Orange, or Sat in Orange.',
        dataPoints: [
          'Intermediate Swimming (8-13): no sessions in Irvine',
          'Closest: East Park Orange (Sun, Thu, Fri, Sat), North Field Fullerton (Tue - FULL)',
          'No Monday swimming sessions exist anywhere',
          'Should expand location or day preferences',
        ],
        tags: ['no-match', 'expand-search', 'swimming'],
      },
    ],
  },
  {
    id: 'data-validation',
    title: 'Data Extraction Validation',
    description: 'Testing that the AI correctly extracts child info and preferences',
    icon: <Target className="w-5 h-5" />,
    color: 'rose',
    scenarios: [
      {
        id: 'natural-language-age',
        title: 'Natural Language Age Expressions',
        description: 'Tests extraction of age from various natural language formats.',
        prompts: [
          "My daughter will be turning 5 next month",
          "My twins are about to be four",
          "He's in first grade, so he's 6",
          "She was born in 2020"
        ],
        expectedBehavior: 'Should correctly parse ages from natural language. "turning 5 next month" = age 4 or 5 depending on handling. "first grade" = likely 6. Birth year should calculate current age.',
        dataPoints: [
          'Age extraction is critical for program matching',
          'Natural language varies widely',
          'Should handle: turning X, about to be X, grade level, birth year',
        ],
        tags: ['data-extraction', 'age-parsing', 'natural-language'],
      },
      {
        id: 'schedule-expressions',
        title: 'Natural Language Schedule Expressions',
        description: 'Tests extraction of day/time preferences from conversational input.',
        prompts: [
          "We're free on weekends only",
          "After school, so around 3-4pm",
          "Not Mondays - that's her dance class",
          "Tuesday through Thursday afternoons work"
        ],
        expectedBehavior: 'Should correctly interpret: "weekends" = Sat/Sun, "after school" = ~3-4pm, "not Mondays" = exclude Mon, "Tuesday through Thursday" = Tue/Wed/Thu.',
        dataPoints: [
          'Day of week values: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat',
          'Time preferences: morning (before noon), afternoon (12-5), evening (after 5)',
          'Exclusion handling is important',
        ],
        tags: ['data-extraction', 'schedule-parsing', 'time-preferences'],
      },
    ],
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md hover:bg-slate-600 transition-colors flex-shrink-0"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-slate-400" />
      )}
    </button>
  );
}

function ScenarioCard({ scenario }: { scenario: TestScenario }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const allPrompts = scenario.prompts.join('\n\n');
    navigator.clipboard.writeText(allPrompts);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-700/30 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white">{scenario.title}</h4>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{scenario.description}</p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {scenario.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-slate-700/50 text-slate-400 text-[10px] rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-700/50 pt-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Test Prompts (send in order)
              </h5>
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium rounded-md transition-colors"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy All Prompts
                  </>
                )}
              </button>
            </div>
            <div className="space-y-2">
              {scenario.prompts.map((prompt, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-slate-900/60 rounded-lg px-3 py-2"
                >
                  <span className="text-xs text-slate-500 font-mono w-5 flex-shrink-0">
                    {i + 1}.
                  </span>
                  <p className="text-sm text-emerald-300 flex-1 font-mono">
                    "{prompt}"
                  </p>
                  <CopyButton text={prompt} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Expected Behavior
            </h5>
            <p className="text-sm text-slate-300 bg-slate-900/60 rounded-lg px-3 py-2.5 leading-relaxed">
              {scenario.expectedBehavior}
            </p>
          </div>

          <div>
            <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Relevant Data Points
            </h5>
            <ul className="space-y-1">
              {scenario.dataPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="text-slate-600 mt-0.5">-</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function CategorySection({ category }: { category: ScenarioCategory }) {
  const [expanded, setExpanded] = useState(true);

  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    red: 'from-red-500/20 to-red-500/5 border-red-500/30',
    orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/30',
    slate: 'from-slate-500/20 to-slate-500/5 border-slate-500/30',
    teal: 'from-teal-500/20 to-teal-500/5 border-teal-500/30',
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/30',
  };

  const iconColorMap: Record<string, string> = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    orange: 'text-orange-400',
    slate: 'text-slate-400',
    teal: 'text-teal-400',
    rose: 'text-rose-400',
  };

  return (
    <div className="rounded-xl border border-slate-700/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full px-5 py-4 flex items-center gap-3 text-left bg-gradient-to-r ${colorMap[category.color]} hover:brightness-110 transition-all`}
      >
        <div className={iconColorMap[category.color]}>{category.icon}</div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-white">{category.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{category.description}</p>
        </div>
        <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded-full">
          {category.scenarios.length} scenarios
        </span>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="p-3 space-y-2 bg-slate-900/30">
          {category.scenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TestScenarios() {
  const [categories, setCategories] = useState<ScenarioCategory[]>(fallbackCategories.slice(0, 1));
  const [loading, setLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({ programs: 0, sessions: 0, full: 0, locations: 0 });

  useEffect(() => {
    async function loadScenarios() {
      try {
        setLoading(true);
        const sessions = await fetchAllSessions();

        const programs = new Set(sessions.map(s => s.program_name)).size;
        const fullCount = sessions.filter(s => s.urgency_level === 'full').length;
        const locations = new Set(sessions.map(s => s.location_name)).size;

        setSessionStats({
          programs,
          sessions: sessions.length,
          full: fullCount,
          locations
        });

        const dataCategories = generateScenariosFromSessions(sessions);

        const categoriesWithIcons: ScenarioCategory[] = dataCategories.map(cat => ({
          ...cat,
          icon: iconMap[cat.icon] || <HelpCircle className="w-5 h-5" />
        }));

        setCategories(categoriesWithIcons);
      } catch (error) {
        console.error('Error loading scenarios:', error);
        setCategories(fallbackCategories.slice(0, 3));
      } finally {
        setLoading(false);
      }
    }

    loadScenarios();
  }, []);

  const totalScenarios = categories.reduce((sum, cat) => sum + cat.scenarios.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a2332] to-[#0f1419]">
      <header className="sticky top-0 z-50 bg-[#0f1419]/95 border-b border-slate-800 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">Test Scenarios</h1>
              <p className="text-xs text-slate-400">
                {loading ? 'Loading scenarios from database...' : `${totalScenarios} scenarios across ${categories.length} categories - based on live Supabase data`}
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-500 transition-colors"
          >
            Open Chat
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
          <h2 className="text-sm font-semibold text-white mb-2">How to Use</h2>
          <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
            <li>Open the chat interface by clicking "Open Chat" above</li>
            <li>Pick a scenario category below and expand a test case</li>
            <li>Click "Copy All Prompts" to copy all prompts at once (separated by line breaks), or copy individual prompts one at a time</li>
            <li>Paste prompts into the chat and send them (if pasted all at once, send each prompt separately in order)</li>
            <li>Compare Kai's responses against the "Expected Behavior" section</li>
            <li>Verify that the correct sessions, prices, and availability are shown</li>
          </ol>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-3 text-center">
                <p className="text-2xl font-bold text-white">{sessionStats.programs}</p>
                <p className="text-xs text-slate-400">Programs</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-3 text-center">
                <p className="text-2xl font-bold text-white">{sessionStats.sessions}</p>
                <p className="text-xs text-slate-400">Active Sessions</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-3 text-center">
                <p className="text-2xl font-bold text-white">{sessionStats.full}</p>
                <p className="text-xs text-slate-400">Full Sessions</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-3 text-center">
                <p className="text-2xl font-bold text-white">{sessionStats.locations}</p>
                <p className="text-xs text-slate-400">Locations</p>
              </div>
            </div>

            {categories.map((category) => (
              <CategorySection key={category.id} category={category} />
            ))}
          </>
        )}
      </main>
    </div>
  );
}
