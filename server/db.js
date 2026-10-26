import mongoose from 'mongoose';
export async function connectDb() {
 const uri = process.env.MONGODB_URI;
 if (!uri) { console.error('[DB] MONGODB_URI is missing'); throw new Error('MONGODB_URI is required'); }
 try { await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 }); console.log('[DB] connected to MongoDB Atlas'); }
 catch (error) { console.error(`[DB] could not connect: ${error.message}`); throw error; }
}
