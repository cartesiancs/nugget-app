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
      className='p-2 backdrop-blur-sm'
      style={{
        background: "#18191C80",
      }}
    >
      {/* Header */}
      <div className='flex items-center justify-between mb-1'>
        <h3 className='text-xs font-semibold text-gray-300 uppercase tracking-wide'>
          Video Steps
        </h3>
        <button
          className='text-gray-400 hover:text-gray-200 text-xs focus:outline-none'
          onClick={() => setCollapseSteps((v) => !v)}
        >
          {collapseSteps ? "▼" : "▲"}
        </button>
      </div>

      {/* Step list - The main change is here, using `grid` and `grid-cols-2` */}
      {!collapseSteps && (
        <div className='grid grid-cols-2 gap-2'>
          {steps.map((step) => {
            const icon = getStepIcon(step.id);
            const disabled = isStepDisabled(step.id) || loading;
            const isCurrent = currentStep === step.id;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-2 p-1 rounded text-left transition-colors text-xs ${
                  disabled
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-white hover:bg-gray-800/30"
                }`}
                style={
                  isCurrent
                    ? {
                        background: "rgba(24, 25, 28, 0.6)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }
                    : {}
                }
                onClick={() => {
                  if (!loading && !disabled && stepStatus[step.id] === "done") {
                    setCurrentStep(step.id);
                  }
                }}
              >
                <span className='text-sm'>
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <rect
                      width='24'
                      height='24'
                      rx='12'
                      fill='#94E7ED'
                      fill-opacity='0.3'
                    />
                    <g clip-path='url(#clip0_640_38521)'>
                      <path
                        d='M7.25 16.75C7.25 16.1369 7.34038 15.2675 7.59021 14.3045M7.59021 14.3045C8.3582 11.3442 10.633 7.5 16.4212 7.5C16.4815 9.0301 15.9103 11.1455 13.9242 12.0551M7.59021 14.3045C13.1993 15.1644 13.9818 13.3593 13.9242 12.0551M13.9242 12.0551C13.3142 12.3344 12.5708 12.5 11.6712 12.5'
                        stroke='#94E7ED'
                        stroke-width='1.5'
                        stroke-linecap='round'
                      />
                    </g>
                    <defs>
                      <clipPath id='clip0_640_38521'>
                        <rect
                          width='12'
                          height='12'
                          fill='white'
                          transform='translate(6 6)'
                        />
                      </clipPath>
                    </defs>
                  </svg>
                </span>
                <div className='flex-1'>
                  <div className='font-medium'>{step.name}</div>
                </div>

                {/* Redo button */}
                {stepStatus[step.id] === "done" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRedoStep(step.id);
                    }}
                    className='px-1.5 py-0.5 text-[9px] rounded transition-colors'
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(37, 99, 235, 0.9) 100%)",
                      color: "white",
                    }}
                  >
                    <svg
                      width='16'
                      height='16'
                      viewBox='0 0 16 16'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path
                        d='M11.6664 1.64917C12.0059 2.4439 12.2408 3.27896 12.3655 4.13341C12.3869 4.28001 12.305 4.42177 12.1674 4.47654C12.1271 4.49255 12.0868 4.50828 12.0464 4.52376M4.33308 14.3509C3.99361 13.5561 3.75872 12.7211 3.63404 11.8666C3.61264 11.72 3.69449 11.5783 3.83214 11.5235C3.87236 11.5075 3.91268 11.4918 3.95308 11.4763M9.66642 5.11327C10.4814 5.01508 11.2807 4.81697 12.0464 4.52376M12.0464 4.52376C11.6646 4.07935 11.2026 3.69077 10.6664 3.38122C8.11552 1.90846 4.85371 2.78246 3.38095 5.33336C2.70465 6.50474 2.52321 7.82603 2.77177 9.05516M13.2722 7.19506C13.4495 8.35177 13.2492 9.5744 12.6186 10.6667C11.1458 13.2176 7.88398 14.0916 5.33308 12.6188C4.79693 12.3093 4.33486 11.9207 3.95308 11.4763M6.33308 10.8868C5.5181 10.985 4.71878 11.1831 3.95308 11.4763'
                        stroke='#94E7ED'
                        stroke-width='1.5'
                        stroke-linecap='round'
                        stroke-linejoin='round'
                      />
                    </svg>
                  </button>
                )}

                {/* Run button */}
                {stepStatus[step.id] !== "done" && !disabled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStepClick(step.id);
                    }}
                    className='px-1.5 py-0.5 text-[9px] rounded transition-colors'
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(34, 197, 94, 0.8) 0%, rgba(22, 163, 74, 0.9) 100%)",
                      color: "white",
                    }}
                  >
                    <svg
                      width='16'
                      height='16'
                      viewBox='0 0 16 16'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path
                        d='M11.6664 1.64917C12.0059 2.4439 12.2408 3.27896 12.3655 4.13341C12.3869 4.28001 12.305 4.42177 12.1674 4.47654C12.1271 4.49255 12.0868 4.50828 12.0464 4.52376M4.33308 14.3509C3.99361 13.5561 3.75872 12.7211 3.63404 11.8666C3.61264 11.72 3.69449 11.5783 3.83214 11.5235C3.87236 11.5075 3.91268 11.4918 3.95308 11.4763M9.66642 5.11327C10.4814 5.01508 11.2807 4.81697 12.0464 4.52376M12.0464 4.52376C11.6646 4.07935 11.2026 3.69077 10.6664 3.38122C8.11552 1.90846 4.85371 2.78246 3.38095 5.33336C2.70465 6.50474 2.52321 7.82603 2.77177 9.05516M13.2722 7.19506C13.4495 8.35177 13.2492 9.5744 12.6186 10.6667C11.1458 13.2176 7.88398 14.0916 5.33308 12.6188C4.79693 12.3093 4.33486 11.9207 3.95308 11.4763M6.33308 10.8868C5.5181 10.985 4.71878 11.1831 3.95308 11.4763'
                        stroke='#94E7ED'
                        stroke-width='1.5'
                        stroke-linecap='round'
                        stroke-linejoin='round'
                      />
                    </svg>
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
