import {
  Model,
  CreationOptional,
  DataTypes,
  HasManyGetAssociationsMixin,
  HasManyCreateAssociationMixin,
} from "sequelize";
import sequelizeInstance from "../../config/sequelize";
import Car from "./car";
import RefreshToken from "./refreshToken";

class User extends Model {
  declare id: CreationOptional<number>;

  declare email: string;

  declare firstname: string;
  declare lastname: string;

  declare specialToken: string | null;
  declare isVerified: boolean;
  declare hashedPassword: string;

  declare getCars: HasManyGetAssociationsMixin<Car>; // Note the null assertions!
  declare createCar: HasManyCreateAssociationMixin<Car>;
  declare createRefreshToken: HasManyCreateAssociationMixin<RefreshToken>;

  // timestamps!
  // createdAt can be undefined during creation
  declare createdAt: CreationOptional<Date>;
  // updatedAt can be undefined during creation
  declare updatedAt: CreationOptional<Date>;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    firstname: DataTypes.STRING,
    lastname: DataTypes.STRING,
    specialToken: DataTypes.STRING,
    isVerified: DataTypes.BOOLEAN,
    hashedPassword: DataTypes.STRING,
  },
  {
    sequelize: sequelizeInstance,
  }
);

User.hasMany(Car, { foreignKey: "UserId" });
Car.belongsTo(User);

User.hasMany(RefreshToken, { foreignKey: "UserId" });
RefreshToken.belongsTo(User);

export default User;
