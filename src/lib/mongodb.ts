import mongoose from 'mongoose';

console.log('=== MONGODB DEBUG ===');
console.log('All env vars with MONGO:', Object.keys(process.env).filter(k => k.includes('MONGO')));
console.log('MONGO_URI value:', process.env.MONGO_URI);
console.log('NODE_ENV:', process.env.NODE_ENV);

const MONGODB_URI = process.env.MONGO_URI!;

if (!MONGODB_URI) {
  console.error('MONGO_URI is not defined!');
  console.log('Available env vars:', Object.keys(process.env).sort());
  throw new Error('Please define the MONGO_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: MongooseCache | undefined = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('Connecting to MongoDB URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('Connected to MongoDB database:', mongoose.connection.db?.databaseName || 'No database name');
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default connectDB;

declare global {
  var mongoose: MongooseCache | undefined;
}