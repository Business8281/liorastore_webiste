const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const email = 'admin@liorastore.in';
const newPassword = 'Admin@123.';

async function resetPassword() {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, {
      password: newPassword
    });
    console.log(`Successfully reset password for ${email} to ${newPassword}`);
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    process.exit();
  }
}

resetPassword();
