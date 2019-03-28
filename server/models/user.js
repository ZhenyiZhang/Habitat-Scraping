import mongoose from 'mongoose';
import bcrypt from 'bcrypt-node';

const Schema = mongoose.Schema;

var userSchema = new Schema({
	email: String,
	password: String,
	profile: {
		name: String,
		age: String,
		gender: String,
	},
});

userSchema.pre('save', function(next) {
	const user = this;
	if (!user.isModified('password') || typeof user.password === 'undefined') {
		return next();
	}
	bcrypt.genSalt(10, function(err, salt) {
		if (err) {
			return next(err);
		}
		bcrypt.hash(user.password, salt, null, function(err, hash) {
			if (err) {
				return next(err);
			}
			user.password = hash;
			next();
		});
	});
});

userSchema.methods.comparePassword = function(candidatePassword, callback) {
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
		if (err) {
			return callback(err);
		}
		callback(null, isMatch);
	});
};

export default mongoose.model('User', userSchema);
