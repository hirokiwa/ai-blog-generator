import { getDocs, limit, orderBy, query, where } from "firebase/firestore"
import * as dotenv from 'dotenv';
import { initializeBlogCollection } from "./firebase";
import { isWithinLast24Hours, timeStampToDate } from "./utils";

dotenv.config();

const getBlogOfTheDay = async () => {
  try {
    const blogCollection = initializeBlogCollection();
    const TIME_DIFFERENCE = Number(process.env["TIME_DIFFERENCE"] ?? "0");
    const publishedDate = new Date();
    publishedDate.setHours(publishedDate.getHours() + TIME_DIFFERENCE);
    const blogQuery = query(blogCollection, where("publishedAt", "<=", publishedDate), orderBy("publishedAt", "desc"), limit(1));
    const blogSnapshot = await getDocs(blogQuery);
    const blogList = blogSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const formatedData = blogList.map((b: any): blog => ({
      id: b.id,
      title: b.title,
      body: b.body,
      createdAt: timeStampToDate(b.createdAt),
      publishedAt: timeStampToDate(b.publishedAt),
      publiclyAvailable: b.publiclyAvailable,
    }));
    const blog = formatedData[0];
    console.log(blog && isWithinLast24Hours(blog.publishedAt) ? blog : undefined)
    return blog && isWithinLast24Hours(blog.publishedAt) ? blog : undefined;
  } catch (e) {
    console.error("Faild to get all blogs.", e);
    return undefined;
  }
};

const announcement = async () => {
  const sourceBlog = await getBlogOfTheDay();
};

announcement();
