import { Clock, Calendar, MapPin, ArrowRight, Zap } from 'lucide-react';
import { Button } from '../common/Button';

interface Alternative {
  sessionId: string;
  programName: string;
  dayOfWeek: string;
  startTime: string;
  locationName: string;
  spotsRemaining: number;
  alternativeType?: 'adjacent_day' | 'alternative_time' | 'alternative_location' | 'similar_program';
  price: number;
  durationWeeks: number;
}

interface AlternativeSuggestionsProps {
  alternatives: Alternative[];
  onSelectAlternative: (sessionId: string) => void;
  requestedSession?: {
    programName: string;
    dayOfWeek: string;
    startTime: string;
    locationName: string;
  };
}

export function AlternativeSuggestions({ alternatives, onSelectAlternative, requestedSession }: AlternativeSuggestionsProps) {
  if (!alternatives || alternatives.length === 0) {
    return null;
  }

  const getAlternativeTypeLabel = (type?: string) => {
    switch (type) {
      case 'adjacent_day':
        return { icon: Calendar, label: 'Same time, different day', color: 'text-blue-400' };
      case 'alternative_time':
        return { icon: Clock, label: 'Same day, different time', color: 'text-purple-400' };
      case 'alternative_location':
        return { icon: MapPin, label: 'Nearby location', color: 'text-green-400' };
      default:
        return { icon: Zap, label: 'Similar program', color: 'text-orange-400' };
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(0)}`;
  };

  return (
    <div className="mt-6 p-4 bg-blue-950/20 rounded-lg border border-blue-800/50">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Zap className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-lg">
            This class is filling fast!
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {requestedSession ? (
              <>Here are similar options with available spots:</>
            ) : (
              <>Consider these alternatives with better availability:</>
            )}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {alternatives.slice(0, 3).map((alt, index) => {
          const { icon: Icon, label, color } = getAlternativeTypeLabel(alt.alternativeType);
          const isTopMatch = index === 0;

          return (
            <div
              key={alt.sessionId}
              className={`relative bg-[#1a2332] border rounded-lg p-4 hover:border-blue-500/50 transition-all ${
                isTopMatch ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' : 'border-gray-700'
              }`}
            >
              {isTopMatch && (
                <div className="absolute -top-2 left-4 px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full">
                  Best Match
                </div>
              )}

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className={`text-xs font-medium ${color}`}>{label}</span>
                  </div>

                  <div className="text-white font-medium">
                    {alt.programName}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{alt.dayOfWeek}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{alt.startTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{alt.locationName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-400 font-medium">
                      {alt.spotsRemaining} spot{alt.spotsRemaining !== 1 ? 's' : ''} available
                    </span>
                    <span className="text-gray-400">
                      {formatPrice(alt.price)} • {alt.durationWeeks} weeks
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => onSelectAlternative(alt.sessionId)}
                  className="px-4 py-2 whitespace-nowrap"
                  size="sm"
                >
                  <span className="flex items-center gap-1">
                    Select
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {alternatives.length > 3 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View {alternatives.length - 3} more alternative{alternatives.length - 3 !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
}