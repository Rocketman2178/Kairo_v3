import { useState, useEffect } from 'react';
import {
  Calendar, Users, Clock, CheckCircle, X, MessageSquare, BookOpen,
  ChevronRight, ChevronLeft, Star, Camera, AlertCircle, MapPin, Phone,
  Video, Hash, Send, Building2, FileWarning, Play, Pause, Timer
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
      equipment: 'Size 3 balls, cones'
    },
    {
      week: 2,
      title: 'Dribbling Basics',
      skills: ['Inside foot dribble', 'Outside foot dribble', 'Speed control'],
      games: ['Dribble Tag', 'Cone Maze'],
      equipment: 'Size 3 balls, cones, pinnies'
    },
    {
      week: 3,
      title: 'Passing Fundamentals',
      skills: ['Inside foot pass', 'Receiving the ball', 'Partner passing'],
      games: ['Passing Pairs', 'Keep Away'],
      equipment: 'Size 3 balls, mini goals'
    },
    {
      week: 4,
      title: 'Shooting & Scoring',
      skills: ['Laces kick', 'Aiming', 'Follow through'],
      games: ['Target Practice', 'Mini Scrimmage'],
      equipment: 'Size 3 balls, portable goals, cones'
    }
  ];

  const curriculumSections = [
    { name: 'Welcome & Warm-up', duration: 5, allocated: 5 },
    { name: 'Skill Introduction', duration: 0, allocated: 8 },
    { name: 'Guided Practice', duration: 0, allocated: 10 },
    { name: 'Activity 1', duration: 0, allocated: 8 },
    { name: 'Water Break', duration: 0, allocated: 3 },
    { name: 'Activity 2 / Game', duration: 0, allocated: 10 },
    { name: 'Scrimmage & Closing', duration: 0, allocated: 6 },
  ];

  const [timerEnabled, setTimerEnabled] = useState(true);
  const [currentSection, setCurrentSection] = useState(0);
  const [sectionTime, setSectionTime] = useState(curriculumSections[0].allocated * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [incidentForm, setIncidentForm] = useState({
    childInvolved: '',
    location: 'Lincoln Park - Field B',
    injuryOccurred: false,
    medicalAttention: false,
    parentNotified: false,
    whatObserved: '',
  });
  const [incidentSubmitted, setIncidentSubmitted] = useState(false);
  const [supervisorCountdown, setSupervisorCountdown] = useState(90);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && sectionTime > 0) {
      interval = setInterval(() => {
        setSectionTime(prev => {
          if (prev <= 1) {
            if (currentSection < curriculumSections.length - 1) {
              setCurrentSection(curr => curr + 1);
              return curriculumSections[currentSection + 1].allocated * 60;
            }
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, sectionTime, currentSection]);

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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    const allocated = curriculumSections[currentSection].allocated * 60;
    const percentRemaining = (sectionTime / allocated) * 100;
    if (percentRemaining <= 0) return 'bg-red-500 text-white';
    if (percentRemaining <= 20) return 'bg-red-100 text-red-700 border-red-300';
    if (percentRemaining <= 40) return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-emerald-100 text-emerald-700 border-emerald-300';
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
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
            M
          </div>
          <div>
            <h1 className="text-xl font-bold">Coach Mike</h1>
            <div className="flex items-center gap-1 text-emerald-100">
              <Star className="w-4 h-4 fill-current" />
              <span>4.9 rating</span>
              <span className="mx-2">|</span>
              <span>127 reviews</span>
            </div>
          </div>
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
                  <span className="text-sm text-slate-600">Timer</span>
                  <button
                    onClick={() => setTimerEnabled(!timerEnabled)}
                    className={`w-10 h-6 rounded-full relative transition-colors ${timerEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${timerEnabled ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {timerEnabled && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">Class Timer</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className={`p-2 rounded-lg transition-colors ${isTimerRunning ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                    >
                      {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className={`text-center p-4 rounded-xl border-2 transition-colors ${getTimerColor()}`}>
                  <p className="text-sm font-medium opacity-80">
                    Section {currentSection + 1} of {curriculumSections.length}
                  </p>
                  <p className="text-lg font-semibold">{curriculumSections[currentSection].name}</p>
                  <p className="text-4xl font-bold my-2">{formatTime(sectionTime)}</p>
                  <p className="text-sm opacity-80">of {curriculumSections[currentSection].allocated}:00 allocated</p>
                </div>
                <div className="flex gap-1 mt-3">
                  {curriculumSections.map((section, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 h-2 rounded-full ${
                        idx < currentSection ? 'bg-emerald-500' :
                        idx === currentSection ? 'bg-emerald-300' :
                        'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 mt-2 text-xs text-slate-500">
                  {curriculumSections.map((section, idx) => (
                    <div key={idx} className="text-center truncate">{section.allocated}m</div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {lessonPlans.map((lesson, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-xl border overflow-hidden ${
                    idx === 1 ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-slate-200'
                  }`}
                >
                  <div className={`p-4 ${idx === 1 ? 'bg-emerald-50' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          idx < 1 ? 'bg-slate-100 text-slate-400' :
                          idx === 1 ? 'bg-emerald-500 text-white' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <h3 className="font-semibold text-slate-900">{lesson.title}</h3>
                      </div>
                      {idx === 1 && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                          Current Week
                        </span>
                      )}
                      {idx < 1 && (
                        <CheckCircle className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    <div className="ml-10 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase mb-1">Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {lesson.skills.map((skill, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase mb-1">Games</p>
                        <div className="flex flex-wrap gap-1">
                          {lesson.games.map((game, i) => (
                            <span key={i} className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded">
                              {game}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium">Equipment:</span>
                        <span>{lesson.equipment}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors">
              View Full 8-Week Curriculum
            </button>
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
                      <p className="text-sm text-emerald-700">Your supervisor has been notified and has 90 minutes to review before it is sent to the school.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Supervisor Review Window</h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-amber-700 mb-1">Time remaining before auto-send to school</p>
                    <p className="text-3xl font-bold text-amber-900">{Math.floor(supervisorCountdown / 60)}:{(supervisorCountdown % 60).toString().padStart(2, '0')}</p>
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
                  onClick={() => { setIncidentSubmitted(false); setSupervisorCountdown(90); setIncidentForm({...incidentForm, childInvolved: '', whatObserved: ''}); }}
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
