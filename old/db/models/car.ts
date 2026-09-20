import {
  BelongsToGetAssociationMixin,
  CreationOptional,
  DataTypes,
  ForeignKey,
  HasManyCreateAssociationMixin,
  HasManyGetAssociationsMixin,
  Model,
} from "sequelize";
import sequelizeInstance from "../../config/sequelize";
import Refuel from "./refuel";
import Repair from "./repair";
import Ticket from "./ticket";
import User from "./user";

class Car extends Model {
  declare id: CreationOptional<number>;

  declare name: string;
  declare type: string;
  declare carMake: string;
  declare fuel: string;
  declare firstRegistration: Date;
  declare licensePlate: string;
  declare fin: string;
  declare isActive: boolean;
  declare purchaseDate: Date;
  declare purchasePrice: number;

  declare UserId: ForeignKey<User["id"]>; //see user.ts file for association

  declare getUser: BelongsToGetAssociationMixin<User>;

  declare getRefuels: HasManyGetAssociationsMixin<Refuel>; // Note the null assertions!
  declare createRefuel: HasManyCreateAssociationMixin<Refuel>;
  declare getRepairs: HasManyGetAssociationsMixin<Repair>; // Note the null assertions!
  declare createRepair: HasManyCreateAssociationMixin<Repair>;
  declare getTickets: HasManyGetAssociationsMixin<Ticket>; // Note the null assertions!
  declare createTicket: HasManyCreateAssociationMixin<Ticket>;

  // timestamps!
  // createdAt can be undefined during creation
  declare createdAt: CreationOptional<Date>;
  // updatedAt can be undefined during creation
  declare updatedAt: CreationOptional<Date>;
}

Car.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    carMake: DataTypes.STRING,
    fuel: DataTypes.STRING,
    firstRegistration: DataTypes.DATE,
    licensePlate: DataTypes.STRING,
    fin: DataTypes.STRING,
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    purchaseDate: { type: DataTypes.DATE, allowNull: true },
    purchasePrice: { type: DataTypes.FLOAT, defaultValue: 0.0 },
  },
  {
    sequelize: sequelizeInstance,
  }
);

Car.hasMany(Refuel, { foreignKey: "CarId" });
Refuel.belongsTo(Car);

Car.hasMany(Repair, { foreignKey: "CarId" });
Repair.belongsTo(Car);

Car.hasMany(Ticket, { foreignKey: "CarId" });
Ticket.belongsTo(Car);

export default Car;
