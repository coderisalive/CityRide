const mongoose = require('mongoose');
const dns = require('dns');

// Set public DNS servers directly for Node.js process to resolve MongoDB Atlas SRV records reliably
dns.setServers(['8.8.8.8', '8.8.4.4','0.0.0.0']);
dns.setDefaultResultOrder('ipv4first');

function connectToDb() {
    mongoose.connect(process.env.DB_CONNECT
    ).then(() => {
        console.log('Connected to DB');
    }).catch(err => console.log(err));
}


module.exports = connectToDb;