import { postToTwitter } from "./twitter";
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
    return blog && isWithinLast24Hours(blog.publishedAt) ? blog : undefined;
  } catch (e) {
    console.error("Faild to get all blogs.", e);
    return undefined;
  }
};

const getAdjustedBodyLength = (
    title: string,
    titleLimit = 28,
    defaultBodyLength = 60
) => {
  const excessTitleLength = Math.max(0, title.length - titleLimit);
  const adjustedBodyLength = Math.max(0, defaultBodyLength - excessTitleLength);
  return adjustedBodyLength;
};

const createTweetText = (sourceBlog: blog) => {
    const adjustedBodyLength = getAdjustedBodyLength(sourceBlog.title);
    return `／\n新着記事🎉\n『${sourceBlog.title}』\n＼\n\n${sourceBlog.body.substring(0, adjustedBodyLength)}...\n\n#関西弁でお届けするAIおじさん毎日ブログ\n\n続きを読む👇👇\nhttps://ai-blog.hirokiwa.com/post/${sourceBlog.id}`;
};

const announcement = async () => {
  const sourceBlog = await getBlogOfTheDay();
  const tweetText = sourceBlog && createTweetText(sourceBlog);
  tweetText && postToTwitter(tweetText);
};

announcement();
