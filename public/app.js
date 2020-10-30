const getStoredData = () => {
  $.getJSON("/releases", function(data) {
  // For each one
    for (var i = 0; i < data.length; i++) {

      var releaseCard = $("<div>");
      releaseCard.addClass("card")

      var cardImage = $("<img>");
      cardImage.addClass("card-img-top")
      cardImage.attr("src", data[i].imgLink);
      cardImage.attr("data-id", data[i]._id)
      releaseCard.append(cardImage);

      var cardBody = $("<div>");
      cardBody.addClass("card-body");

      var cardText = $("<p class=\"card-text\" >" + data[i].artist + " - <span> <a href=" + data[i].link + ">" + data[i].title +"</a></span></p>");
      cardBody.append(cardText);
      releaseCard.append(cardBody);

      $("#releases").prepend(releaseCard);

    }
  });
}

$(document).on("click", "#scrape", function() {
  $.ajax({
    method: "GET",
    url: "/scrape/"
  })
  // With that done
  .then(function(data) {
    // Log the response
    console.log(data);
    let wait = setTimeout(getStoredData, 2000);
  })
});

$(document).on("click", "#wipe", function() {
  $.ajax({
    method: "GET",
    url: "/wipe/"
  })
  // With that done
  .then(function(data) {
    // Log the response
    console.log(data);
    $("#releases").empty();
  })
});


// Whenever someone clicks a p tag
$(document).on("click", "img", function() {
  // Empty the notes from the note section
  $("#notes").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  console.log(thisId);

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/releases/" + thisId
  })
    // With that done, add the note information to the page
    .then(function(data) {
      console.log(data);
      // An input to enter a new title
      $("#notes").append("<input id='titleinput' name='title' >");

      $("#titleinput").val(data[0].artist + " - " + data[0].title);
      // A textarea to add a new note body
      $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $("#notes").append("<button data-id='" + data[0]._id + "' id='savenote'>Save Note</button>");

      // If there's a note in the article
      if (data[0].note) {
        console.log(data[0].note)
        // Place the title of the note in the title input
        $("#titleinput").val(data[0].note.title);
        // Place the body of the note in the body textarea
        $("#bodyinput").val(data[0].note.body);
      }
    });
});

// When you click the savenote button
$(document).on("click", "#savenote", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/releases/" + thisId,
    data: {
      // Value taken from title input
      title: $("#titleinput").val(),
      // Value taken from note textarea
      body: $("#bodyinput").val()
    }
  })
    // With that done
    .then(function(data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      $("#notes").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val(""); 
});

getStoredData();
