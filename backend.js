const express = require("express");
const path = require('node:path');
const fspromise = require('fs/promises');
const fs = require('fs')
const favicon = require('serve-favicon')
const bodyParser = require('body-parser')

const app = express();
const port = 8000;

const date_map = {
  "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4,
  "May": 5, "Jun": 6, "Jul": 7, "Aug": 8, "Sep": 9,
  "Oct": 10, "Nov": 11, "Dec": 12
}


app.use(express.static('static'));
app.use(favicon(path.join(__dirname, 'static', 'favicon.ico')))
app.use(express.json())


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

// Comparator for sorting based on recency of thread
function compareSortNewest(a, b) {
  var date_arr_a = datestring_to_arr(a[3]);
  var date_arr_b = datestring_to_arr(b[3]);

  for (var i = 0; i < date_arr_a.length; i++) {
    if (date_arr_a[i] > date_arr_b[i]) {
      return -1;
    }
    else if (date_arr_a[i] < date_arr_b[i]) {
      return 1;
    }
  }
  return 0;
}

// Comparator for sorting based on old-ness of thread
function compareSortOldest(a, b) {
  var date_arr_a = datestring_to_arr(a[3]);
  var date_arr_b = datestring_to_arr(b[3]);

  for (var i = 0; i < date_arr_a.length; i++) {
    if (date_arr_a[i] < date_arr_b[i]) {
      return -1;
    }
    else if (date_arr_a[i] > date_arr_b[i]) {
      return 1;
    }
  }
  return 0;
}

// Converts an integer to an ID key used for looking up threads
function int_to_id(x) {
  var int_string = x.toString();
  var padding = '0'.repeat(8 - int_string.length);
  var id_string = padding.concat(int_string);
  return id_string;

}

// Returns an array representing the current time and date
function get_date_arr() {
  var date = new Date()
  var date_arr = []
  date = date.toString()
  date = date.split(" ")
  const time = date[4].split(":")
  date_arr = [parseInt(date[3]), date_map[date[1]], parseInt(date[2]),
  parseInt(time[0]), parseInt(time[1]), parseInt(time[2])]
  return date_arr

}

// Converts a date array into a string. Inverse of datestring_to_arr.
function datearr_to_string(a) {
  var s = ''
  for (var i = 0; i < a.length; i++) {

    a_i_string = a[i].toString()
    if (i > 0) {
      if (a_i_string.length < 2) {
        a_i_string = '0'.concat(a_i_string)
      }
    }
    s = s.concat(a_i_string)
    if (i != a.length - 1) {
      s = s.concat('-')
    }
  }
  return s
}

// Converts a date string into an array. Inverse of datearr_to_string.
function datestring_to_arr(a) {
  var s_arr = a.split("-")
  var a = []
  for (var i = 0; i < s_arr.length; i++) {
    a.push(parseInt(s_arr[i]))
  }
  return a;

}

// Returns the home page
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, './homepage.html'));
});

// Returns the number of thread pages available to view
app.get("/getpagecount", async function (req, res) {
  var thread_count = 0;
  var page_count = 0
  var fp = 'thread_db.json'

  // Reads the thread_db file and returns the number of pages
  fspromise.readFile(fp)
    .then((data) => {
      var files = JSON.parse(data.toString());
      thread_count = files["threads"].length
      page_count = thread_count_to_page_count(thread_count)
      res.send({ 'page_count': page_count })
    })
    .catch((error) => {
      console.log("Error")
      res.send({})
    });

});

// Returns the five threads that satisfy the user's request
app.get("/threads", async function (req, res) {
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


      if (select == 'date-newest') {
        arr.sort(compareSortNewest);
      }
      else if (select == 'date-oldest') {
        arr.sort(compareSortOldest);
      }

      else if (select == 'likes') {
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

app.get("/threadinfo", function (req, res) {
  var fp = 'thread_db.json';
  var thread_id = req.query["id"]
  fspromise.readFile(fp)
    .then((data) => {
      var files = JSON.parse(data.toString())
      thread_arr = files["threads"]
      chosen_thread = {}
      for (var i = 0; i < thread_arr.length; i++) {
        if (thread_arr[i]["id"] == thread_id) {
          res.send(thread_arr[i])
        }
      }
    })
});

app.post("/createnewthread", function (req, res) {

  // Getting variables from the body

  var thread_title = req.body["title"];
  var thread_text = req.body["body"];

  // Opening the ID database and getting the least-recently used ID. 
  // This is the equivalent of generating a primary key in a database.
  var id_fp = 'id.json'
  var data = fs.readFileSync(id_fp);
  var jsonData = JSON.parse(data)
  var id_int = parseInt(jsonData["id"])

  var new_id_int = id_int + 1
  jsonData["id"] = new_id_int
  fs.writeFileSync(id_fp, JSON.stringify(jsonData));

  // Gets the correct ID string to add to the thread
  var id_string = int_to_id(id_int);

  // Getting the date that the thread was posted
  var date_arr = get_date_arr()
  var date_string = datearr_to_string(date_arr)

  // Setting likes and comments
  var likes = 0;
  var comments = 0;


  // Opening thread database
  var fp = 'thread_db.json'
  var data = fs.readFileSync(fp);
  var jsonData = JSON.parse(data)
  jsonData.threads.push({
    "id": id_string,
    "title": thread_title,
    "body": thread_text,
    "date": date_string,
    "likes": likes,
    "comments": comments,
  })

  fs.writeFileSync(fp, JSON.stringify(jsonData));

  res.json({})

});

app.post("/deletethread", function (req, res) {
  var thread_deletion_id = req.body["thread-id"]

  var fp = 'thread_db.json'
  var data = fs.readFileSync(fp);
  var jsonData = JSON.parse(data)
  var thread_data = jsonData["threads"]

  var ind_to_delete = -1

  for (var i=0; i < thread_data.length; i++) {
    if (thread_data[i]["id"] == thread_deletion_id) {
      ind_to_delete = i;
    }
  }
  jsonData.threads.splice(ind_to_delete, 1);

  fs.writeFileSync(fp, JSON.stringify(jsonData));

  res.json({})

});


app.listen(port, function () {
  console.log(`http://127.0.0.1:${port}/`)
});
