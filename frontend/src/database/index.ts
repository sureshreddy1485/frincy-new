import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

// Open the SQLite database synchronously (Expo SDK 50+)
const expoDb = openDatabaseSync('frincy_v2.db');

// Initialize Drizzle ORM
export const database = drizzle(expoDb, { schema });

// In the future, drizzle-kit migrations can be run here or via a dedicated hook
// using useMigrations from drizzle-orm/expo-sqlite/migrator.
