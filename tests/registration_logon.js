const { app } = require('../app');
const { factory } = require('../util/seed_db');
const faker = require('@faker-js/faker').fakerEN_US;
const { expect } = require('chai');
const request = require('supertest');
const User = require('../models/User');

describe('tests for registration and logon', function () {
  let csrfToken;
  let csrfCookie;
  let sessionCookie;
  let user;
  let password;

  it('should get the registration page', async () => {
    const res = await request(app).get('/sessions/register').send();
    expect(res).to.have.status(200);
    expect(res).to.have.property('text');
    expect(res.text).to.include('Enter your name');

    const textNoLineEnd = res.text.replaceAll('\n', '');
    const csrfTokenMatch = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd);
    expect(csrfTokenMatch).to.not.be.null;
    csrfToken = csrfTokenMatch[1];

    expect(res.headers).to.have.property('set-cookie');
    const cookies = res.headers['set-cookie'];
    csrfCookie = cookies.find((cookie) => cookie.startsWith('csrfToken'));
    expect(csrfCookie).to.not.be.undefined;
  });

  it('should register the user', async () => {
    password = faker.internet.password();
    user = await factory.build('user', { password });

    const dataToPost = {
      name: user.name,
      email: user.email,
      password: password,
      password1: password,
      _csrf: csrfToken,
    };

    const res = await request(app)
      .post('/sessions/register')
      .set('Cookie', csrfCookie)
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(dataToPost);

    expect(res).to.have.status(200);
    expect(res.text).to.include('Sustainable Brands');

    const newUser = await User.findOne({ email: user.email });
    expect(newUser).to.not.be.null;
  });

  it('should log the user on', async () => {
    const dataToPost = {
      email: user.email,
      password: password,
      _csrf: csrfToken,
    };

    const res = await request(app)
      .post('/sessions/login')
      .set('Cookie', csrfCookie)
      .set('content-type', 'application/x-www-form-urlencoded')
      .redirects(0)
      .send(dataToPost);

    expect(res).to.have.status(302);
    expect(res.headers.location).to.equal('/');

    const cookies = res.headers['set-cookie'];
    sessionCookie = cookies.find((cookie) => cookie.startsWith('connect.sid'));
    expect(sessionCookie).to.not.be.undefined;
  });

  it('should get the index page', async () => {
    const res = await request(app)
      .get('/')
      .set('Cookie', csrfCookie)
      .set('Cookie', sessionCookie)
      .send();

    expect(res).to.have.status(200);
    expect(res.text).to.include(user.name);
  });
});
