import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

const googleProvider = new GoogleAuthProvider();

// Sign up with email and password
export async function signUpWithEmail(email, password, userData) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update Firebase Auth display name
  await updateProfile(user, { displayName: userData.name });

  // Create Firestore user document
  const userDoc = {
    uid: user.uid,
    name: userData.name,
    email: user.email,
    college: userData.college || '',
    graduationYear: userData.graduationYear || '',
    profilePicture: '',
    role: 'candidate',
    xp: 0,
    level: 1,
    rank: 'Bronze',
    streak: 0,
    skills: [],
    bio: '',
    totalTests: 0,
    totalInterviews: 0,
    avgScore: 0,
    badges: [],
    isBlocked: false,
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', user.uid), userDoc);

  // Add to leaderboard
  await setDoc(doc(db, 'leaderboard', user.uid), {
    uid: user.uid,
    name: userData.name,
    college: userData.college || '',
    xp: 0,
    level: 1,
    rank: 'Bronze',
    badges: 0,
    profilePicture: '',
    updatedAt: serverTimestamp(),
  });

  // Create welcome notification
  await setDoc(doc(db, 'notifications', `${user.uid}_welcome`), {
    userId: user.uid,
    message: `Welcome to InterviewAce AI, ${userData.name}! 🎉 Start your journey with an Aptitude Test.`,
    type: 'system',
    read: false,
    createdAt: serverTimestamp(),
  });

  return userCredential;
}

// Sign in with email
export async function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Sign in with Google
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Check if user already exists
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // New Google user - create profile
    const userDoc = {
      uid: user.uid,
      name: user.displayName || 'User',
      email: user.email,
      college: '',
      graduationYear: '',
      profilePicture: user.photoURL || '',
      role: 'candidate',
      xp: 0,
      level: 1,
      rank: 'Bronze',
      streak: 0,
      skills: [],
      bio: '',
      totalTests: 0,
      totalInterviews: 0,
      avgScore: 0,
      badges: [],
      isBlocked: false,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    };

    await setDoc(userRef, userDoc);

    await setDoc(doc(db, 'leaderboard', user.uid), {
      uid: user.uid,
      name: user.displayName || 'User',
      college: '',
      xp: 0,
      level: 1,
      rank: 'Bronze',
      badges: 0,
      profilePicture: user.photoURL || '',
      updatedAt: serverTimestamp(),
    });
  } else {
    // Existing user - update last active
    await updateDoc(userRef, { lastActive: serverTimestamp() });
  }

  return result;
}

// Log out
export async function logOut() {
  return signOut(auth);
}

// Reset password
export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

// Update user profile in Firestore
export async function updateUserProfile(uid, data) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { ...data, updatedAt: serverTimestamp() });

  // Update leaderboard if XP/level changed
  if (data.xp !== undefined || data.level !== undefined || data.name !== undefined) {
    const leaderRef = doc(db, 'leaderboard', uid);
    const leaderUpdate = {};
    if (data.xp !== undefined) leaderUpdate.xp = data.xp;
    if (data.level !== undefined) leaderUpdate.level = data.level;
    if (data.rank !== undefined) leaderUpdate.rank = data.rank;
    if (data.name !== undefined) leaderUpdate.name = data.name;
    if (data.profilePicture !== undefined) leaderUpdate.profilePicture = data.profilePicture;
    leaderUpdate.updatedAt = serverTimestamp();
    await updateDoc(leaderRef, leaderUpdate).catch(() => {});
  }
}

// Get user profile from Firestore
export async function getUserProfile(uid) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Award XP to user
export async function awardXP(uid, amount, reason) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const userData = snap.data();
  const newXP = (userData.xp || 0) + amount;
  const newLevel = calculateLevel(newXP);
  const newRank = getRankFromLevel(newLevel);

  await updateDoc(userRef, {
    xp: newXP,
    level: newLevel,
    rank: newRank,
    lastActive: serverTimestamp(),
  });

  // Update leaderboard
  await updateDoc(doc(db, 'leaderboard', uid), {
    xp: newXP,
    level: newLevel,
    rank: newRank,
    updatedAt: serverTimestamp(),
  }).catch(() => {});

  return { newXP, newLevel, newRank, gained: amount };
}

// Helper functions
function calculateLevel(xp) {
  let level = 1;
  while (level < 100 && xp >= 100 * level * level) {
    level++;
  }
  return level;
}

function getRankFromLevel(level) {
  if (level <= 20) return 'Bronze';
  if (level <= 40) return 'Silver';
  if (level <= 60) return 'Gold';
  if (level <= 80) return 'Platinum';
  return 'Diamond';
}
