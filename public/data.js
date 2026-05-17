// QuantumQuiz prototype data — names, avatars, questions, word pairs
window.QQ_DATA = (function() {

  const players = [
    { id: 'p1', name: 'BLAZE',  hue: 340, score: 4820, streak: 4, isYou: false },
    { id: 'p2', name: 'PIXEL',  hue: 190, score: 4510, streak: 2, isYou: true  },
    { id: 'p3', name: 'NEON',   hue: 80,  score: 4380, streak: 3, isYou: false },
    { id: 'p4', name: 'VOID',   hue: 270, score: 3920, streak: 0, isYou: false },
    { id: 'p5', name: 'GLITCH', hue: 30,  score: 3640, streak: 1, isYou: false },
    { id: 'p6', name: 'RETRO',  hue: 220, score: 3210, streak: 0, isYou: false },
    { id: 'p7', name: 'AURA',   hue: 310, score: 2880, streak: 2, isYou: false },
    { id: 'p8', name: 'ZAP',    hue: 150, score: 2440, streak: 0, isYou: false },
  ];

  const question = {
    category: 'SCIENCE & NATURE',
    difficulty: 'MEDIUM',
    text: 'Which planet in our solar system has the most known moons?',
    options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'],
    correct: 1,
    source: 'NASA, 2023 — Saturn (146)'
  };

  // Recent answers state (for reveal screen)
  const answerDistribution = [3, 5, 1, 0]; // how many picked each option

  const chat = [
    { who: 'SYSTEM', what: 'BLAZE joined the lobby', kind: 'system' },
    { who: 'BLAZE',  what: 'lfg', kind: 'user', hue: 340 },
    { who: 'NEON',   what: 'someone pick impostor mode pls', kind: 'user', hue: 80 },
    { who: 'PIXEL',  what: 'voted ⭐', kind: 'user', hue: 190 },
    { who: 'SYSTEM', what: 'VOID joined the lobby', kind: 'system' },
    { who: 'GLITCH', what: 'im going for the win tonight', kind: 'user', hue: 30 },
    { who: 'BLAZE',  what: '😤 not if I see you first', kind: 'user', hue: 340 },
  ];

  // Word pair for impostor demo
  const impostor = {
    crewWord: 'PIZZA',
    impostorWord: 'LASAGNA',
    theme: 'Italian food',
    clues: [
      { who: 'BLAZE',  hue: 340, word: 'cheese',    role: 'crew' },
      { who: 'PIXEL',  hue: 190, word: 'oven',      role: 'crew' },
      { who: 'NEON',   hue: 80,  word: 'layers',    role: 'impostor' }, // suspicious!
      { who: 'VOID',   hue: 270, word: 'delivery',  role: 'crew' },
      { who: 'GLITCH', hue: 30,  word: 'crust',     role: 'crew' },
      { who: 'RETRO',  hue: 220, word: 'slice',     role: 'crew' },
    ],
    impostorId: 'p3', // NEON is the impostor
  };

  const voteResults = [
    { id: 'p3', name: 'NEON',   hue: 80,  votes: 5 },
    { id: 'p5', name: 'GLITCH', hue: 30,  votes: 2 },
    { id: 'p1', name: 'BLAZE',  hue: 340, votes: 1 },
    { id: 'p4', name: 'VOID',   hue: 270, votes: 0 },
  ];

  return { players, question, answerDistribution, chat, impostor, voteResults };
})();
