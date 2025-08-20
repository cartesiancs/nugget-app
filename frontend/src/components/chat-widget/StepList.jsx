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
  const completedSteps = steps.filter(
    (step) => stepStatus[step.id] === "done",
  ).length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? completedSteps / totalSteps : 0;

  // Progress circle calculations
  const radius = 14; // INCREASED: Changed from 12 to 14
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      className='p-2 backdrop-blur-sm rounded-xl mr-2 ml-2'
      style={{
        background: "#18191C",
      }}
    >
      {/* Header */}
      <div className='flex items-center justify-between mb-2 mt-2'>
        <div className='flex items-center gap-2'>
          <h3 className='text-xs font-semibold text-gray-300 uppercase ml-2 tracking-wide'>
            Tasks
          </h3>
        </div>

        {/* Progress indicator, loading indicator and dropdown button */}
        <div className='flex items-center gap-2'>
          {/* Improved circular progress indicator */}
          <div className='relative w-12 h-12 flex items-center justify-center'>
            {" "}
            {/* INCREASED: Changed w-10 and h-10 to w-12 and h-12 */}
            <svg
              width='48' // INCREASED: Changed from 40 to 48
              height='48' // INCREASED: Changed from 40 to 48
              viewBox='0 0 48 48' // INCREASED: Changed from 0 0 40 40 to 0 0 48 48
              className='absolute'
              style={{ transform: "rotate(-90deg)" }}
            >
              {/* Background circle */}
              <circle
                cx='24'
                cy='24'
                r={radius}
                fill='none'
                stroke='rgba(255, 255, 255, 0.1)'
                strokeWidth='2'
              />
              {/* Progress circle */}
              <circle
                cx='24'
                cy='24'
                r={radius}
                fill='none'
                stroke='#94E7ED'
                strokeWidth='2'
                strokeLinecap='round'
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transition: "stroke-dashoffset 0.5s ease-in-out",
                  filter: "drop-shadow(0 0 4px rgba(148, 231, 237, 0.3))",
                }}
              />
            </svg>
            {/* Progress text */}
            <div className='absolute inset-0 flex items-center justify-center text-xs font-semibold text-white'>
              {" "}
              {/* INCREASED: Changed text-xs to text-sm */}
              {completedSteps}/{totalSteps}
            </div>
          </div>

          {/* Improved loading spinner */}
          {loading && (
            <div className='relative w-4 h-4'>
              <svg
                width='16'
                height='16'
                viewBox='0 0 16 16'
                className='animate-spin'
              >
                <circle
                  cx='8'
                  cy='8'
                  r='6'
                  fill='none'
                  stroke='rgba(255, 255, 255, 0.1)'
                  strokeWidth='1.5'
                />
                <circle
                  cx='8'
                  cy='8'
                  r='6'
                  fill='none'
                  stroke='#94E7ED'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeDasharray='9.425'
                  strokeDashoffset='7.069'
                  style={{
                    filter: "drop-shadow(0 0 4px rgba(148, 231, 237, 0.4))",
                  }}
                />
              </svg>
            </div>
          )}

          <button
            className='text-gray-400 hover:text-gray-200 text-xs focus:outline-none transition-colors'
            onClick={() => setCollapseSteps((v) => !v)}
          >
            {collapseSteps ? "▼" : "▲"}
          </button>
        </div>
      </div>

      {/* Step list - Using grid with uniform sizing and rounded edges */}
      {!collapseSteps && (
        <div className='grid grid-cols-2 gap-2'>
          {steps.map((step) => {
            const icon = getStepIcon(step.id);
            const disabled = isStepDisabled(step.id) || loading;
            const isCurrent = currentStep === step.id;
            const isDone = stepStatus[step.id] === "done";

            return (
              <div
                key={step.id}
                className={`flex items-center gap-2 p-2 rounded-full text-left transition-all duration-200 text-xs cursor-pointer min-h-[48px] ${
                  disabled
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-white hover:bg-gray-800/30"
                }`}
                style={{
                  background: isDone
                    ? "rgba(148, 231, 237, 0.1)"
                    : "rgba(255, 255, 255, 0.05)",
                  border: isCurrent
                    ? "1px solid rgba(148, 231, 237, 0.4)"
                    : "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: "none",
                }}
                onClick={() => {
                  if (!loading && !disabled && stepStatus[step.id] === "done") {
                    setCurrentStep(step.id);
                  }
                }}
              >
                <svg
                  width='28'
                  height='28'
                  viewBox='0 0 18 18'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <rect
                    width='18'
                    height='18'
                    rx='9'
                    fill={isDone ? "#94E7ED" : "white"}
                    fillOpacity={isDone ? "0.2" : "0.1"}
                  />
                  <g clipPath={`url(#clip0_640_38521_${step.id})`}>
                    <path
                      d='M5.437 12.562C5.437 12.1027 5.505 11.4506 5.693 10.7284M5.693 10.7284C6.268 8.5082 7.975 5.625 12.116 5.625C12.161 6.773 11.733 8.359 10.243 9.041M5.693 10.7284C9.899 11.373 10.486 10.019 10.243 9.041M10.243 9.041C9.786 9.251 9.228 9.375 8.453 9.375'
                      stroke={isDone ? "#94E7ED" : "white"}
                      strokeOpacity={isDone ? "0.8" : "0.5"}
                      strokeWidth='1'
                      strokeLinecap='round'
                    />
                  </g>
                  <defs>
                    <clipPath id={`clip0_640_38521_${step.id}`}>
                      <rect
                        width='9'
                        height='9'
                        fill='white'
                        transform='translate(4.5 4.5)'
                      />
                    </clipPath>
                  </defs>
                </svg>

                <div className='flex-1 min-w-0'>
                  <div className='font-medium truncate text-xs leading-tight'>
                    {step.name}
                  </div>
                </div>

                {/* Improved action buttons */}
                <div className='flex-shrink-0'>
                  {stepStatus[step.id] === "done" ? (
                    /* Redo button for completed steps */
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRedoStep(step.id);
                      }}
                      className='w-6 h-6 flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer hover:scale-105'
                      
                    >
                      <svg
                        width='18'
                        height='18'
                        viewBox='0 0 12 12'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <path
                          d='M8.7498 1.23688C9.0044 1.83292 9.1806 2.45922 9.2741 3.10006C9.2901 3.21001 9.2287 3.31633 9.1255 3.35741C9.0953 3.36941 9.0651 3.38121 9.0348 3.39282M3.2498 10.7632C2.9952 10.1671 2.8190 9.54083 2.7255 8.89999C2.7095 8.78999 2.7708 8.68367 2.8741 8.64259C2.9043 3.63059 2.9345 8.61879 2.9648 8.60718M7.2498 3.83495C7.8610 3.76131 8.4605 3.61273 9.0348 3.39282M9.0348 3.39282C8.7484 3.05951 8.4019 2.76808 7.9998 2.53591C6.0866 1.43135 3.6402 2.08685 2.5357 4.00002C2.0284 4.87856 1.8924 5.86952 2.0788 6.79137M9.9541 5.39629C10.0871 6.26383 9.9369 7.1808 9.4639 8.00002C8.3593 9.91319 5.9129 10.5687 3.9998 9.46411C3.5977 9.23195 3.2511 8.94052 2.9648 8.60718'
                          stroke='#94E7ED'
                          strokeWidth='1'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    </div>
                  ) : !disabled ? (
                    /* Run button for incomplete steps */
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStepClick(step.id);
                      }}
                      className='w-6 h-6 flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer hover:scale-105'
                    >
                      <svg
                        width='18'
                        height='18'
                        viewBox='0 0 12 12'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <path
                          d='M8.7498 1.23688C9.0044 1.83292 9.1806 2.45922 9.2741 3.10006C9.2901 3.21001 9.2287 3.31633 9.1255 3.35741C9.0953 3.36941 9.0651 3.38121 9.0348 3.39282M3.2498 10.7632C2.9952 10.1671 2.8190 9.54083 2.7255 8.89999C2.7095 8.78999 2.7708 8.68367 2.8741 8.64259C2.9043 3.63059 2.9345 8.61879 2.9648 8.60718M7.2498 3.83495C7.8610 3.76131 8.4605 3.61273 9.0348 3.39282M9.0348 3.39282C8.7484 3.05951 8.4019 2.76808 7.9998 2.53591C6.0866 1.43135 3.6402 2.08685 2.5357 4.00002C2.0284 4.87856 1.8924 5.86952 2.0788 6.79137M9.9541 5.39629C10.0871 6.26383 9.9369 7.1808 9.4639 8.00002C8.3593 9.91319 5.9129 10.5687 3.9998 9.46411C3.5977 9.23195 3.2511 8.94052 2.9648 8.60718'
                          stroke='#FFFFFF80'
                          strokeWidth='1'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
