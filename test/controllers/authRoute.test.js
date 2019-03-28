import '../../env';
import request from 'supertest';
import { expect } from 'chai';

require('dotenv').config();
const app = require('../../server/app').default;

describe('Authentication APIs', () => {
	const validSigninCrendential = {
		email: 'test@test.com',
		password: 'Test1',
	};

	const invalidSigninEmail = {
		email: 'wrongEmail@wrongEmail.com',
		password: 'Test1',
	};

	const invalidSigninPassword = {
		email: 'test@test.com',
		password: 'wrongPassword1',
	};

	const validSignupCrendential = {
		username: 'User1',
		email: 'test@test.com',
		password: 'Test1',
	};

	const invalidSignupCrendential = {
		username: 'User1',
		email: '',
		password: 'Test1',
	};

	const parseCookie = (cookie) => {
		let list = [];
		for (let i = 0; i < cookie.length; i++) {
			list.push(cookie[i].split('=')[0]);
		}
		return list;
	};

	describe('#POST to /auth/signup', () => {
		it('should create a user', (done) => {
			request(app).post('/auth/signup')
				.send(validSignupCrendential)
				.expect(200)
				.end((err, res) => {
					if (err) return done(err);
					expect(res.body.userName).to.equal('User1');
					done();
				});
		});

		it('should return an error message "required field missing." ', (done) => {
			request(app).post('/auth/signup')
				.send(invalidSignupCrendential)
				.expect(422)
				.end((err, res) => {
					if (err) return done(err);
					expect(res.body.error).to.equal('Required field missing.');
					done();
				});
		});
	});

	describe('#POST to /auth/signin', () => {
		// Create a user before each test
		beforeEach((done) => {
			request(app).post('/auth/signup')
				.send(validSignupCrendential)
				.end((err) => {
					if (err) return done(err);
					done();
				});
		});

		it('should return an error message "The email address does not exits." ', (done) => {
			request(app).post('/auth/signin')
				.send(invalidSigninEmail)
				.expect(401)
				.end((err, res) => {
					if (err) return done(err);
					expect(res.body.message).to.equal('The email address does not exits.');
					done();
				});
		});

		it('should return an error message "Incorrect password."', (done) => {
			request(app).post('/auth/signin')
				.send(invalidSigninPassword)
				.expect(401)
				.end((err, res) => {
					if (err) return done(err);
					expect(res.body.message).to.equal('Incorrect password.');
					done();
				});
		});

		it('should signin', (done) => {
			request(app).post('/auth/signin')
				.send(validSigninCrendential)
				.expect(200)
				.end((err, res) => {
					if (err) return done(err);
					const cookieNames = parseCookie(res.headers['set-cookie']);
					expect(cookieNames).to.include.members(['token', 'user_id', 'user_name']);
					done();
				});
		});
	});
});