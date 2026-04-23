const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const authController = require('../controllers/authController');

let app, server, mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const User = require('../models/User');
  // create a test user
  await User.create({ email: 'test@example.com', password: 'Password123', role: 'user' });

  app = express();
  app.use(express.json());
  app.post('/login', authController.login);
  app.post('/register', authController.register);
  server = app.listen();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  server.close();
});

describe('Auth Controller', () => {
  test('should login with correct credentials', async () => {
    const res = await request(app).post('/login').send({ email: 'test@example.com', password: 'Password123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('should reject login with wrong password', async () => {
    const res = await request(app).post('/login').send({ email: 'test@example.com', password: 'WrongPass' });
    expect(res.status).toBe(401);
  });

  test('should register a new user', async () => {
    const res = await request(app).post('/register').send({ email: 'new@example.com', password: 'NewPass123', role: 'user' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
  });
});
