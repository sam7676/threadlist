const express = require("express");
const path = require('node:path');
const fspromise = require('fs/promises');
const fs = require('fs')
const favicon = require('serve-favicon')
const multer = require('multer')
const sharp = require('sharp')

const app = express();
const port = 8000;

const date_map = {
  "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4,
  "May": 5, "Jun": 6, "Jul": 7, "Aug": 8, "Sep": 9,
  "Oct": 10, "Nov": 11, "Dec": 12
}
const upload = multer({ dest: 'static/uploads/' })

const thread_db_fp = 'db\\thread_db.json'
const thread_id_fp = 'db\\thread_id.json'
const comment_db_fp = 'db\\comment_db.json'
const comment_id_fp = 'db\\comment_id.json'

const ID_KEY_LENGTH = 8
const THREAD_MIN_TITLE_LENGTH = 1
const THREAD_MAX_TITLE_LENGTH = 100
const THREAD_MIN_BODY_LENGTH = 0
const THREAD_MAX_BODY_LENGTH = 4000
const COMMENT_MIN_LENGTH = 0
const COMMENT_MAX_LENGTH = 4000

const THREAD_LIKES_INDEX = 5
const THREAD_COMMENTS_INDEX = 6
const THREAD_DATES_INDEX = 3
const THREAD_UPDATE_INDEX = 4
const COMMENT_LIKES_INDEX = 3
const COMMENT_DATES_INDEX = 2
const COMMENT_IMAGE_INDEX = 5

const STRING_TYPE = "string"
const NUMBER_TYPE = "number"
const UNDEFINED_TYPE = "undefined"
const thread_select_set = new Set(['date-newest', 'date-oldest', 'last-update', 'likes', 'comments'])
const comment_select_set = new Set(['date-newest', 'date-oldest', 'likes', 'has-image'])

app.use(express.static('static'));
app.use(favicon(path.join(__dirname, 'static', 'favicon.ico')))
app.use(express.json())

let d = ''

d = `Error checking helper functions`

// Checks if the argument given is of the given type
function check_type(inp, t) {
  if (!(typeof (inp) == t)) {
    throw "Argument type not matching required type"
  }
}
// Checks if the argument given is non-negative
function check_non_negative(number) {
  if (number < 0) {
    throw "Number must be non-negative"
  }
}
// Checks that a given ID length is not greater than the maximum length
function check_valid_id(str) {
  if (str.length > ID_KEY_LENGTH) {
    throw "ID length greater than the maximum length"
  }
}
// Checks that a dictionary contains a given item
function check_dict_has(dict, item) {
  try {
    check_type(dict[item], UNDEFINED_TYPE)
    throw "Item not in dictioanry"
  }
  catch {}
}
function check_set_has(set, item) {
  if (!set.has(item)) {
    throw "Set does not contain item"
  }
}
function check_length(str, min_length, max_length) {
  check_type(str, STRING_TYPE)
  if (!(str.length >= min_length && str.length <= max_length)) {
    throw "String length not in range"
  }
}

d = `Other helper functions`

