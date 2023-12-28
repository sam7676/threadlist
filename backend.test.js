const backend = require('./backend')


test('check_valid_id', () => {
    expect(backend.check_valid_id("00000001")).toBe(true);
    expect(backend.check_valid_id("0000002")).toBe(false);
    expect(backend.check_valid_id(3)).toBe(false);
  });

// Note function only called with nonnegative integers from the back end
test('item_count_to_page_count', () => {
  expect(backend.item_count_to_page_count(0)).toBe(1);
  expect(backend.item_count_to_page_count(1)).toBe(1);
  expect(backend.item_count_to_page_count(5)).toBe(1);
  expect(backend.item_count_to_page_count(6)).toBe(2);
  expect(backend.item_count_to_page_count(10)).toBe(2);
});

test('dict_get', () => {
  const d = {1:1,2:2,3:3,4:4,5:5,6:6}
  expect(backend.dict_get(d,1,10)).toBe(1);
  expect(backend.dict_get(d,7,10)).toBe(10);
  expect(backend.dict_get(d,1,7)).toBe(1);
  expect(backend.dict_get(d,1,7)).toBe(1);
  expect(backend.dict_get(d,1,7)).toBe(1);
  expect(backend.dict_get(1, 1, 7)).toBe(7);
});

test('int_to_id', () => {
  expect(backend.int_to_id(0)).toBe('00000000');
  expect(backend.int_to_id(1)).toBe('00000001');
  expect(backend.int_to_id(100)).toBe('00000100');
  expect( () => {
        backend.int_to_id(-1)
      }).toThrow(Error);
  expect( () => {
        backend.int_to_id(100000000)
      }).toThrow(Error);
});

test('check_file_exists', async () => {
  expect(await backend.check_file_exists("./backend.js")).toBe(true);
  expect(await backend.check_file_exists("a")).toBe(false);
});