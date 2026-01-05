import { useState } from 'react';
import {
  Calendar, Clock, MapPin, Users, AlertTriangle, CheckCircle, Plus,
  ChevronLeft, ChevronRight, GripVertical, X, RefreshCw, Zap
} from 'lucide-react';

interface ScheduleSlot {
  id: string;
  program: string;
  coach: string;
  time: string;
  duration: number;
  location: string;
  capacity: number;
  enrolled: number;
  color: string;
}

interface Conflict {
  type: 'coach' | 'location' | 'overlap';
  message: string;
  severity: 'error' | 'warning';
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const times = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

const initialSchedule: Record<string, ScheduleSlot[]> = {
  'Monday': [
    { id: 'm1', program: 'Mini Soccer', coach: 'Coach Mike', time: '4:00 PM', duration: 45, location: 'Lincoln Park', capacity: 12, enrolled: 10, color: 'bg-blue-500' },
    { id: 'm2', program: 'Junior Soccer', coach: 'Coach Sarah', time: '5:00 PM', duration: 60, location: 'Lincoln Park', capacity: 14, enrolled: 14, color: 'bg-emerald-500' },
  ],
  'Tuesday': [
    { id: 't1', program: 'Dance Academy', coach: 'Coach Lisa', time: '4:30 PM', duration: 45, location: 'Downtown Center', capacity: 16, enrolled: 12, color: 'bg-pink-500' },
  ],
  'Wednesday': [
    { id: 'w1', program: 'Mini Soccer', coach: 'Coach Mike', time: '4:00 PM', duration: 45, location: 'Riverside Park', capacity: 12, enrolled: 11, color: 'bg-blue-500' },
    { id: 'w2', program: 'Basketball Basics', coach: 'Coach Jake', time: '5:00 PM', duration: 60, location: 'Downtown Center', capacity: 14, enrolled: 8, color: 'bg-orange-500' },
  ],
  'Thursday': [
    { id: 'th1', program: 'Swim Lessons', coach: 'Coach Emma', time: '3:00 PM', duration: 30, location: 'Aquatic Center', capacity: 8, enrolled: 8, color: 'bg-cyan-500' },
    { id: 'th2', program: 'Swim Lessons', coach: 'Coach Emma', time: '3:45 PM', duration: 30, location: 'Aquatic Center', capacity: 8, enrolled: 6, color: 'bg-cyan-500' },
  ],
  'Friday': [
    { id: 'f1', program: 'Martial Arts', coach: 'Coach Ken', time: '4:00 PM', duration: 60, location: 'Downtown Center', capacity: 16, enrolled: 14, color: 'bg-red-500' },
  ],
  'Saturday': [
    { id: 's1', program: 'Mini Soccer', coach: 'Coach Mike', time: '9:00 AM', duration: 45, location: 'Lincoln Park', capacity: 12, enrolled: 12, color: 'bg-blue-500' },
    { id: 's2', program: 'Mini Soccer', coach: 'Coach Sarah', time: '10:00 AM', duration: 45, location: 'Lincoln Park', capacity: 12, enrolled: 10, color: 'bg-blue-500' },
    { id: 's3', program: 'Junior Soccer', coach: 'Coach Mike', time: '11:00 AM', duration: 60, location: 'Riverside Park', capacity: 14, enrolled: 13, color: 'bg-emerald-500' },
  ]
};

export function DemoScheduling() {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const checkConflicts = (slot: ScheduleSlot, day: string) => {
    const newConflicts: Conflict[] = [];
    const daySlots = schedule[day] || [];

    daySlots.forEach(existing => {
      if (existing.id === slot.id) return;

      if (existing.coach === slot.coach && existing.time === slot.time) {
        newConflicts.push({
          type: 'coach',
          message: `${slot.coach} is already scheduled at ${slot.time}`,
          severity: 'error'
        });
      }

      if (existing.location === slot.location && existing.time === slot.time) {
        newConflicts.push({
          type: 'location',
          message: `${slot.location} is already booked at ${slot.time}`,
          severity: 'error'
        });
      }
    });

    setConflicts(newConflicts);
  };

  const runOptimizer = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setShowOptimizer(true);
    }, 2000);
  };

  const optimizerSuggestions = [
    {
      type: 'capacity',
      title: 'Add Saturday 10:30 AM Mini Soccer',
      reason: 'Lincoln Park class is full with 4 on waitlist. Coach Sarah available.',
      impact: '+$2,028 potential revenue'
    },
    {
      type: 'timing',
      title: 'Move Thursday Swim to 4:00 PM',
      reason: 'Analytics show 23% higher signup rate for after-school times.',
      impact: '+12% enrollment expected'
    },
    {
      type: 'balance',
      title: 'Add Tuesday Mini Soccer',
      reason: 'Gap in weekday schedule. High demand area, Coach Jake available.',
      impact: 'Better weekly coverage'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schedule Manager</h1>
          <p className="text-slate-600">Drag and drop to organize classes</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={runOptimizer}
            disabled={isOptimizing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-70"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                AI Optimizer
              </>
            )}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus className="w-4 h-4" />
            Add Class
          </button>
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
            <AlertTriangle className="w-5 h-5" />
            Schedule Conflicts Detected
          </div>
          <ul className="space-y-1">
            {conflicts.map((conflict, idx) => (
              <li key={idx} className="text-sm text-red-600">{conflict.message}</li>
            ))}
          </ul>
        </div>
      )}

      {showOptimizer && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900">AI Schedule Recommendations</h3>
            </div>
            <button onClick={() => setShowOptimizer(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            {optimizerSuggestions.map((suggestion, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">{suggestion.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{suggestion.reason}</p>
                    <p className="text-sm font-medium text-emerald-600 mt-1">{suggestion.impact}</p>
                  </div>
                  <button className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-7 border-b border-slate-200">
              <div className="p-3 bg-slate-50"></div>
              {days.map((day) => (
                <div key={day} className="p-3 bg-slate-50 text-center font-medium text-slate-700 border-l border-slate-200">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              <div className="border-r border-slate-200">
                {times.map((time) => (
                  <div key={time} className="h-20 p-2 text-xs text-slate-500 border-b border-slate-100">
                    {time}
                  </div>
                ))}
              </div>

              {days.map((day) => (
                <div key={day} className="border-l border-slate-200 relative">
                  {times.map((time) => (
                    <div key={time} className="h-20 border-b border-slate-100"></div>
                  ))}

                  {(schedule[day] || []).map((slot) => {
                    const timeIndex = times.findIndex(t => {
                      const slotHour = parseInt(slot.time.split(':')[0]);
                      const slotPeriod = slot.time.includes('PM') ? 'PM' : 'AM';
                      const gridHour = parseInt(t.split(':')[0]);
                      const gridPeriod = t.includes('PM') ? 'PM' : 'AM';
                      return slotHour === gridHour && slotPeriod === gridPeriod;
                    });

                    if (timeIndex === -1) return null;

                    const top = timeIndex * 80;
                    const height = (slot.duration / 60) * 80;

                    return (
                      <div
                        key={slot.id}
                        onClick={() => {
                          setSelectedSlot(slot);
                          checkConflicts(slot, day);
                        }}
                        className={`absolute left-1 right-1 ${slot.color} rounded-lg p-2 text-white text-xs cursor-pointer hover:opacity-90 transition-opacity shadow-sm`}
                        style={{ top: `${top}px`, height: `${Math.max(height, 40)}px` }}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <GripVertical className="w-3 h-3 opacity-50" />
                          <span className="font-medium truncate">{slot.program}</span>
                        </div>
                        <div className="opacity-80 truncate">{slot.time}</div>
                        <div className="flex items-center gap-1 mt-1 opacity-80">
                          <Users className="w-3 h-3" />
                          <span>{slot.enrolled}/{slot.capacity}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Class Details</h3>
              <button onClick={() => setSelectedSlot(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`${selectedSlot.color} rounded-xl p-4 text-white mb-4`}>
              <h4 className="font-bold text-lg">{selectedSlot.program}</h4>
              <p className="opacity-80">{selectedSlot.coach}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Time</p>
                  <p className="font-medium text-slate-900">{selectedSlot.time} ({selectedSlot.duration} min)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Location</p>
                  <p className="font-medium text-slate-900">{selectedSlot.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Enrollment</p>
                  <p className="font-medium text-slate-900">{selectedSlot.enrolled} of {selectedSlot.capacity} spots filled</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedSlot(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">
                Edit Class
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Capacity Overview</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total Classes</span>
              <span className="font-medium text-slate-900">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total Capacity</span>
              <span className="font-medium text-slate-900">148 spots</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Current Enrollment</span>
              <span className="font-medium text-slate-900">126 (85%)</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Coach Utilization</h3>
          <div className="space-y-2">
            {[
              { name: 'Coach Mike', hours: 4.5, color: 'bg-blue-500' },
              { name: 'Coach Sarah', hours: 2.5, color: 'bg-emerald-500' },
              { name: 'Coach Emma', hours: 2, color: 'bg-cyan-500' },
            ].map((coach, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${coach.color}`}></div>
                <span className="text-sm text-slate-700 flex-1">{coach.name}</span>
                <span className="text-sm font-medium text-slate-900">{coach.hours}h/week</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Full Classes</h3>
          <div className="space-y-2">
            {[
              { name: 'Mon Junior Soccer', waitlist: 2 },
              { name: 'Sat Mini Soccer 9AM', waitlist: 4 },
              { name: 'Thu Swim 3:00 PM', waitlist: 3 },
            ].map((cls, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{cls.name}</span>
                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                  {cls.waitlist} waitlist
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
