"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Refuels", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      station: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      odometerReading: {
        type: Sequelize.BIGINT.UNSIGNED,
      },
      fuel: {
        type: Sequelize.STRING,
      },
      liter: {
        type: Sequelize.FLOAT,
      },
      amount: {
        type: Sequelize.FLOAT,
        defaultValue: 0.0,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },

      CarId: {
        type: Sequelize.BIGINT.UNSIGNED,
        references: {
          model: "Cars",
          key: "id",
        },
        onUpdate: "cascade",
        onDelete: "cascade",
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Refuels");
  },
};
