const express = require('express');
const path = require('node:path');
const fspromise = require('fs/promises');
const fs = require('fs');
const favicon = require('serve-favicon');
const multer = require('multer');
const sharp = require('sharp');

const app = express();
const port = 8800;

const dateMap = {
  Jan: 1,
Feb: 2,
Mar: 3,
Apr: 4,
  May: 5,
Jun: 6,
Jul: 7,
Aug: 8,
Sep: 9,
  Oct: 10,
Nov: 11,
Dec: 12
};
const upload = multer({ dest: 'static/uploads/' });

// Filepaths for JSON databases
const threadDbFp = 'db\\thread_db.json';
const threadIdFp = 'db\\thread_id.json';
const commentDbFp = 'db\\comment_db.json';
const commentIdFp = 'db\\comment_id.json';

const ID_KEY_LENGTH = 8;
const THREAD_MIN_TITLE_LENGTH = 1;
const THREAD_MAX_TITLE_LENGTH = 100;
const THREAD_MIN_BODY_LENGTH = 0;
const THREAD_MAX_BODY_LENGTH = 600;
const COMMENT_MIN_LENGTH = 0;
const COMMENT_MAX_LENGTH = 600;

// Array indices. To do with how data is encoded.
const THREAD_LIKES_INDEX = 5;
const THREAD_COMMENTS_INDEX = 6;
const THREAD_DATES_INDEX = 3;
const THREAD_UPDATE_INDEX = 4;
const COMMENT_LIKES_INDEX = 3;
const COMMENT_DATES_INDEX = 2;
const COMMENT_IMAGE_INDEX = 5;

const MIN_IMAGE_WIDTH = 50;
const MAX_IMAGE_WIDTH = 300;

// Important variable types
const STRING_TYPE = 'string';
const NUMBER_TYPE = 'number';
const UNDEFINED_TYPE = 'undefined';

// Options for sorting threads/comments
const threadSelectSet = new Set(['date-newest', 'date-oldest', 'last-update', 'likes', 'comments']);
const commentSelectSet = new Set(['date-newest', 'date-oldest', 'likes', 'has-image']);

app.use(express.static('static'));
app.use(favicon(path.join(__dirname, 'static', 'favicon.ico')));
app.use(express.json());

// Helper functions

