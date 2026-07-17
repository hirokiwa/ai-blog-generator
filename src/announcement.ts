import { postToTwitter } from "./twitter";
import { getDocs, limit, orderBy, query, where } from "firebase/firestore"
import * as dotenv from 'dotenv';
import { initializeBlogCollection } from "./firebase";
import { isWithinLast24Hours, timeStampToDate } from "./utils";
import { getTweetLength } from "twitter-text";

dotenv.config();

const DEFAULT_BODY_LENGTH = 60;
const TWEET_BYTE_LENGTH_LIMIT = 280;

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
    throw e;
  }
};

const buildTweetText = ({ title, body, id }: { title: string; body: string; id: string }) => {
    return `／\n新着記事🎉\n『${title}』\n＼\n\n${body}…\n\n#関西弁でお届けするAIおじさん毎日ブログ\n\n続きを読む👇👇\nhttps://ai-blog.hirokiwa.com/post/${id}?utm_source=official_x&utm_medium=social&utm_campaign=new_post`;
};

const createTweetText = ({ title, body, id }: { title: string; body: string; id: string }) => {
  const tweetWithoutBody = buildTweetText({
    title,
    body: "",
    id,
  });

  const tweetByteLengthWithoutBody = getTweetLength(tweetWithoutBody);
  const remainingByteLength = TWEET_BYTE_LENGTH_LIMIT - tweetByteLengthWithoutBody;
  const availableBodyLength = Math.floor((remainingByteLength) / 2); // 2 characters per Japanese character

  const bodyToInsert = body.substring(0, Math.min(DEFAULT_BODY_LENGTH, availableBodyLength));

  return buildTweetText({
    title,
    body: bodyToInsert,
    id,
  });
};

const announcement = async () => {
  const sourceBlog = await getBlogOfTheDay();
  if (!sourceBlog) {
    throw new Error("Blog of the day is not found.");
  }
  const tweetText = createTweetText({
    title: sourceBlog.title,
    body: sourceBlog.body,
    id: sourceBlog.id,
  });
  await postToTwitter(tweetText);
};

if (require.main === module) {
  announcement().catch((error) => {
    console.error('Faild to run announcement:', error);
    throw error;
  });
}
