import OpenAI from "openai"
import { parseGeneratedBlog, repetition } from "../src/generate"

describe('parseGeneratedBlog', () => {
  const commonFormat = {
    id: 'id',
    object: 'chat.completion',
    created: 9999999999,
    model: 'gpt-3.5-turbo-0613',
    usage: { prompt_tokens: 500, completion_tokens: 500, total_tokens: 1000 },
    system_fingerprint: null
  }

  it('should parse a valid completion and return generatedPart.', () => {
    const completion = {
      ...commonFormat,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: '{\n' +
              '  "title": "This is a blog.",\n' +
              '  "body": "Hello.\\n\\nHello.\\n\\nHello.\\n\\nHello.\\n\\nHello.\\n\\nHello."\n' +
              '}'
          },
          finish_reason: 'stop'
        }
      ],
    } as unknown as OpenAI.Chat.Completions.ChatCompletion;

    const result = parseGeneratedBlog(completion);
    expect(result).toStrictEqual({
        title: 'This is a blog.',
        body: 'Hello.Hello.Hello.Hello.Hello.Hello.'
    });
  });
  
  it('should return undefined if content ket is wrong.', () => {
    const completion = {
      ...commonFormat,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: '{\n' +
              '  "title": "This is a blog.",\n' +
              '  "sentence": "Hello.\\n\\nHello.\\n\\nHello.\\n\\nHello.\\n\\nHello.\\n\\nHello."\n' +
              '}'
          },
          finish_reason: 'stop'
        }
      ],
    } as unknown as OpenAI.Chat.Completions.ChatCompletion;

    const result = parseGeneratedBlog(completion);
    expect(result).toBeUndefined();
  });

  it('should return undefined if content is an empty array.', () => {
    const completion = {
      ...commonFormat,
      choices: [],
    } as unknown as OpenAI.Chat.Completions.ChatCompletion;

    const result = parseGeneratedBlog(completion);
    expect(result).toBeUndefined();
  });

  it('should return undefined if content is not proper json format.', () => {
    const completion = {
      ...commonFormat,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'This is a content.'
          },
          finish_reason: 'stop'
        }
      ],
    } as unknown as OpenAI.Chat.Completions.ChatCompletion;

    const result = parseGeneratedBlog(completion);
    expect(result).toBeUndefined();
  });
});

describe('repetition', () => {
  const data = {
    title: "This is title.",
    body: "This is body."
  };
  const callBackData = async () => {
    return await data;
  }
  const callBackUndefined = async () => {
    return await undefined
  }

  it('should return data when index is positive value.', async () => {
    const result = await repetition(3, callBackData);
    expect(result).toStrictEqual(data);
  });
  it('should return data when index is 0.', async () => {
    const result = await repetition(0, callBackData);
    expect(result).toStrictEqual(data);
  });
  it('should return data when index is negative value.', async () => {
    const result = await repetition(-1, callBackData);
    expect(result).toStrictEqual(data);
  });
  it('should return undefined when index is positive value.', async () => {
    const result = await repetition(3, callBackUndefined);
    expect(result).toBeUndefined();
  });
  it('should return undefined when index is 0.', async () => {
    const result = await repetition(0, callBackUndefined);
    expect(result).toBeUndefined();
  });
  it('should return undefined when index is negative value.', async () => {
    const result = await repetition(-1, callBackUndefined);
    expect(result).toBeUndefined();
  });
});