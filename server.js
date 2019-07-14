var express = require("express");
var mongoose = require("mongoose");

var cheerio = require("cheerio");
var axios = require("axios");

var db = require("./models");

var PORT = process.env.PORT || 3000;
var app = express();
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://joyousmisery128:mintvol821@ds151086.mlab.com:51086/heroku_l2nth5p1"
//"mongodb://localhost/albumscraper"

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

app.get("/scrape", function (req, res) {

  console.log("Hitting route /scrape");

  process.on('unhandledRejection', function(err) {
    console.log(err);
  });

  axios.get("https://www.metacritic.com/browse/albums/release-date/available").then(function (response) {

    console.log("Getting albums");

    var $ = cheerio.load(response.data);

    $("li.product.release_product").each(function (i, element) {

      var limiter = i < 8;
      /* console.log(limiter);
      console.log(i); */

      var result = {}

      result.title = $(this).find(".basic_stat.product_title").children("a").text().replace("\n", "").replace("\'", "").trim();
      result.artist = $(this).find(".basic_stat.condensed_stats").find("li.stat.product_artist").children(".data").text()
      result.release = $(this).find(".basic_stat.condensed_stats").find("li.stat.release_date.full_release_date").children(".data").text()
      result.score = $(this).find(".basic_stat.product_score.brief_metascore").children(".metascore_w").text()
      result.link = "https://www.metacritic.com" + $(this).find(".basic_stat.product_title").children("a").attr("href");
    
      console.log(result.link);

      axios.get(result.link).then(function (imageresp) {

        var $$ = cheerio.load(imageresp.data);

        result.imgLink = $$("img.product_image").attr("src");

        console.log("image " + result.imgLink);

      }).then(function() {
        db.Release.create(result)
          .then(function (dbRelease) {
            console.log(dbRelease.title);
          })
          .catch(function (err) {
            console.log(err);
          });
      });
      return limiter;
    });

    res.send("Scrape Complete");
  });
});

// Route for getting all Articles from the db
app.get("/releases", function (req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Release.find({})
    .then(function (all) {
      // If all Notes are successfully found, send them back to the client
      res.json(all);
    })
    .catch(function (err) {
      // If an error occurs, send the error back to the client
      res.json(err);
    });
});

app.get("/wipe", function (req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Release.remove({})
    .then(function (all) {
      // If all Notes are successfully found, send them back to the client
      res.send("All entries wiped");
    })
    .catch(function (err) {
      // If an error occurs, send the error back to the client
      res.json(err);
    });
    db.Note.remove({})
    .then(function (all) {
      // If all Notes are successfully found, send them back to the client
      res.send("All notes wiped");
    })
    .catch(function (err) {
      // If an error occurs, send the error back to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/releases/:id", function (req, res) {

  db.Release.find({ _id: req.params.id })
    .populate("note")
    .then(function (dbNote) {
      // If all Notes are successfully found, send them back to the client
      res.json(dbNote);
    })
    .catch(function (err) {
      // If an error occurs, send the error back to the client
      res.json(err);
    });
});

 // Route for saving/updating an Article's associated Note
app.post("/releases/:id", function (req, res) {
  // TODO
  // ====
  // save the new note that gets posted to the Notes collection
  // then find an article from the req.params.id
  // and update it's "note" property with the _id of the new note
  console.log(req.params.id);
  db.Note.create(req.body)
    .then(function (dbNote) {
      return db.Release.findOneAndUpdate({ _id: req.params.id }, { $set: { note: dbNote._id } }, { new: true });
    })
    .then(function(dbRelease) {
      res.json(dbRelease);
    })
    .catch(function (err) {
      // If an error occurs, send the error back to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});