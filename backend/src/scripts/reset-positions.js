/**
 * Reset all user positions to 0,0,0
 * Run this script once to update all existing users
 * 
 * Usage: node src/scripts/reset-positions.js
 */

import { supabase } from '../config/supabase.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from monorepo root
dotenv.config({ path: join(__dirname, '../../../../.env') });

async function resetAllPositions() {
  try {
    console.log('Resetting all user positions to (0, 0, 0)...');

    // First, get count of users
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting users:', countError);
      process.exit(1);
    }

    console.log(`Found ${count} users to update.`);

    // Update all users to have position { x: 0, y: 0, z: 0 }
    const { error } = await supabase
      .from('users')
      .update({ position: { x: 0, y: 0, z: 0 } });

    if (error) {
      console.error('Error resetting positions:', error);
      process.exit(1);
    }

    console.log(`Successfully reset positions for all ${count} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

resetAllPositions();

