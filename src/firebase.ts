import { initializeApp } from "firebase/app";
import { Firestore, collection, getFirestore } from "firebase/firestore";

const initializeDb = () => {
  try {
    const apiKey = process.env["FIREBASE_API_KEY"];
    const projectId = process.env["FIREBASE_PROJECT_ID"];
    if (!apiKey || !projectId) {
      throw new Error(!apiKey
        ? "Firebase API Key is not found."
        : "Firebase Project ID is not found."
      );
    }
    const firebaseConfig = {
      apiKey: apiKey,
      projectId: projectId,
    };
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
  
    return db;
  } catch (e) {
    console.error("Faild to initialize app", e);
    throw e;
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
