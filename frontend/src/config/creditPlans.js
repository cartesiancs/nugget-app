// Dynamic Credit Plans Configuration
// Change prices and credits here to update across the entire app

export const creditPlans = [
  {
    id: 'basic',
    name: 'Basic Plan',
    credits: 1000,
    price: 50,
    popular: false,
    features: [
      '1,000 AI credits',
      'Image generation',
      'Basic video creation',
      'Standard support'
    ]
  },
  {
    id: 'popular',
    name: 'Popular Plan',
    credits: 2000,
    price: 75,
    popular: true,
    features: [
      '2,000 AI credits',
      'Image generation',
      'Advanced video creation',
      'Priority support',
      'Custom templates'
    ]
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    credits: 3000,
    price: 120,
    popular: false,
    features: [
      '3,000 AI credits',
      'Unlimited image generation',
      'Professional video creation',
      'Premium support',
      'All features included',
      'API access'
    ]
  }
];

// Helper function to get plan by ID
export const getPlanById = (id) => {
  return creditPlans.find(plan => plan.id === id);
};

// Helper function to format price
export const formatPrice = (price) => {
  return `$${price}`;
};

// Helper function to format credits
export const formatCredits = (credits) => {
  return credits.toLocaleString();
};
