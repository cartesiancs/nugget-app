import React, { useState } from "react";

const ConceptSelection = ({
  concepts,
  onConceptSelect,
  selectedConcept,
}) => {
  const [expandedCard, setExpandedCard] = useState(null);
  const containerRef = React.useRef(null);


  if (!concepts) return null;

  const handleCardClick = (concept) => {
    onConceptSelect(concept);
  };

  const handleExpandClick = (e, index) => {
    e.stopPropagation();
    const newExpandedCard = expandedCard === index ? null : index;
    setExpandedCard(newExpandedCard);

    // Center the expanded card
    if (newExpandedCard !== null && containerRef.current) {
      setTimeout(() => {
        const container = containerRef.current;
        const expandedElement = container.children[index];
        if (expandedElement) {
          const containerRect = container.getBoundingClientRect();
          const elementRect = expandedElement.getBoundingClientRect();
          const scrollLeft =
            expandedElement.offsetLeft -
            (containerRect.width - elementRect.width) +
            50;
          container.scrollTo({
            left: Math.max(0, scrollLeft),
            behavior: "smooth",
          });
        }
      }, 100);
    }
  };

  return (
    <div className='mt-3 w-full'>
      <div
        ref={containerRef}
        className="flex space-x-3 overflow-x-auto pb-4 w-full"
      >
        {concepts.map((concept, index) => {
          const isSelected = selectedConcept && selectedConcept.title === concept.title;
          return (
            <div
              key={index}
              className={`rounded-lg overflow-hidden transition-all duration-300 cursor-pointer ${
                expandedCard === index 
                  ? 'flex-shrink-0 w-full h-auto min-h-44' 
                  : 'flex-shrink-0 w-44 h-44'
              } ${
                isSelected 
                  ? 'border-2 border-cyan-400 shadow-lg shadow-cyan-400/50 bg-gradient-to-br from-cyan-500/15 to-blue-500/15' 
                  : 'border border-gray-600/40 hover:border-gray-500/60 bg-white/10'
              }`}
              onClick={() => handleCardClick(concept)}
            >
              <div className="p-3 h-full flex flex-col relative">
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className="bg-cyan-400 rounded-full p-1">
                      <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
                
                {/* Dropdown arrow in top right */}
                <button
                  onClick={(e) => handleExpandClick(e, index)}
                  className="absolute top-2 right-2 bg-white text-black transition-colors p-1 z-10"
                >
                  <svg 
                    className={`w-3 h-3 transition-transform duration-200 ${expandedCard === index ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Title */}
                <div className={`font-bold text-sm mb-2 pr-6 ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                  {concept.title}
                  {isSelected && <span className="ml-2 text-xs">✓ Selected</span>}
                </div>

              {/* Summary */}
              <div className='flex-1'>
                {expandedCard === index ? (
                  <div className='text-gray-300 text-xs leading-relaxed'>
                    <span className='text-cyan-300'>Summary:</span>{" "}
                    {concept.summary || "No summary available"}
                  </div>
                ) : (
                  <div className="relative">
                    <div className="text-gray-300 text-xs leading-relaxed max-h-16 overflow-hidden">
                      <span className="text-cyan-300">Summary:</span> {(concept.summary|| "No summary")}
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-custom::-webkit-scrollbar {
          height: 6px;
        }

        .scrollbar-custom::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default ConceptSelection;