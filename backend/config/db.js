const mysql = require("mysql2");
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("banque", "root", "", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
});

module.exports = sequelize;
