import {hello} from '../src/main'

describe('hello test', () => {
  test('OK', () => {
    const res = hello("AI Blog")
    expect(res).toBe("Hello AI Blog!")
  })
})
