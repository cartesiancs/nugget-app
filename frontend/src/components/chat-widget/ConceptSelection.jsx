import React, { useState } from "react";

const ConceptSelection = ({
  concepts,
  currentStep,
  onConceptSelect,
  selectedConcept,
  showAsCards = false,
}) => {
  const [expandedCard, setExpandedCard] = useState(null);

  if (!concepts) return null;

  // Legacy display for step-based UI
  if (!showAsCards && currentStep !== 1) return null;

  const handleCardClick = (concept, index) => {
    if (showAsCards) {
      onConceptSelect(concept);
    } else {
      onConceptSelect(concept);
    }
  };

  const handleExpandClick = (e, index) => {
    e.stopPropagation();
    setExpandedCard(expandedCard === index ? null : index);
  };

  if (showAsCards) {
    return (
      <div className="mt-3 w-full">
        <div 
          className="flex space-x-3 overflow-x-auto pb-4 w-full" 
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitScrollbar: { display: 'none' }
          }}
        >
          {concepts.map((concept, index) => (
            <div
              key={index}
              className={`flex-shrink-0 w-48 bg-gray-800 border border-gray-600 rounded-lg overflow-hidden hover:border-gray-500 transition-all duration-300 cursor-pointer ${
                expandedCard === index ? 'h-auto min-h-48' : 'h-48'
              }`}
              onClick={() => handleCardClick(concept, index)}
            >
              <div className="p-4 h-full flex flex-col relative">
                {/* Dropdown arrow in top right */}
                <button
                  onClick={(e) => handleExpandClick(e, index)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors p-1"
                >
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${expandedCard === index ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Title */}
                <div className="text-white font-bold text-base mb-3 pr-8">
                  {concept.title}
                </div>

                {/* Tone and Goal */}
                <div className="space-y-2 mb-3">
                  <div className="text-gray-300 text-sm">
                    <span className="text-gray-400">Tone:</span> {concept.tone}
                  </div>
                  <div className="text-gray-300 text-sm">
                    <span className="text-gray-400">Goal:</span> {concept.goal}
                  </div>
                </div>

                {/* Concept text */}
                <div className="flex-1">
                  {expandedCard === index ? (
                    <div className="text-gray-300 text-sm leading-relaxed">
                      <span className="text-gray-400">Concept:</span> {concept.concept}
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="text-gray-300 text-sm leading-relaxed">
                        <span className="text-gray-400">Concept:</span> {concept.concept.substring(0, 100)}...
                      </div>
                      {/* Blur effect at bottom when collapsed */}
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-800 to-transparent pointer-events-none"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Legacy step-based display
  return (
    <div className='mb-4'>
      <h4 className='text-sm font-semibold text-white mb-2'>
        Choose a Concept:
      </h4>
      <div className='space-y-2'>
        {concepts.map((concept, index) => (
          <button
            key={index}
            onClick={() => onConceptSelect(concept)}
            className='w-full p-3 bg-gray-800 border border-gray-700 rounded text-left hover:bg-gray-700 hover:border-gray-600 transition-colors'
          >
            <div className='text-white font-medium text-sm mb-1'>
              {concept.title}
            </div>
            <div className='text-gray-300 text-xs mb-2'>{concept.concept}</div>
            <div className='flex flex-wrap gap-1'>
              <span className='px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded'>
                Tone: {concept.tone}
              </span>
              <span className='px-2 py-1 bg-green-600 text-green-100 text-xs rounded'>
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
