import { Handle, Position } from "@xyflow/react";

const SegmentNode = ({ data }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "generating":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return "✅";
      case "generating":
        return "🔄";
      case "error":
        return "❌";
      default:
        return "⏳";
    }
  };

  return (
    <div className="relative">
      {/* Node Label */}
      <div className="absolute -top-8 left-0 text-sm font-semibold text-blue-400 bg-gray-900/90 px-2 py-1 rounded-md border border-blue-400/30">
        SEGMENT
      </div>
      
      <div
        className="rounded-xl p-2 w-[240px] h-[240px] relative overflow-visible"
        style={{
          background: "linear-gradient(180deg, rgba(50, 53, 62, 0.9) 0%, rgba(17, 18, 21, 0.95) 100%)",
          border: "1px solid rgba(233, 232, 235, 0.2)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-blue-400">Scene {data.id}</h3>
          <div className={`w-3 h-3 rounded-full ${getStatusColor(data.status)}`}></div>
        </div>
        {/* Reduce inner height to accommodate header and status within 240px node */}
        <div 
          className="w-[220px] h-[200px] rounded-lg p-2 text-xs text-gray-300 overflow-hidden"
          style={{
            background: "rgba(17, 18, 21, 0.8)",
            border: "1px solid rgba(233, 232, 235, 0.15)",
            boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.2)"
          }}
        >
          <div className="mb-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-medium text-gray-300">Visual</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(data.visual).then(() => {
                    // Optional: You can add a toast notification here
                    console.log('Visual text copied to clipboard');
                  }).catch(err => {
                    console.error('Failed to copy text: ', err);
                  });
                }}
                className="text-gray-400 hover:text-blue-400 transition-colors duration-200 p-1 hover:bg-gray-700/50 rounded"
                title="Copy visual text"
              >
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-400 line-clamp-4 leading-relaxed whitespace-pre-wrap break-words">{data.visual}</p>
          </div>
          {data.narration && (
            <div>
              <h4 className="text-xs font-medium text-gray-300 mb-1">Narration</h4>
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed whitespace-pre-wrap break-words">{data.narration}</p>
            </div>
          )}
          <div className="absolute bottom-1 left-2 text-xs text-gray-400">
            {getStatusIcon(data.status)} {data.status}
          </div>
        </div>
        {/* Output handle */}
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          style={{
            background: '#8b5cf6',
            width: 20,
            height: 20,
            border: '4px solid #fff',
            boxShadow: '0 0 15px rgba(139, 92, 246, 0.8)',
            zIndex: 9999,
            right: -10
          }}
        />
      </div>
    </div>
  );
};

export default SegmentNode;