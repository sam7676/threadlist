const express = require("express");
const path = require('node:path');
const fspromise = require('fs/promises');
const fs = require('fs')
const favicon = require('serve-favicon')
const multer = require('multer')

const app = express();
const port = 8000;

const date_map = {
  "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4,
  "May": 5, "Jun": 6, "Jul": 7, "Aug": 8, "Sep": 9,
  "Oct": 10, "Nov": 11, "Dec": 12
}

const upload = multer({ dest: 'uploads/' })

const thread_db_fp = 'db\\thread_db.json'
const thread_id_fp = 'db\\thread_id.json'
const comment_db_fp = 'db\\comment_db.json'
const comment_id_fp = 'db\\comment_id.json'


app.use(express.static('static'));
app.use(favicon(path.join(__dirname, 'static', 'favicon.ico')))
app.use(express.json())


// Converts the number of items to the number of pages that represents it
function item_count_to_page_count(num) {
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

// Comparators for sorting threads
function t_compareLikes(a, b) {
  if (a[4] === b[4]) {
    return 0;
  }
  else {
    return (a[4] > b[4]) ? -1 : 1;
  }
}
function t_compareComments(a, b) {
  if (a[5] === b[5]) {
    return 0;
  }
  else {
    return (a[5] > b[5]) ? -1 : 1;
  }
}
function t_compareSortNewest(a, b) {
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
function t_compareSortOldest(a, b) {
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

function c_compareLikes(a, b) {
  if (a[3] === b[3]) {
    return 0;
  }
  else {
    return (a[3] > b[3]) ? -1 : 1;
  }
}
function c_compareSortNewest(a, b) {
  var date_arr_a = datestring_to_arr(a[2]);
  var date_arr_b = datestring_to_arr(b[2]);

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
function c_compareSortOldest(a, b) {
  var date_arr_a = datestring_to_arr(a[2]);
  var date_arr_b = datestring_to_arr(b[2]);

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

// Converts a date array into a string, or vice versa.
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
function datestring_to_arr(a) {
  var s_arr = a.split("-")
  var b = []
  for (var i = 0; i < s_arr.length; i++) {
    b.push(parseInt(s_arr[i]))
  }
  return b;

}

// Returns the JSON representation of a given JSON filepath
async function open_json_file(filepath) {
  var promise = await fspromise.readFile(filepath)
  return JSON.parse(promise.toString())

}






// Returns the home page
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, './homepage.html'));
});

// Returns the number of thread/comment pages available to view
app.get("/getpagecount", async function (req, res) {
  var page_count = 0

  // Reads the thread_db file and returns the number of pages
  var files = await open_json_file(thread_db_fp)
  var page_count = item_count_to_page_count(files["threads"].length)
  res.send({ 'page_count': page_count })
});
app.get("/getcommentcount", async function (req, res) {
  var thread_id = req.query["thread-id"]
  var comment_count = 0

  // Reads the thread_db file and returns the number of pages
  var files = await open_json_file(comment_db_fp)
  for (let i = 0; i < files["comments"].length; i++) {
    if (files.comments[i]["parent"] == thread_id) {
      comment_count += 1
    }
  }


  var page_count = item_count_to_page_count(comment_count)

  res.send({ 'page_count': page_count })
});


// Returns the five threads/comments that satisfy the user's request
app.get("/threads", async function (req, res) {
  var select = dict_get(req.query, "select", "date-newest");
  var search = dict_get(req.query, "search", "");
  var page = parseInt(dict_get(req.query, "page", '1'));

  var files = await open_json_file(thread_db_fp);
  var thread_arr = files["threads"]
  var arr = []

  for (let i = 0; i < thread_arr.length; i++) {
    if (thread_arr[i]["title"].includes(search)) {
      arr.push([thread_arr[i]["id"], thread_arr[i]["title"], thread_arr[i]["body"], thread_arr[i]["date"],
      thread_arr[i]["likes"], thread_arr[i]["comments"]])
    }
  }

  // Sorting the array
  if (select == 'date-newest') {
    arr.sort(t_compareSortNewest);
  }
  else if (select == 'date-oldest') {
    arr.sort(t_compareSortOldest);
  }
  else if (select == 'likes') {
    arr.sort(t_compareLikes);
  }
  else if (select == 'comments') {
    arr.sort(t_compareComments);
  }

  var start = (page - 1) * 5
  var end = Math.min(page * 5, arr.length)

  items = arr.slice(start, end)
  while (items.length < 5) {
    items.push(['_', '_', '_', '_', '_', '_'])
  }

  res.send(JSON.stringify(items))
})
app.get("/comments", async function (req, res) {
  var select = dict_get(req.query, "select", "date-newest");
  var search = dict_get(req.query, "search", "");
  var page = parseInt(dict_get(req.query, "page", '1'));
  var thread_id = req.query["thread-id"]

  var files = await open_json_file(comment_db_fp);
  var comment_arr = files["comments"]
  var arr = []

  for (let i = 0; i < comment_arr.length; i++) {
    if (comment_arr[i]["body"].includes(search) && comment_arr[i]["parent"] == thread_id) {
      arr.push([comment_arr[i]["id"], comment_arr[i]["body"], comment_arr[i]["date"],
      comment_arr[i]["likes"], comment_arr[i]["parent"]])
    }
  }
  // Sorting the array
  if (select == 'date-newest') {
    arr.sort(c_compareSortNewest);
  }
  else if (select == 'date-oldest') {
    arr.sort(c_compareSortOldest);
  }
  else if (select == 'likes') {
    arr.sort(c_compareLikes);
  }

  var start = (page - 1) * 5
  var end = Math.min(page * 5, arr.length)

  items = arr.slice(start, end)
  while (items.length < 5) {
    items.push(['_', '_', '_', '_', '_', '_'])
  }

  res.send(JSON.stringify(items))
})


// Returns information about an individual thread
app.get("/threadinfo", async function (req, res) {
  var thread_id = req.query["id"]
  var files = await open_json_file(thread_db_fp)
  thread_arr = files["threads"]

  for (var i = 0; i < thread_arr.length; i++) {
    if (thread_arr[i]["id"] == thread_id) {
      res.send(thread_arr[i])
    }
  }

});

// Creates a new thread/comment
app.post("/createnewthread", async function (req, res) {

  // Getting variables from the body

  var thread_title = req.body["title"];
  var thread_text = req.body["body"];

  // Opening the ID database and getting the least-recently used ID. 
  // This is the equivalent of generating a primary key in a database.
  var jsonData = await open_json_file(thread_id_fp)
  var id_int = parseInt(jsonData["id"])
  var new_id_int = id_int + 1
  jsonData["id"] = new_id_int

  fspromise.writeFile(thread_id_fp, JSON.stringify(jsonData));

  // Gets the correct ID string to add to the thread
  var id_string = int_to_id(id_int);

  // Getting the date that the thread was posted
  var date_string = datearr_to_string(get_date_arr())

  // Setting likes and comments
  var likes = 0;
  var comments = 0;


  // Opening thread database
  var jsonData = await open_json_file(thread_db_fp)
  jsonData.threads.push({
    "id": id_string,
    "title": thread_title,
    "body": thread_text,
    "date": date_string,
    "likes": likes,
    "comments": comments,
  })

  fspromise.writeFile(thread_db_fp, JSON.stringify(jsonData));
  res.json({})
});
app.post("/addcomment", async function (req, res) {

  // Getting variables from the body
  var thread_id = req.body["thread-id"]
  var comment_body = req.body["body"];

  // Opening the ID database and getting the least-recently used ID. 
  // This is the equivalent of generating a primary key in a database.
  var jsonData = await open_json_file(comment_id_fp)
  var id_int = parseInt(jsonData["id"])
  var new_id_int = id_int + 1
  jsonData["id"] = new_id_int

  fspromise.writeFile(comment_id_fp, JSON.stringify(jsonData));

  // Gets the correct ID string to add to the thread
  var id_string = int_to_id(id_int);

  // Getting the date that the comment was posted
  var date_string = datearr_to_string(get_date_arr())

  // Setting likes and comments
  var likes = 0;

  // Opening comment database
  var jsonData = await open_json_file(comment_db_fp)
  jsonData.comments.push({
    "id": id_string,
    "body": comment_body,
    "date": date_string,
    "likes": likes,
    "parent": thread_id,
  })

  fspromise.writeFile(comment_db_fp, JSON.stringify(jsonData));

  // Adding 1 comment to thread database
  var threadJsonData = await open_json_file(thread_db_fp)
  for (var i = 0; i < threadJsonData.threads.length; i++) {
    if (threadJsonData.threads[i]["id"] == thread_id) {
      threadJsonData.threads[i]["comments"] += 1
    }
  }

  fspromise.writeFile(thread_db_fp, JSON.stringify(threadJsonData));


  res.json({})
});


// Deletes a given thread/comment
app.post("/deletethread", async function (req, res) {
  var thread_deletion_id = req.body["thread-id"]

  var jsonData = await open_json_file(thread_db_fp);
  var ind_to_delete = -1

  for (var i = 0; i < jsonData.threads.length; i++) {
    if (jsonData.threads[i]["id"] == thread_deletion_id) {
      ind_to_delete = i;
    }
  }

  jsonData.threads.splice(ind_to_delete, 1);
  fspromise.writeFile(thread_db_fp, JSON.stringify(jsonData));

  // Deleting comments with the thread as the ID
  var jsonData = await open_json_file(comment_db_fp);
  var inds_to_delete = []

  for (var i = 0; i < jsonData.comments.length; i++) {
    if (jsonData.comments[i]["parent"] == thread_deletion_id) {
      inds_to_delete.push(i);
    }
  }

  while (inds_to_delete.length > 0) {
    ind = inds_to_delete.pop()
    jsonData.comments.splice(ind, 1);
  }

  fspromise.writeFile(comment_db_fp, JSON.stringify(jsonData));


  res.json({})

});
app.post("/deletecomment", async function (req, res) {
  var comment_deletion_id = req.body["comment-id"]

  var jsonData = await open_json_file(comment_db_fp);
  var ind_to_delete = -1

  var parent = -1

  for (var i = 0; i < jsonData.comments.length; i++) {
    if (jsonData.comments[i]["id"] == comment_deletion_id) {
      ind_to_delete = i;
      parent = jsonData.comments[i]["parent"]
    }
  }

  jsonData.comments.splice(ind_to_delete, 1);

  fspromise.writeFile(comment_db_fp, JSON.stringify(jsonData));


  // Deleting 1 comment from thread database
  var threadJsonData = await open_json_file(thread_db_fp)
  for (var i = 0; i < threadJsonData.threads.length; i++) {
    if (threadJsonData.threads[i]["id"] == parent) {
      threadJsonData.threads[i]["comments"] -= 1
    }
  }

  fspromise.writeFile(thread_db_fp, JSON.stringify(threadJsonData));


  res.json({})

});


// Likes a given thread/comment
app.post("/likethread", async function (req, res) {
  var thread_id = req.body["thread-id"]
  var like_number = req.body["like-number"]

  var jsonData = await open_json_file(thread_db_fp);
  var ind = -1

  for (var i = 0; i < jsonData.threads.length; i++) {
    if (jsonData.threads[i]["id"] == thread_id) {
      ind = i;
    }
  }

  jsonData.threads[ind]["likes"] += like_number;

  fspromise.writeFile(thread_db_fp, JSON.stringify(jsonData));

  res.json({})

});
app.post("/likecomment", async function (req, res) {
  var comment_id = req.body["comment-id"]
  var like_number = req.body["like-number"]

  var jsonData = await open_json_file(comment_db_fp);
  var ind = -1

  for (var i = 0; i < jsonData.comments.length; i++) {
    if (jsonData.comments[i]["id"] == comment_id) {
      ind = i;
    }
  }

  jsonData.comments[ind]["likes"] += like_number;

  fspromise.writeFile(comment_db_fp, JSON.stringify(jsonData));

  res.json({})

});

app.post("/uploadimage", upload.single("file"), async function (req, res) {
  

  var tempPath = req.file.path;
  
  var suffix = path.extname(req.file.originalname).toLowerCase()

  var thread_id = req.body["hidden-thread-id"]

  // Opening the ID database and getting the least-recently used ID. 
  // This is the equivalent of generating a primary key in a database.
  var jsonData = await open_json_file(comment_id_fp)
  var id_int = parseInt(jsonData["id"])
  var new_id_int = id_int + 1
  jsonData["id"] = new_id_int
  fspromise.writeFile(comment_id_fp, JSON.stringify(jsonData));
  var id_string = int_to_id(id_int);

  var targetPath = path.join(__dirname, `./uploads/${id_string}.png`);

  if (suffix === ".png" || suffix === ".jpg") {
    promise = await fspromise.rename(tempPath, targetPath)
  }
  res.status(200);
});


app.listen(port, function () {
  console.log(`http://127.0.0.1:${port}/`)
});
