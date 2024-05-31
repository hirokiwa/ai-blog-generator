import OpenAI from "openai";

const fetchOpenAi = async () => {
  try {
    const apiKey = process.env["OPENAI_API_KEY"];
    const messageContent = process.env["OPENAI_MESSAGE_CONTENT"];
    if (!apiKey || !messageContent) {
      throw new Error(!apiKey
        ? "Open API Key is not found."
        : "Open API Message Conttent is not found."
      );
    }
    const openai = new OpenAI({apiKey: apiKey});
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: messageContent }],
      model: "gpt-4o",
    });
    return completion;
  } catch (e) {
    console.error(e, "Faild to fetch Open API");
    return undefined;
  }
}

export const parseGeneratedBlog = (completion: OpenAI.Chat.Completions.ChatCompletion) => {
  try {
    const rawContent = completion.choices[0]?.message?.content;
    const newlinesErased = rawContent?.replace(/\r?\n/g, "");
    const codeBlockRemoved = newlinesErased?.replace(/^```json/, '').replace(/```$/, '') ?? "";
    const parsedJson = newlinesErased && JSON.parse(codeBlockRemoved);

    const blogTitle = parsedJson?.title;
    const blogBody = parsedJson?.body.replace(/\r?\n/g, "").replace(" ", '').replace("　", '');
    
    const parsedBlog = blogTitle && blogBody ? {
      title: blogTitle as string,
      body: blogBody as string,
    } as generatedPart : undefined;
    
    return parsedBlog;
  } catch (e) {
    console.error(e, "Faild to parse data.");
    return undefined;
  }
}

export const repetition = async (maxIndex: number, callBack: () => Promise<generatedPart|undefined>): Promise<generatedPart|undefined> => {
  const parsedNewBlog = callBack();
  return maxIndex <= 0 || await parsedNewBlog
    ? parsedNewBlog
    : repetition(maxIndex - 1, callBack);
}

const getGeneratedPart = async (): Promise<generatedPart|undefined> => {
  const completion = await fetchOpenAi();
  const parsedNewBlog = completion && parseGeneratedBlog(completion);
  return parsedNewBlog;
}

export const generateBlog = async (): Promise<blogData|undefined> => {
  const parsedNewBlog = await repetition(3, getGeneratedPart);
  const TIME_DIFFERENCE = 9;

  const now = new Date();
  return parsedNewBlog ? {
    ...parsedNewBlog,
    createdAt: now,
    publishedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19 - TIME_DIFFERENCE, 0, 0, 0),
    publiclyAvailable: true,
  } : undefined;
}