import mongoose from 'mongoose';

mongoose.Promise = global.Promise;

before((done) => {
	mongoose.connect('mongodb://localhost:27017/authentication_TEST');
	mongoose.connection
		.once('open', () => {
			done();
		})
		.on('error', (error) => {
			console.warn('Warning', error);
		});
});

beforeEach((done) => {
	const { users } = mongoose.connection.collections;
	users.drop()
		.then(() => done())
		.catch(() => done());
});