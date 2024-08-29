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

  // test create recipes
  describe('POST/recipes', () => {
    it('should save new recipe to db', async () => {
      // DATA you want to save to db
      const recipes = {
        name: 'chicken nugget',
        difficulty: 2,
        vegetarian: false,
      };

      const res = await request(app)
        .post('/recipes')
        .send(recipes)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(201);

      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        }),
      );

      id = res.body.data._id;
    });

    it('should not save new recipe to db, invalid vegetarian value', async () => {
      // DATA you want to save to db
      const recipes = {
        name: 'chicken nugget',
        difficulty: 3,
        vegetarian: 'true',
      };

      const res = await request(app)
        .post('/recipes')
        .send(recipes)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(400);

      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'vegetarian field should be boolean',
        }),
      );
    });

    it('should not save new recipe to db, empty name field', async () => {
      // DATA you want to save to db
      const recipes = {
        difficulty: 2,
        vegetarian: true,
      };

      const res = await request(app)
        .post('/recipes')
        .send(recipes)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(400);

      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'name field can not be empty',
        }),
      );
    });

    it('should not save new recipe to db, invalid difficulty field', async () => {
      // DATA you want to save to db
      const recipes = {
        name: 'jollof rice',
        difficulty: '2',
        vegetarian: true,
      };

      const res = await request(app)
        .post('/recipes')
        .send(recipes)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(400);

      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'difficulty field should be a number',
        }),
      );
    });

    it('should not save new recipe to db, invalid token', async () => {
      // DATA you want to save to db
      const recipes = {
        name: 'jollof rice',
        difficulty: '2',
        vegetarian: true,
      };

      const res = await request(app)
        .post('/recipes')
        .send(recipes)
        .set('Authorization', 'Bearer sdfsfsdgsdf');

      expect(res.statusCode).toEqual(403);

      expect(res.body).toEqual(
        expect.objectContaining({
          message: 'Unauthorized',
        }),
      );
    });
  });

  // test get all recipe
  describe('GET /recipes', () => {
    it('should retrieve all the recipes in the db', async () => {
      const res = await request(app).get('/recipes');

      expect(res.statusCode).toEqual(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        }),
      );
    });
  });

  // test get a particular recipe
  describe('GET/recipes/:id', () => {
    it('should retrieve a specific in the db', async () => {
      const res = await request(app).get(`/recipes/${id}`);

      expect(res.statusCode).toEqual(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        }),
      );
    });

    it('should not retrieve any recipe from the db when invalid id is passed', async () => {
      const res = await request(app).get('/recipes/sg54j36h54j63vrgfdfg');

      expect(res.statusCode).toEqual(400);

      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Recipe with id sg54j36h54j63vrgfdfg does not exist',
        }),
      );
    });
  });

  // Test update recipe
  describe('PATCH/recipes/:id', () => {
    it('should update a specific record in db', async () => {
      const recipes = {
        name: 'chicken nugget',
      };

      const res = await request(app)
        .patch(`/recipes/${id}`)
        .send(recipes)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        }),
      );
    });

    it('should not update recipe when invalid difficulty', async () => {
      const recipes = {
        name: 'jollof rice',
        difficulty: '2',
      };

      const res = await request(app)
        .patch(`/recipes/${id}`)
        .send(recipes)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(400);

      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'difficulty field should be a number',
        }),
      );
    });

    it('should not update recipe when invalid vegetarian', async () => {
      const recipes = {
        name: 'jollof rice',
        difficulty: 2,
        vegetarian: 'true',
      };

      const res = await request(app)
        .patch(`/recipes/${id}`)
        .send(recipes)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(400);

      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'vegetarian field should be boolean',
        }),
      );
    });

    it('should not update recipe when invalid recipe id', async () => {
      const recipes = {
        difficulty: 3,
      };

      const res = await request(app)
        .patch('/recipes/34jkhgfh4j5h45hbfdgdf87d8fg')
        .send(recipes)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(400);

      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Recipe with id 34jkhgfh4j5h45hbfdgdf87d8fg does not exist',
        }),
      );
    });

    it('should not update recipe when invalid token', async () => {
      const recipes = {
        name: 'chicken nugget',
      };

      const res = await request(app)
        .patch(`/recipes/${id}`)
        .send(recipes)
        .set('Authorization', 'Bearer kjdfhsiuh4h324b2j34b3b42bh4j32b4jh32b4');

      expect(res.statusCode).toEqual(403);

      expect(res.body).toEqual(
        expect.objectContaining({
          message: 'Unauthorized',
        }),
      );
    });

    it('should not update recipe when no update passed', async () => {
      const recipes = {};

      const res = await request(app)
        .patch(`/recipes/${id}`)
        .send(recipes)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(400);

      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'field should not be empty',
        }),
      );
    });
  });
});
