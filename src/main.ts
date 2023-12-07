import { addDoc, getDocs } from "firebase/firestore"
import * as dotenv from 'dotenv';
import { initializeBlogCollection } from "./firebase";
import { dateToTimeStamp, timeStampToDate } from "./utils";
import { generateBlog } from "./generate";

dotenv.config();

export const hello = (name: string): string => {
  return `Thank ${name}!`
}

const getAllBlogs = async () => {
  try {
    const blogCollection = initializeBlogCollection();
    const blogSnapshot = await getDocs(blogCollection);
    const blogList = blogSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const formatedData = blogList.map((b: any): blog => ({
      id: b.id,
      title: b.title,
      body: b.body,
      createdAt: timeStampToDate(b.createdAt),
      publishedAt: timeStampToDate(b.publishedAt),
      publiclyAvailable: b.publiclyAvailable,
    }));
    return formatedData.length > 0 ? formatedData : undefined;
  } catch (e) {
    console.error("Faild to get all blogs.", e);
    return undefined;
  }
}

const addBlog = async (newBlog: blogData): Promise<string> => {
  try {
    const blogCollection = initializeBlogCollection();
    const docRef = await addDoc(blogCollection, newBlog);
    return docRef.id;
  } catch (error) {
    console.error('Faild to add blig:', error);
    throw error;
  }
};

const main = async () => {
  console.log(hello("AI Blog"));
  const newBlog = await generateBlog();
  newBlog && addBlog(newBlog)
    .then((_) => console.log(`Success to store with ID ****.`))
    .catch((error) => console.error('Faild to store the blog:', error))
}

main();