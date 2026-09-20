import { BelongsToGetAssociationMixin, CreationOptional, DataTypes, ForeignKey, Model } from "sequelize";
import sequelizeInstance from "../../config/sequelize";
import Car from "./car";

class Repair extends Model {
  declare id: CreationOptional<number>;

  declare date: Date;
  declare station: string;
  declare odometerReading: number;
  declare type: string;
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

Repair.init(
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
    station: { type: DataTypes.STRING, allowNull: false },
    odometerReading: DataTypes.BIGINT.UNSIGNED,
    type: DataTypes.STRING,
    amount: { type: DataTypes.FLOAT, defaultValue: 0.0 },
    description: DataTypes.STRING,
  },
  {
    sequelize: sequelizeInstance,
  }
);

export default Repair;
