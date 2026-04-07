interface blog extends blogData { id: string; }

interface blogData extends generatedPart {
  createdAt: Date;
  publishedAt: Date;
  publiclyAvailable: boolean;
}

interface generatedPart {
  title: string;
  body: string;
}

interface firestoreBlogDocument extends Record<string, unknown> {
  title: string;
  body: string;
  createdAt: import("firebase/firestore").Timestamp;
  publishedAt: import("firebase/firestore").Timestamp;
  publiclyAvailable: boolean;
}
