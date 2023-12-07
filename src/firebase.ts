import { initializeApp } from "firebase/app";
import { Firestore, collection, getFirestore } from "firebase/firestore";

const initializeDb = () => {
  try {
    const firebaseConfig = {
      apiKey: process.env["FIREBASE_API_KEY"],
      projectId: process.env["FIREBASE_PROJECT_ID"],
    };
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
  
    return db;
  } catch (e) {
    console.error("Faild to initialize app", e);
    return undefined;
  }
}

export const initializeBlogCollection = () => {
  try {
    const db = initializeDb();
    const collectionName = process.env["FIREBASE_BLOG_COLLECTION"];
    if (!db || !collectionName) {
      throw new Error(!db
        ? "Faild to initialize app."
        : "Collection Name is not found."
      );
    }
    return collection(db, collectionName);
  } catch (e) {
    console.error("Faild to initialize blog collection.", e);
    throw e;
  }
}
