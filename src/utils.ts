import { Timestamp } from "firebase/firestore";

export const timeStampToDate = (timeStamp: Timestamp) => {
  try {
    return timeStamp.toDate();
  } catch (e) {
    console.error(e, "Faild to convert from time stamp to Date.")
    throw e;
  }
}

export const dateToTimeStamp = (date: Date) => {
  try {
    return Timestamp.fromDate(date);
  } catch (e) {
    console.error(e, "Faild to convert from Date to time stamp.")
    throw e;
  }
}