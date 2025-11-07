const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI not set');
  }

  await mongoose.connect(uri, {
    autoIndex: process.env.NODE_ENV !== 'production',
  });

  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.log('Connected to MongoDB');
  }
};

module.exports = connectDB;
