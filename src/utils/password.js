// src/utils/password.js
const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;

exports.hashPassword = async (password) => {
  if (!password) {
    throw new Error("Password is required");
  }
  return bcrypt.hash(password, SALT_ROUNDS);
};

exports.comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) {
    return false;
  }
  return bcrypt.compare(password, hashedPassword);
};
