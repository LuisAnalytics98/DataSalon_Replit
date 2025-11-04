import { useState } from "react";
import ProgressStepper from "../ProgressStepper";

export default function ProgressStepperExample() {
  const [currentStep, setCurrentStep] = useState(2);

  const steps = [
    { id: 1, label: "Client Info" },
    { id: 2, label: "Service" },
    { id: 3, label: "Stylist" },
    { id: 4, label: "Date & Time" },
    { id: 5, label: "Confirm" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ProgressStepper 
        steps={steps} 
        currentStep={currentStep}
        onStepClick={setCurrentStep}
      />
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Current step: {currentStep}</p>
      </div>
    </div>
  );
}
