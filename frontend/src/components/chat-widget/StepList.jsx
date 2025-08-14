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
    <div 
      className="p-2 border-b"
      style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(24, 25, 28, 0.4)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
          Video Steps
        </h3>
        <button
          className="text-gray-400 hover:text-gray-200 text-xs focus:outline-none"
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
                    : "text-white hover:bg-gray-800/30"
                }`}
                style={
                  isCurrent
                    ? {
                        background: 'rgba(24, 25, 28, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }
                    : {}
                }
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
                    className="px-1.5 py-0.5 text-[9px] rounded transition-colors"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(37, 99, 235, 0.9) 100%)',
                      color: 'white'
                    }}
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
                    className="px-1.5 py-0.5 text-[9px] rounded transition-colors"
                    style={{
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.8) 0%, rgba(22, 163, 74, 0.9) 100%)',
                      color: 'white'
                    }}
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
