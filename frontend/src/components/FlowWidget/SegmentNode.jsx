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
    <div
      className="rounded-xl p-2 w-[240px] h-[240px] relative overflow-visible"
      style={{
        background: "linear-gradient(180.01deg, rgba(50, 53, 62, 0.17) 0.01%, rgba(17, 18, 21, 0.2) 109.75%)",
        border: "1px solid",
        borderImage: "linear-gradient(180deg, rgba(17, 18, 21, 0.1) 0%, rgba(233, 232, 235, 0.04) 100%) 1",
        backdropFilter: "blur(20px)"
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-bold text-blue-400">Scene {data.id}</h3>
        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(data.status)}`}></div>
      </div>
      {/* Reduce inner height to accommodate header and status within 240px node */}
      <div 
        className="w-[220px] h-[200px] rounded-lg p-2 text-[11px] text-gray-300 overflow-hidden"
        style={{
          background: "rgba(17, 18, 21, 0.3)",
          border: "1px solid rgba(233, 232, 235, 0.1)",
          backdropFilter: "blur(10px)"
        }}
      >
        <div className="mb-1">
          <h4 className="text-[10px] font-medium text-gray-300 mb-0.5">Visual</h4>
          <p className="text-[10px] text-gray-400 line-clamp-4 leading-snug whitespace-pre-wrap break-words">{data.visual}</p>
        </div>
        {data.narration && (
          <div>
            <h4 className="text-[10px] font-medium text-gray-300 mb-0.5">Narration</h4>
            <p className="text-[10px] text-gray-400 line-clamp-2 leading-snug whitespace-pre-wrap break-words">{data.narration}</p>
          </div>
        )}
        <div className="absolute bottom-1 left-2 text-[10px] text-gray-400">
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
  );
};

export default SegmentNode; 