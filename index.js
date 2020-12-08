// Add required packages
const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const { resolve } = require("path");

const app = express();

require("dotenv").config();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  user: "brmkmdavmfpgcl",
  host: "ec2-50-16-198-4.compute-1.amazonaws.com",
  database: "d3b4tcvkatcom6",
  password: "3133f4340e597e32a193d783e753e732c929c2ec64951ab23c26812fd0d707b3",
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});
console.log("Successful connection to the database");

//Creating the customer table (cusId, cusFname, cusLname, cusState, cusSalesYTD, cusSalesPrev)
const sql_create = `CREATE TABLE IF NOT EXISTS car (
    carvin INTEGER PRIMARY KEY,
    carmake VARCHAR(20) NOT NULL,
    carmodel VARCHAR(20),
    carmileage INTEGER
);`;
pool.query(sql_create, [], (err, result) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Successful creation of the 'car' table");
});

// Database seeding
const sql_insert = `INSERT INTO car (carvin, carmake, carmodel, carmileage) VALUES
(1001, 'Ford', 'Mustang', 9857),
(1002, 'Ford', 'F150', 57249),
(1003, 'Ford', 'Explorer', 53218),
(1004, 'Chevy', 'Corvette', 0019),
(1005, 'Chevy', 'Camaro', 32587),
(1006, 'Chevy', 'S10', 44000),
(1007, 'Chevy', 'Bolt', 7532),
(1008, 'Dodge', 'Charger', 36000),
(1009, 'Dodge', 'Challenger', 48256),
(1010, 'Dodge', 'RAM', 65147)
ON CONFLICT DO NOTHING;`;
pool.query(sql_insert, [], (err, result) => {
  if (err) {
    return console.error(err.message);
  }
  const sql_sequence = "SELECT SETVAL('car_carvin_Seq', MAX(carvin)) FROM car;";
  pool.query(sql_sequence, [], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Successful creation of car");
  });
});

// Start listener
app.listen(process.env.PORT || 3000, () => {
  console.log("Server started (http://localhost:3000/) !");
});

app.get("/", (req, res) => {
  res.render("index", { data: [], display: false, found: 1 });
});

app.post("/", (req, res) => {
  const vin = req.body.vin;
  const make = req.body.make;
  const model = req.body.model;
  const mileage = req.body.mileage;
  const data = [vin, make, model, mileage];
  if (vin === "" && make === "" && model === "" && mileage === "") {
    const sql = "SELECT * FROM car ORDER BY carvin";
    pool.query(sql, [], (err, result) => {
      if (err) {
        return console.error(err.message);
      }
      res.render("index", {
        dataFound: result.rows,
        data: data,
        display: true,
        found: 0,
      });
    });
  } else {
    const sql = "SELECT * FROM car ORDER BY carvin";
    pool.query(sql, [], (err, result) => {
      if (err) {
        return console.error(err.message);
      }

      var dataFound = [],
        display,
        found;
      for (var i = 0; i < result.rows.length; i++) {
        var car = result.rows[i];
        var checkVin = true,
          checkMake = true,
          checkModel = true,
          checkMileage = true;
        if (vin !== "") {
          if (parseInt(vin) === car.carvin) checkVin = true;
          else checkVin = false;
        }

        if (make !== "") {
          var len = make.length;
          if (
            len <= car.carmake.length &&
            make.toLowerCase() === car.carmake.substring(0, len).toLowerCase()
          ) {
            checkMake = true;
          } else checkMake = false;
        }

        if (model !== "") {
          var len = model.length;
          if (
            len <= car.carmodel.length &&
            model.toLowerCase() === car.carmodel.substring(0, len).toLowerCase()
          ) {
            checkModel = true;
          } else checkModel = false;
        }

        if (mileage !== "") {
          if (parseInt(mileage) >= car.carmileage) checkMileage = true;
          else checkMileage = false;
        }

        if (checkVin && checkMake && checkModel && checkMileage) {
          dataFound.push(car);
        }
      }

      if (dataFound.length === 0) {
        display = false;
        found = 0;
      } else {
        display = true;
        found = 0;
      }
      res.render("index", {
        dataFound: dataFound,
        data: data,
        display: display,
        found: found,
      });
    });
  }
});
