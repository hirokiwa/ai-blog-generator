import { Timestamp } from "firebase/firestore"
import { dateToTimeStamp, timeStampToDate } from "../src/utils"

describe('timeStampToDate test', () => {
  test('OK', async () => {
    const res = timeStampToDate(new Timestamp(1700857726, 808000000))
    expect(res).toStrictEqual(new Date("2023-11-24T20:28:46.808Z"))
  })
})

describe('dateToTimeStamp test', () => {
  test('OK', async () => {
    const res = dateToTimeStamp(new Date("2023-11-24T20:28:46.808Z"))
    expect(res).toStrictEqual(new Timestamp(1700857726, 808000000))
  })
})