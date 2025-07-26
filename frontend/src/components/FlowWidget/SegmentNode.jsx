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
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 min-w-[200px] max-w-[300px] relative">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-blue-400">Scene {data.id}</h3>
        <div className={`w-3 h-3 rounded-full ${getStatusColor(data.status)}`}></div>
      </div>
      <div className="space-y-2">
        <div>
          <h4 className="text-xs font-medium text-gray-300 mb-1">Visual:</h4>
          <p className="text-xs text-gray-400 line-clamp-3">{data.visual}</p>
        </div>
        {data.narration && (
          <div>
            <h4 className="text-xs font-medium text-gray-300 mb-1">Narration:</h4>
            <p className="text-xs text-gray-400 line-clamp-2">{data.narration}</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-2 text-xs">
        <span className="text-gray-400">
          {getStatusIcon(data.status)} {data.status}
        </span>
      </div>
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          background: '#8b5cf6',
          width: 12,
          height: 12,
          border: '2px solid #fff',
        }}
      />
    </div>
  );
};

export default SegmentNode; 