import React, { useState } from "react";

const ScriptSelection = ({
  scripts,
  onScriptSelect,
  selectedScript,
  isProjectScript = false,
}) => {
  const [expandedCard, setExpandedCard] = useState(null);


  // Handle both scenarios: scripts array or single project script
  const hasScripts = scripts && (scripts.response1 || scripts.response2);
  const hasProjectScript = selectedScript && selectedScript.segments && isProjectScript;
  
  if (!hasScripts && !hasProjectScript) return null;

  const handleCardClick = (script, cardId) => {
    onScriptSelect(script, cardId);
  };

  const handleExpandClick = (e, index) => {
    e.stopPropagation();
    setExpandedCard(expandedCard === index ? null : index);
  };

  // Create script cards array for unified rendering
  const scriptCards = [];
  
  if (hasProjectScript) {
    // For project scripts (history), create two cards - one selected, one alternative
    scriptCards.push(
      {
        id: 'project-script-1',
        title: 'Selected Script',
        script: selectedScript,
        isProject: true,
        isSelected: true
      },
      {
        id: 'project-script-2',
        title: 'Alternative Script',
        script: selectedScript,
        isProject: true,
        isSelected: false
      }
    );
  } else if (hasScripts) {
    // For newly generated scripts, create two cards for user selection
    if (scripts.response1) {
      scriptCards.push({
        id: 1,
        title: 'Script 1',
        script: scripts.response1,
        isProject: false,
        isSelected: false
      });
    }
    if (scripts.response2) {
      scriptCards.push({
        id: 2,
        title: 'Script 2', 
        script: scripts.response2,
        isProject: false,
        isSelected: false
      });
    }
  }

  return (
    <div className="mt-3 w-full">
      <div className="flex space-x-3 overflow-x-auto pb-4 w-full">
        {scriptCards.map((card, index) => {
          // Check if this card is selected
          let isSelected = false;
          
          if (hasProjectScript) {
            // For project scripts (history), use the isSelected property from the card
            isSelected = card.isSelected;
          } else if (hasScripts) {
            // For newly generated scripts, check if this specific script matches the selected one
            if (selectedScript && card.script) {
              // First try object reference comparison
              if (selectedScript === card.script) {
                isSelected = true;
              } else {
                // If not the same object, check if this is the same script by comparing the card ID
                // This is more reliable than comparing segment properties
                if (selectedScript.cardId === card.id) {
                  isSelected = true;
                }
              }
            }
          }

          return (
            <div
              key={card.id}
              className={`rounded-lg overflow-hidden transition-all duration-300 cursor-pointer ${
                expandedCard === index 
                  ? 'flex-shrink-0 w-80 h-auto min-h-44' 
                  : 'flex-shrink-0 w-44 h-44'
              } ${
                isSelected 
                  ? 'border-2 border-cyan-400 shadow-lg shadow-cyan-400/50 bg-gradient-to-br from-cyan-500/15 to-blue-500/15' 
                  : 'border border-gray-600/40 hover:border-gray-500/60 bg-white/10'
              }`}
              onClick={() => handleCardClick(card.script, card.id)}
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
                  className="absolute top-2 right-2 text-gray-400 hover:text-cyan-300 transition-colors p-1"
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
                  {card.title}
                  {isSelected && <span className="ml-2 text-xs">✓ Selected</span>}
                </div>

                {/* Seconds and Summary */}
                <div className="space-y-1 mb-2">
                  <div className="text-gray-300 text-xs">
                    <span className="text-cyan-300">Seconds:</span> {card.script?.segments?.length ? card.script.segments.length * 5 : 0}<span>s</span>
                  </div>
                </div>

                {/* Summary content */}
                <div className="flex-1">
                  {expandedCard === index ? (
                    <div className="text-gray-300 text-xs leading-relaxed">
                      <span className="text-cyan-300">Summary:</span> {card.script?.summary || "No summary available"}
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="text-gray-300 text-xs leading-relaxed">
                        <span className="text-cyan-300">Summary:</span> {(card.script?.summary || "No summary")}
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
};

export default ScriptSelection;