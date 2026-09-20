import { BelongsToGetAssociationMixin, CreationOptional, DataTypes, ForeignKey, Model, UUIDV4 } from "sequelize";
import sequelizeInstance from "../../config/sequelize";
import User from "./user";

class RefreshToken extends Model {
  declare refreshToken: CreationOptional<string>;

  declare validUntil: Date;
  declare initialLogin: Date;

  declare UserId: ForeignKey<User["id"]>; //see user.ts file for association

  declare getUser: BelongsToGetAssociationMixin<User>;

  // timestamps!
  // createdAt can be undefined during creation
  declare createdAt: CreationOptional<Date>;
}

RefreshToken.init(
  {
    refreshToken: {
      allowNull: false,
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
    },

    validUntil: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    initialLogin: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize: sequelizeInstance,
    timestamps: true,
    updatedAt: false,
  }
);

export default RefreshToken;
