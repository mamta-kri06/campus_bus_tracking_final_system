require("dotenv").config();
const connectDB = require("./config/db");
const User = require("./models/User");
const Route = require("./models/Route");
const Bus = require("./models/Bus");

const seed = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Route.deleteMany({}),
    Bus.deleteMany({}),
  ]);

  const route = await Route.create({
    name: "IIT ISM Loop",
    code: "ISM-01",
    stops: [
      { name: "Location 1", latitude: 23.811881649928363, longitude: 86.4442943404539 },
      { name: "Location 2", latitude: 23.811549736470667, longitude: 86.44067824679097 },
      { name: "Location 3", latitude: 23.81198872878966, longitude: 86.43901536103179 },
      { name: "Location 4", latitude: 23.81642398179947, longitude: 86.4394124680987 },
      { name: "Location 5", latitude: 23.819322708608407, longitude: 86.43610324284606 },
    ],
  });

  const bus = await Bus.create({
    number: "BUS-101",
    route: route._id,
    status: "stopped",
    currentLocation: {
      latitude: 23.811881649928363,
      longitude: 86.4442943404539,
      updatedAt: new Date(),
    },
  });

  const admin = await User.create({
    name: "Admin",
    email: "admin@gmail.com",
    password: "admin123",
    role: "admin",
  });

  const driver = await User.create({
    name: "Driver",
    email: "driver@gmail.com",
    password: "driver123",
    role: "driver",
    assignedBus: bus._id,
  });

  bus.driver = driver._id;
  await bus.save();

  await User.create({
    name: "Student",
    email: "student@gmail.com",
    password: "student123",
    role: "student",
  });

  console.log("Seed complete");
  console.log("Admin login: admin@gmail.com / admin123");
  console.log("Driver login: driver@gmail.com / driver123");
  console.log("Student login: student@gmail.com / student123");
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
