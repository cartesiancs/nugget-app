import React from "react";

/**
 * Renders the list of 6 video creation steps along with their current status.
 * Purely presentational – all state & logic is driven by props.
 */
export default function StepList({
  steps,
  stepStatus,
  currentStep,
  loading,
  collapseSteps,
  setCollapseSteps,
  isStepDisabled,
  getStepIcon,
  handleStepClick,
  handleRedoStep,
  setCurrentStep,
}) {
  return (
    <div className="p-3 border-b border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
          Video Steps
        </h3>
        <button
          className="text-gray-400 hover:text-gray-200 text-sm focus:outline-none"
          onClick={() => setCollapseSteps((v) => !v)}
        >
          {collapseSteps ? "▼" : "▲"}
        </button>
      </div>

      {/* Step list */}
      {!collapseSteps && (
        <div className="space-y-1">
          {steps.map((step) => {
            const icon = getStepIcon(step.id);
            const disabled = isStepDisabled(step.id) || loading;
            const isCurrent = currentStep === step.id;

            return (
              <div
                key={step.id}
                className={`w-full flex items-center gap-2 p-1 rounded text-left transition-colors text-xs ${
                  disabled
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-white hover:bg-gray-800"
                } ${isCurrent ? "bg-gray-800" : ""}`}
                onClick={() => {
                  if (!loading && !disabled && stepStatus[step.id] === "done") {
                    setCurrentStep(step.id);
                  }
                }}
              >
                <span className="text-sm">{icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{step.name}</div>
                </div>

                {/* Redo button */}
                {stepStatus[step.id] === "done" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRedoStep(step.id);
                    }}
                    className="px-2 py-0.5 text-[10px] bg-blue-600 hover:bg-blue-500 rounded"
                  >
                    Redo
                  </button>
                )}

                {/* Run button */}
                {stepStatus[step.id] !== "done" && !disabled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStepClick(step.id);
                    }}
                    className="px-2 py-0.5 text-[10px] bg-green-600 hover:bg-green-500 rounded"
                  >
                    Run
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
