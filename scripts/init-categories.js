const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const categories = [
    { name: "Cast iron Cookware", slug: "cast-iron-cookware", order: 0 },
    { name: "Home Essentials", slug: "home-essentials", order: 1 },
    { name: "Kitchen Essentials", slug: "kitchen-essentials", order: 2 },
    { name: "Tri Ply Cookware", slug: "tri-ply-cookware", order: 3 }
];

async function initializeCategories() {
  try {
    const categoriesRef = db.collection('categories');
    const existing = await categoriesRef.get();
    
    if (existing.empty) {
      console.log('Initializing categories...');
      for (const cat of categories) {
        await categoriesRef.add({
          ...cat,
          description: "Premium " + cat.name + " for your kitchen.",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Added: ${cat.name}`);
      }
      console.log('Categories initialized!');
    } else {
      console.log('Categories already exist. Skipping initialization.');
    }
  } catch (error) {
    console.error('Error during initialization:', error);
  } finally {
    process.exit();
  }
}

initializeCategories();
