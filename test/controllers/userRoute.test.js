import '../../env';
import request from 'supertest';
import { expect } from 'chai';
import app from '../../server/app';

describe('User APIs', () => {

	const signupCrendential = {
		username: 'User1',
		email: 'test@test.com',
		password: 'Test1',
	};

	const newProfile = {
		email: 'newTest@test.com',
		gender: 'male',
		name: 'Test Name',
		age: 20,
	};

	const newPassword = {
		password: 'Test1',
		newPassword: 'Test2',
	};

	describe('#GET to /api/user/profile', () => {
		const agent = request.agent(app);
		it('should return unauthorized', (done) => {
			agent.get('/api/user/profile')
				.expect(401)
				.end((err, res) => {
					if (err) return done(err);
					expect(res.body.title).to.equal('Not Authenticated');
					expect(res.body.error.message).to.equal('jwt must be provided');
					done();
				});
		});

		it('should return user profile', (done) => {
			agent.post('/auth/signup')
				.send(signupCrendential)
				.end((err) => {
					expect(err).to.be.a('null');

					agent.get('/api/user/profile')
						.expect(200)
						.end((err, res) => {
							if (err) return done(err);
							expect(res.body.user).to.eql({
								email: 'test@test.com',
								name: 'User1',
							});
							done();
						});
				});
		});
	});

	describe('#GET to /api/user/account', () => {
		const agent = request.agent(app);
		it('should return unauthorized', (done) => {
			agent.get('/api/user/account')
				.expect(401)
				.end((err, res) => {
					if (err) return done(err);
					expect(res.body.title).to.equal('Not Authenticated');
					expect(res.body.error.message).to.equal('jwt must be provided');
					done();
				});
		});

		it('should return if user has password', (done) => {
			agent.post('/auth/signup')
				.send(signupCrendential)
				.end((err) => {
					expect(err).to.be.a('null');

					agent.get('/api/user/account')
						.expect(200)
						.end((err, res) => {
							if (err) return done(err);
							expect(res.body.user.containPassword).to.equal(true);
							done();
						});
				});
		});
	});

	describe('#POST /api/user/profile', () => {
		const agent = request.agent(app);
		it('should return unauthorized', (done) => {
			agent.post('/api/user/profile')
				.expect(401)
				.end((err, res) => {
					if (err) return done(err);
					expect(res.body.title).to.equal('Not Authenticated');
					expect(res.body.error.message).to.equal('jwt must be provided');
					done();
				});
		});

		it('should update profile', (done) => {
			agent.post('/auth/signup')
				.send(signupCrendential)
				.end((err) => {
					expect(err).to.be.a('null');

					agent.post('/api/user/profile')
						.send(newProfile)
						.expect(200)
						.end((err, res) => {
							if (err) return done(err);
							expect(res.body.message).to.equal('Successfully updated !');
							done();
						});
				});
		});
	});

	describe('#POST /api/user/account', () => {
		const agent = request.agent(app);
		it('should return unauthorized', (done) => {
			agent.post('/api/user/account')
				.expect(401)
				.end((err, res) => {
					if (err) return done(err);
					expect(res.body.title).to.equal('Not Authenticated');
					expect(res.body.error.message).to.equal('jwt must be provided');
					done();
				});
		});

		it('should update password', (done) => {
			agent.post('/auth/signup')
				.send(signupCrendential)
				.end((err) => {
					expect(err).to.be.a('null');

					agent.post('/api/user/account')
						.send(newPassword)
						.expect(200)
						.end((err, res) => {
							if (err) return done(err);
							expect(res.body.message).to.equal('Successfully updated !');
							done();
						});
				});
		});
	});
});