import { Check } from 'lucide-react';

interface Step {
  label: string;
  shortLabel: string;
}

interface RegistrationStepsProps {
  currentStep: number;
  steps: Step[];
}

export default function RegistrationSteps({ currentStep, steps }: RegistrationStepsProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((s, i) => {
        const isComplete = i < currentStep;
        const isCurrent = i === currentStep;

        return (
          <div key={s.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  isComplete
                    ? 'bg-green-500 text-white'
                    : isCurrent
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isComplete ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium transition-colors ${
                  isCurrent ? 'text-blue-600' : isComplete ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.shortLabel}</span>
              </span>
            </div>

            {i < steps.length - 1 && (
              <div className="flex-1 mx-2 sm:mx-3">
                <div
                  className={`h-0.5 rounded-full transition-colors duration-300 ${
                    i < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
