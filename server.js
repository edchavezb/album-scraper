var express = require("express");
var mongoose = require("mongoose");

var cheerio = require("cheerio");
var axios = require("axios");

var db = require("./models");

var PORT = process.env.PORT || 3000;
var app = express();
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/albumscraper";
//"mongodb://localhost/albumscraper"

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

// Route to begin scraping metacritic.com and save the resulting albums to the database
app.get("/scrape", function (req, res) {

  console.log("Hitting route /scrape");

  process.on('unhandledRejection', function(err) {
    console.log(err);
  });

  axios.get("https://www.metacritic.com/browse/albums/release-date/available").then(function (response) {

    console.log("Getting albums");

    var $ = cheerio.load(response.data);

    $("td.clamp-summary-wrap").each(function (i, element) {

      var limiter = i < 18;

      var result = {}

      result.title = $(this).find(".title").children("h3").text().trim();
      result.artist = $(this).find(".clamp-details").children(".artist").text().replace("by", "").trim();
      result.release = $(this).find(".clamp-details").children("span").text().trim();
      result.score = $(this).find(".clamp-score-wrap").find(".metascore_w").text().trim();
      result.link = "https://www.metacritic.com" + $(this).find(".title").attr("href");

      axios.get(result.link).then(function (imageresp) {

        var $$ = cheerio.load(imageresp.data);

        result.imgLink = $$("img.product_image").attr("src");

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

// Route for getting all albums from the db
app.get("/releases", function (req, res) {

  db.Release.find({})
    .then(function (all) {
      res.json(all);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Route to wipe all previously scraped albums
app.get("/wipe", function (req, res) {
  db.Release.deleteMany({})
    .then(function (all) {
      res.send("All entries wiped");
    })
    .catch(function (err) {
      res.json(err);
    });
    db.Note.remove({})
    .then(function (all) {
      res.send("All notes wiped");
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Route for grabbing a specific album by id, retrieve its notes
app.get("/releases/:id", function (req, res) {

  db.Release.find({ _id: req.params.id })
    .populate("note")
    .then(function (dbNote) {
      res.json(dbNote);
    })
    .catch(function (err) {
      res.json(err);
    });
});

 // Route for saving/updating an album's associated Note
app.post("/releases/:id", function (req, res) {
  console.log(req.params.id);
  db.Note.create(req.body)
    .then(function (dbNote) {
      return db.Release.findOneAndUpdate({ _id: req.params.id }, { $set: { note: dbNote._id } }, { new: true });
    })
    .then(function(dbRelease) {
      res.json(dbRelease);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});