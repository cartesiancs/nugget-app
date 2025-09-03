import { useState } from "react";
import { chatApi } from "../../services/chat";

export const useModelSelection = () => {
  // Model selection states
  const [selectedConceptModel, setSelectedConceptModel] = useState(
    chatApi.getDefaultModel("TEXT"),
  );
  const [selectedScriptModel, setSelectedScriptModel] = useState(
    chatApi.getDefaultModel("TEXT"),
  );
  const [selectedImageModel, setSelectedImageModel] = useState(
    chatApi.getDefaultModel("IMAGE"),
  );
  const [selectedVideoModel, setSelectedVideoModel] = useState(
    chatApi.getDefaultModel("VIDEO"),
  );

  // Reset all models to defaults
  const resetModelsToDefaults = () => {
    setSelectedConceptModel(chatApi.getDefaultModel("TEXT"));
    setSelectedScriptModel(chatApi.getDefaultModel("TEXT"));
    setSelectedImageModel(chatApi.getDefaultModel("IMAGE"));
    setSelectedVideoModel(chatApi.getDefaultModel("VIDEO"));
  };

  return {
    // States
    selectedConceptModel,
    selectedScriptModel,
    selectedImageModel,
    selectedVideoModel,

    // Setters
    setSelectedConceptModel,
    setSelectedScriptModel,
    setSelectedImageModel,
    setSelectedVideoModel,

    // Actions
    resetModelsToDefaults,
  };
};
