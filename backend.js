const express = require("express");
const path = require('node:path'); 
const fspromise = require('fs/promises');
const fs = require('fs')
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

// Comparator for sorting based on likes
function compareLikes(a, b) {
  if (a[4] === b[4]) {
      return 0;
  }
  else {
      return (a[4] < b[4]) ? -1 : 1;
  }
}

// Comparator for sorting based on comments
function compareComments(a, b) {
  if (a[5] === b[5]) {
      return 0;
  }
  else {
      return (a[5] < b[5]) ? -1 : 1;
  }
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

  fspromise.readFile(fp)
    .then((data) => {
      var files = JSON.parse(data.toString());
      thread_arr = files["threads"]
      
      var arr = []
      for (let i = 0; i < thread_arr.length; i++) {
        if (thread_arr[i]["title"].includes(search)) {
          arr.push([thread_arr[i]["id"], thread_arr[i]["title"], thread_arr[i]["body"], thread_arr[i]["date"],
                    thread_arr[i]["likes"], thread_arr[i]["comments"]])
        }
      } 


      if (select == 'likes') {
        arr.sort(compareLikes);
      }
      else if (select == 'comments') {
        arr.sort(compareComments);
      }

      var start = (page - 1) * 5
      var end = Math.min(page * 5, arr.length)

      items = arr.slice(start, end)
      while (items.length < 5) {
        items.push(['_', '_', '_', '_', '_', '_'])
      }

      res.send(JSON.stringify(items))
    })
    .catch((error) => {
      console.log("Error")
      res.send({})
    });


})


app.listen(port, function () {
  console.log(`http://127.0.0.1:${port}/`)
});
