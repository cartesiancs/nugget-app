import React, { useState, useMemo } from "react";
import { Brain, Image, Video, User } from "lucide-react";
import { assets } from "../../assets/assets";

/**
 * TaskList component for FlowWidget - shows progress through the 6-step video creation flow
 * Steps: User Input → Concept → Script → Segment → Image → Video
 */
export default function TaskList({
  nodes,
  collapsed = false,
  onToggleCollapse,
  taskCompletionStates = {}
}) {
  const [collapseSteps, setCollapseSteps] = useState(collapsed);

  // Define the 6 steps of the flow
  const steps = [
    { id: 0, name: "User Input", description: "Add user input node", icon: User, type: "lucide" },
    { id: 1, name: "Concept", description: "Generate concepts", icon: Brain, type: "lucide" },
    { id: 2, name: "Script", description: "Create scripts", icon: assets.TextIcon, type: "asset" },
    { id: 3, name: "Segment", description: "Generate segments", icon: assets.SegmentIcon, type: "asset" },
    { id: 4, name: "Image", description: "Create images", icon: Image, type: "lucide" },
    { id: 5, name: "Video", description: "Generate videos", icon: Video, type: "lucide" },
  ];

  // Use completion states from parent component instead of node counting
  const stepStatus = useMemo(() => {
    const status = {
      0: taskCompletionStates.userInput ? "done" : "pending", // User Input
      1: taskCompletionStates.concept ? "done" : "pending",   // Concept
      2: taskCompletionStates.script ? "done" : "pending",    // Script
      3: taskCompletionStates.segment ? "done" : "pending",   // Segment
      4: taskCompletionStates.image ? "done" : "pending",     // Image
      5: taskCompletionStates.video ? "done" : "pending",     // Video
    };

    console.log("📊 TaskList: Task completion states:", taskCompletionStates, "Status:", status);
    return status;
  }, [taskCompletionStates]);

  // Calculate current step (highest incomplete step)
  const currentStep = useMemo(() => {
    for (let i = 0; i < steps.length; i++) {
      if (stepStatus[i] !== "done") {
        return i;
      }
    }
    return steps.length - 1; // All done
  }, [stepStatus, steps.length]);

  // Calculate progress
  const completedSteps = Object.values(stepStatus).filter(status => status === "done").length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? completedSteps / totalSteps : 0;

  // Progress circle calculations
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const getStepIcon = (stepId) => {
    const status = stepStatus[stepId];
    if (status === "done") return "✅";
    if (stepId === currentStep) return "▶️";
    return "⏸️";
  };

  return (
    <div className='relative'>
      {/* Original circular button with conditional progress indicator */}
      <div
        className='w-16 h-16 hover:bg-gray-600 border-0 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center backdrop-blur-sm cursor-pointer relative'
        style={{ background: "#18191CCC" }}
        onClick={() => {
          const newCollapsed = !collapseSteps;
          setCollapseSteps(newCollapsed);
          if (onToggleCollapse) {
            onToggleCollapse(newCollapsed);
          }
        }}
        title="Flow Progress"
      >
        {/* Progress circle overlay - only show if there's progress */}
        {progress > 0 && (
          <svg
            width='64'
            height='64'
            viewBox='0 0 64 64'
            className='absolute'
            style={{ transform: "rotate(-90deg)" }}
          >
            {/* Background circle */}
            <circle
              cx='32'
              cy='32'
              r='28'
              fill='none'
              stroke='rgba(255, 255, 255, 0.1)'
              strokeWidth='2'
            />
            {/* Progress circle */}
            <circle
              cx='32'
              cy='32'
              r='28'
              fill='none'
              stroke='#94E7ED'
              strokeWidth='2'
              strokeLinecap='round'
              strokeDasharray={2 * Math.PI * 28}
              strokeDashoffset={2 * Math.PI * 28 * (1 - progress)}
              style={{
                transition: "stroke-dashoffset 0.5s ease-in-out",
                filter: "drop-shadow(0 0 4px rgba(148, 231, 237, 0.3))",
              }}
            />
          </svg>
        )}
        
        {/* Show either clean icon OR progress text, not both */}
        <div className='relative z-10 flex items-center justify-center'>
          {progress > 0 ? (
            // Show progress text instead of icon when there's progress
            <div className='text-white font-bold text-sm'>
              {completedSteps}/6
            </div>
          ) : (
            // Show clean icon when no progress
            <img
              src={assets.NewChatIcon}
              className='w-12 h-12'
              alt='Task Progress'
            />
          )}
        </div>
      </div>

      {/* Icons-only vertical layout when expanded */}
      {!collapseSteps && (
        <div className='absolute top-20 left-1/2 transform -translate-x-1/2 z-[1002] bg-[#18191CCC] backdrop-blur-sm rounded-xl p-2 shadow-xl'>
          <div className='flex flex-col gap-2'>
            {steps.map((step) => {
              const isDone = stepStatus[step.id] === "done";
              const isCurrent = currentStep === step.id;

              return (
                <div
                  key={step.id}
                  className='relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer'
                  style={{
                    background: isDone
                      ? "rgba(148, 231, 237, 0.2)"
                      : isCurrent
                      ? "rgba(148, 231, 237, 0.1)"
                      : "rgba(255, 255, 255, 0.1)",
                    border: isCurrent
                      ? "2px solid rgba(148, 231, 237, 0.6)"
                      : "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: isDone 
                      ? "0 0 8px rgba(148, 231, 237, 0.3)"
                      : "none",
                  }}
                  title={step.name}
                >
                  {/* Render icon based on type */}
                  {step.type === "asset" ? (
                    step.id === 2 ? ( // Script icon - Text.svg
                      <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path 
                          d="M6.08337 21.9167C6.08337 20.8948 6.234 19.4458 6.65039 17.8408M6.65039 17.8408C7.93037 12.9071 11.7217 6.5 21.3687 6.5C21.4692 9.05017 20.5173 12.5758 17.207 14.0918M6.65039 17.8408C15.9989 19.2739 17.303 16.2656 17.207 14.0918M17.207 14.0918C16.1904 14.5573 14.9513 14.8333 13.452 14.8333" 
                          stroke={isDone ? "#94E7ED" : isCurrent ? "#94E7ED" : "white"}
                          strokeOpacity={isDone ? 1 : isCurrent ? 0.8 : 0.4}
                          strokeWidth="1.5" 
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : ( // Segment icon - segment.svg
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect 
                          width="18" 
                          height="18" 
                          x="3" 
                          y="3" 
                          rx="2"
                          stroke={isDone ? "#94E7ED" : isCurrent ? "#94E7ED" : "white"}
                          strokeOpacity={isDone ? 1 : isCurrent ? 0.8 : 0.4}
                          strokeWidth="1.25" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                        <path 
                          d="M7 8h10"
                          stroke={isDone ? "#94E7ED" : isCurrent ? "#94E7ED" : "white"}
                          strokeOpacity={isDone ? 1 : isCurrent ? 0.8 : 0.4}
                          strokeWidth="1.25" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                        <path 
                          d="M7 12h10"
                          stroke={isDone ? "#94E7ED" : isCurrent ? "#94E7ED" : "white"}
                          strokeOpacity={isDone ? 1 : isCurrent ? 0.8 : 0.4}
                          strokeWidth="1.25" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                        <path 
                          d="M7 16h10"
                          stroke={isDone ? "#94E7ED" : isCurrent ? "#94E7ED" : "white"}
                          strokeOpacity={isDone ? 1 : isCurrent ? 0.8 : 0.4}
                          strokeWidth="1.25" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                    )
                  ) : (
                    <step.icon
                      size={16}
                      color={isDone ? "#94E7ED" : isCurrent ? "#94E7ED" : "white"}
                      opacity={isDone ? 1 : isCurrent ? 0.8 : 0.4}
                    />
                  )}
                  
                  {/* Completion indicator */}
                  {isDone && (
                    <div className='absolute -top-1 -right-1 w-4 h-4 bg-[#94E7ED] rounded-full flex items-center justify-center'>
                      <svg width='10' height='10' viewBox='0 0 10 10' fill='none'>
                        <path
                          d='M2 5L4 7L8 3'
                          stroke='#0d0d0d'
                          strokeWidth='1.5'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    </div>
                  )}
                  
                  {/* Current step indicator */}
                  {isCurrent && !isDone && (
                    <div className='absolute -top-1 -right-1 w-3 h-3 bg-[#94E7ED] rounded-full animate-pulse' />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