// Checks that a given ID length is not greater than the maximum length
function checkValidID (stri) {
  return stri.length === ID_KEY_LENGTH;
}
// Converts the number of items to the number of pages that represents it
function itemCountToPageCount (num) {
  if (num === 0) {
    return 1;
  } else {
    return Math.ceil(num / 5);
  }
}
// Function that provides lookups for a dictionary and also provides a default
function dictGet (object, key, defaultValue) {
  const result = object[key];
  return (typeof result !== 'undefined') ? result : defaultValue;
}
// Comparators for sorting threads
// Error handling is ignored, as we will always assume our thread database is in the form
// [id, title, body, date, lastupdate, likes, comments]
// and our comment database is in the form [id, body, date, likes, parent, image]
function threadCompareLikes (a, b) {
  if (a[THREAD_LIKES_INDEX] === b[THREAD_LIKES_INDEX]) {
    return 0;
  } else {
    return (a[THREAD_LIKES_INDEX] > b[THREAD_LIKES_INDEX]) ? -1 : 1;
  }
}
function threadCompareComments (a, b) {
  if (a[THREAD_COMMENTS_INDEX] === b[THREAD_COMMENTS_INDEX]) {
    return 0;
  } else {
    return (a[THREAD_COMMENTS_INDEX] > b[THREAD_COMMENTS_INDEX]) ? -1 : 1;
  }
}
function threadCompareSortNewest (a, b) {
  const dateArrA = datestringToArr(a[THREAD_DATES_INDEX]);
  const dateArrB = datestringToArr(b[THREAD_DATES_INDEX]);

  for (let i = 0; i < dateArrA.length; i++) {
    if (dateArrA[i] > dateArrB[i]) {
      return -1;
    } else if (dateArrA[i] < dateArrB[i]) {
      return 1;
    }
  }
  return 0;
}
function threadCompareSortOldest (a, b) {
  const dateArrA = datestringToArr(a[THREAD_DATES_INDEX]);
  const dateArrB = datestringToArr(b[THREAD_DATES_INDEX]);

  for (let i = 0; i < dateArrA.length; i++) {
    if (dateArrA[i] < dateArrB[i]) {
      return -1;
    } else if (dateArrA[i] > dateArrB[i]) {
      return 1;
    }
  }
  return 0;
}
function threadCompareSortLastUpdate (a, b) {
  const dateArrA = datestringToArr(a[THREAD_UPDATE_INDEX]);
  const dateArrB = datestringToArr(b[THREAD_UPDATE_INDEX]);

  for (let i = 0; i < dateArrA.length; i++) {
    if (dateArrA[i] > dateArrB[i]) {
      return -1;
    } else if (dateArrA[i] < dateArrB[i]) {
      return 1;
    }
  }
  return 0;
}
function commentCompareLikes (a, b) {
  if (a[COMMENT_LIKES_INDEX] === b[COMMENT_LIKES_INDEX]) {
    return 0;
  } else {
    return (a[COMMENT_LIKES_INDEX] > b[COMMENT_LIKES_INDEX]) ? -1 : 1;
  }
}
function commentCompareSortNewest (a, b) {
  const dateArrA = datestringToArr(a[COMMENT_DATES_INDEX]);
  const dateArrB = datestringToArr(b[COMMENT_DATES_INDEX]);

  for (let i = 0; i < dateArrA.length; i++) {
    if (dateArrA[i] > dateArrB[i]) {
      return -1;
    } else if (dateArrA[i] < dateArrB[i]) {
      return 1;
    }
  }
  return 0;
}
function commentCompareSortOldest (a, b) {
  const dateArrA = datestringToArr(a[COMMENT_DATES_INDEX]);
  const dateArrB = datestringToArr(b[COMMENT_DATES_INDEX]);

  for (let i = 0; i < dateArrA.length; i++) {
    if (dateArrA[i] < dateArrB[i]) {
      return -1;
    } else if (dateArrA[i] > dateArrB[i]) {
      return 1;
    }
  }
  return 0;
}
function commentCompareSortHasImage (a, b) {
  if (a[COMMENT_IMAGE_INDEX] === '_' && b[COMMENT_IMAGE_INDEX] === '_') {
    return 0;
  } else if (a[COMMENT_IMAGE_INDEX] === '_') {
    return 1;
  } else {
    return -1;
  }
}
// Converts an integer to an ID key used for looking up threads
function intToID (x) {
  const intString = x.toString();
  if (!typeof (x) === NUMBER_TYPE || intString.length > ID_KEY_LENGTH || x < 0) {
    throw new Error('intToID: input not accepted');
  }

  const padding = '0'.repeat(ID_KEY_LENGTH - intString.length);
  const idString = padding.concat(intString);
  return idString;
}
// Returns an array representing the current time and date
// No error handling needed, as inputs are generated by the computer and not the user
function getDateArr () {
  let date = new Date();
  let dateArr = [];
  date = date.toString();
  date = date.split(' ');
  const time = date[4].split(':');
  dateArr = [parseInt(date[3]), dateMap[date[1]], parseInt(date[2]),
  parseInt(time[0]), parseInt(time[1]), parseInt(time[2])];
  return dateArr;
}
// Converts a date array into a string, or vice versa.
function datearrToString (a) {
  let s = '';
  for (let i = 0; i < a.length; i++) {
    let aIString = a[i].toString();
    if (i > 0) {
      if (aIString.length < 2) {
        aIString = '0'.concat(aIString);
      }
    }
    s = s.concat(aIString);
    if (i !== a.length - 1) {
      s = s.concat('-');
    }
  }
  return s;
}
function datestringToArr (a) {
  const sArr = a.split('-');
  const b = [];
  for (let i = 0; i < sArr.length; i++) {
    b.push(parseInt(sArr[i]));
  }
  return b;
}
// Returns the JSON representation of a given JSON filepath
async function openJsonFile (filepath) {
  const promise = await fspromise.readFile(filepath);
  return JSON.parse(promise.toString());
}
// Generates an id key for a given path
async function generateIdKey (path) {
  const jsonData = await openJsonFile(path);
  const idInt = parseInt(jsonData.id);
  const newIdInt = idInt + 1;
  jsonData.id = newIdInt;

  fspromise.writeFile(path, JSON.stringify(jsonData));

  // Gets the correct ID string to add to the thread
  return intToID(idInt);
}
// Resizes an image to fit in the correct dimensions
async function resizeImage (oldPath, newPath) {
  const image = sharp(oldPath).flatten({ background: '#ffffff' });
  const metadata = await image.metadata();
  let width = metadata.width;
  let height = metadata.height;

  if (width > MAX_IMAGE_WIDTH) {
    const ratio = width / MAX_IMAGE_WIDTH;
    width = MAX_IMAGE_WIDTH;
    height = Math.ceil(height / ratio);
  } else if (width < MIN_IMAGE_WIDTH) {
    const ratio = width / MIN_IMAGE_WIDTH;
    width = MIN_IMAGE_WIDTH;
    height = Math.ceil(height / ratio);
  }

  const newImage = image.resize(width, height);
  await newImage.toFile(newPath);
}
function checkFileExists (file) {
  return fs.promises.access(file, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

// App get requests

// Returns the home page
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, './static/homepage.html'));
});

