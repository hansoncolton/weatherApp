var express = require('express');
var router = express.Router();

/* PostgreSQL and PostGIS module and connection setup */
const { Client, Query } = require('pg')

// Setup connection
var username = "postgres" // sandbox username
var password = "Koff3eCup!" // read only privileges on our table
var host = "localhost:5432"
var database = "cambridge" // database name
var conString = "postgres://"+username+":"+password+"@"+host+"/"+database; // Your Database Connection

// Set up your database query to display GeoJSON
var coffee_query = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json((id, name)) As properties FROM coffee_shops As lg) As f) As fc";


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


/* GET Postgres JSON data */
router.get('/data', function (req, res) {
  var client = new Client(conString);
  client.connect();
  var query = client.query(new Query(coffee_query));
  query.on("row", function (row, result) {
      result.addRow(row);
  });
  query.on("end", function (result) {
      res.send(result.rows[0].row_to_json);
      res.end();
  });
});


/* GET the map page */
router.get('/map', function(req, res) {
 /*  var long = 0;
  var lat = 0;
  if(navigator.geolocation)
  {
    var position = navigator.geolocation.getCurrentPosition();
    long = position.coords.longitude;
    lat = position.coords.latitude;
  } */

  res.render('map', {
    title: "Ag Weather", // Give a title to our page
    jsonData: "",
    //currentLat : lat,
  //  currentLong : long
  });

 /* var client = new Client(conString); // Setup our Postgres Client
  client.connect(); // connect to the client
  var query = client.query(new Query(coffee_query)); // Run our Query
  query.on("row", function (row, result) {
      result.addRow(row);
  });
  // Pass the result to the map page
  query.on("end", function (result) {
      var data = result.rows[0].row_to_json // Save the JSON as variable data
      res.render('map', {
          title: "Express API", // Give a title to our page
          jsonData: data // Pass data to the View

      });
  }); */
});

/* GET the filtered page */
router.get('/filter*', function (req, res) {
  var name = req.query.name;
  if (name.indexOf("--") > -1 || name.indexOf("'") > -1 || name.indexOf(";") > -1 || name.indexOf("/*") > -1 || name.indexOf("xp_") > -1){
      console.log("Bad request detected");
      res.redirect('/map');
      return;
  } else {
      console.log("Request passed")
      var filter_query = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json((id, name)) As properties FROM coffee_shops As lg WHERE lg.name = \'" + name + "\') As f) As fc";
      var client = new Client(conString);
      client.connect();
      var query = client.query(new Query(filter_query));
      query.on("row", function (row, result) {
          result.addRow(row);
      });
      query.on("end", function (result) {
          var data = result.rows[0].row_to_json
          res.render('map', {
              title: "Express API",
              jsonData: data
          });
      });
  };
});

module.exports = router;
