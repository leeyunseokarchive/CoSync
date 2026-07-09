import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

const app = initializeApp({ projectId: 'cosync-d7dd7' });
const db = getFirestore(app);
const auth = getAuth(app);

async function seed() {
  console.log("Seeding Database...");

  const testUser = {
    uid: "test-user-1",
    email: "test@example.com",
    password: "password123",
    displayName: "Test User 1"
  };

  try {
    await auth.getUser(testUser.uid);
    console.log("User already exists");
  } catch {
    await auth.createUser({
      uid: testUser.uid,
      email: testUser.email,
      password: testUser.password,
      displayName: testUser.displayName
    });
    console.log("Created test user");
  }

  await db.collection("users").doc(testUser.uid).set({
    name: testUser.displayName,
    email: testUser.email,
    plan: "premium",
    subscriptionStatus: "active",
    teamIds: []
  });

  console.log("Seeding complete");
}

seed().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
