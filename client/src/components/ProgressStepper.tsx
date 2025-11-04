import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  label: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
}

export default function ProgressStepper({ steps, currentStep, onStepClick }: ProgressStepperProps) {
  return (
    <div className="w-full bg-background border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isClickable = isCompleted && onStepClick;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => isClickable && onStepClick(step.id)}
                    disabled={!isClickable}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                      isCompleted && "bg-primary text-primary-foreground",
                      isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                      !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
                      isClickable && "cursor-pointer hover-elevate"
                    )}
                    data-testid={`step-indicator-${step.id}`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : step.id}
                  </button>
                  <span className={cn(
                    "mt-2 text-xs sm:text-sm font-medium text-center hidden sm:block",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-2 transition-all duration-300",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            );
          })}
        </div>
        <div className="sm:hidden text-center mt-3">
          <span className="text-sm font-medium text-muted-foreground">
            Paso {currentStep} de {steps.length}
          </span>
        </div>
      </div>
    </div>
  );
}