// Converts the number of items to the number of pages that represents it
function item_count_to_page_count(num) {
  // Error handling
  check_type(num, NUMBER_TYPE)
  check_non_negative(num)

  if (num == 0) {
    return 1
  }
  else {
    return Math.ceil(num / 5)
  }
}
// Function that provides lookups for a dictionary and also provides a default
function dict_get(object, key, default_value) {
  const result = object[key];
  return (typeof result !== "undefined") ? result : default_value;
}
// Comparators for sorting threads
// Error handling is ignored, as we will always assume our thread database is in the form 
// [id, title, body, date, lastupdate, likes, comments]
// and our comment database is in the form [id, body, date, likes, parent, image]
function t_compareLikes(a, b) {
  if (a[THREAD_LIKES_INDEX] === b[THREAD_LIKES_INDEX]) {
    return 0;
  }
  else {
    return (a[THREAD_LIKES_INDEX] > b[THREAD_LIKES_INDEX]) ? -1 : 1;
  }
}
function t_compareComments(a, b) {
  if (a[THREAD_COMMENTS_INDEX] === b[THREAD_COMMENTS_INDEX]) {
    return 0;
  }
  else {
    return (a[THREAD_COMMENTS_INDEX] > b[THREAD_COMMENTS_INDEX]) ? -1 : 1;
  }
}
function t_compareSortNewest(a, b) {
  const date_arr_a = datestring_to_arr(a[THREAD_DATES_INDEX]);
  const date_arr_b = datestring_to_arr(b[THREAD_DATES_INDEX]);

  for (let i = 0; i < date_arr_a.length; i++) {
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
  const date_arr_a = datestring_to_arr(a[THREAD_DATES_INDEX]);
  const date_arr_b = datestring_to_arr(b[THREAD_DATES_INDEX]);

  for (let i = 0; i < date_arr_a.length; i++) {
    if (date_arr_a[i] < date_arr_b[i]) {
      return -1;
    }
    else if (date_arr_a[i] > date_arr_b[i]) {
      return 1;
    }
  }
  return 0;
}
function t_compareSortLastUpdate(a, b) {
  const date_arr_a = datestring_to_arr(a[THREAD_UPDATE_INDEX]);
  const date_arr_b = datestring_to_arr(b[THREAD_UPDATE_INDEX]);

  for (let i = 0; i < date_arr_a.length; i++) {
    if (date_arr_a[i] > date_arr_b[i]) {
      return -1;
    }
    else if (date_arr_a[i] < date_arr_b[i]) {
      return 1;
    }
  }
  return 0;
}
function c_compareLikes(a, b) {
  if (a[COMMENT_LIKES_INDEX] === b[COMMENT_LIKES_INDEX]) {
    return 0;
  }
  else {
    return (a[COMMENT_LIKES_INDEX] > b[COMMENT_LIKES_INDEX]) ? -1 : 1;
  }
}
function c_compareSortNewest(a, b) {
  const date_arr_a = datestring_to_arr(a[COMMENT_DATES_INDEX]);
  const date_arr_b = datestring_to_arr(b[COMMENT_DATES_INDEX]);

  for (let i = 0; i < date_arr_a.length; i++) {
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
  const date_arr_a = datestring_to_arr(a[COMMENT_DATES_INDEX]);
  const date_arr_b = datestring_to_arr(b[COMMENT_DATES_INDEX]);

  for (let i = 0; i < date_arr_a.length; i++) {
    if (date_arr_a[i] < date_arr_b[i]) {
      return -1;
    }
    else if (date_arr_a[i] > date_arr_b[i]) {
      return 1;
    }
  }
  return 0;
}
function c_compareSortHasImage(a, b) {
  if (a[COMMENT_IMAGE_INDEX] === '_' && b[COMMENT_IMAGE_INDEX] === '_') {
    return 0
  }
  else if (a[COMMENT_IMAGE_INDEX] === '_') {
    return 1
  }
  else {
    return -1
  }
}
// Converts an integer to an ID key used for looking up threads
function int_to_id(x) {

  check_type(x, NUMBER_TYPE);
  check_non_negative(x);

  const int_string = x.toString();

  check_valid_id(int_string);

  const padding = '0'.repeat(ID_KEY_LENGTH - int_string.length);
  const id_string = padding.concat(int_string);
  return id_string;
}
// Returns an array representing the current time and date
// No error handling needed, as inputs are generated by the computer and not the user
function get_date_arr() {
  let date = new Date()
  let date_arr = []
  date = date.toString()
  date = date.split(" ")
  const time = date[4].split(":")
  date_arr = [parseInt(date[3]), date_map[date[1]], parseInt(date[2]),
  parseInt(time[0]), parseInt(time[1]), parseInt(time[2])]
  return date_arr

}
// Converts a date array into a string, or vice versa.
function datearr_to_string(a) {
  let s = ''
  for (let i = 0; i < a.length; i++) {
    let a_i_string = a[i].toString()
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
  const s_arr = a.split("-")
  let b = []
  for (let i = 0; i < s_arr.length; i++) {
    b.push(parseInt(s_arr[i]))
  }
  return b;

}
// Returns the JSON representation of a given JSON filepath
async function open_json_file(filepath) {
  check_type(filepath, STRING_TYPE)

  if (!check_file_exists(filepath)) {
    throw "File not found"
  }
  try {
    const promise = await fspromise.readFile(filepath)
    return JSON.parse(promise.toString())
  }
  catch {
    throw "File not read"
  }



}
// Checks if a file exists. Not error handling, returns a boolean.
function check_file_exists(file) {
  return fs.promises.access(file, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false)
}
// Tries to delete a file
async function delete_file(image_file_path) {
  try {
    check_type(image_file_path, STRING_TYPE)
    let res = await check_file_exists(image_file_path)
    if (res == true) {
      fspromise.unlink(image_file_path)
    }
  }
  catch (e) {
    return
  }
}
// Generates an id key for a given path
async function generate_id_key(path) {
  let jsonData = await open_json_file(path)
  const id_int = parseInt(jsonData["id"])
  const new_id_int = id_int + 1
  jsonData["id"] = new_id_int

  fspromise.writeFile(path, JSON.stringify(jsonData));

  // Gets the correct ID string to add to the thread
  return int_to_id(id_int);

}

async function resize_image(old_path, new_path) {

  const image = await sharp(old_path).flatten({ background: '#ffffff' })
  const metadata = await image.metadata()
  let width = metadata.width
  let height = metadata.height

  if (width > 400) {
    const ratio = width / 400
    width = 400
    height = Math.ceil(height / ratio)
  }
  else if (width < 100) {
    const ratio = width / 100
    width = 100
    height = Math.ceil(height / ratio)
    
  }

  const new_image = await image.resize(width, height)
  try {
    await new_image.toFile(new_path)
  }
  catch (e) {
    console.log("Backend problem - error with resize_image module")
    console.log(e)
  }
}



d = `App get requests`

// Returns the home page
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, './static/homepage.html'));
});

