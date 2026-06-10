const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const rideModel = require('./models/ride.model');

async function run() {
    await mongoose.connect(process.env.DB_CONNECT);
    console.log("Connected to DB");
    const result = await rideModel.deleteMany({});
    console.log(`Deleted ${result.deletedCount} rides.`);
    mongoose.connection.close();
}
run().catch(console.error);
