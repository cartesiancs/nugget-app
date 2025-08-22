import React, { useState } from "react";

const ConceptSelection = ({
  concepts,
  currentStep,
  onConceptSelect,
  selectedConcept,
  showAsCards = false,
}) => {
  const [expandedCard, setExpandedCard] = useState(null);
  const containerRef = React.useRef(null);

  if (!concepts) return null;

  // Legacy display for step-based UI
  if (!showAsCards && currentStep !== 1) return null;

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
          const scrollLeft = expandedElement.offsetLeft - (containerRect.width - elementRect.width)+50;
          container.scrollTo({
            left: Math.max(0, scrollLeft),
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  if (showAsCards) {
    return (
      <div className="mt-3 w-full">
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

                {/* Tone and Goal */}
                <div className="space-y-1 mb-2">
                  <div className="text-gray-300 text-xs">
                    <span className="text-cyan-300">Tone:</span> {concept.tone}
                  </div>
                  <div className="text-gray-300 text-xs">
                    <span className="text-cyan-300">Goal:</span> {concept.goal}
                  </div>
                </div>

                {/* Concept text */}
                <div className="flex-1">
                  {expandedCard === index ? (
                    <div className="text-gray-300 text-xs leading-relaxed">
                      <span className="text-cyan-300">Concept:</span> {concept.concept}
                    </div>
                  ) : (
                    <div className="relative blur-3xl">
                      <div className="text-gray-300 text-xs leading-relaxed max-h-16 overflow-hidden">
                        <span className="text-cyan-300 ">Concept:</span> {concept.concept.substring(0, 120)}...
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Legacy step-based display
  return (
    <div className='mb-3'>
      <h4 className='text-xs font-semibold text-white mb-2'>
        Choose a Concept:
      </h4>
      <div className='space-y-2'>
        {concepts.map((concept, index) => (
          <button
            key={index}
            onClick={() => onConceptSelect(concept)}
            className='w-full p-2 border border-gray-700/40 rounded text-left hover:border-gray-600/60 transition-colors bg-gray-900/50 backdrop-blur-sm'
          >
            <div className='text-white font-medium text-xs mb-1'>
              {concept.title}
            </div>
            <div className='text-gray-300 text-xs mb-2'>{concept.concept}</div>
            <div className='flex flex-wrap gap-1'>
              <span className='px-2 py-0.5 text-xs rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white'>
                Tone: {concept.tone}
              </span>
              <span className='px-2 py-0.5 text-xs rounded bg-gradient-to-br from-green-500 to-green-600 text-white'>
                Goal: {concept.goal}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Show selected concept when step 1 is clicked */}
      {selectedConcept && (
        <div className='mt-4'>
          <h4 className='text-sm font-semibold text-white mb-2'>
            Selected Concept:
          </h4>
          <div className='p-3 bg-gray-800 border border-gray-700 rounded'>
            <div className='text-white font-medium text-sm mb-1'>
              {selectedConcept.title}
            </div>
            <div className='text-gray-300 text-xs mb-2'>
              {selectedConcept.concept}
            </div>
            <div className='flex flex-wrap gap-1'>
              <span className='px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded'>
                Tone: {selectedConcept.tone}
              </span>
              <span className='px-2 py-1 bg-green-600 text-green-100 text-xs rounded'>
                Goal: {selectedConcept.goal}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConceptSelection;