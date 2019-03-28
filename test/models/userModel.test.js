import { expect } from 'chai';

import User from '../../server/models/user';

describe('Users', () => {

	describe('#save', () => {
		const validUser = new User({
			email: 'test@test.com',
			password: 'Test1',
			google: {
				id: String,
				name: String,
			},
			profile: {
				name: 'John Snow',
				age: 20,
				gender: 'male',
			},
		});

		it('should save a user', (done) => {
			validUser.save()
				.then(() => {
					expect(validUser.isNew).to.be.false;
					done();
				})
				.catch((err) => {
					return done(err);
				});
		});
	});

	describe('#update', () => {
		const user = new User({
			email: 'test@test.com',
			password: 'Test1',
		});

		it('should update user', (done) => {
			user.save()
				.then(() => User.update({ email: 'test@test.com' }, { email: 'test2@test.com' }))
				.then(() => User.find({}))
				.then((users) => {
					expect(users).to.have.length(1);
					expect(users[0].email).to.equal('test2@test.com');
					done();
				})
				.catch((err) => {
					return done(err);
				});
		});
	});
});