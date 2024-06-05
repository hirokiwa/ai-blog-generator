import { TwitterApi } from "twitter-api-v2";

const twitterClient = new TwitterApi({
  appKey: process.env["TWITTER_APP_KEY"] ?? "",
  appSecret: process.env["TWITTER_APP_SECRET"] ?? "",
  accessToken: process.env["TWITTER_ACCESS_TOKEN"] ?? "",
  accessSecret: process.env["TWITTER_ACCESS_SECRET"] ?? "",
});

export const postToTwitter = async (message: string) => {
  try {
    await twitterClient.v2.tweet(message);
    console.log('Tweet successfully posted!');
  } catch (error) {
    console.error('Error posting tweet:', error);
  };
};
