function SegmentDetail({ segment }) {
  if (!segment) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Select a segment to view details
      </div>
    );
  }

  // Split visual content into sections based on common patterns
  const visualSections = segment.visual.split(/(?=Scene Title:|Visuals:|Camera:|Text Overlay:|Audio Cues:)/)
    .filter(Boolean)
    .map(section => section.trim());

  return (
    <div className="p-6 space-y-8 overflow-y-auto">
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-blue-400">Visual Description</h3>
        {visualSections.map((section, index) => {
          const [title, ...content] = section.split(':');
          return (
            <div key={index} className="space-y-2">
              <h4 className="text-lg font-semibold text-blue-300">{title.trim()}</h4>
              <p className="text-gray-300 leading-relaxed">{content.join(':').trim()}</p>
            </div>
          );
        })}
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-green-400">Video & Audio Description</h3>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{segment.narration}</p>
        </div>
      </div>
      
      <div className="text-sm text-gray-500">
        Segment ID: {segment.id}
      </div>
    </div>
  );
}

export default SegmentDetail; 