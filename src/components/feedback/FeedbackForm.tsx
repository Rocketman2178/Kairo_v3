import { useState } from 'react';
import { X, Star, Send, CheckCircle, Trophy, Zap, Target, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FeedbackFormProps {
  onClose: () => void;
}

interface SectionConfig {
  id: string;
  title: string;
  description: string;
  points: number;
  questions: QuestionConfig[];
}

interface QuestionConfig {
  key: string;
  label: string;
  type: 'rating' | 'text' | 'select' | 'multiselect';
  options?: string[];
  required?: boolean;
}

const sections: SectionConfig[] = [
  {
    id: 'problem',
    title: 'Problem Validation',
    description: 'Help us understand the registration challenges you face',
    points: 100,
    questions: [
      { key: 'pain_score', label: 'How painful is your current registration process? (1-10)', type: 'rating', required: true },
      { key: 'current_solution', label: 'What do you currently use for registration?', type: 'select', options: ['Spreadsheets', 'Paper forms', 'Basic software', 'Custom solution', 'Other'] },
      { key: 'biggest_challenge', label: 'What\'s your biggest registration challenge?', type: 'text' },
    ]
  },
  {
    id: 'market',
    title: 'Market Reality',
    description: 'Your competitive landscape and budget',
    points: 150,
    questions: [
      { key: 'competitor_tools', label: 'Which tools have you tried or considered?', type: 'multiselect', options: ['TeamSnap', 'LeagueApps', 'SportsEngine', 'Active Network', 'Custom built', 'None'] },
      { key: 'budget_range', label: 'What\'s your monthly software budget?', type: 'select', options: ['Under $100', '$100-$500', '$500-$1000', '$1000-$2500', 'Over $2500'] },
      { key: 'decision_timeline', label: 'When are you looking to implement a solution?', type: 'select', options: ['Immediately', '1-3 months', '3-6 months', '6+ months', 'Just exploring'] },
    ]
  },
  {
    id: 'implementation',
    title: 'Implementation Concerns',
    description: 'Technical and operational considerations',
    points: 125,
    questions: [
      { key: 'tech_comfort', label: 'How comfortable is your team with new technology? (1-10)', type: 'rating' },
      { key: 'integration_needs', label: 'What integrations are critical for you?', type: 'multiselect', options: ['Payment processing', 'Email marketing', 'Accounting', 'Website', 'CRM', 'None'] },
      { key: 'data_migration', label: 'How much historical data would need migration?', type: 'select', options: ['None', 'Less than 1 year', '1-3 years', 'More than 3 years'] },
    ]
  },
  {
    id: 'business',
    title: 'Business Model Fit',
    description: 'Pricing and value perception',
    points: 175,
    questions: [
      { key: 'pricing_preference', label: 'Which pricing model do you prefer?', type: 'select', options: ['Per registration fee', 'Monthly subscription', 'Annual subscription', 'Per-student pricing'] },
      { key: 'roi_expectation', label: 'What ROI would justify the investment?', type: 'select', options: ['Time savings', 'Increased enrollments', 'Better retention', 'Reduced errors', 'All of the above'] },
      { key: 'deal_breakers', label: 'What would be a deal breaker?', type: 'text' },
    ]
  },
  {
    id: 'features',
    title: 'Feature Priority',
    description: 'What matters most to you',
    points: 150,
    questions: [
      { key: 'ai_interest', label: 'How interested are you in AI-powered registration? (1-10)', type: 'rating', required: true },
      { key: 'must_have_features', label: 'Which features are must-haves?', type: 'multiselect', options: ['Online payments', 'Automated communications', 'Scheduling', 'Reporting', 'Mobile app', 'Parent portal'] },
      { key: 'nice_to_have', label: 'What would be a nice bonus?', type: 'text' },
    ]
  },
  {
    id: 'organization',
    title: 'Organization Profile',
    description: 'Help us understand your scale',
    points: 100,
    questions: [
      { key: 'org_size', label: 'How many students do you serve annually?', type: 'select', options: ['Under 100', '100-500', '500-1000', '1000-5000', 'Over 5000'] },
      { key: 'staff_count', label: 'How many staff members handle registration?', type: 'select', options: ['Just me', '2-5', '6-10', 'More than 10'] },
      { key: 'locations', label: 'How many locations do you operate?', type: 'select', options: ['1', '2-5', '6-10', '11-25', 'More than 25'] },
    ]
  },
  {
    id: 'experience',
    title: 'Demo Experience',
    description: 'Your thoughts on what you\'ve seen',
    points: 125,
    questions: [
      { key: 'demo_rating', label: 'How would you rate this demo? (1-10)', type: 'rating', required: true },
      { key: 'impressed_by', label: 'What impressed you most?', type: 'text' },
      { key: 'concerns', label: 'What concerns do you have?', type: 'text' },
    ]
  },
  {
    id: 'nps',
    title: 'Recommendation',
    description: 'Would you recommend Kairo?',
    points: 100,
    questions: [
      { key: 'nps_score', label: 'How likely are you to recommend Kairo? (0-10)', type: 'rating', required: true },
      { key: 'recommendation_reason', label: 'Why did you give that score?', type: 'text' },
    ]
  },
  {
    id: 'contact',
    title: 'Stay Connected',
    description: 'Get updates and early access',
    points: 75,
    questions: [
      { key: 'email', label: 'Your email address', type: 'text', required: true },
      { key: 'name', label: 'Your name', type: 'text' },
      { key: 'organization', label: 'Organization name', type: 'text' },
      { key: 'role', label: 'Your role', type: 'select', options: ['Owner', 'Director', 'Administrator', 'Coach', 'Other'] },
    ]
  },
  {
    id: 'final',
    title: 'Final Thoughts',
    description: 'Anything else you\'d like to share',
    points: 100,
    questions: [
      { key: 'additional_feedback', label: 'Any other feedback or suggestions?', type: 'text' },
      { key: 'feature_request', label: 'What feature would you love to see?', type: 'text' },
    ]
  },
];

export function FeedbackForm({ onClose }: FeedbackFormProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | string[] | number>>({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const section = sections[currentSection];
  const progress = ((currentSection + 1) / sections.length) * 100;

  const handleResponse = (key: string, value: string | string[] | number) => {
    setResponses(prev => ({ ...prev, [key]: value }));
  };

  const completeSection = () => {
    if (!completedSections.has(section.id)) {
      setCompletedSections(prev => new Set([...prev, section.id]));
      setTotalPoints(prev => prev + section.points);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  };

  const nextSection = () => {
    completeSection();
    if (currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1);
    } else {
      submitFeedback();
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
    }
  };

  const skipSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1);
    } else {
      submitFeedback();
    }
  };

  const submitFeedback = async () => {
    setIsSubmitting(true);
    try {
      const feedbackData = {
        total_points_earned: totalPoints + section.points,
        completion_percentage: Math.round((completedSections.size + 1) / sections.length * 100),
        registration_pain_score: responses.pain_score as number,
        nps_score: responses.nps_score as number,
        respondent_email: responses.email as string,
        respondent_organization: responses.organization as string,
        respondent_name: responses.name as string,
        respondent_role: responses.role as string,
        monthly_budget_range: responses.budget_range as string,
        decision_timeline: responses.decision_timeline as string,
        badges_earned: getBadges(),
        most_valuable_ai_concept: responses.impressed_by as string,
        platform_resistance_reason: responses.concerns as string,
        biggest_registration_headache: responses.biggest_challenge as string,
        critical_problem_not_solving: responses.deal_breakers as string,
        feature_priority_ranking: { must_have: responses.must_have_features, nice_to_have: responses.nice_to_have },
      };

      await supabase.from('tiger_tank_feedback').insert(feedbackData);
      setIsComplete(true);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBadges = () => {
    const badges: string[] = [];
    if (totalPoints >= 500) badges.push('Power Reviewer');
    if (completedSections.size >= 8) badges.push('Completionist');
    if ((responses.nps_score as number) >= 9) badges.push('Kairo Champion');
    if ((responses.ai_interest as number) >= 8) badges.push('AI Enthusiast');
    return badges;
  };

  const renderQuestion = (question: QuestionConfig) => {
    const value = responses[question.key];

    switch (question.type) {
      case 'rating':
        const maxRating = question.key === 'nps_score' ? 10 : 10;
        return (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: maxRating + 1 }, (_, i) => i).map(num => (
              <button
                key={num}
                onClick={() => handleResponse(question.key, num)}
                className={`w-10 h-10 rounded-lg font-medium transition-all ${
                  value === num
                    ? 'bg-amber-500 text-white scale-110'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        );

      case 'select':
        return (
          <div className="grid grid-cols-2 gap-2">
            {question.options?.map(option => (
              <button
                key={option}
                onClick={() => handleResponse(question.key, option)}
                className={`px-4 py-2 rounded-lg text-sm text-left transition-all ${
                  value === option
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        );

      case 'multiselect':
        const selected = (value as string[]) || [];
        return (
          <div className="grid grid-cols-2 gap-2">
            {question.options?.map(option => (
              <button
                key={option}
                onClick={() => {
                  const newValue = selected.includes(option)
                    ? selected.filter(v => v !== option)
                    : [...selected, option];
                  handleResponse(question.key, newValue);
                }}
                className={`px-4 py-2 rounded-lg text-sm text-left transition-all flex items-center gap-2 ${
                  selected.includes(option)
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {selected.includes(option) && <CheckCircle className="w-4 h-4" />}
                {option}
              </button>
            ))}
          </div>
        );

      case 'text':
        return (
          <textarea
            value={(value as string) || ''}
            onChange={(e) => handleResponse(question.key, e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 resize-none"
            rows={3}
            placeholder="Type your answer..."
          />
        );
    }
  };

  if (isComplete) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
          <p className="text-slate-400 mb-6">Your feedback helps shape the future of Kairo</p>

          <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
            <div className="text-3xl font-bold text-amber-400 mb-1">{totalPoints}</div>
            <div className="text-slate-400 text-sm">Total Points Earned</div>
          </div>

          {getBadges().length > 0 && (
            <div className="mb-6">
              <p className="text-slate-400 text-sm mb-3">Badges Earned:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {getBadges().map(badge => (
                  <span key={badge} className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`
                }}
              >
                <Star className="w-4 h-4 text-amber-400" />
              </div>
            ))}
          </div>
        )}

        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Tiger Tank Feedback</h2>
                <p className="text-slate-400 text-sm">Help us build the perfect platform</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center gap-2 text-amber-400">
              <Zap className="w-4 h-4" />
              <span className="font-semibold">{totalPoints}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">
                +{section.points} pts
              </span>
              <span className="text-slate-500 text-sm">
                Section {currentSection + 1} of {sections.length}
              </span>
              <span className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded-full">
                Optional
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{section.title}</h3>
            <p className="text-slate-400">{section.description}</p>
          </div>

          <div className="space-y-6">
            {section.questions.map((question) => (
              <div key={question.key}>
                <label className="block text-white mb-3">
                  {question.label}
                  {question.required && <span className="text-amber-400 ml-1">*</span>}
                </label>
                {renderQuestion(question)}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-700 flex items-center justify-between">
          <button
            onClick={prevSection}
            disabled={currentSection === 0}
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={skipSection}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Skip
            </button>
            <button
              onClick={nextSection}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? (
                'Submitting...'
              ) : currentSection === sections.length - 1 ? (
                <>
                  Submit <Send className="w-4 h-4" />
                </>
              ) : (
                <>
                  Continue <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
