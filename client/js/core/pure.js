export const ELEMENT_PROMPTS = {
  earth: [
    'Where have you felt most grounded and secure recently?',
    'What physical sensations are you noticing in your body right now?',
    'Describe a place in nature that makes you feel connected to the earth.',
    'What practices help you feel stable and rooted?'
  ],
  water: [
    'What emotions have been flowing through you today?',
    'How do you allow yourself to feel without judgment?',
    'What needs to be released or let go of?',
    'Describe the quality of your emotional state like water—still, flowing, turbulent?'
  ],
  fire: [
    'What is something you feel passionate or energized about right now?',
    'What action could you take today that excites you?',
    'Where do you feel your inner spark calling you forward?',
    'What would you create if fear was not holding you back?'
  ],
  air: [
    'Which thoughts have been swirling in your mind lately?',
    'What clarity are you seeking right now?',
    'How can you create more mental space today?',
    'What ideas want to be expressed or communicated?'
  ],
  spirit: [
    'What brings you a sense of connection to something greater?',
    'What are you grateful for in this moment?',
    'How do you experience the divine or unity in your life?',
    'What is your soul asking you to pay attention to?'
  ]
};

export const isValidElement = (element) => element in ELEMENT_PROMPTS;

export const getElementGeometry = (element) => {
  const geometries = {
    earth: new THREE.BoxGeometry(1, 1, 1),
    water: new THREE.IcosahedronGeometry(0.6, 0),
    fire: new THREE.TetrahedronGeometry(0.7, 0),
    air: new THREE.OctahedronGeometry(0.7, 0),
    spirit: new THREE.DodecahedronGeometry(0.6, 0)
  };
  return geometries[element];
};

export const getElementColor = (element) => {
  const colors = {
    earth: 0x8b7355,
    water: 0x4a90a4,
    fire: 0xd4573f,
    air: 0x68f2c2,
    spirit: 0x48235f
  };
  return colors[element];
};

export const getRandomPrompt = (element) => {
  const prompts = ELEMENT_PROMPTS[element];
  return prompts[Math.floor(Math.random() * prompts.length)];
};

const ELEMENT_DETAILS = {
  earth: {
    name: 'Earth',
    figure: 'Cube • Hexahedron',
    description: 'The cube is the most stable of the Platonic solids, echoing the steady heartbeat of soil and stone.',
    natureAction: 'Press your bare feet into soil or hold a smooth stone and study its details for 30 seconds.',
    quickFacts: [
      'Faces always meet at right angles, representing structure and ritual.',
      'Aligned with the root chakra & long exhales.',
      'Best used when journaling about anchors and foundations.',
      'Six faces mirror the six cardinal directions in sacred geometry.',
      'Mineralogists link cubes to crystalline lattices, a reminder of slow growth.'
    ]
  },
  water: {
    name: 'Water',
    figure: 'Icosahedron',
    description: 'Twenty triangular faces mirror endless ripples—each angle a new current or emotional tide.',
    natureAction: 'Cup water in your hands and feel its movement, or listen closely to running water for a minute.',
    quickFacts: [
      'The 12 vertices encourage openness and receptivity.',
      'Linked to sacral energy & creative surrender.',
      'Guides reflections about trust, empathy, and release.',
      'Marine biologists note icosahedral symmetry in viral shells and microscopic plankton.',
      'Mystics pair it with lunar tides—journal when emotions feel tidal.'
    ]
  },
  fire: {
    name: 'Fire',
    figure: 'Tetrahedron',
    description: 'Four faces rise into a single point, channeling breath upward like sparks leaping from flame.',
    natureAction: 'Warm your palms near a flame or sunlight and notice the heat before journaling.',
    quickFacts: [
      'Only Platonic solid that sits naturally on a base, ready to launch.',
      'Connected to solar plexus focus & courageous action.',
      'Use it to prompt momentum, willpower, and daring visions.',
      'NASA engineers love tetrahedral trusses for lightweight strength.',
      'Esoteric texts call it the alchemical “spark” that turns ideas to form.'
    ]
  },
  air: {
    name: 'Air',
    figure: 'Octahedron',
    description: 'Twin pyramids join at the center, symbolizing balance between inhale and exhale, thought and expression.',
    natureAction: 'Step outside, touch a tree if possible, and take three long, intentional breaths.',
    quickFacts: [
      'Eight faces keep conversations circulating.',
      'Aligned with heart-space openness & listening.',
      'Invites journaling on clarity, language, and exchange.',
      'Crystallographers see octahedra inside diamonds and quartz.',
      'Symbolists say its dual pyramids channel breath between Earth and sky.'
    ]
  },
  spirit: {
    name: 'Spirit',
    figure: 'Dodecahedron',
    description: 'Twelve pentagons orbit a hidden center, hinting at the unseen layers that bind each element together.',
    natureAction: 'Find a quiet view of the sky, close your eyes briefly, and notice any whispers of intuition.',
    quickFacts: [
      'Considered a bridge to ether in sacred geometry.',
      'Pairs with crown chakra practices & stillness.',
      'Supports reflections on purpose, wonder, and unity.',
      'Astronomers model certain quasicrystals with dodecahedral symmetry.',
      'Plato linked it to the cosmos—use it when questions feel infinite.'
    ]
  }
};

export const getElementDetails = () => ELEMENT_DETAILS;
export const getElementDetail = (element) => ELEMENT_DETAILS[element];
export const getNatureAction = (element) => ELEMENT_DETAILS[element]?.natureAction || '';

export const createEntry = (element, text, folder = 'inbox') => ({
  id: Date.now(),
  element,
  text,
  folder,
  date: new Date().toISOString()
});

export const formatDate = (isoDate) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getAllElements = () => ['earth', 'water', 'fire', 'air', 'spirit'];
