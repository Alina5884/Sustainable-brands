const { expect } = require('chai');
const puppeteer = require('puppeteer');
require('../app');
const { seed_db, testUserPassword } = require('../util/seed_db');
const Brand = require('../models/Brand');

let testUser = null;
let page = null;
let browser = null;

describe('Sustainable Brands Puppeteer Test', function () {
  before(async function () {
    this.timeout(30000);
    browser = await puppeteer.launch({ headless: false, slowMo: 100 });
    page = await browser.newPage();
    await page.goto('http://localhost:3000');
  });

  after(async function () {
    this.timeout(5000);
    await browser.close();
  });

  describe('index page test', function () {
    this.timeout(10000);

    it('finds the index page login link', async () => {
      const logonLink = await page.waitForSelector("a[href='/sessions/login']");
      expect(logonLink).to.not.be.null;
    });

    it('gets to the login page', async () => {
      const logonLink = await page.$('a[href="/sessions/login"]');
      await logonLink.click();
      await page.waitForNavigation();
      const emailInput = await page.waitForSelector('input[name="email"]');
      expect(emailInput).to.not.be.null;
    });
  });

  describe('logon page test', function () {
    this.timeout(20000);

    it('resolves all the fields', async () => {
      const emailInput = await page.waitForSelector('input[name="email"]');
      const passwordInput = await page.waitForSelector(
        'input[name="password"]'
      );
      const submitButton = await page.waitForSelector("button[type='submit']");

      expect(emailInput).to.not.be.null;
      expect(passwordInput).to.not.be.null;
      expect(submitButton).to.not.be.null;
    });

    it('sends the login', async () => {
      testUser = await seed_db();
      await page.type('input[name="email"]', testUser.email);
      await page.type('input[name="password"]', testUserPassword);
      const submitButton = await page.waitForSelector("button[type='submit']");
      await submitButton.click();
      await page.waitForNavigation();

      const loggedInText = await page.waitForSelector(
        `p:contains("${testUser.name} is logged on.")`
      );
      expect(loggedInText).to.not.be.null;

      const viewAllBrandsButton =
        await page.waitForSelector('a[href="/brands"]');
      const viewMyBrandsButton = await page.waitForSelector(
        'a[href="/myBrands"]'
      );
      expect(viewAllBrandsButton).to.not.be.null;
      expect(viewMyBrandsButton).to.not.be.null;

      await viewAllBrandsButton.click();
      await page.waitForNavigation();
    });
  });

  describe('puppeteer brand operations', function () {
    this.timeout(30000);

    it('should navigate to the brands list and check the number of entries', async () => {
      const content = await page.content();
      const brandsList = content.split('<tr>').length - 1;
      expect(brandsList).to.equal(20);
    });

    it('should open the "Add A Brand" form', async () => {
      const addBrandButton = await page.waitForSelector(
        "a[href='/brands/new']"
      );
      await addBrandButton.click();
      await page.waitForNavigation();

      const nameField = await page.waitForSelector('input[name="name"]');
      const descriptionField = await page.waitForSelector(
        'textarea[name="description"]'
      );
      const submitButton = await page.waitForSelector("button[type='submit']");

      expect(nameField).to.not.be.null;
      expect(descriptionField).to.not.be.null;
      expect(submitButton).to.not.be.null;
    });

    it('should add a new brand and verify the result', async () => {
      const name = 'Test Brand';
      const description = 'Test description for the new brand';
      await page.type('input[name="name"]', name);
      await page.type('textarea[name="description"]', description);
      const submitButton = await page.waitForSelector("button[type='submit']");
      await submitButton.click();
      await page.waitForNavigation();

      const successMessage = await page.waitForSelector(
        'p:contains("Brand added successfully")'
      );
      expect(successMessage).to.not.be.null;

      const brand = await Brand.findOne({ name });
      expect(brand).to.not.be.null;
      expect(brand.name).to.equal(name);
      expect(brand.description).to.equal(description);
    });
  });
});
