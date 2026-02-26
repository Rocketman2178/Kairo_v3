import { useState } from 'react';
import { MapPin, Calendar, Clock, Users, Star, Info, TrendingUp, Zap } from 'lucide-react';
import { Button } from '../common/Button';
import { LocationDetailModal } from './LocationDetailModal';
import { CoachDetailModal } from './CoachDetailModal';
import { ProgramDetailModal } from './ProgramDetailModal';
import { formatPriceWithPaymentOption } from '../../utils/paymentPlans';

interface SessionRecommendation {
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

interface SessionCardProps {
  session: SessionRecommendation;
  onSelect: (sessionId: string) => void;
  onJoinWaitlist?: (sessionId: string, programName: string) => void;
  organizationId: string;
  onSignUp?: (sessionId: string, programName: string) => void;
  isFull?: boolean;
}

export function SessionCard({ session, onSelect, onJoinWaitlist, organizationId, onSignUp, isFull = false }: SessionCardProps) {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);

  // Debug logging for session rating
  console.log('SessionCard received:', {
    programName: session.programName,
    sessionRating: session.sessionRating,
    hasSessionRating: !!session.sessionRating,
    sessionRatingType: typeof session.sessionRating,
  });

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(0)}`;
  };

  const formatTime = (time: string) => {
    const trimmed = time.trim();
    if (/[AP]M$/i.test(trimmed)) {
      return trimmed.replace(/^0+(\d)/, '$1');
    }
    const [hours, minutes] = trimmed.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getSpotsColor = () => {
    const percentFull = (session.enrolledCount / session.capacity) * 100;
    if (percentFull >= 90) return 'text-red-400 bg-red-950/30 border border-red-800/50';
    if (percentFull >= 70) return 'text-orange-400 bg-orange-950/30 border border-orange-800/50';
    return 'text-green-400 bg-green-950/30 border border-green-800/50';
  };

  const formatAgeRange = (ageRange?: string) => {
    if (!ageRange) return null;
    const match = ageRange.match(/\[(\d+),(\d+)\)/);
    if (match) {
      return `Ages ${match[1]}-${parseInt(match[2]) - 1}`;
    }
    return null;
  };

  const fillRate = session.fillRatePercent || ((session.enrolledCount / session.capacity) * 100);
  const urgency = session.urgencyLevel || (
    fillRate >= 100 ? 'full' :
    fillRate >= 75 ? 'filling_fast' :
    fillRate >= 50 ? 'moderate' : 'available'
  );

  const getUrgencyBadge = () => {
    if (urgency === 'filling_fast' && session.spotsRemaining > 0) {
      const isSaturday = session.dayOfWeek === 'Saturday';
      return (
        <div className="flex items-center gap-1 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold animate-pulse shadow-lg">
          <Zap className="w-3 h-3" />
          <span>{isSaturday ? 'Filling Fast!' : `Only ${session.spotsRemaining} left`}</span>
        </div>
      );
    }
    return null;
  };

  const getFillRateColor = () => {
    if (fillRate >= 90) return 'bg-red-500';
    if (fillRate >= 75) return 'bg-orange-500';
    if (fillRate >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getWeekendBadge = () => {
    const isSaturday = session.dayOfWeek === 'Saturday';
    const isSunday = session.dayOfWeek === 'Sunday';

    if ((isSaturday || isSunday) && urgency !== 'full') {
      return (
        <div className="flex items-center gap-1 text-xs text-blue-400 bg-blue-950/30 px-2 py-1 rounded-full border border-blue-800/50">
          <TrendingUp className="w-3 h-3" />
          <span>{isSaturday ? 'Most popular day' : 'Popular weekend slot'}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="bg-[#1a2332] border border-gray-800 rounded-lg p-4 hover:shadow-lg hover:shadow-blue-500/10 transition-all hover:border-[#6366f1]/50">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-white">{session.programName}</h3>
              {formatAgeRange(session.ageRange) && (
                <span className="px-2 py-0.5 bg-[#0f1419] text-[#06b6d4] text-xs rounded-full border border-[#06b6d4]/30">
                  {formatAgeRange(session.ageRange)}
                </span>
              )}
              {getUrgencyBadge()}
              {getWeekendBadge()}
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {session.programDescription}
              <button
                onClick={() => setShowProgramModal(true)}
                className="ml-1 hover:text-[#06b6d4] transition-colors inline-flex items-center align-middle"
                title="View session details"
              >
                <Info className="w-3.5 h-3.5 text-gray-500 hover:text-[#06b6d4]" />
              </button>
            </p>
          </div>
          <div className="text-right ml-4 flex-shrink-0">
            <div className="text-xl font-bold bg-gradient-to-r from-[#6366f1] to-[#06b6d4] bg-clip-text text-transparent">
              {formatPrice(session.price)}
            </div>
            <div className="text-xs text-gray-500">{formatPriceWithPaymentOption(session.price, session.durationWeeks)}</div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {session.sessionRating && (
            <div className="flex items-center text-sm text-gray-300 bg-gray-800/50 rounded px-2 py-1">
              <Star className="w-4 h-4 mr-2 text-yellow-400 fill-yellow-400" />
              <span className="font-medium text-yellow-400">{session.sessionRating.toFixed(1)}</span>
              <span className="ml-1 text-xs text-gray-400">Session Rating</span>
            </div>
          )}

          <div className="flex items-center text-sm text-gray-300">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0 text-[#6366f1]" />
            <span>{session.dayOfWeek}s at {formatTime(session.startTime)}</span>
          </div>

          <div className="flex text-sm text-gray-300">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-[#06b6d4]" />
            <span>
              <button
                onClick={() => setShowLocationModal(true)}
                className="hover:text-[#06b6d4] transition-colors underline decoration-dotted underline-offset-2"
                title="View location details"
              >
                {session.locationName}
              </button>
              {session.locationRating && (
                <span className="ml-1 text-yellow-400">({session.locationRating.toFixed(1)}★)</span>
              )}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-300">
            <Clock className="w-4 h-4 mr-2 flex-shrink-0 text-[#8b5cf6]" />
            <span>Starts {new Date(session.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>

          {session.coachName && (
            <div className="flex text-sm text-gray-300">
              <Star className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-yellow-500" />
              <span>
                <button
                  onClick={() => setShowCoachModal(true)}
                  className="hover:text-yellow-400 transition-colors underline decoration-dotted underline-offset-2"
                  title="View coach details"
                >
                  {session.coachName.toLowerCase().startsWith('coach') ? session.coachName : `Coach ${session.coachName}`}
                </button>
                {session.coachRating && (
                  <span className="ml-1 text-yellow-400">({session.coachRating.toFixed(1)}★)</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Fill Rate Progress Bar */}
        <div className="mt-4 pt-3 border-t border-gray-800">
          <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
            <span>Capacity</span>
            <span>{session.enrolledCount}/{session.capacity} enrolled</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getFillRateColor()}`}
              style={{ width: `${Math.min(fillRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3">
          {isFull ? (
            <>
              <div className="flex items-center text-sm font-medium px-3 py-1 rounded-full text-red-400 bg-red-950/30 border border-red-800/50">
                <Users className="w-4 h-4 mr-1" />
                <span>Class Full ({session.enrolledCount}/{session.capacity})</span>
              </div>

              <Button
                onClick={() => onJoinWaitlist?.(session.sessionId, session.programName)}
                className="px-4 py-2 bg-gradient-to-r from-[#f59e0b] to-[#f97316] hover:from-[#ea8f04] hover:to-[#e96209]"
              >
                Join Waitlist
              </Button>
            </>
          ) : (
            <>
              <div className={`flex items-center text-sm font-medium px-3 py-1 rounded-full ${getSpotsColor()}`}>
                <Users className="w-4 h-4 mr-1" />
                <span>{session.spotsRemaining} spot{session.spotsRemaining !== 1 ? 's' : ''} left</span>
              </div>

              <Button
                onClick={() => onSelect(session.sessionId)}
                className="px-4 py-2"
              >
                Select
              </Button>
            </>
          )}
        </div>
      </div>

      {session.locationId && (
        <LocationDetailModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          locationId={session.locationId}
          locationName={session.locationName}
          locationAddress={session.locationAddress}
          organizationId={organizationId}
          onSignUp={onSignUp}
        />
      )}

      {session.coachId && (
        <CoachDetailModal
          isOpen={showCoachModal}
          onClose={() => setShowCoachModal(false)}
          coachId={session.coachId}
          coachName={session.coachName}
          coachRating={session.coachRating}
          organizationId={organizationId}
          onSignUp={onSignUp}
        />
      )}

      <ProgramDetailModal
        isOpen={showProgramModal}
        onClose={() => setShowProgramModal(false)}
        programName={session.programName}
        programDescription={session.programDescription}
        organizationId={organizationId}
        onSignUp={onSignUp}
      />
    </>
  );
}
