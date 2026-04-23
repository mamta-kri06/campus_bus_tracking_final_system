const User = require("../models/User");

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const getDrivers = async (req, res, next) => {
  try {
    const drivers = await User.find({ role: "driver" }).populate(
      "assignedBus",
      "number status",
    );
    res.json(drivers);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password, role });
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).json(userResponse);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

module.exports = { getUsers, getDrivers, createUser };