// Returns the number of thread/comment pages available to view
app.get('/getpagecount', async function (req, res) {
  try {
    let pageCount = 0;
    const files = await openJsonFile(threadDbFp);
    pageCount = itemCountToPageCount(files.threads.length);
    res.send({ pageCount });
  } catch (e) {
    console.log('Backend problem - /getpagecount');
    console.log(e);
    res.status(400).end();
  }
});
app.get('/getcommentcount', async function (req, res) {
  let threadId = '';

  // Validating thread ID input
  try {
    threadId = req.query['thread-id'];
    if (!checkValidID(threadId)) {
      throw new Error('');
    }
  } catch {
    res.status(400).end();
    return;
  }

  try {
    // Iterating through all files, counting how many comments with the given thread ID appear
    let commentCount = 0;
    const files = await openJsonFile(commentDbFp);
    for (let i = 0; i < files.comments.length; i++) {
      if (files.comments[i].parent === threadId) {
        commentCount += 1;
      }
    }

    const pageCount = itemCountToPageCount(commentCount);
    res.send({
      'comment-count': commentCount,
      'page-count': pageCount
    });
  } catch (e) {
    console.log('Backend problem - /getcommentcount');
    console.log(e);
    res.status(400).end();
  }
});

// Returns the five threads/comments that satisfy the user's request
app.get('/threads', async function (req, res) {
  let select = '';
  let search = '';
  let page = '';

  // Validating user input
  try {
    select = dictGet(req.query, 'select', 'date-newest');
    search = dictGet(req.query, 'search', '');
    page = parseInt(dictGet(req.query, 'page', '1'));
    if (!threadSelectSet.has(select)) {
      throw new Error('');
    }
  } catch {
    res.status(400).end();
    return;
  }

  try {
    const files = await openJsonFile(threadDbFp);
    const threadArr = files.threads;
    const arr = [];

    // Getting all threads that include the search result and placing into an array
    for (let i = 0; i < threadArr.length; i++) {
      if (threadArr[i].title.includes(search)) {
        arr.push([threadArr[i].id, threadArr[i].title, threadArr[i].body, threadArr[i].date, threadArr[i].lastupdate,
        threadArr[i].likes, threadArr[i].comments]);
      }
    }

    // Sorting the array
    if (select === 'date-newest') {
      arr.sort(threadCompareSortNewest);
    } else if (select === 'date-oldest') {
      arr.sort(threadCompareSortOldest);
    } else if (select === 'last-update') {
      arr.sort(threadCompareSortLastUpdate);
    } else if (select === 'likes') {
      arr.sort(threadCompareLikes);
    } else if (select === 'comments') {
      arr.sort(threadCompareComments);
    }

    // Slicing the array to return 5 items
    const start = (page - 1) * 5;
    const end = Math.min(page * 5, arr.length);
    const items = arr.slice(start, end);

    while (items.length < 5) {
      items.push(['_', '_', '_', '_', '_', '_', '_']);
    }

    res.send(JSON.stringify(items));
  } catch (e) {
    console.log('Backend problem - /threads');
    console.log(e);
    res.status(400).end();
  }
});
app.get('/comments', async function (req, res) {
  let threadId = '';
  let select = '';
  let search = '';
  let page = '';

  // Validating user input
  try {
    threadId = req.query['thread-id'];
    select = dictGet(req.query, 'select', 'date-newest');
    search = dictGet(req.query, 'search', '');
    page = parseInt(dictGet(req.query, 'page', '1'));

    if (!checkValidID(threadId) || !commentSelectSet.has(select)) {
      throw new Error('');
    }
  } catch {
    res.status(400).end();
    return;
  }

  try {
    const files = await openJsonFile(commentDbFp);
    const commentArr = files.comments;
    const arr = [];

    // Finding all comments whose parent is threadArr and include the search result. Adding these to an array.
    for (let i = 0; i < commentArr.length; i++) {
      if (commentArr[i].body.includes(search) && commentArr[i].parent === threadId) {
        arr.push([commentArr[i].id, commentArr[i].body, commentArr[i].date,
        commentArr[i].likes, commentArr[i].parent, commentArr[i].image]);
      }
    }

    // Sorting the array
    if (select === 'date-newest') {
      arr.sort(commentCompareSortNewest);
    } else if (select === 'date-oldest') {
      arr.sort(commentCompareSortOldest);
    } else if (select === 'likes') {
      arr.sort(commentCompareLikes);
    } else if (select === 'has-image') {
      arr.sort(commentCompareSortHasImage);
    }

    // Slicing the array to have 5 items, based on the page number
    const start = (page - 1) * 5;
    const end = Math.min(page * 5, arr.length);
    const items = arr.slice(start, end);

    while (items.length < 5) {
      items.push(['_', '_', '_', '_', '_', '_']);
    }
    res.send(JSON.stringify(items));
  } catch (e) {
    console.log('Backend problem - /comments');
    console.log(e);
    res.status(400).end();
  }
});

