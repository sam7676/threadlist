const backend = require('./backend')


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
  const d = {1:1,2:2,3:3,4:4,5:5,6:6}
  expect(backend.dictGet(d,1,10)).toBe(1);
  expect(backend.dictGet(d,7,10)).toBe(10);
  expect(backend.dictGet(d,1,7)).toBe(1);
  expect(backend.dictGet(d,1,7)).toBe(1);
  expect(backend.dictGet(d,1,7)).toBe(1);
  expect(backend.dictGet(1, 1, 7)).toBe(7);
});

test('intToID', () => {
  expect(backend.intToID(0)).toBe('00000000');
  expect(backend.intToID(1)).toBe('00000001');
  expect(backend.intToID(100)).toBe('00000100');
  expect( () => {
        backend.intToID(-1)
      }).toThrow(Error);
  expect( () => {
        backend.intToID(100000000)
      }).toThrow(Error);
});

test('checkFileExists', async () => {
  expect(await backend.checkFileExists("./backend.js")).toBe(true);
  expect(await backend.checkFileExists("a")).toBe(false);
});