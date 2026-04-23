const Bus = require("../models/Bus");
const Route = require("../models/Route");
const User = require("../models/User");
const Location = require("../models/Location");
const { estimateEtaMinutes } = require("../utils/eta");

const getBuses = async (req, res, next) => {
  try {
    const buses = await Bus.find()
      .populate("route", "name code stops")
      .populate("driver", "name email");
    res.json(buses);
  } catch (error) {
    next(error);
  }
};

const createBus = async (req, res, next) => {
  try {
    const route = await Route.findById(req.body.route);
    if (!route) return res.status(400).json({ message: "Invalid route" });
    const bus = await Bus.create(req.body);
    res.status(201).json(bus);
  } catch (error) {
    next(error);
  }
};

const updateBus = async (req, res, next) => {
  try {
    const isDriver = req.user?.role === "driver";
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    if (isDriver) {
      const isAssignedDriver = bus.driver && String(bus.driver) === String(req.user._id);
      if (!isAssignedDriver) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const allowedDriverFields = ["status", "isTripActive"];
      const requestedFields = Object.keys(req.body || {});
      const hasOnlyAllowedFields = requestedFields.every((field) => allowedDriverFields.includes(field));
      if (!hasOnlyAllowedFields) {
        return res.status(400).json({ message: "Drivers can only update status and trip state" });
      }
    }

    const hadStatusOrTripChange =
      Object.prototype.hasOwnProperty.call(req.body || {}, "status") ||
      Object.prototype.hasOwnProperty.call(req.body || {}, "isTripActive");
    Object.assign(bus, req.body);
    await bus.save();

    if (hadStatusOrTripChange) {
      const io = req.app.get("io");
      if (io) {
        io.to(`bus_${bus._id}`).emit("busStatusUpdated", {
          busId: bus._id,
          status: bus.status,
          isTripActive: bus.isTripActive,
          currentLocation: bus.currentLocation || null,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    res.json(bus);
  } catch (error) {
    next(error);
  }
};

const deleteBus = async (req, res, next) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) return res.status(404).json({ message: "Bus not found" });
    res.json({ message: "Bus deleted" });
  } catch (error) {
    next(error);
  }
};

const assignDriver = async (req, res, next) => {
  try {
    const { busId, driverId } = req.body;

    if (!busId) {
      return res.status(400).json({ message: "Bus ID is required" });
    }

    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    // Handle Unassignment
    if (!driverId) {
      const currentDriverId = bus.driver;
      bus.driver = null;
      await bus.save();

      if (currentDriverId) {
        await User.findByIdAndUpdate(currentDriverId, { assignedBus: null });
      }

      return res.json({ message: "Driver unassigned", busId });
    }

    // Handle Assignment
    const driver = await User.findOne({ _id: driverId, role: "driver" });
    if (!driver) return res.status(400).json({ message: "Invalid driver" });

    // Remove driver from previous bus if any
    if (driver.assignedBus && String(driver.assignedBus) !== String(busId)) {
      await Bus.findByIdAndUpdate(driver.assignedBus, { driver: null });
    }

    // Remove current driver from this bus if any
    if (bus.driver && String(bus.driver) !== String(driverId)) {
      await User.findByIdAndUpdate(bus.driver, { assignedBus: null });
    }

    bus.driver = driver._id;
    await bus.save();
    driver.assignedBus = bus._id;
    await driver.save();

    res.json({ message: "Driver assigned", busId, driverId });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    next(error);
  }
};

const getBusLocations = async (req, res, next) => {
  try {
    const latest = await Location.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$bus", doc: { $first: "$$ROOT" } } },
    ]);
    res.json(latest.map((entry) => entry.doc));
  } catch (error) {
    next(error);
  }
};

const getBusEta = async (req, res, next) => {
  try {
    const { busId, lat, lng } = req.query;
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    const eta = estimateEtaMinutes(
      bus.currentLocation,
      { latitude: Number(lat), longitude: Number(lng) },
      Number(process.env.DEFAULT_SPEED_KMPH || 24)
    );
    res.json({ busId, etaMinutes: eta });
  } catch (error) {
    next(error);
  }
};

const getRecentDelays = async (req, res, next) => {
  try {
    const delays = await Location.find({ status: "delayed" })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("bus", "number");

    const messages = delays.map((entry) => {
      const busId = entry.bus?._id || entry.bus;
      const busNumber = entry.bus?.number || "Unknown";
      return {
        busId,
        busNumber,
        message: `Bus ${busNumber} is delayed.`,
        updatedAt: entry.createdAt,
      };
    });

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBuses,
  createBus,
  updateBus,
  deleteBus,
  assignDriver,
  getBusLocations,
  getBusEta,
  getRecentDelays,
};