// Returns information about an individual thread
app.get('/threadinfo', async function (req, res) {
  let threadId = '';
  // Validating
  try {
    threadId = req.query.id;
    if (!checkValidID(threadId)) {
      throw new Error('');
    }
  } catch {
    res.status(400).end();
    return;
  }

  try {
    const files = await openJsonFile(threadDbFp);
    const threadArr = files.threads;

    // Iterating through all threads, returning the thread with a matching ID to the GET request parameter
    for (let i = 0; i < threadArr.length; i++) {
      if (threadArr[i].id === threadId) {
        res.send(threadArr[i]);
        return;
      }
    }

    // No thread has been found, return error
    res.status(400).end();
  } catch (e) {
    console.log('Backend problem - /threadinfo');
    console.log(e);
    res.status(400).end();
  }
});
// Returns the last time the thread was updated
app.get('/getlastupdate', async function (req, res) {
  let threadId = '';
  // Validating body
  try {
    threadId = req.query['thread-id'];
    if (!checkValidID(threadId)) {
      throw new Error('');
    }
  } catch {
    res.status(400).end();
    return;
  }

  try {
    const files = await openJsonFile(threadDbFp);
    const threadArr = files.threads;

    // Iterating all threads, finding thread with ID matching get request parameter, returning its lastupdate value
    for (let i = 0; i < threadArr.length; i++) {
      if (threadArr[i].id === threadId) {
        res.json({ lastUpdate: threadArr[i].lastupdate });
        return;
      }
    }

    // No thread found, return error
    res.status(400).end();
  } catch (e) {
    console.log('Backend problem - /getlastupdate');
    console.log(e);
    res.status(400).end();
  }
});

// App post requests

