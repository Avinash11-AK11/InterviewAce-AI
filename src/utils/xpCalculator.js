// ─── XP Calculation Utilities ──────────────────────────────────────────────────

export const calculateTestXp = (testData) => {
  if (testData.score === undefined || testData.score === null) return 0;
  
  let xpPerQuestion = 10;
  switch (testData.difficulty) {
    case 'Beginner': xpPerQuestion = 10; break;
    case 'Intermediate': xpPerQuestion = 15; break;
    case 'Advanced': xpPerQuestion = 20; break;
    case 'Expert': xpPerQuestion = 30; break;
    default: xpPerQuestion = 10; break;
  }
  
  const maxXP = (testData.questions?.length || 10) * xpPerQuestion;
  let xp = Math.round((testData.score / 100) * maxXP);
  
  // Give base XP of 10 for participating even if score is extremely low
  if (xp === 0) xp += 10;
  
  return xp;
};

export const calculateCodingXp = (codingData) => {
  if (codingData.status === 'success' || codingData.status === 'passed' || codingData.passed) {
    if (codingData.difficulty === 'Hard' || codingData.difficulty === 'hard') {
      return 30; // 30 XP for Hard
    } else {
      return 10; // 10 XP for others
    }
  }
  return 0;
};

export const calculateInterviewXp = (interviewData) => {
  const score = interviewData.overallScore || interviewData.score || 0;
  // Award up to 200 XP for an interview based on performance score
  if (score >= 50) {
    return Math.round((score / 100) * 200);
  } else {
    return 20; // Base participation XP if failed
  }
};
