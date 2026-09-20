import { BelongsToGetAssociationMixin, CreationOptional, DataTypes, ForeignKey, Model } from "sequelize";
import sequelizeInstance from "../../config/sequelize";
import Car from "./car";

class Ticket extends Model {
  declare id: CreationOptional<number>;

  declare date: Date;
  declare type: string;
  declare location: string;
  declare amount: number;
  declare description: string;

  declare CarId: ForeignKey<Car["id"]>; //see car.ts file for association

  declare getCar: BelongsToGetAssociationMixin<Car>;

  // timestamps!
  // createdAt can be undefined during creation
  declare createdAt: CreationOptional<Date>;
  // updatedAt can be undefined during creation
  declare updatedAt: CreationOptional<Date>;
}

Ticket.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    type: DataTypes.STRING,
    location: DataTypes.STRING,
    description: DataTypes.STRING,
    amount: { type: DataTypes.FLOAT, defaultValue: 0.0 },
  },
  {
    sequelize: sequelizeInstance,
  }
);

export default Ticket;
