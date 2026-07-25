const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

/* token schema to hold the refresh tokens for the users */
const tokenSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

tokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

/* User schema that holds the information for the user's login and associated linked researcher. */
const userSchema = new mongoose.Schema({
    name: { type: String, required: true, maxLength: 255 },
    email: { type: String, required: true, unique: true },
    researcherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Researcher', required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
});

userSchema.plugin(mongoosePaginate);

module.exports = {
    Token: mongoose.model('Token', tokenSchema),
    User: mongoose.model('User', userSchema)
};