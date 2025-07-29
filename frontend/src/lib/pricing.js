/**
 * Credit pricing utility based on backend pricing
 * Source: prices.md
 */

export const CREDIT_PRICES = {
  // Image Generation
  IMAGE: {
    imagen: {
      credits: 2,
      editCredits: 4,
      unit: "per image",
      cost: 0.04,
    },
    recraft: {
      credits: 1,
      editCredits: 2,
      unit: "per image",
      cost: 0.02,
    },
  },

  // Video Generation
  VIDEO: {
    veo2: {
      credits: 25,
      editCredits: 37.5,
      unit: "per second",
      cost: 0.5,
    },
    "runway ml": {
      credits: 2.5,
      editCredits: 3.75,
      unit: "per second",
      cost: 0.05,
    },
    "kling v2.1 master (fal ai)": {
      credits: 20,
      editCredits: 30,
      unit: "per second",
      cost: 0.28,
    },
    veo3: {
      credits: 37.5,
      editCredits: 0,
      unit: "per second",
      cost: 0.75,
    },
  },

  // Audio Generation
  AUDIO: {
    elevenlabs: {
      credits: 2,
      editCredits: 2,
      unit: "per minute",
      cost: 0.11,
    },
  },

  // Text Processing
  TEXT: {
    perplexity: {
      credits: 1,
      editCredits: 2,
      unit: "per request",
      cost: 0.008,
    },
    "concept generator": {
      credits: 1,
      editCredits: 2,
      unit: "per request",
      cost: 0.0021,
    },
    "script & segmentation": {
      credits: 3,
      editCredits: 6,
      unit: "per request",
      cost: 0.06,
    },
    "web-info": {
      credits: 1,
      editCredits: 2,
      unit: "per request",
      cost: 0.008,
    },
  },
};

/**
 * Get credit cost for a specific model and operation type
 * @param {string} category - 'IMAGE', 'VIDEO', 'AUDIO', 'TEXT'
 * @param {string} model - Model name (e.g., 'imagen', 'veo2', 'perplexity')
 * @param {boolean} isEdit - Whether this is an edit operation
 * @returns {number} Credit cost
 */
export const getCreditCost = (category, model, isEdit = false) => {
  const categoryPrices = CREDIT_PRICES[category.toUpperCase()];
  if (!categoryPrices) {
    console.warn(`Unknown category: ${category}`);
    return 0;
  }

  const modelPrices = categoryPrices[model];
  if (!modelPrices) {
    console.warn(`Unknown model: ${model} for category: ${category}`);
    return 0;
  }

  return isEdit ? modelPrices.editCredits : modelPrices.credits;
};

/**
 * Get credit cost for text operations by service name
 * @param {string} serviceName - Service name ('web-info', 'concept generator', 'script & segmentation', 'perplexity')
 * @param {boolean} isEdit - Whether this is an edit operation
 * @returns {number} Credit cost
 */
export const getTextCreditCost = (serviceName, isEdit = false) => {
  return getCreditCost("TEXT", serviceName, isEdit);
};

/**
 * Get credit cost for image generation
 * @param {string} model - Image model name
 * @param {boolean} isEdit - Whether this is an edit operation
 * @returns {number} Credit cost
 */
export const getImageCreditCost = (model, isEdit = false) => {
  return getCreditCost("IMAGE", model, isEdit);
};

/**
 * Get credit cost for video generation
 * @param {string} model - Video model name
 * @param {number} duration - Duration in seconds (default: 8)
 * @param {boolean} isEdit - Whether this is an edit operation
 * @returns {number} Credit cost
 */
export const getVideoCreditCost = (model, duration = 8, isEdit = false) => {
  const baseCost = getCreditCost("VIDEO", model, isEdit);
  return baseCost * duration;
};

/**
 * Get credit cost for audio generation
 * @param {string} model - Audio model name
 * @param {number} duration - Duration in minutes (default: 1)
 * @param {boolean} isEdit - Whether this is an edit operation
 * @returns {number} Credit cost
 */
export const getAudioCreditCost = (model, duration = 1, isEdit = false) => {
  const baseCost = getCreditCost("AUDIO", model, isEdit);
  return baseCost * duration;
};

/**
 * Format credit deduction message
 * @param {string} serviceName - Name of the service
 * @param {number} credits - Number of credits deducted
 * @returns {string} Formatted message
 */
export const formatCreditDeduction = (serviceName, credits) => {
  return `${credits} credit${
    credits !== 1 ? "s" : ""
  } deducted for ${serviceName}`;
};
