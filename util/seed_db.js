const Brand = require('../models/Brand');
const User = require('../models/User');
const faker = require('@faker-js/faker').fakerEN_US;
const FactoryBot = require('factory-bot');
require('dotenv').config();

const testUserPassword = faker.internet.password();
const factory = FactoryBot.factory;
const factoryAdapter = new FactoryBot.MongooseAdapter();
factory.setAdapter(factoryAdapter);

const categories = ['Clothing', 'Shoes', 'Accessories', 'Tableware', 'Other'];

factory.define('brand', Brand, {
  name: () => faker.company.name(),
  category: () => categories[Math.floor(Math.random() * categories.length)],
  description: () => faker.lorem.sentence(),
  website: () => faker.internet.url(),
  isSustainable: () => faker.datatype.boolean(),
});

factory.define('user', User, {
  name: () => faker.person.fullName().slice(0, 20),
  email: () => faker.internet.email(),
  password: () => faker.internet.password(),
});

const seed_db = async () => {
  let testUser = null;
  try {
    const mongoURL = process.env.MONGO_URI_TEST;
    await Brand.deleteMany({});
    await User.deleteMany({});
    testUser = await factory.create('user', { password: testUserPassword });
    await factory.createMany('brand', 20, { createdBy: testUser._id });
  } catch (e) {
    console.log('database error:', e.message);
    throw e;
  }
  return testUser;
};

module.exports = { testUserPassword, factory, seed_db };
