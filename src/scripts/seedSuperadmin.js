import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { logger } from '../config/logger.js';

export const seedSuperadmin = async () => {
  try {
    await connectDatabase(env.MONGODB_URI);

    const email = (env.SUPERADMIN_EMAIL || 'superadmin@kairo-horology.com').toLowerCase().trim();
    const password = env.SUPERADMIN_PASSWORD || 'KairoSuperSecret2026!';

    let superadmin = await User.findOne({ email });

    if (superadmin) {
      superadmin.role = 'superadmin';
      superadmin.status = 'active';
      superadmin.isEmailVerified = true;
      superadmin.password = password; // pre-validate hook will bcrypt hash
      await superadmin.save();
      logger.info(`✅ Existing Superadmin updated: ${email}`);
    } else {
      superadmin = new User({
        firstName: 'Atelier',
        lastName: 'Superadmin',
        email,
        password, // pre-validate hook will bcrypt hash
        role: 'superadmin',
        status: 'active',
        isEmailVerified: true
      });
      await superadmin.save();
      logger.info(`✨ New Superadmin seeded successfully: ${email}`);
    }

    return superadmin;
  } catch (error) {
    logger.error(`❌ Superadmin seeding failed: ${error.message}`);
    throw error;
  } finally {
    await disconnectDatabase();
  }
};

// Execute if run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('seedSuperadmin.js')) {
  seedSuperadmin()
    .then(() => {
      console.log('Superadmin seed completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export default seedSuperadmin;
