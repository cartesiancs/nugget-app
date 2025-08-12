import React from "react";

const ConceptSelection = ({
  concepts,
  currentStep,
  onConceptSelect,
  selectedConcept,
}) => {
  if (!concepts || currentStep !== 1) return null;

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
