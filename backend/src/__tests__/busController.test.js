const request = require('supertest');
const http = require('http');
const socketIo = require('socket.io');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const User = require('../models/User');
const Location = require('../models/Location');
const { attachSocketHandlers } = require('../services/socketService');

jest.mock('../models/Bus');
jest.mock('../models/Route');
jest.mock('../models/User');
jest.mock('../models/Location');

const mockIo = {
  to: jest.fn(() => mockIo),
  emit: jest.fn(),
  on: jest.fn(),
};

describe('Bus Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getBuses returns list of buses', async () => {
    const fakeBuses = [{ _id: '1', number: 'A1' }];
    Bus.find.mockReturnValue({ populate: jest.fn().mockReturnThis(), exec: Promise.resolve(fakeBuses) });
    const req = { }; const res = { json: jest.fn() }; const next = jest.fn();
    const { getBuses } = require('../controllers/busController');
    await getBuses(req, res, next);
    expect(res.json).toHaveBeenCalledWith(fakeBuses);
  });

  test('createBus validates route existence', async () => {
    Route.findById.mockResolvedValue(null);
    const req = { body: { route: 'invalid' } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    const next = jest.fn();
    const { createBus } = require('../controllers/busController');
    await createBus(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('assignDriver updates driver and bus correctly', async () => {
    const fakeBus = { _id: 'bus1', driver: null, save: jest.fn() };
    const fakeUser = { _id: 'driver1', assignedBus: null, save: jest.fn() };
    Bus.findById.mockResolvedValue(fakeBus);
    User.findOne.mockResolvedValue(fakeUser);
    const req = { body: { busId: 'bus1', driverId: 'driver1' } };
    const res = { json: jest.fn() };
    const next = jest.fn();
    const { assignDriver } = require('../controllers/busController');
    await assignDriver(req, res, next);
    expect(fakeBus.driver.toString()).toBe('driver1');
    expect(fakeUser.assignedBus.toString()).toBe('bus1');
    expect(res.json).toHaveBeenCalledWith({ message: 'Driver assigned', busId: 'bus1', driverId: 'driver1' });
  });
});