// Returns the number of thread/comment pages available to view
app.get("/getpagecount", async function (req, res) {
  let page_count = 0

  // Reads the thread_db file and returns the number of pages
  const files = await open_json_file(thread_db_fp)
  try {
    page_count = item_count_to_page_count(files["threads"].length)
    res.send({ 'page_count': page_count });
  }
  catch (e) {
    console.log("Backend problem - /getpagecount")
    console.log(e);
    res.status(400).end();
    return
  }

});
app.get("/getcommentcount", async function (req, res) {

  // Checking the query parameter appears in the request. User input validation
  try {
    check_dict_has(req, "query")
    check_dict_has(req.query, "thread-id")
  }
  catch {
    res.status(400).end()
    return
  }

  // Checking thread ID is valid. User input validation
  const thread_id = req.query["thread-id"]
  try {
    check_type(thread_id, STRING_TYPE)
    check_valid_id(thread_id)
  }
  catch {
    res.status(400).end();
    return
  }


  let comment_count = 0
  try {
    // Reads the thread_db file and returns the number of pages
    const files = await open_json_file(comment_db_fp)
    for (let i = 0; i < files["comments"].length; i++) {
      if (files.comments[i]["parent"] == thread_id) {
        comment_count += 1
      }
    }
  }
  catch (e) {
    console.log("Backend problem - /getcommentcount - comment database not opened")
    console.log(e);
    res.status(400).end();
    return
  }

  const page_count = item_count_to_page_count(comment_count)
  res.send({ 'comment_count': comment_count, 'page_count': page_count })
});

