const express = require("express");
const path = require('node:path'); 
const fspromise = require('fs/promises');
const favicon = require('serve-favicon')

const app = express();
const port = 3000;

app.use(express.static('static'));
app.use(favicon(path.join(__dirname, 'static', 'favicon.ico')))

// Converts the number of threads to the number of pages that represents it
function thread_count_to_page_count(num) {
  if (num == 0) {
    return 1
  }
  else {
    return Math.ceil(num / 5)
  }
}

// Function that provides lookups for a dictionary and also provides a default
function dict_get(object, key, default_value) {
  var result = object[key];
  return (typeof result !== "undefined") ? result : default_value;
}

// Returns the home page
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname,'./homepage.html'));
});

// Returns the number of thread pages available to view
app.get("/getpagecount", function (req, res) {
  var thread_count = 0;
  var page_count = 0

  var fp = 'thread_db.json'

  // Reads the thread_db file and returns the number of pages
  fspromise.readFile(fp)
    .then((data) => {
      var files = JSON.parse(data.toString());
      thread_count = files["threads"].length
      page_count = thread_count_to_page_count(thread_count)
      res.send({'page_count': page_count})
    })
    .catch((error) => {
      console.log("Error")
      res.send({})
    });

});


// Returns the five threads that satisfy the user's request
app.get("/threads", function (req, res) {
  var fp = 'thread_db.json';
  var select = dict_get(req.query, "select", "date-newest");
  var search = dict_get(req.query, "search", "");
  var page = parseInt(dict_get(req.query, "page", '1'));

  console.log(select);
  console.log(search);
  console.log(page);


  // fs.readFile(fp)
  //   .then((data) => {
  //     var files = JSON.parse(data.toString());
  //     thread_count = files["threads"].length
  //     page_count = thread_count_to_page_count(thread_count)
  //     res.send({'page_count': page_count})
  //   })
  //   .catch((error) => {
  //     console.log("Error")
  //     res.send({})
  //   });

  res.send({})



})


app.listen(port, function () {
  console.log(`http://127.0.0.1:${port}/`)
});
