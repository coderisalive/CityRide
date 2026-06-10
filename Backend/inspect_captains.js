const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const captainModel = require('./models/captain.model');

async function run() {
    await mongoose.connect(process.env.DB_CONNECT);
    console.log("Connected to DB");
    const captains = await captainModel.find({});
    console.log("CAPTAINS IN DB:");
    for (const c of captains) {
        console.log({
            _id: c._id,
            fullname: c.fullname,
            email: c.email,
            status: c.status,
            socketId: c.socketId,
            location: c.location
        });
    }
    mongoose.connection.close();
}
run().catch(console.error);
