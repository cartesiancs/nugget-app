import React from 'react';

// Shared styles and constants for FlowWidget components
export const FlowWidgetStyles = {
  // Node loading state styles
  loadingNode: {
    background: "#1a1a1a",
    border: "1px solid #444",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
    opacity: 0.8,
  },
  
  // Node error state styles  
  errorNode: {
    background: "#1a1a1a",
    border: "1px solid #dc2626",
    boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
  },
  
  // Node existing state styles
  existingNode: {
    background: "#1a1a1a", 
    border: "1px solid #444",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
  },
  
  // Edge styles
  defaultEdge: {
    stroke: '#E9E8EB33',
    strokeWidth: 2,
    filter: 'drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))'
  },
  
  // Handle styles
  defaultHandle: {
    background: "#ffffff",
    width: 16,
    height: 16,
    border: "2px solid #fff",
  },
  
  // Loading animation keyframes
  loadingPulse: `
    @keyframes pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
  `,
  
  // Generation state indicators
  generationStateColors: {
    loading: '#fbbf24', // amber
    error: '#dc2626',   // red
    completed: '#10b981', // emerald
    pending: '#6b7280'  // gray
  }
};

// Utility function to get node state styles
export const getNodeStateStyles = (nodeState, selected = false, hasData = false) => {
  const baseStyle = {
    transition: 'all 0.3s ease',
    borderRadius: '16px',
    padding: '16px',
    width: '280px',
    position: 'relative',
  };
  
  let stateStyles = {};
  
  switch (nodeState) {
    case 'loading':
      stateStyles = {
        ...FlowWidgetStyles.loadingNode,
        animation: 'pulse 2s infinite',
      };
      break;
    case 'error':
      stateStyles = FlowWidgetStyles.errorNode;
      break;
    case 'existing':
    case 'completed':
      stateStyles = FlowWidgetStyles.existingNode;
      break;
    default:
      stateStyles = {
        background: "#1a1a1a",
        border: hasData ? "1px solid #444" : "1px solid #333",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
      };
  }
  
  // Add selection styles
  if (selected) {
    stateStyles.ring = hasData ? "2px solid #8b5cf6" : "2px solid #6b7280";
    stateStyles.boxShadow = hasData 
      ? "0 0 20px rgba(139, 92, 246, 0.3)" 
      : "0 0 20px rgba(107, 114, 128, 0.3)";
  }
  
  return { ...baseStyle, ...stateStyles };
};

// Loading spinner component for generation states
export const LoadingSpinner = ({ size = 20, color = '#fbbf24' }) => (
  <div 
    className="animate-spin"
    style={{
      width: size,
      height: size,
      border: `2px solid transparent`,
      borderTop: `2px solid ${color}`,
      borderRadius: '50%',
    }}
  />
);

// Generation state badge component
export const GenerationStateBadge = ({ state, children }) => {
  const color = FlowWidgetStyles.generationStateColors[state] || FlowWidgetStyles.generationStateColors.pending;
  
  return (
    <div 
      className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {state === 'loading' && <LoadingSpinner size={12} color={color} />}
      {children}
    </div>
  );
};

export default FlowWidgetStyles;
