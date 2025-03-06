const { app } = require('../app');
const { expect } = require('chai');
const { seed_db, testUserPassword } = require('../util/seed_db');
const Brand = require('../models/Brand');
const get_chai = require('../util/get_chai');

describe('Testing Brand CRUD operations', function () {
  before(async function () {
    const { expect, request } = await get_chai();
    this.test_user = await seed_db();
    let req = request(app).get('/sessions/login').send();
    let res = await req;

    console.log('Response Text:', res.text);

    const textNoLineEnd = res.text.replaceAll('\n', '');

    const csrfMatch = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd);
    if (csrfMatch) {
      this.csrfToken = csrfMatch[1];
    } else {
      throw new Error('CSRF token not found in the response.');
    }

    let cookies = res.headers['set-cookie'];
    this.csrfCookie = cookies.find((element) =>
      element.startsWith('csrfToken')
    );
    const dataToPost = {
      email: this.test_user.email,
      password: testUserPassword,
      _csrf: this.csrfToken,
    };
    req = request(app)
      .post('/sessions/login')
      .set('Cookie', this.csrfCookie)
      .set('content-type', 'application/x-www-form-urlencoded')
      .redirects(0)
      .send(dataToPost);
    res = await req;
    cookies = res.headers['set-cookie'];
    this.sessionCookie = cookies.find((element) =>
      element.startsWith('connect.sid')
    );
    expect(this.csrfToken).to.not.be.undefined;
    expect(this.sessionCookie).to.not.be.undefined;
    expect(this.csrfCookie).to.not.be.undefined;
  });

  it('should fetch the list of brands', async function () {
    const { request } = await get_chai();
    const res = await request(app)
      .get('/brands')
      .set('Cookie', this.sessionCookie)
      .set('Cookie', this.csrfCookie)
      .send();

    const $ = cheerio.load(res.text);
    const rows = $('tr');
    expect(rows.length).to.equal(21);
  });

  it('should add a new brand', async function () {
    const { request } = await get_chai();
    const newBrand = { name: 'New Brand', description: 'A new test brand' };
    const res = await request(app)
      .post('/brands/add')
      .set('Cookie', this.sessionCookie)
      .set('Cookie', this.csrfCookie)
      .send({ ...newBrand, _csrf: this.csrfToken });

    const addedBrand = await Brand.findOne({
      name: 'New Brand',
      createdBy: this.test_user._id,
    });
    expect(addedBrand).to.not.be.null;
    expect(addedBrand.name).to.equal('New Brand');
    expect(addedBrand.description).to.equal('A new test brand');

    const brands = await Brand.find({ createdBy: this.test_user._id });
    expect(brands.length).to.equal(21);
  });
});
