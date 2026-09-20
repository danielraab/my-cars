import { Sequelize } from "sequelize";

const sequelizeInstance = new Sequelize(process.env.APP_DB_URI as string, {
  logging: process.env.NODE_ENV !== "production",
});

export default sequelizeInstance;
