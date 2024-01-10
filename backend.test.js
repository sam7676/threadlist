const backend = require('./backend')
const request = require('supertest')
const app = backend.app

describe('Test backend functions', () => {

test('checkValidID', () => {
  expect(backend.checkValidID("00000001")).toBe(true);
  expect(backend.checkValidID("0000002")).toBe(false);
  expect(backend.checkValidID(3)).toBe(false);
});

// Note function only called with nonnegative integers from the back end
test('itemCountToPageCount', () => {
  expect(backend.itemCountToPageCount(0)).toBe(1);
  expect(backend.itemCountToPageCount(1)).toBe(1);
  expect(backend.itemCountToPageCount(5)).toBe(1);
  expect(backend.itemCountToPageCount(6)).toBe(2);
  expect(backend.itemCountToPageCount(10)).toBe(2);
});

test('dictGet', () => {
  const d = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 }
  expect(backend.dictGet(d, 1, 10)).toBe(1);
  expect(backend.dictGet(d, 7, 10)).toBe(10);
  expect(backend.dictGet(d, 1, 7)).toBe(1);
  expect(backend.dictGet(d, 1, 7)).toBe(1);
  expect(backend.dictGet(d, 1, 7)).toBe(1);
  expect(backend.dictGet(1, 1, 7)).toBe(7);
});

test('intToID', () => {
  expect(backend.intToID(0)).toBe('00000000');
  expect(backend.intToID(1)).toBe('00000001');
  expect(backend.intToID(100)).toBe('00000100');
  expect(() => {
    backend.intToID(-1)
  }).toThrow(Error);
  expect(() => {
    backend.intToID(100000000)
  }).toThrow(Error);
});

test('checkFileExists', async () => {
  expect(await backend.checkFileExists("./backend.js")).toBe(true);
  expect(await backend.checkFileExists("a")).toBe(false);
});

});

describe('Test backend GET routing', () => {

test('GET /pagecount succeeds', () => {
  return request(app)
    .get('/getpagecount')
    .expect(200)
    .expect('Content-type', /json/);
});

test('GET /commentcount succeeds', () => {
  return request(app)
    .get('/getcommentcount?thread-id=00000001')
    .expect(200)
    .expect('Content-type', /json/);
});
test('GET /commentcount fails with invalid ID', () => {
  return request(app)
    .get('/getcommentcount?thread-id=3')
    .expect(400);
});
test('GET /commentcount fails with no parameters', () => {
  return request(app)
    .get('/getcommentcount')
    .expect(400);
});

test('GET /threads succeeds', () => {
  return request(app)
    .get('/threads?select=date-newest&search=&page=1')
    .expect(200)
});
test('GET /threads fails when select isn`t valid', () => {
  return request(app)
    .get('/threads?select=invalid&search=&page=1')
    .expect(400)
});

test('GET /comments succeeds', () => {
  return request(app)
    .get('/comments?select=date-newest&search=&page=1&thread-id=00000001')
    .expect(200)
});
test('GET /comments succeeds with an absurdly large page number', () => {
  return request(app)
    .get('/comments?select=date-newest&search=&page=1000&thread-id=00000001')
    .expect(200)
});
test('GET /comments fails when select isn`t valid', () => {
  return request(app)
    .get('/comments?select=none&search=&page=1&thread-id=00000001')
    .expect(400)
});
test('GET /comments fails when thread ID isn`t valid', () => {
  return request(app)
    .get('/comments?select=none&search=&page=1&thread-id=3')
    .expect(400)
});
test('GET /comments fails with no parameters', () => {
  return request(app)
    .get('/comments')
    .expect(400)
});

test('GET /threadinfo succeeds', () => {
  return request(app)
    .get('/threadinfo?id=00000001')
    .expect(200)
    .expect('Content-type', /json/);
});
test('GET /threadinfo fails when thread not found', () => {
  return request(app)
    .get('/threadinfo?id=99999999')
    .expect(400)
});
test('GET /threadinfo fails with invalid thread ID', () => {
  return request(app)
    .get('/threadinfo?id=3')
    .expect(400)
});
test('GET /threadinfo fails with no parameters', () => {
  return request(app)
    .get('/threadinfo')
    .expect(400)
});

test('GET /getlastupdate succeeds', () => {
  return request(app)
    .get('/getlastupdate?thread-id=00000001')
    .expect(200)
    .expect('Content-type', /json/);
});
test('GET /getlastupdate fails when thread not found', () => {
  return request(app)
    .get('/getlastupdate?thread-id=99999999')
    .expect(400)
});
test('GET /getlastupdate fails with invalid thread ID', () => {
  return request(app)
    .get('/getlastupdate?thread-id=3')
    .expect(400)
});
test('GET /getlastupdate fails with no parameters', () => {
  return request(app)
    .get('/getlastupdate')
    .expect(400)
});

});

describe('Test backend POST routing', () => {

test('POST /createnewthread succeeds', () => {
  const params = { title: 'title', body: 'text'};
  return request(app)
  .post('/createnewthread')
  .send(params)
.expect(200);
});
test('POST /createnewthread fails with no parameters', () => {
  const params = {};
  return request(app)
  .post('/createnewthread')
  .send(params)
.expect(400);
});

test('POST /addcomment succeeds', () => {
  const params = { "thread-id": '00000001', "comment-body": 'body'};
  return request(app)
  .post('/addcomment')
  .send(params)
.expect(200);
});
test('POST /addcomment fails with invalid thread ID', () => {
  const params = { "thread-id": '3', "comment-body": 'body'};
  return request(app)
  .post('/addcomment')
  .send(params)
.expect(400);
});
test('POST /addcomment fails with no parameters', () => {
  const params = {};
  return request(app)
  .post('/addcomment')
  .send(params)
.expect(400);
});

test('POST /likethread succeeds', () => {
  const params = { "thread-id": '00000001', 'like-number': 1};
  return request(app)
  .post('/likethread')
  .send(params)
.expect(200);
});
test('POST /likethread fails with invalid thread ID', () => {
  const params = { "thread-id": '3'};
  return request(app)
  .post('/likethread')
  .send(params)
.expect(400);
});
test('POST /likethread fails with no parameters', () => {
  const params = {};
  return request(app)
  .post('/likethread')
  .send(params)
.expect(400);
});

test('POST /likecomment succeeds', () => {
  const params = { "comment-id": '00000164', "like-number": 1};
  return request(app)
  .post('/likecomment')
  .send(params)
.expect(200);
});
test('POST /likecomment fails with invalid thread ID', () => {
  const params = { "comment-id": '3'};
  return request(app)
  .post('/likecomment')
  .send(params)
.expect(400);
});
test('POST /likecomment fails with no parameters', () => {
  const params = {};
  return request(app)
  .post('/likecomment')
  .send(params)
.expect(400);
});




});