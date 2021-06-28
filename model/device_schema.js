const mongoose = require('mongoose');

const deviceSchema = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    device: String,
    os: String,
    manufacturer: String,
    lastCheckedOutDate: Date,
    lastCheckedOutBy: String,
    isCheckedOut: Boolean
})


module.exports = mongoose.model('devices', deviceSchema)