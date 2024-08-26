const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../index');
const User = require('../database/models/users');
const mongoose = require('../database/dbConection');

let id;
let token;

describe('Test the recipes API', () => {
  beforeAll(async () => {
    // create a test user
    const password = bcrypt.hashSync('okay', 10);
    await User.create({
      username: 'admin',
      password,
    });
  });

  afterAll(async () => {
    await User.deleteMany();
    await mongoose.disconnect();
  });

  // test login
  describe('POST/login', () => {
    it('should authenticate the user and sign him in', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const user = {
        username: 'admin',
        password: 'okay',
      };

      const res = await request(app).post('/login').send(user);

      token = res.body.accessToken;

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          accessToken: token,
          success: true,
          data: expect.objectContaining({
            id: res.body.data.id,
            username: res.body.data.username,
          }),
        }),
      );
    });

    it('should not login if password field is empty', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const user = {
        username: 'admin',
      };

      const res = await request(app).post('/login').send(user);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'username or password can not be empty',
        }),
      );
    });

    it('should not login if username is empty', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const user = {
        password: 'okay',
      };

      const res = await request(app).post('/login').send(user);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'username or password can not be empty',
        }),
      );
    });

    it('should not login if username does not exists', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const user = {
        username: 'chii',
        password: 'okay',
      };

      const res = await request(app).post('/login').send(user);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Incorrect username or password',
        }),
      );
    });

    it('should not login if password is incorrect', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const user = {
        username: 'admin',
        password: 'okay1',
      };

      const res = await request(app).post('/login').send(user);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Incorrect username or password',
        }),
      );
    });
  });
});
