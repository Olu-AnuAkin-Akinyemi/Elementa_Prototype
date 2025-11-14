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