// Returns the five threads/comments that satisfy the user's request
app.get("/threads", async function (req, res) {

  // Checking query appears as a parameter. User input validation.
  try {
    check_dict_has(req, "query")
  }
  catch {
    res.status(400).end()
    return
  }


  // Getting parameters

  // Checking select is a valid select item, and page is an integer. User input validation.
  const select = dict_get(req.query, "select", "date-newest");
  const search = dict_get(req.query, "search", "");
  let page = dict_get(req.query, "page", '1')
  try {
    check_set_has(thread_select_set, select)
    page = parseInt(page);
  }
  catch {
    res.status(400).end()
    return
  }

  // Opening the threads database
  try {
    const files = await open_json_file(thread_db_fp);
    const thread_arr = files["threads"]
    let arr = []

    // Getting all threads that include the search result and placing into an array
    for (let i = 0; i < thread_arr.length; i++) {
      if (thread_arr[i]["title"].includes(search)) {
        arr.push([thread_arr[i]["id"], thread_arr[i]["title"], thread_arr[i]["body"], thread_arr[i]["date"], thread_arr[i]["lastupdate"],
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
    else if (select == 'last-update') {
      arr.sort(t_compareSortLastUpdate);
    }
    else if (select == 'likes') {
      arr.sort(t_compareLikes);
    }
    else if (select == 'comments') {
      arr.sort(t_compareComments);
    }

    // Slicing the array to return 5 items
    const start = (page - 1) * 5
    const end = Math.min(page * 5, arr.length)

    let items = arr.slice(start, end)
    while (items.length < 5) {
      items.push(['_', '_', '_', '_', '_', '_','_'])
    }

    res.send(JSON.stringify(items))
  }
  catch (e) {
    console.log("Backend problem - /threads")
    console.log(e)
    res.status(400).end()
    return
  }
})
app.get("/comments", async function (req, res) {

  // Checking query appears as a parameter. User input validation.
  try {
    check_dict_has(req, "query")
  }
  catch {
    res.status(400).end()
    return
  }

  const select = dict_get(req.query, "select", "date-newest");
  const search = dict_get(req.query, "search", "");
  const thread_id = req.query["thread-id"]
  let page = dict_get(req.query, "page", '1');

  // User input validation
  try {
    check_set_has(comment_select_set, select);
    page = parseInt(page);
    check_type(thread_id, STRING_TYPE);
    check_valid_id(thread_id);
  }
  catch {
    res.status(400).end()
    return
  }


  try {
    const files = await open_json_file(comment_db_fp);
    const comment_arr = files["comments"]
    let arr = []

    for (let i = 0; i < comment_arr.length; i++) {
      if (comment_arr[i]["body"].includes(search) && comment_arr[i]["parent"] == thread_id) {
        arr.push([comment_arr[i]["id"], comment_arr[i]["body"], comment_arr[i]["date"],
        comment_arr[i]["likes"], comment_arr[i]["parent"], comment_arr[i]["image"]])
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
    else if (select == 'has-image') {
      arr.sort(c_compareSortHasImage)
    }

    const start = (page - 1) * 5
    const end = Math.min(page * 5, arr.length)

    let items = arr.slice(start, end)
    while (items.length < 5) {
      items.push(['_', '_', '_', '_', '_', '_'])
    }

    res.send(JSON.stringify(items))
  }
  catch (e) {
    console.log("Backend problem - /comments")
    console.log(e)
    res.status(400).end();
    return
  }
})

// Returns information about an individual thread
app.get("/threadinfo", async function (req, res) {

  // Validating body
  try {
    check_dict_has(req, "query")
    check_dict_has(req.query, "id")
  }
  catch {
    res.status(400).end()
    return
  }

  let thread_id = req.query["id"]
  try {
    check_type(thread_id, STRING_TYPE);
    check_valid_id(thread_id);
  }
  catch {
    res.status(400).end()
    return
  }


  try {
    const files = await open_json_file(thread_db_fp)
    const thread_arr = files["threads"]

    for (let i = 0; i < thread_arr.length; i++) {
      if (thread_arr[i]["id"] == thread_id) {
        res.send(thread_arr[i])
        return
      }
    }
    res.status(400).end()
    return
  }
  catch (e) {
    console.log("Backend problem - /threadinfo")
    console.log(e)
    res.status(400).end()
    return
  }

});

app.get("/getlastupdate", async function (req, res) {

  // Validating body
  try {
    check_dict_has(req, "query")
    check_dict_has(req.query, "thread-id")
  }
  catch {
    res.status(400).end()
    return
  }
  let thread_id = req.query["thread-id"]
  try {
    check_type(thread_id, STRING_TYPE);
    check_valid_id(thread_id);
  }
  catch {
    res.status(400).end()
    return
  }

  try {
    const files = await open_json_file(thread_db_fp)
    const thread_arr = files["threads"]

    for (let i = 0; i < thread_arr.length; i++) {
      if (thread_arr[i]["id"] == thread_id) {
        res.json({"last_update": thread_arr[i]["lastupdate"]})
        return
      }
    }
    res.status(400).end()
    return
  }
  catch (e) {
    console.log("Backend problem - /getlastupdate")
    console.log(e)
    res.status(400).end()
    return
  }
});


d = `App post requests`

// Creates a new thread/comment
app.post("/createnewthread", async function (req, res) {

  // Checking all body elements are present
  try {
    check_dict_has(req, "body")
    check_dict_has(req.body, "title")
    check_dict_has(req.body, "body")
  }
  catch {
    res.status(400).end()
    return
  }

  // Getting variables from the body
  const thread_title = req.body["title"].trim();
  const thread_text = req.body["body"].trim();


  // Checking length of thread
  try {
    check_length(thread_title, THREAD_MIN_TITLE_LENGTH, THREAD_MAX_TITLE_LENGTH)
    check_length(thread_text, THREAD_MIN_BODY_LENGTH, THREAD_MAX_BODY_LENGTH)
  }
  catch {
    res.json({ "error": "length" })
    return;
  }


  try {

    // Opening the ID database and getting the least-recently used ID. 
    // This is the equivalent of generating a primary key in a database.
    const id_string = await generate_id_key(thread_id_fp)

    // Getting the date that the thread was posted
    const date_string = datearr_to_string(get_date_arr())

    // Setting likes and comments
    const likes = 0;
    const comments = 0;


    // Opening thread database
    let jsonData = await open_json_file(thread_db_fp)
    jsonData.threads.push({
      "id": id_string,
      "title": thread_title,
      "body": thread_text,
      "date": date_string,
      "lastupdate": date_string,
      "likes": likes,
      "comments": comments,
    })

    fspromise.writeFile(thread_db_fp, JSON.stringify(jsonData));
    res.json({ "thread-id": id_string })
    return

  }
  catch (e) {
    console.log("Backend problem - /createnewthread")
    console.log(e)
    res.status(400).end()
    return
  }

});
app.post("/addcomment", upload.single("file"), async function (req, res) {

  // Checking dict is a body
  try {
    check_dict_has(req, "body")
  }
  catch {
    res.status(400).end();
    return;
  }

  // Opening the ID database and getting the least-recently used ID. 
  // This is the equivalent of generating a primary key in a database.
  const id_string = await generate_id_key(comment_id_fp)

  let img_path = '_'


  try {

    if (req["file"] !== undefined) {
      const tempPath = req.file.path;
      const suffix = path.extname(req.file.originalname).toLowerCase()

      if (!(suffix === ".png" || suffix === ".jpg" || suffix === '.jpeg')) {
        res.json({"error":"file"})
        console.log(`${tempPath} - temp path`)
        delete_file(tempPath);
        return;
      }

      const newTempPath = `${tempPath}.jpg`

      const targetPath = path.join(__dirname, `./static/uploads/${id_string}.jpg`);
      await fspromise.rename(tempPath, newTempPath)
      await resize_image(newTempPath, targetPath)
      delete_file(newTempPath);

      img_path = `./uploads/${id_string}.jpg`
    }

  }
  catch (e) {
    console.log("Backend problem - /addcomment")
    console.log(e)
    res.status(400).end()
    return;
  }

  let thread_id = ''
  let comment_body = ''

  try {
    check_dict_has(req.body, "thread-id")
    check_dict_has(req.body, "comment-body")
    thread_id = req.body["thread-id"]
    comment_body = req.body["comment-body"].trim()

    check_type(thread_id, STRING_TYPE)
    check_type(comment_body, STRING_TYPE)

    check_valid_id(thread_id)
    check_length(comment_body, COMMENT_MIN_LENGTH, COMMENT_MAX_LENGTH)
  }
  catch {
    res.status(400).end()
    return;
  }


  if (img_path == '_' && comment_body == '') {
    res.json({"error":"content"})
    return
  }

  try {
    // Adding comment to db
    const date_string = datearr_to_string(get_date_arr());
    const likes = 0;
    let jsonData = await open_json_file(comment_db_fp)

    jsonData.comments.push({
      "id": id_string,
      "body": comment_body,
      "date": date_string,
      "likes": likes,
      "parent": thread_id,
      "image": img_path,
    })


    await fspromise.writeFile(comment_db_fp, JSON.stringify(jsonData));

    // Adding 1 comment to thread database
    let threadJsonData = await open_json_file(thread_db_fp)
    for (let i = 0; i < threadJsonData.threads.length; i++) {
      if (threadJsonData.threads[i]["id"] == thread_id) {
        threadJsonData.threads[i]["comments"] += 1
        threadJsonData.threads[i]["lastupdate"] = date_string
      }
    }

    await fspromise.writeFile(thread_db_fp, JSON.stringify(threadJsonData));
    res.json({});
    return
  }
  catch (e) {
    console.log("Backend problem - /addcomment")
    console.log(e)
    res.status(400).end()
    return
  }
});


app.post("/deletethread", async function (req, res) {
  let thread_deletion_id = ''
  try {
    check_dict_has(req, "body")
    check_dict_has(req.body, "thread-id")
    thread_deletion_id = req.body["thread-id"]
    check_valid_id(thread_deletion_id);
  }
  catch {
    res.status(400).end()
    return
  }

  let threadJsonData = await open_json_file(thread_db_fp);
  let ind_to_delete = -1

  for (let i = 0; i < threadJsonData.threads.length; i++) {
    if (threadJsonData.threads[i]["id"] == thread_deletion_id) {
      ind_to_delete = i;
    }
  }

  if (ind_to_delete == -1) {
    res.status(400).end();
    return;
  }

  try {
    threadJsonData.threads.splice(ind_to_delete, 1);
    fspromise.writeFile(thread_db_fp, JSON.stringify(threadJsonData));

    // Deleting comments with the thread as the ID
    let commentJsonData = await open_json_file(comment_db_fp);
    let inds_to_delete = []

    for (let i = 0; i < commentJsonData.comments.length; i++) {
      if (commentJsonData.comments[i]["parent"] == thread_deletion_id) {
        inds_to_delete.push(i);
      }
    }

    while (inds_to_delete.length > 0) {
      const ind = inds_to_delete.pop()
      const image_src = commentJsonData.comments[ind]["image"]
      if (image_src !== '_') {
        const comment_id = commentJsonData.comments[ind]["id"]
        const image_file_path = `./static/uploads/${comment_id}.jpg`
        delete_file(image_file_path);
      }
      commentJsonData.comments.splice(ind, 1);
    }
    fspromise.writeFile(comment_db_fp, JSON.stringify(commentJsonData));

    res.json({})
  }
  catch (e) {
    console.log("Backend problem - /deletethread")
    console.log(e)
    res.status(400).end()
    return;
  }

});
app.post("/deletecomment", async function (req, res) {
  let comment_deletion_id = ''
  try {
    check_dict_has(req, "body")
    check_dict_has(req.body, "comment-id")
    comment_deletion_id = req.body["comment-id"]
    check_valid_id(comment_deletion_id);
  }
  catch {
    res.status(400).end();
    return;
  }

  try {

    let commentJsonData = await open_json_file(comment_db_fp);
    let ind_to_delete = -1

    let parent = -1

    for (let i = 0; i < commentJsonData.comments.length; i++) {
      if (commentJsonData.comments[i]["id"] == comment_deletion_id) {
        ind_to_delete = i;
        parent = commentJsonData.comments[i]["parent"]
      }
    }

    if (ind_to_delete == -1) {
      res.status(400).end()
      return;
    }

    commentJsonData.comments.splice(ind_to_delete, 1);

    fspromise.writeFile(comment_db_fp, JSON.stringify(commentJsonData));


    // Deleting 1 comment from thread database
    let threadJsonData = await open_json_file(thread_db_fp)
    for (let i = 0; i < threadJsonData.threads.length; i++) {
      if (threadJsonData.threads[i]["id"] == parent) {
        threadJsonData.threads[i]["comments"] -= 1
      }
    }

    fspromise.writeFile(thread_db_fp, JSON.stringify(threadJsonData));

    // Deleting image (if it exists)
    let image_file_path = `./static/uploads/${comment_deletion_id}.jpg`
    if (check_file_exists(image_file_path)) {
      delete_file(image_file_path);
    }


    res.json({})
    return;


  }
  catch (e) {
    console.log("Backend problem - /deletecomment")
    console.log(e)
    res.status(400).end()
    return;
  }

});


// Likes a given thread/comment
app.post("/likethread", async function (req, res) {
  let thread_id = ''
  let like_number = 0

  try {
    check_dict_has(req, "body")
    check_dict_has(req.body, "thread-id")
    check_dict_has(req.body, "like-number")
    thread_id = req.body["thread-id"]

    check_valid_id(thread_id)

    like_number = req.body["like-number"]
    check_type(like_number, NUMBER_TYPE)

  }
  catch {
    res.status(400).end()
    return;
  }

  try {
    let jsonData = await open_json_file(thread_db_fp);
    let ind = -1

    for (let i = 0; i < jsonData.threads.length; i++) {
      if (jsonData.threads[i]["id"] == thread_id) {
        ind = i;
      }
    }

    if (ind == -1) {
      res.status(400).end()
      return;
    }

    jsonData.threads[ind]["likes"] += like_number;

    fspromise.writeFile(thread_db_fp, JSON.stringify(jsonData));

    res.json({})
  }
  catch (e) {
    console.log("Backend problem - /likethread")
    console.log(e)
    res.status(400).end()
    return;
  }

});
app.post("/likecomment", async function (req, res) {
  let comment_id = ''
  let like_number = 0

  try {
    check_dict_has(req, "body")
    check_dict_has(req.body, "comment-id")
    check_dict_has(req.body, "like-number")
    comment_id = req.body["comment-id"]

    check_valid_id(comment_id)

    like_number = req.body["like-number"]
    like_number = parseInt(like_number)

  }
  catch {
    res.status(400).end()
    return;
  }


  try {


    let jsonData = await open_json_file(comment_db_fp);
    let ind = -1

    for (let i = 0; i < jsonData.comments.length; i++) {
      if (jsonData.comments[i]["id"] == comment_id) {
        ind = i;
      }
    }

    if (ind == -1) {
      res.status(400).end()
      return
    }

    jsonData.comments[ind]["likes"] += like_number;

    fspromise.writeFile(comment_db_fp, JSON.stringify(jsonData));

    res.json({})
    return

  }
  catch (e) {
    console.log("Backend problem - /likecomment")
    console.log(e)
    res.status(400).end()
    return;
  }

});



app.listen(port, function () {
  console.log(`http://127.0.0.1:${port}/`)
});
