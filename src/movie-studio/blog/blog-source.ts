import { getDocs, limit, orderBy, query } from "firebase/firestore";
import { initializeBlogCollection } from "../../firebase";
import { timeStampToDate } from "../../utils";
import { assertPublishedOnCurrentDay, getIsoStringWithoutMilliseconds } from "../shared/date";
import { MovieStudioError } from "../shared/errors";
import type { BlogVideoSource } from "../shared/types";

const mapBlogDocumentToVideoSource = (
  id: string,
  blogDocument: firestoreBlogDocument,
): BlogVideoSource => {
  return {
    id,
    title: blogDocument.title,
    body: blogDocument.body,
    publishedAt: getIsoStringWithoutMilliseconds(timeStampToDate(blogDocument.publishedAt)),
  };
};

export const fetchLatestBlogPublishedToday = async (
  currentDate: Date,
  timeZone: string,
): Promise<BlogVideoSource> => {
  const blogCollection = initializeBlogCollection();
  const latestPublishedBlogQuery = query(
    blogCollection,
    orderBy("publishedAt", "desc"),
    limit(1),
  );
  const latestPublishedBlogSnapshot = await getDocs(latestPublishedBlogQuery);
  const latestPublishedBlogDocument = latestPublishedBlogSnapshot.docs[0];

  if (latestPublishedBlogDocument === undefined) {
    throw new MovieStudioError("No published blog was found.");
  }

  const latestPublishedBlogData = latestPublishedBlogDocument.data();

  if (
    typeof latestPublishedBlogData["title"] !== "string" ||
    typeof latestPublishedBlogData["body"] !== "string" ||
    latestPublishedBlogData["publishedAt"] === undefined
  ) {
    throw new MovieStudioError("Latest blog document shape is invalid.");
  }

  const publishedAt = timeStampToDate(
    latestPublishedBlogData["publishedAt"] as firestoreBlogDocument["publishedAt"],
  );

  // assertPublishedOnCurrentDay(publishedAt, currentDate, timeZone);

  return mapBlogDocumentToVideoSource(
    latestPublishedBlogDocument.id,
    latestPublishedBlogData as firestoreBlogDocument,
  );
};
