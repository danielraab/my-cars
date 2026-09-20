"use strict";

const bcrypt = require("bcryptjs");
const faker = require("faker");

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await createUserWithDummyData(queryInterface, "tester@draab.at", "test");
    await createUserWithDummyData(queryInterface);
    await createUserWithDummyData(queryInterface);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Refuels");
    await queryInterface.bulkDelete("Repairs");
    await queryInterface.bulkDelete("Tickets");
    await queryInterface.bulkDelete("Cars");
    await queryInterface.bulkDelete("Users");
  },
};

async function createUserWithDummyData(queryInterface, email, password) {
  const userId = await queryInterface.bulkInsert("Users", [
    {
      email: email || faker.internet.email(),
      firstname: faker.name.firstName(),
      lastname: faker.name.lastName(),
      hashedPassword: (await bcrypt).hashSync(password || "password"),
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  await createCarsForUser(queryInterface, userId);
}

let oldDate = new Date("2022-01-01 12:00:00");
function getNextDate() {
  oldDate.setDate(oldDate.getDate() + 8);
  oldDate.setHours(oldDate.getHours() + 1);
  return new Date(oldDate);
}

let oldOdometer = 10000;
function getNextOdometer() {
  oldOdometer += 650;
  return oldOdometer;
}

async function createCarsForUser(queryInterface, userId) {
  addSingleCar(queryInterface, userId);
  addSingleCar(queryInterface, userId);
  addSingleCar(queryInterface, userId);
}

async function addSingleCar(queryInterface, userId) {
  const carId = await queryInterface.bulkInsert("Cars", [getNewCarForUser(userId)]);
  createRefuels(queryInterface, carId);
  createRepairs(queryInterface, carId);
  createTicket(queryInterface, carId);
}

function getNewCarForUser(userId) {
  return {
    type: faker.random.arrayElement(["Car", "Bike", "Truck"]),
    fuel: faker.random.arrayElement(["Diesel", "Gasoline", "Electric"]),
    firstRegistration: getNextDate(),
    licensePlate: faker.random.alphaNumeric(6),
    fin: faker.vehicle.vin(),
    name: faker.vehicle.model(),
    carMake: faker.vehicle.manufacturer(),
    purchaseDate: faker.date.past(5),
    purchasePrice: faker.finance.amount(3000, 50000),
    createdAt: new Date(),
    updatedAt: new Date(),
    UserId: userId,
  };
}

async function createRefuels(queryInterface, carId) {
  queryInterface.bulkInsert("Refuels", [
    getNewRefuelForCar(carId),
    getNewRefuelForCar(carId),
    getNewRefuelForCar(carId),
    getNewRefuelForCar(carId),
    getNewRefuelForCar(carId),

    getNewRefuelForCar(carId),
    getNewRefuelForCar(carId),
    getNewRefuelForCar(carId),
    getNewRefuelForCar(carId),
    getNewRefuelForCar(carId),

    getNewRefuelForCar(carId),
    getNewRefuelForCar(carId),
    getNewRefuelForCar(carId),
    getNewRefuelForCar(carId),
    getNewRefuelForCar(carId),

    getNewRefuelForCar(carId),
    getNewRefuelForCar(carId),
    getNewRefuelForCar(carId),
    getNewRefuelForCar(carId),
    getNewRefuelForCar(carId),
  ]);

  function getNewRefuelForCar(carId) {
    return {
      odometerReading: getNextOdometer(),
      fuel: faker.random.arrayElement(["Normal", "Special"]),
      liter: faker.finance.amount(10, 80, 1),
      station: faker.random.arrayElement(["Turmöl Peuerbach", "Pink Stritzing", "Avia Bad Schallerbach"]),
      date: getNextDate(),
      amount: faker.finance.amount(10, 100),
      createdAt: new Date(),
      updatedAt: new Date(),
      CarId: carId,
    };
  }
}

async function createRepairs(queryInterface, carId) {
  queryInterface.bulkInsert("Repairs", [
    getNewRepair(carId),
    getNewRepair(carId),
    getNewRepair(carId),
    getNewRepair(carId),
    getNewRepair(carId),

    getNewRepair(carId),
    getNewRepair(carId),
    getNewRepair(carId),
    getNewRepair(carId),
    getNewRepair(carId),
  ]);
}

function getNewRepair(carId) {
  return {
    station: faker.random.arrayElement(["KLM Neumarkt", "Forstinger Grieskrichen", "Holatko"]),
    odometerReading: getNextOdometer(),
    date: getNextDate(),
    amount: faker.finance.amount(100, 1000),
    type: faker.random.arrayElement(["Service", "Repair", "Check"]),
    description: faker.lorem.words(10),
    createdAt: new Date(),
    updatedAt: new Date(),
    CarId: carId,
  };
}

async function createTicket(queryInterface, carId) {
  queryInterface.bulkInsert("Tickets", [
    getNewTicket(carId),
    getNewTicket(carId),
    getNewTicket(carId),
    getNewTicket(carId),
    getNewTicket(carId),

    getNewTicket(carId),
    getNewTicket(carId),
    getNewTicket(carId),
    getNewTicket(carId),
    getNewTicket(carId),
  ]);
}

function getNewTicket(carId) {
  return {
    date: getNextDate(),
    amount: faker.finance.amount(20, 100),
    type: faker.random.arrayElement(["Velocity", "Parking", "Others"]),
    location: faker.random.arrayElement(["Wels", "Grieskirchen", "Peuerbach"]),
    description: faker.lorem.words(12),
    createdAt: new Date(),
    updatedAt: new Date(),
    CarId: carId,
  };
}
