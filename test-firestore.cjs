const admin = require('firebase-admin');
admin.initializeApp({
  projectId: process.env.VITE_FIREBASE_PROJECT_ID
});
const db = admin.firestore();
async function run() {
  const snapshot = await db.collection('artifacts').doc('e2d7b2e1-3b36-493f-92cd-2c46df07b2dc').collection('public').doc('data').collection('regulasi').get();
  console.log('Docs count:', snapshot.size);
  snapshot.forEach(doc => console.log(doc.id, doc.data().nomor));
}
run();
