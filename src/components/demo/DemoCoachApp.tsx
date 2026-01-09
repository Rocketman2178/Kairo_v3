import { useState, useEffect } from 'react';
import {
  Calendar, Users, Clock, CheckCircle, X, MessageSquare, BookOpen,
  ChevronRight, ChevronLeft, Star, Camera, AlertCircle, MapPin, Phone,
  Video, Hash, Send, Building2, FileWarning, Play, Pause, Timer, Settings, Eye, EyeOff,
  ChevronDown, ChevronUp, SkipForward
} from 'lucide-react';

type CoachView = 'schedule' | 'attendance' | 'messaging' | 'team' | 'curriculum' | 'incident';

interface ClassSession {
  id: string;
  time: string;
  program: string;
  location: string;
  enrolled: number;
  capacity: number;
  status: 'upcoming' | 'in_progress' | 'completed';
}

interface Student {
  id: string;
  name: string;
  age: number;
  parentName: string;
  parentPhone: string;
  photo: string;
  present: boolean | null;
  notes?: string;
}

export function DemoCoachApp() {
  const [view, setView] = useState<CoachView>('schedule');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [showRatings, setShowRatings] = useState(true);
  const [coachMessagingEnabled, setCoachMessagingEnabled] = useState(true);

  const todayClasses: ClassSession[] = [
    {
      id: '1',
      time: '9:00 AM',
      program: 'Mini Soccer',
      location: 'Lincoln Park - Field A',
      enrolled: 10,
      capacity: 12,
      status: 'completed'
    },
    {
      id: '2',
      time: '10:30 AM',
      program: 'Mini Soccer',
      location: 'Lincoln Park - Field B',
      enrolled: 11,
      capacity: 12,
      status: 'in_progress'
    },
    {
      id: '3',
      time: '2:00 PM',
      program: 'Junior Soccer',
      location: 'Riverside Park',
      enrolled: 14,
      capacity: 16,
      status: 'upcoming'
    },
    {
      id: '4',
      time: '4:30 PM',
      program: 'Premier Soccer',
      location: 'Downtown Center',
      enrolled: 12,
      capacity: 14,
      status: 'upcoming'
    }
  ];

  const students: Student[] = [
    { id: '1', name: 'Connor Roberts', age: 4, parentName: 'Sarah Roberts', parentPhone: '(555) 123-4567', photo: '', present: null },
    { id: '2', name: 'Emma Martinez', age: 5, parentName: 'Maria Martinez', parentPhone: '(555) 234-5678', photo: '', present: null },
    { id: '3', name: 'Jake Thompson', age: 4, parentName: 'Mike Thompson', parentPhone: '(555) 345-6789', photo: '', present: null },
    { id: '4', name: 'Sophia Davis', age: 5, parentName: 'Jennifer Davis', parentPhone: '(555) 456-7890', photo: '', present: null },
    { id: '5', name: 'Ethan Wilson', age: 4, parentName: 'David Wilson', parentPhone: '(555) 567-8901', photo: '', present: null },
    { id: '6', name: 'Olivia Garcia', age: 5, parentName: 'Carlos Garcia', parentPhone: '(555) 678-9012', photo: '', present: null, notes: 'Allergic to bee stings' },
    { id: '7', name: 'Liam Brown', age: 4, parentName: 'Amanda Brown', parentPhone: '(555) 789-0123', photo: '', present: null },
    { id: '8', name: 'Ava Johnson', age: 5, parentName: 'Robert Johnson', parentPhone: '(555) 890-1234', photo: '', present: null },
    { id: '9', name: 'Noah Miller', age: 4, parentName: 'Emily Miller', parentPhone: '(555) 901-2345', photo: '', present: null },
    { id: '10', name: 'Isabella Lee', age: 5, parentName: 'James Lee', parentPhone: '(555) 012-3456', photo: '', present: null, notes: 'First day today!' }
  ];

  const lessonPlans = [
    {
      week: 1,
      title: 'Introduction & Ball Familiarity',
      skills: ['Toe taps', 'Ball rolls', 'Stopping the ball'],
      games: ['Shark Attack', 'Red Light Green Light'],
      equipment: 'Size 3 balls, cones',
      sections: [
        { name: 'Welcome & Warm-up', allocated: 5, description: 'Greet kids, high-fives, light jogging in circle' },
        { name: 'Skill Introduction', allocated: 8, description: 'Demonstrate toe taps and ball rolls' },
        { name: 'Guided Practice', allocated: 10, description: 'Kids practice toe taps in pairs' },
        { name: 'Activity 1', allocated: 8, description: 'Ball roll relay race' },
        { name: 'Water Break', allocated: 3, description: 'Hydration and rest' },
        { name: 'Game: Shark Attack', allocated: 10, description: 'Coach is shark, kids dribble to safety' },
        { name: 'Scrimmage & Closing', allocated: 6, description: 'Mini scrimmage, high-fives, goodbye' },
      ]
    },
    {
      week: 2,
      title: 'Dribbling Basics',
      skills: ['Inside foot dribble', 'Outside foot dribble', 'Speed control'],
      games: ['Dribble Tag', 'Cone Maze'],
      equipment: 'Size 3 balls, cones, pinnies',
      sections: [
        { name: 'Welcome & Warm-up', allocated: 5, description: 'Dynamic stretches, running with ball' },
        { name: 'Skill Introduction', allocated: 8, description: 'Demonstrate inside/outside foot dribble' },
        { name: 'Guided Practice', allocated: 10, description: 'Dribble through cone course' },
        { name: 'Activity 1', allocated: 8, description: 'Speed dribble races' },
        { name: 'Water Break', allocated: 3, description: 'Hydration and rest' },
        { name: 'Game: Dribble Tag', allocated: 10, description: 'Tag while dribbling' },
        { name: 'Scrimmage & Closing', allocated: 6, description: 'Mini scrimmage, high-fives, goodbye' },
      ]
    },
    {
      week: 3,
      title: 'Passing Fundamentals',
      skills: ['Inside foot pass', 'Receiving the ball', 'Partner passing'],
      games: ['Passing Pairs', 'Keep Away'],
      equipment: 'Size 3 balls, mini goals',
      sections: [
        { name: 'Welcome & Warm-up', allocated: 5, description: 'Toe taps review, light cardio' },
        { name: 'Skill Introduction', allocated: 8, description: 'Demonstrate inside foot pass technique' },
        { name: 'Guided Practice', allocated: 10, description: 'Partner passing back and forth' },
        { name: 'Activity 1', allocated: 8, description: 'Pass to target game' },
        { name: 'Water Break', allocated: 3, description: 'Hydration and rest' },
        { name: 'Game: Keep Away', allocated: 10, description: '3v1 keep away circles' },
        { name: 'Scrimmage & Closing', allocated: 6, description: 'Mini scrimmage, high-fives, goodbye' },
      ]
    },
    {
      week: 4,
      title: 'Shooting & Scoring',
      skills: ['Laces kick', 'Aiming', 'Follow through'],
      games: ['Target Practice', 'Mini Scrimmage'],
      equipment: 'Size 3 balls, portable goals, cones',
      sections: [
        { name: 'Welcome & Warm-up', allocated: 5, description: 'Ball touches, dynamic stretches' },
        { name: 'Skill Introduction', allocated: 8, description: 'Demonstrate shooting with laces' },
        { name: 'Guided Practice', allocated: 10, description: 'Shooting at targets from 5 yards' },
        { name: 'Activity 1', allocated: 8, description: 'Aim for corners competition' },
        { name: 'Water Break', allocated: 3, description: 'Hydration and rest' },
        { name: 'Game: Target Practice', allocated: 10, description: 'Points for hitting targets' },
        { name: 'Scrimmage & Closing', allocated: 6, description: 'Full scrimmage with goals, goodbye' },
      ]
    },
    {
      week: 5,
      title: 'Defense & Positioning',
      skills: ['Defensive stance', 'Staying goal-side', 'Blocking shots'],
      games: ['Steal the Bacon', 'Goalie Wars'],
      equipment: 'Size 3 balls, cones, pinnies',
      sections: [
        { name: 'Welcome & Warm-up', allocated: 5, description: 'Quick feet drills, lateral movement' },
        { name: 'Skill Introduction', allocated: 8, description: 'Defensive positioning demo' },
        { name: 'Guided Practice', allocated: 10, description: '1v1 defensive drills' },
        { name: 'Activity 1', allocated: 8, description: 'Shadow defense game' },
        { name: 'Water Break', allocated: 3, description: 'Hydration and rest' },
        { name: 'Game: Steal the Bacon', allocated: 10, description: 'Race to ball, defend goal' },
        { name: 'Scrimmage & Closing', allocated: 6, description: 'Scrimmage focusing on defense' },
      ]
    },
    {
      week: 6,
      title: 'Teamwork & Communication',
      skills: ['Calling for ball', 'Making space', 'Supporting teammates'],
      games: ['Triangle Passing', 'Team Relay'],
      equipment: 'Size 3 balls, cones, pinnies',
      sections: [
        { name: 'Welcome & Warm-up', allocated: 5, description: 'Partner stretches, team circle' },
        { name: 'Skill Introduction', allocated: 8, description: 'Communication phrases: "man on", "time"' },
        { name: 'Guided Practice', allocated: 10, description: 'Triangle passing with calling' },
        { name: 'Activity 1', allocated: 8, description: 'Making space exercises' },
        { name: 'Water Break', allocated: 3, description: 'Hydration and rest' },
        { name: 'Game: Team Relay', allocated: 10, description: 'Passing relay with communication' },
        { name: 'Scrimmage & Closing', allocated: 6, description: 'Scrimmage with bonus for calling' },
      ]
    },
    {
      week: 7,
      title: 'Game Day Skills',
      skills: ['Throw-ins', 'Corner kicks', 'Goal kicks'],
      games: ['Throw-in Tournament', 'Set Piece Challenge'],
      equipment: 'Size 3 balls, cones, full goals',
      sections: [
        { name: 'Welcome & Warm-up', allocated: 5, description: 'Jogging, arm stretches for throw-ins' },
        { name: 'Skill Introduction', allocated: 8, description: 'Proper throw-in technique' },
        { name: 'Guided Practice', allocated: 10, description: 'Practice throw-ins and restarts' },
        { name: 'Activity 1', allocated: 8, description: 'Corner kick practice' },
        { name: 'Water Break', allocated: 3, description: 'Hydration and rest' },
        { name: 'Game: Set Piece Challenge', allocated: 10, description: 'Score from set pieces' },
        { name: 'Scrimmage & Closing', allocated: 6, description: 'Full game with proper restarts' },
      ]
    },
    {
      week: 8,
      title: 'Championship Day',
      skills: ['All skills review', 'Game awareness', 'Celebration!'],
      games: ['Skills Showcase', 'Championship Match'],
      equipment: 'Size 3 balls, cones, goals, medals',
      sections: [
        { name: 'Welcome & Warm-up', allocated: 5, description: 'Fun warm-up games, excitement build' },
        { name: 'Skills Showcase', allocated: 8, description: 'Kids demonstrate favorite skill' },
        { name: 'Mini Competitions', allocated: 10, description: 'Dribble race, shooting contest' },
        { name: 'Team Photos', allocated: 8, description: 'Individual and team photos' },
        { name: 'Water Break', allocated: 3, description: 'Hydration and snacks' },
        { name: 'Championship Match', allocated: 10, description: 'Final fun scrimmage' },
        { name: 'Awards & Closing', allocated: 6, description: 'Medals, high-fives, goodbyes!' },
      ]
    }
  ];

  const [expandedWeek, setExpandedWeek] = useState<number | null>(2);
  const [sectionTimers, setSectionTimers] = useState<Record<string, number>>({});
  const [activeSectionKey, setActiveSectionKey] = useState<string | null>(null);

  const [timerEnabled, setTimerEnabled] = useState(true);

  const [incidentForm, setIncidentForm] = useState({
    childInvolved: '',
    location: 'Lincoln Park - Field B',
    injuryOccurred: false,
    medicalAttention: false,
    parentNotified: false,
    whatObserved: '',
  });
  const [incidentSubmitted, setIncidentSubmitted] = useState(false);
  const [supervisorDelayMinutes, setSupervisorDelayMinutes] = useState(90);
  const [supervisorCountdown, setSupervisorCountdown] = useState(90);
  const [groupPrivacyEnabled, setGroupPrivacyEnabled] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSectionKey) {
      interval = setInterval(() => {
        setSectionTimers(prev => {
          const currentTime = prev[activeSectionKey] ?? 0;
          if (currentTime <= 1) {
            const [weekStr, sectionStr] = activeSectionKey.split('-');
            const weekIndex = parseInt(weekStr);
            const sectionIndex = parseInt(sectionStr);
            const currentWeek = lessonPlans[weekIndex];
            if (sectionIndex < currentWeek.sections.length - 1) {
              const nextKey = `${weekIndex}-${sectionIndex + 1}`;
              const nextAllocated = currentWeek.sections[sectionIndex + 1].allocated * 60;
              setActiveSectionKey(nextKey);
              return { ...prev, [activeSectionKey]: 0, [nextKey]: nextAllocated };
            }
            setActiveSectionKey(null);
            return { ...prev, [activeSectionKey]: 0 };
          }
          return { ...prev, [activeSectionKey]: currentTime - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSectionKey]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (incidentSubmitted && supervisorCountdown > 0) {
      interval = setInterval(() => {
        setSupervisorCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [incidentSubmitted, supervisorCountdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    const prefix = seconds < 0 ? '-' : '';
    return `${prefix}${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSectionTimerColor = (sectionKey: string, allocated: number) => {
    const currentTime = sectionTimers[sectionKey] ?? allocated * 60;
    const percentRemaining = (currentTime / (allocated * 60)) * 100;
    if (currentTime <= 0) return 'bg-red-500 text-white border-red-500';
    if (percentRemaining <= 20) return 'bg-red-100 text-red-700 border-red-300';
    if (percentRemaining <= 40) return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-teal-100 text-teal-700 border-teal-300';
  };

  const startSectionTimer = (weekIndex: number, sectionIndex: number) => {
    const key = `${weekIndex}-${sectionIndex}`;
    const allocated = lessonPlans[weekIndex].sections[sectionIndex].allocated * 60;
    if (!sectionTimers[key]) {
      setSectionTimers(prev => ({ ...prev, [key]: allocated }));
    }
    setActiveSectionKey(key);
  };

  const pauseSectionTimer = () => {
    setActiveSectionKey(null);
  };

  const skipToNextSection = (weekIndex: number, currentSectionIndex: number) => {
    const currentWeek = lessonPlans[weekIndex];
    if (currentSectionIndex < currentWeek.sections.length - 1) {
      const nextKey = `${weekIndex}-${currentSectionIndex + 1}`;
      const nextAllocated = currentWeek.sections[currentSectionIndex + 1].allocated * 60;
      setSectionTimers(prev => ({ ...prev, [nextKey]: nextAllocated }));
      setActiveSectionKey(nextKey);
    } else {
      setActiveSectionKey(null);
    }
  };

  const toggleAttendance = (studentId: string, present: boolean) => {
    setAttendance(prev => ({ ...prev, [studentId]: present }));
  };

  const attendanceCount = Object.values(attendance).filter(v => v === true).length;
  const absentCount = Object.values(attendance).filter(v => v === false).length;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
              M
            </div>
            <div>
              <h1 className="text-xl font-bold">Coach Mike</h1>
              {showRatings ? (
                <div className="flex items-center gap-1 text-emerald-100">
                  <Star className="w-4 h-4 fill-current" />
                  <span>4.9 rating</span>
                  <span className="mx-2">|</span>
                  <span>127 reviews</span>
                </div>
              ) : (
                <p className="text-emerald-100 text-sm">Soccer Shots OC</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowRatings(!showRatings)}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            title={showRatings ? "Hide public ratings" : "Show public ratings"}
          >
            {showRatings ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'schedule', label: 'Schedule', icon: <Calendar className="w-4 h-4" /> },
            { id: 'attendance', label: 'Attendance', icon: <Users className="w-4 h-4" /> },
            { id: 'messaging', label: 'Parents', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'team', label: 'Team Chat', icon: <Building2 className="w-4 h-4" /> },
            { id: 'curriculum', label: 'Curriculum', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'incident', label: 'Incident', icon: <FileWarning className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id as CoachView)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                view === tab.id
                  ? 'bg-white text-emerald-700'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {view === 'schedule' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <button className="p-2 hover:bg-slate-100 rounded-lg">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="text-lg font-semibold text-slate-900">{formatDate(selectedDate)}</h2>
              <button className="p-2 hover:bg-slate-100 rounded-lg">
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-3">
              {todayClasses.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedClass(session)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    session.status === 'in_progress'
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${
                        session.status === 'in_progress'
                          ? 'bg-emerald-100 text-emerald-700'
                          : session.status === 'completed'
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {session.time.split(':')[0]}
                        <span className="text-xs ml-0.5">{session.time.includes('PM') ? 'PM' : 'AM'}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{session.program}</h3>
                        <p className="text-sm text-slate-600">{session.time}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      session.status === 'in_progress'
                        ? 'bg-emerald-100 text-emerald-700'
                        : session.status === 'completed'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {session.status === 'in_progress' ? 'In Progress' :
                       session.status === 'completed' ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{session.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{session.enrolled}/{session.capacity} enrolled</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900">Weather Alert</h4>
                  <p className="text-sm text-amber-700">
                    Light rain expected at 3 PM. The 4:30 PM Premier Soccer class may need to move indoors.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'attendance' && (
          <div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
              <h2 className="font-semibold text-slate-900 mb-1">Mini Soccer - 10:30 AM</h2>
              <p className="text-sm text-slate-600">Lincoln Park - Field B</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Present: {attendanceCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Absent: {absentCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
                  <span className="text-sm text-slate-600">Unmarked: {students.length - attendanceCount - absentCount}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {students.map((student) => (
                <div key={student.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900">{student.name}</h3>
                        <span className="text-xs text-slate-500">Age {student.age}</span>
                      </div>
                      <p className="text-sm text-slate-600">{student.parentName}</p>
                      {student.notes && (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {student.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAttendance(student.id, true)}
                        className={`p-3 rounded-full transition-colors ${
                          attendance[student.id] === true
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600'
                        }`}
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => toggleAttendance(student.id, false)}
                        className={`p-3 rounded-full transition-colors ${
                          attendance[student.id] === false
                            ? 'bg-red-500 text-white'
                            : 'bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-600'
                        }`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
              <Camera className="w-5 h-5" />
              Take Class Photo
            </button>
          </div>
        )}

        {view === 'messaging' && (
          <div>
            <div className="mb-4 p-3 bg-slate-100 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Coach-to-Parent Messaging</p>
                    <p className="text-xs text-slate-500">
                      {coachMessagingEnabled ? "Coaches can send updates directly to parents" : "Direct messaging is disabled by organization"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCoachMessagingEnabled(!coachMessagingEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    coachMessagingEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                    coachMessagingEnabled ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>

            {!coachMessagingEnabled && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <p className="text-amber-800 font-medium">Direct parent messaging is disabled</p>
                <p className="text-amber-600 text-sm">Contact your administrator to enable this feature</p>
              </div>
            )}

            {coachMessagingEnabled && (
            <>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Quick Messages</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Class starting in 10 min!',
                  'Weather update',
                  'Reminder: bring water',
                  'Schedule change'
                ].map((msg, idx) => (
                  <button
                    key={idx}
                    className="p-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {msg}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <Video className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Record Video Update</h3>
                  <p className="text-sm text-slate-600">Share class highlights with parents</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Record
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-medium text-slate-900">Send to 10:30 AM Mini Soccer Parents</h3>
              </div>
              <div className="p-4">
                <textarea
                  placeholder="Type your message to all parents..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Phone className="w-4 h-4" />
                    <span>Will send SMS to 10 parents</span>
                  </div>
                  <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors">
                    Send Message
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-slate-900 mb-3">Recent Messages</h3>
              <div className="space-y-2">
                {[
                  { to: 'Mini Soccer Parents', msg: 'Great class today! See you next week.', time: '2 hours ago', type: 'text' },
                  { to: 'Sarah Roberts', msg: 'Video: Connor did amazing with his passing today!', time: 'Yesterday', type: 'video' },
                  { to: 'Junior Soccer Parents', msg: 'Practice moved to Field B due to maintenance.', time: '2 days ago', type: 'text' }
                ].map((message, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {message.type === 'video' && <Video className="w-4 h-4 text-blue-500" />}
                        <span className="font-medium text-slate-900 text-sm">{message.to}</span>
                      </div>
                      <span className="text-xs text-slate-500">{message.time}</span>
                    </div>
                    <p className="text-sm text-slate-600">{message.msg}</p>
                  </div>
                ))}
              </div>
            </div>
            </>
            )}
          </div>
        )}

        {view === 'team' && (
          <div>
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 text-emerald-700 mb-2">
                <Building2 className="w-5 h-5" />
                <span className="font-semibold">Team Communication Hub</span>
              </div>
              <p className="text-sm text-emerald-600">
                Connect with your team instantly. No more switching between apps.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Group Messaging Privacy</p>
                    <p className="text-xs text-slate-500">
                      {groupPrivacyEnabled ? "Phone numbers hidden in group chats (names only)" : "Phone numbers visible to all group members"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setGroupPrivacyEnabled(!groupPrivacyEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    groupPrivacyEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                    groupPrivacyEnabled ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
              <p className="text-xs text-emerald-600 mt-2">Enabled by default to protect staff privacy</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
              <div className="p-3 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-900 text-sm">Channels</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { name: 'all-staff', icon: <Hash className="w-4 h-4" />, unread: 3, desc: 'Company-wide announcements' },
                  { name: 'lincoln-park', icon: <Hash className="w-4 h-4" />, unread: 1, desc: 'Lincoln Park location team' },
                  { name: 'riverside-park', icon: <Hash className="w-4 h-4" />, unread: 0, desc: 'Riverside Park location team' },
                  { name: 'coaches-general', icon: <Hash className="w-4 h-4" />, unread: 5, desc: 'All coaches chat' }
                ].map((channel, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                      {channel.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 text-sm">{channel.name}</span>
                        {channel.unread > 0 && (
                          <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-xs rounded-full font-medium">
                            {channel.unread}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{channel.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
              <div className="p-3 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-900 text-sm">Direct Messages</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { name: 'Coach Sarah', status: 'online', lastMsg: 'Can you cover my 4pm class Thursday?', unread: 1 },
                  { name: 'Coach Jake', status: 'offline', lastMsg: 'Thanks for the equipment!', unread: 0 },
                  { name: 'Admin Team', status: 'online', lastMsg: 'Schedule for next week is posted', unread: 0 }
                ].map((dm, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm">
                        {dm.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        dm.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 text-sm">{dm.name}</span>
                        {dm.unread > 0 && (
                          <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-xs rounded-full font-medium">
                            {dm.unread}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{dm.lastMsg}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-3 border-b border-slate-100 flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-900 text-sm">all-staff</span>
              </div>
              <div className="p-4 space-y-4 max-h-60 overflow-y-auto">
                {[
                  { from: 'Admin Team', msg: 'Reminder: Staff meeting tomorrow at 9am!', time: '10:30 AM' },
                  { from: 'Coach Sarah', msg: 'New equipment arrived at Lincoln Park', time: '9:15 AM' },
                  { from: 'You', msg: 'Great work everyone on the spring enrollment numbers!', time: 'Yesterday' }
                ].map((msg, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-xs flex-shrink-0">
                      {msg.from === 'You' ? 'M' : msg.from.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 text-sm">{msg.from}</span>
                        <span className="text-xs text-slate-400">{msg.time}</span>
                      </div>
                      <p className="text-sm text-slate-600">{msg.msg}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Message #all-staff"
                    className="flex-1 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'curriculum' && (
          <div>
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Mini Soccer (Ages 3-5)</h2>
                  <p className="text-slate-600">8-week curriculum - Week 2 of 8</p>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">Section Timers</span>
                  <button
                    onClick={() => setTimerEnabled(!timerEnabled)}
                    className={`w-10 h-6 rounded-full relative transition-colors ${timerEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${timerEnabled ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
              {timerEnabled && (
                <p className="text-xs text-emerald-600 mt-1">Enabled by default - helps new coaches manage class timing for each section</p>
              )}
            </div>

            <div className="space-y-3">
              {lessonPlans.map((lesson, weekIdx) => {
                const isExpanded = expandedWeek === lesson.week;
                const isCurrentWeek = lesson.week === 2;
                const isCompleted = lesson.week < 2;

                return (
                  <div
                    key={weekIdx}
                    className={`bg-white rounded-xl border overflow-hidden transition-all ${
                      isCurrentWeek ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-slate-200'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedWeek(isExpanded ? null : lesson.week)}
                      className={`w-full p-4 text-left ${isCurrentWeek ? 'bg-emerald-50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                            isCompleted ? 'bg-slate-100 text-slate-400' :
                            isCurrentWeek ? 'bg-emerald-500 text-white' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {lesson.week}
                          </span>
                          <div>
                            <h3 className="font-semibold text-slate-900">{lesson.title}</h3>
                            <p className="text-sm text-slate-500">7 sections | {lesson.sections.reduce((acc, s) => acc + s.allocated, 0)} min total</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isCurrentWeek && (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                              Current
                            </span>
                          )}
                          {isCompleted && <CheckCircle className="w-5 h-5 text-slate-400" />}
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-100">
                        <div className="p-4 bg-slate-50 border-b border-slate-100">
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="text-slate-500">Skills: </span>
                              {lesson.skills.map((skill, i) => (
                                <span key={i} className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded mr-1 mb-1">
                                  {skill}
                                </span>
                              ))}
                            </div>
                            <div>
                              <span className="text-slate-500">Games: </span>
                              {lesson.games.map((game, i) => (
                                <span key={i} className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded mr-1 mb-1">
                                  {game}
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">Equipment: {lesson.equipment}</p>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {lesson.sections.map((section, sectionIdx) => {
                            const sectionKey = `${weekIdx}-${sectionIdx}`;
                            const isActive = activeSectionKey === sectionKey;
                            const timeRemaining = sectionTimers[sectionKey] ?? section.allocated * 60;
                            const hasStarted = sectionTimers[sectionKey] !== undefined;

                            return (
                              <div
                                key={sectionIdx}
                                className={`p-4 ${isActive ? 'bg-teal-50' : ''}`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-3 flex-1">
                                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                      hasStarted && timeRemaining <= 0 ? 'bg-red-100 text-red-700' :
                                      isActive ? 'bg-teal-500 text-white' :
                                      'bg-slate-100 text-slate-500'
                                    }`}>
                                      {sectionIdx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-slate-900 text-sm">{section.name}</h4>
                                      <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
                                    </div>
                                  </div>

                                  {timerEnabled && (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <div className={`px-3 py-1.5 rounded-lg border text-sm font-mono font-bold min-w-[70px] text-center transition-colors ${
                                        getSectionTimerColor(sectionKey, section.allocated)
                                      }`}>
                                        {hasStarted ? formatTime(timeRemaining) : `${section.allocated}:00`}
                                      </div>

                                      {isActive ? (
                                        <div className="flex gap-1">
                                          <button
                                            onClick={pauseSectionTimer}
                                            className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg transition-colors"
                                            title="Pause"
                                          >
                                            <Pause className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => skipToNextSection(weekIdx, sectionIdx)}
                                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                                            title="Skip to next"
                                          >
                                            <SkipForward className="w-4 h-4" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => startSectionTimer(weekIdx, sectionIdx)}
                                          className="p-2 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-lg transition-colors"
                                          title="Start timer"
                                        >
                                          <Play className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="p-3 bg-slate-50 border-t border-slate-100">
                          <div className="flex gap-1">
                            {lesson.sections.map((section, idx) => {
                              const key = `${weekIdx}-${idx}`;
                              const time = sectionTimers[key];
                              const isComplete = time !== undefined && time <= 0;
                              const isActive = activeSectionKey === key;
                              return (
                                <div
                                  key={idx}
                                  className={`flex-1 h-2 rounded-full transition-colors ${
                                    isComplete ? 'bg-emerald-500' :
                                    isActive ? 'bg-teal-400' :
                                    'bg-slate-200'
                                  }`}
                                  title={`${section.name} (${section.allocated}min)`}
                                />
                              );
                            })}
                          </div>
                          <div className="flex justify-between mt-1 text-xs text-slate-400">
                            <span>Section 1</span>
                            <span>Section 7</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'incident' && (
          <div>
            {!incidentSubmitted ? (
              <div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <FileWarning className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900">Incident Report</h3>
                      <p className="text-sm text-red-700">Document any incidents that occur during class. Reports are sent to your supervisor for review before being forwarded to the school.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-700">Supervisor review delay:</span>
                    </div>
                    <select
                      value={supervisorDelayMinutes}
                      onChange={(e) => {
                        setSupervisorDelayMinutes(Number(e.target.value));
                        setSupervisorCountdown(Number(e.target.value));
                      }}
                      className="px-2 py-1 border border-slate-200 rounded text-sm"
                    >
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>90 minutes (default)</option>
                      <option value={120}>2 hours</option>
                      <option value={180}>3 hours</option>
                      <option value={360}>6 hours</option>
                    </select>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Organization can configure this delay (default: 90 min)</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Child Involved</label>
                    <select
                      value={incidentForm.childInvolved}
                      onChange={(e) => setIncidentForm({...incidentForm, childInvolved: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select child...</option>
                      {students.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                    <select
                      value={incidentForm.location}
                      onChange={(e) => setIncidentForm({...incidentForm, location: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option>Lincoln Park - Field B</option>
                      <option>Lincoln Park - Field A</option>
                      <option>Riverside Park</option>
                      <option>Downtown Center</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={incidentForm.injuryOccurred}
                        onChange={(e) => setIncidentForm({...incidentForm, injuryOccurred: e.target.checked})}
                        className="w-5 h-5 rounded text-red-600 focus:ring-red-500"
                      />
                      <span className="text-slate-700">Injury Occurred</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={incidentForm.medicalAttention}
                        onChange={(e) => setIncidentForm({...incidentForm, medicalAttention: e.target.checked})}
                        className="w-5 h-5 rounded text-red-600 focus:ring-red-500"
                      />
                      <span className="text-slate-700">Medical Attention Required</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={incidentForm.parentNotified}
                        onChange={(e) => setIncidentForm({...incidentForm, parentNotified: e.target.checked})}
                        className="w-5 h-5 rounded text-red-600 focus:ring-red-500"
                      />
                      <span className="text-slate-700">Parent/Guardian Notified</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">What I Observed</label>
                    <textarea
                      value={incidentForm.whatObserved}
                      onChange={(e) => setIncidentForm({...incidentForm, whatObserved: e.target.value})}
                      placeholder="Describe what you observed during the incident..."
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setIncidentSubmitted(true)}
                  disabled={!incidentForm.childInvolved || !incidentForm.whatObserved}
                  className="w-full mt-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <FileWarning className="w-5 h-5" />
                  Submit Incident Report
                </button>
              </div>
            ) : (
              <div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-emerald-900">Report Submitted</h3>
                      <p className="text-sm text-emerald-700">Your supervisor has been notified and has {supervisorDelayMinutes} minutes to review before it is sent to the school.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Supervisor Review Window</h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-amber-700 mb-1">Time remaining before auto-send to school</p>
                    <p className="text-3xl font-bold text-amber-900">{Math.floor(supervisorCountdown / 60)}:{(supervisorCountdown % 60).toString().padStart(2, '0')}</p>
                    <p className="text-xs text-amber-600 mt-1">Configured delay: {supervisorDelayMinutes} minutes</p>
                  </div>
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-2">SMS sent to supervisor:</p>
                    <p className="text-sm text-slate-800 italic">"ALERT: Incident Report Filed by Coach Mike at Lincoln Park - Field B."</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Supervisor Actions</h3>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                      <Pause className="w-4 h-4" />
                      Pause Send
                    </button>
                    <button className="flex-1 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" />
                      Send Now
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => { setIncidentSubmitted(false); setSupervisorCountdown(supervisorDelayMinutes); setIncidentForm({...incidentForm, childInvolved: '', whatObserved: ''}); }}
                  className="w-full mt-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                >
                  File Another Report
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
