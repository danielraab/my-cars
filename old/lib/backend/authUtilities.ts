import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import moment from "moment";
import { Op } from "sequelize";
import RefreshToken from "../../db/models/refreshToken";
import User from "../../db/models/user";
import { TokenInfo } from "../types/user";

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

export function compareHashedPassword(password: string, hashedPassword: string) {
  return bcrypt.compareSync(password, hashedPassword);
}

export function createAccessToken(user: User): string {
  const token: TokenInfo = {
    id: user.id,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
  };
  return jwt.sign(token, process.env.APP_JWT_SECRET!, {
    expiresIn: parseInt(process.env.APP_JWT_EXPIRES_IN_SEC || "60"),
  });
}

export async function createRefreshToken(user: User, initialLogin?: Date): Promise<string> {
  const validUntil = moment();
  validUntil.add(Number(process.env.APP_REFRESH_TOKEN_VALIDITY_IN_SEC), "seconds");
  const newRefreshToken = await user.createRefreshToken({
    validUntil: validUntil,
    initialLogin: initialLogin || new Date(),
  });

  return newRefreshToken.refreshToken;
}

export async function cleanExpiredRefreshToken() {
  await RefreshToken.destroy({ where: { validUntil: { [Op.lte]: new Date() } } });
}

export function verifyToken(token: string): TokenInfo | undefined {
  try {
    return jwt.verify(token, process.env.APP_JWT_SECRET!) as TokenInfo;
  } catch (err) {
    return undefined;
  }
}