// Creates a new thread/comment
app.post('/createnewthread', async function (req, res) {
  let threadTitle = '';
  let threadText = '';

  // Checking all body elements are present
  try {
    threadTitle = req.body.title.trim();
    threadText = req.body.body.trim();
  } catch {
    res.status(400).end();
    return;
  }

  try {
    // Checking length of thread
    if (!(threadTitle.length >= THREAD_MIN_TITLE_LENGTH && threadTitle.length <= THREAD_MAX_TITLE_LENGTH) ||
      !(threadText.length >= THREAD_MIN_BODY_LENGTH && threadText.length <= THREAD_MAX_BODY_LENGTH)) {
      res.json({ error: 'length' });
      return;
    }

    // Opening the ID database and getting the least-recently used ID.
    // This is the equivalent of generating a primary key in a database.
    const idString = await generateIdKey(threadIdFp);

    // Getting the date that the thread was posted
    const dateString = datearrToString(getDateArr());

    // Setting likes and comments
    const likes = 0;
    const comments = 0;

    // Opening thread database and adding new thread to it
    const jsonData = await openJsonFile(threadDbFp);
    jsonData.threads.push({
      id: idString,
      title: threadTitle,
      body: threadText,
      date: dateString,
      lastupdate: dateString,
      likes,
      comments
    });

    fspromise.writeFile(threadDbFp, JSON.stringify(jsonData));
    res.json({ 'thread-id': idString });
  } catch (e) {
    console.log('Backend problem - /createnewthread');
    console.log(e);
    res.status(400).end();
  }
});
app.post('/addcomment', upload.single('file'), async function (req, res) {
  let threadId = '';
  let commentBody = '';

  // Validating thread ID and body
  try {
    threadId = req.body['thread-id'];
    commentBody = req.body['comment-body'].trim();
    if (!(commentBody.length >= COMMENT_MIN_LENGTH && commentBody.length <= COMMENT_MAX_LENGTH)) {
      res.json({ error: 'length' });
      return;
    }
    if (!checkValidID(threadId)) {
      throw new Error('');
    }
  } catch {
    res.status(400).end();
    return;
  }

  try {
    // Opening the ID database and getting the least-recently used ID.
    // This is the equivalent of generating a primary key in a database.
    const idString = await generateIdKey(commentIdFp);

    let imgPath = '_';

    // Check if file is passed as a parameter
    if (req.file !== undefined) {
      // Verify file is an image
      const tempPath = req.file.path;
      const suffix = path.extname(req.file.originalname).toLowerCase();

      if (!(suffix === '.png' || suffix === '.jpg' || suffix === '.jpeg')) {
        res.json({ error: 'file' });

        // Delete file
        fspromise.unlink(tempPath);
        return;
      }

      // Resize file and delete old versions
      const newTempPath = `${tempPath}.jpg`;
      const targetPath = path.join(__dirname, `./static/uploads/${idString}.jpg`);
      await fspromise.rename(tempPath, newTempPath);
      await resizeImage(newTempPath, targetPath);
      fspromise.unlink(newTempPath);

      imgPath = `./uploads/${idString}.jpg`;
    }

    // Check either file exists or comment body exists
    if (imgPath === '_' && commentBody === '') {
      res.json({ error: 'content' });
      return;
    }

    // Adding comment to db
    const dateString = datearrToString(getDateArr());
    const likes = 0;
    const jsonData = await openJsonFile(commentDbFp);

    jsonData.comments.push({
      id: idString,
      body: commentBody,
      date: dateString,
      likes,
      parent: threadId,
      image: imgPath
    });
    fspromise.writeFile(commentDbFp, JSON.stringify(jsonData));

    // Incrementing comment count, lastupdate for thread database
    const threadJsonData = await openJsonFile(threadDbFp);
    for (let i = 0; i < threadJsonData.threads.length; i++) {
      if (threadJsonData.threads[i].id === threadId) {
        threadJsonData.threads[i].comments += 1;
        threadJsonData.threads[i].lastupdate = dateString;
      }
    }
    fspromise.writeFile(threadDbFp, JSON.stringify(threadJsonData));
    res.json({});
  } catch (e) {
    console.log('Backend problem - /addcomment');
    console.log(e);
    res.status(400).end();
  }
});

