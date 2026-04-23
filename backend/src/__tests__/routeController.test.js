const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const routeController = require('../../src/controllers/routeController');

// In‑memory MongoDB for isolated tests
const { MongoMemoryServer } = require('mongodb-memory-server');
let mongod, app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  // Minimal app with routes
  app = express();
  app.use(express.json());
  app.get('/routes', routeController.getRoutes);
  app.post('/routes', routeController.createRoute);
  app.put('/routes/:id', routeController.updateRoute);
  app.delete('/routes/:id', routeController.deleteRoute);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Route Controller', () => {
  let createdId;

  test('should create a route', async () => {
    const res = await request(app)
      .post('/routes')
      .send({ name: 'Test Route', code: 'TR01', stops: [] })
      .expect(201);
    expect(res.body).toHaveProperty('_id');
    createdId = res.body._id;
  });

  test('should list routes', async () => {
    const res = await request(app).get('/routes').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(r => r._id === createdId)).toBe(true);
  });

  test('should update a route', async () => {
    const res = await request(app)
      .put(`/routes/${createdId}`)
      .send({ name: 'Updated Route' })
      .expect(200);
    expect(res.body.name).toBe('Updated Route');
  });

  test('should delete a route', async () => {
    await request(app).delete(`/routes/${createdId}`).expect(200);
    const list = await request(app).get('/routes').expect(200);
    expect(list.body.some(r => r._id === createdId)).toBe(false);
  });
});
