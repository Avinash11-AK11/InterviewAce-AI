import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { BADGES_DATA } from './seedData';
import { calculateTestXp, calculateCodingXp, calculateInterviewXp } from './xpCalculator';

const getBadgeProgress = (badge, stats) => {
  if (!stats) return { pct: 0 };
  const { type, count } = badge.requirement;
  let current = 0;
  switch (type) {
    case 'tests_taken':    current = stats.testsTaken || 0;       break;
    case 'problems_solved':current = stats.problemsSolved || 0;   break;
    case 'interviews_done':current = stats.interviewsDone || 0;   break;
    case 'streak_days':    current = stats.currentStreak || 0;    break;
    case 'resumes_uploaded':current= stats.resumesUploaded || 0;  break;
    case 'high_score_count':current = stats.highScoreCount || 0;  break;
    case 'perfect_score':  current = stats.perfectScores || 0;    break;
    case 'hard_problems':  current = stats.hardProblemsSolved || 0;break;
    case 'profile_complete':current = stats.profileComplete ? 1 : 0;break;
    default:               current = 0;
  }
  return { pct: Math.min((current / count) * 100, 100) };
};

const isEarned = (badge, stats) => {
  return getBadgeProgress(badge, stats).pct >= 100;
};

const calculateLevel = (xp) => {
  let level = 1;
  while (xp >= 100 * level * level) {
    level++;
  }
  return level;
};

export const syncUserStats = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    
    const userData = userSnap.data();

    // 1. Fetch Aptitude Results
    const resultsQ = query(collection(db, 'results'), where('userId', '==', uid));
    const resultsSnap = await getDocs(resultsQ);
    let testsTaken = 0;
    let perfectScores = 0;
    let highScoreCount = 0;
    let testXp = 0;
    
    resultsSnap.forEach(d => {
      testsTaken++;
      const data = d.data();
      if (data.score === 100) perfectScores++;
      if (data.score >= 90) highScoreCount++;
      
      testXp += calculateTestXp(data);
    });

    // 2. Fetch Coding Submissions
    const subsQ = query(collection(db, 'submissions'), where('userId', '==', uid));
    const subsSnap = await getDocs(subsQ);
    let problemsSolved = 0;
    let hardProblemsSolved = 0;
    let codingXp = 0;

    subsSnap.forEach(d => {
      const data = d.data();
      if (data.status === 'success' || data.status === 'passed' || data.passed) {
        problemsSolved++;
        if (data.difficulty === 'Hard' || data.difficulty === 'hard') {
          hardProblemsSolved++;
        }
      }
      codingXp += calculateCodingXp(data);
    });

    // 3. Fetch Interviews
    const interviewsQ = query(collection(db, 'interviewSessions'), where('userId', '==', uid));
    const interviewsSnap = await getDocs(interviewsQ);
    let interviewsDone = 0;
    let interviewXp = 0;
    
    interviewsSnap.forEach(d => {
      interviewsDone++;
      const data = d.data();
      if (data.overallScore === 100 || data.score === 100) perfectScores++;
      
      interviewXp += calculateInterviewXp(data);
    });

    // 4. Fetch Resumes
    const resumesQ = query(collection(db, 'resumes'), where('userId', '==', uid));
    const resumesSnap = await getDocs(resumesQ);
    const resumesUploaded = resumesSnap.size;

    // 5. Fetch Q&A Sessions
    const qaSessionsQ = query(collection(db, 'qaSessions'), where('userId', '==', uid));
    const qaSessionsSnap = await getDocs(qaSessionsQ);
    let qaSessionsDone = 0;
    let qaXp = 0;
    qaSessionsSnap.forEach(d => {
      qaSessionsDone++;
      qaXp += d.data().xpEarned || 0;
    });

    const statsForBadges = {
      testsTaken,
      problemsSolved,
      interviewsDone,
      currentStreak: userData.streak || 0,
      resumesUploaded,
      qaSessionsDone,
      highScoreCount,
      perfectScores,
      hardProblemsSolved,
      profileComplete: userData.name && userData.college ? 1 : 0,
    };

    // Calculate Earned Badges
    const newlyCalculatedBadges = BADGES_DATA.filter(b => isEarned(b, statsForBadges)).map(b => b.id);
    const existingBadges = userData.badges || [];
    // Merge them so admin-added badges are never lost
    const earnedBadges = Array.from(new Set([...existingBadges, ...newlyCalculatedBadges]));
    
    // Calculate Total Earned XP from activities
    let badgeXp = 0;
    BADGES_DATA.forEach(b => {
      if (earnedBadges.includes(b.id)) {
        badgeXp += b.xpReward || 0;
      }
    });

    const newCalculatedXp = testXp + codingXp + interviewXp + qaXp + badgeXp;
    
    // Calculate XP purely from scratch based on actual work and submissions.
    // This perfectly fixes any corrupted or legacy XP.
    const finalXp = newCalculatedXp;
    const newLevel = calculateLevel(finalXp);

    await updateDoc(userRef, {
      xp: finalXp,
      calculatedXp: newCalculatedXp,
      level: newLevel,
      badges: earnedBadges,
      testsTaken,
      problemsSolved,
      interviewsDone,
      resumesUploaded,
      qaSessionsDone
    });

  } catch (err) {
    console.error("Failed to sync user stats", err);
  }
};