// Deleting a thread/comment
app.post('/deletethread', async function (req, res) {
  let threadDeletionId = '';

  // Validation
  try {
    threadDeletionId = req.body['thread-id'];
    if (!checkValidID(threadDeletionId)) {
      throw new Error('');
    }
  } catch {
    res.status(400).end();
    return;
  }

  try {
    const threadJsonData = await openJsonFile(threadDbFp);
    let indToDelete = -1;

    // Finding index of thread to delete
    for (let i = 0; i < threadJsonData.threads.length; i++) {
      if (threadJsonData.threads[i].id === threadDeletionId) {
        indToDelete = i;
      }
    }

    // If no thread matches thread ID provided, return error
    if (indToDelete === -1) {
      res.status(400).end();
      return;
    }

    // Otherwise, delete thread and update database
    threadJsonData.threads.splice(indToDelete, 1);
    fspromise.writeFile(threadDbFp, JSON.stringify(threadJsonData));

    // Finding comments with the thread as the ID
    const commentJsonData = await openJsonFile(commentDbFp);
    const indsToDelete = [];

    for (let i = 0; i < commentJsonData.comments.length; i++) {
      if (commentJsonData.comments[i].parent === threadDeletionId) {
        indsToDelete.push(i);
      }
    }

    // Working through comment IDs matching the thread and deleting them
    while (indsToDelete.length > 0) {
      const ind = indsToDelete.pop();
      const imageSrc = commentJsonData.comments[ind].image;
      if (imageSrc !== '_') {
        const commentId = commentJsonData.comments[ind].id;

        // Attempt to delete comment image
        const imageFilePath = `./static/uploads/${commentId}.jpg`;
        const fileExists = await checkFileExists(imageFilePath);
        if (fileExists) {
          fspromise.unlink(imageFilePath);
        }
      }
      // Deletes comment
      commentJsonData.comments.splice(ind, 1);
    }
    fspromise.writeFile(commentDbFp, JSON.stringify(commentJsonData));
    res.json({});
  } catch (e) {
    console.log('Backend problem - /deletethread');
    console.log(e);
    res.status(400).end();
  }
});
app.post('/deletecomment', async function (req, res) {
  let commentDeletionId = '';

  // Validation
  try {
    commentDeletionId = req.body['comment-id'];
    if (!checkValidID(commentDeletionId)) {
      throw new Error('');
    }
  } catch {
    res.status(400).end();
    return;
  }

  try {
    const commentJsonData = await openJsonFile(commentDbFp);
    let indToDelete = -1;
    let parent = -1;

    // Finding index of comment to delete
    for (let i = 0; i < commentJsonData.comments.length; i++) {
      if (commentJsonData.comments[i].id === commentDeletionId) {
        indToDelete = i;
        parent = commentJsonData.comments[i].parent;
      }
    }

    // If no comments match provided comment ID, return error
    if (indToDelete === -1) {
      res.status(400).end();
      return;
    }

    // Deleting comment
    commentJsonData.comments.splice(indToDelete, 1);
    fspromise.writeFile(commentDbFp, JSON.stringify(commentJsonData));

    // Subtracting 1 comment from thread database
    const threadJsonData = await openJsonFile(threadDbFp);
    for (let i = 0; i < threadJsonData.threads.length; i++) {
      if (threadJsonData.threads[i].id === parent) {
        threadJsonData.threads[i].comments -= 1;
      }
    }
    fspromise.writeFile(threadDbFp, JSON.stringify(threadJsonData));

    // Deleting associated comment image (if it exists)
    const imageFilePath = `./static/uploads/${commentDeletionId}.jpg`;
    const fileExists = await checkFileExists(imageFilePath);
    if (fileExists) {
      fspromise.unlink(imageFilePath);
    }

    res.json({});
  } catch (e) {
    console.log('Backend problem - /deletecomment');
    console.log(e);
    res.status(400).end();
  }
});

// Likes a given thread/comment
app.post('/likethread', async function (req, res) {
  let threadId = '';
  let likeNumber = 0;

  // Validation
  try {
    threadId = req.body['thread-id'];
    if (!checkValidID(threadId)) {
      throw new Error('');
    }
    likeNumber = parseInt(req.body['like-number']);
  } catch {
    res.status(400).end();
    return;
  }

  try {
    // Finds index of associated thread in database
    const jsonData = await openJsonFile(threadDbFp);
    let ind = -1;

    for (let i = 0; i < jsonData.threads.length; i++) {
      if (jsonData.threads[i].id === threadId) {
        ind = i;
      }
    }

    // If no thread in database matches given thread, return error
    if (ind === -1) {
      res.status(400).end();
      return;
    }

    // Increment the thread's like count
    jsonData.threads[ind].likes += likeNumber;
    fspromise.writeFile(threadDbFp, JSON.stringify(jsonData));
    res.json({});
  } catch (e) {
    console.log('Backend problem - /likethread');
    console.log(e);
    res.status(400).end();
  }
});
app.post('/likecomment', async function (req, res) {
  let commentId = '';
  let likeNumber = 0;

  // Validation
  try {
    commentId = req.body['comment-id'];
    if (!checkValidID(commentId)) {
      throw new Error('');
    }
    likeNumber = parseInt(req.body['like-number']);
  } catch {
    res.status(400).end();
    return;
  }

  try {
    const jsonData = await openJsonFile(commentDbFp);
    let ind = -1;

    // Finding index of comment to like in database
    for (let i = 0; i < jsonData.comments.length; i++) {
      if (jsonData.comments[i].id === commentId) {
        ind = i;
      }
    }

    // If no comment matches provided comment ID, return error
    if (ind === -1) {
      res.status(400).end();
      return;
    }

    // Increment comment like count
    jsonData.comments[ind].likes += likeNumber;
    fspromise.writeFile(commentDbFp, JSON.stringify(jsonData));
    res.json({});
  } catch (e) {
    console.log('Backend problem - /likecomment');
    console.log(e);
    res.status(400).end();
  }
});

module.exports = {
  checkValidID,
  itemCountToPageCount,
  dictGet,
  intToID,
  checkFileExists,

  app,
  port,

  NUMBER_TYPE,
  STRING_TYPE,
  UNDEFINED_TYPE
};
