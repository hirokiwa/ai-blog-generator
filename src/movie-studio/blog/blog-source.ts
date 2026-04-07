import { readFile } from "fs/promises";
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

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

interface MockBlogEntryInput {
  id?: string;
  title: string;
  body: string;
  publishedAt?: string;
}

interface MockBlogCollectionInput {
  blogs: MockBlogEntryInput[];
}

const isMockBlogEntryInput = (value: unknown): value is MockBlogEntryInput => {
  if (!isObjectRecord(value)) {
    return false;
  }

  return (
    typeof value["title"] === "string" &&
    typeof value["body"] === "string" &&
    (value["id"] === undefined || typeof value["id"] === "string") &&
    (value["publishedAt"] === undefined || typeof value["publishedAt"] === "string")
  );
};

const isMockBlogCollectionInput = (value: unknown): value is MockBlogCollectionInput => {
  if (!isObjectRecord(value) || !Array.isArray(value["blogs"])) {
    return false;
  }

  return value["blogs"].every((blogEntry) => isMockBlogEntryInput(blogEntry));
};

const normalizeMockBlogEntry = (
  blogEntry: MockBlogEntryInput,
  currentDate: Date,
  fallbackId: string,
  sourceLabel: string,
): BlogVideoSource => {
  const resolvedPublishedAt = blogEntry.publishedAt ?? getIsoStringWithoutMilliseconds(currentDate);
  const publishedAtDate = new Date(resolvedPublishedAt);

  if (Number.isNaN(publishedAtDate.getTime())) {
    throw new MovieStudioError(
      `Blog source publishedAt is invalid. source=${sourceLabel} publishedAt=${resolvedPublishedAt}`,
    );
  }

  return {
    id: blogEntry.id ?? fallbackId,
    title: blogEntry.title,
    body: blogEntry.body,
    publishedAt: getIsoStringWithoutMilliseconds(publishedAtDate),
  };
};

const normalizeBlogVideoSource = (
  value: unknown,
  currentDate: Date,
  sourceLabel: string,
): BlogVideoSource => {
  if (isMockBlogEntryInput(value)) {
    return normalizeMockBlogEntry(value, currentDate, "mock-blog", sourceLabel);
  }

  if (isMockBlogCollectionInput(value)) {
    const latestBlogEntry = value.blogs[0];
    if (latestBlogEntry === undefined) {
      throw new MovieStudioError(`Mock blog collection was empty. source=${sourceLabel}`);
    }

    return normalizeMockBlogEntry(latestBlogEntry, currentDate, "mock-blog-1", sourceLabel);
  }

  throw new MovieStudioError(`Blog source shape is invalid. source=${sourceLabel}`);
};

export const readBlogVideoSourceFromJsonFile = async (
  filePath: string,
  currentDate: Date,
): Promise<BlogVideoSource> => {
  const fileContent = await readFile(filePath, "utf8");
  const parsedValue = JSON.parse(fileContent) as unknown;
  return normalizeBlogVideoSource(parsedValue, currentDate, filePath);
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

export const resolveMovieStudioBlogSource = async ({
  currentDate,
  timeZone,
  mockBlogFilePath,
}: {
  currentDate: Date;
  timeZone: string;
  mockBlogFilePath?: string;
}): Promise<BlogVideoSource> => {
  if (mockBlogFilePath !== undefined) {
    return await readBlogVideoSourceFromJsonFile(mockBlogFilePath, currentDate);
  }

  return await fetchLatestBlogPublishedToday(currentDate, timeZone);
};
