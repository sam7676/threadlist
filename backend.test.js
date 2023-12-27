const backend = require('./backend')

test('checks type of 4', () => {
    expect(backend.check_type(4, backend.NUMBER_TYPE)).toBe();
  });

test('checks non negative object', () => {
    expect(backend.check_non_negative(5)).toBe();
});


// test('checks non negative object', () => {
//     expect(backend.check_non_negative(-1)).toThrow();
// });


test("Test description", () => {
    expect(backend.check_non_negative(-1)).toThrow(TypeError);
    expect(backend.check_non_negative(-1)).toThrow("UNKNOWN ERROR");
    expect(backend.check_non_negative(-1)).toThrow("Number must be non-negative");
  });