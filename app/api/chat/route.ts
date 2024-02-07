import { GoogleGenerativeAI } from '@fuyun/generative-ai';
import { GoogleGenerativeAIStream, Message, StreamingTextResponse } from 'ai';
import { kv } from '@vercel/kv'
import { nanoid } from '@/lib/utils'
import { auth } from '@/auth'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '',process.env.PALM_PROXY);

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

// Convert messages from the Vercel AI SDK Format to the format
// that is expected by the Google GenAI SDK
const buildGoogleGenAIPrompt = (messages: Message[]) => ({
  contents: messages
    .filter(message => message.role === 'user' || message.role === 'assistant')
    .map(message => ({
      role: message.role === 'user' ? 'user' : 'model',
      parts: [{ text: message.content }],
    })),
});

const initprompt=process.env.PROMPT

export async function POST(req: Request) {
  const json = await req.json()
  const { messages, previewToken } = json
  var msg = messages
  // Extract the prompt from the body of the request
  if(msg.length<2){
    msg=[{role: 'user', 
    content: initprompt + messages[0].content}]
  }
  // console.log(msg)
  const geminiStream = await genAI
    .getGenerativeModel({ model: 'gemini-pro' })
    .generateContentStream(buildGoogleGenAIPrompt(msg));

  // Convert the response into a friendly text-stream
  const stream = GoogleGenerativeAIStream(geminiStream,{
    onCompletion: async (completion: string) => {
      // Store the response in KV
      const title = json.messages[0].content.substring(0, 120);
      const id = json.id ?? nanoid();
      const createdAt = Date.now();
      const userId = (await auth())?.user.id;
      const path = `/chat/${id}`
      const payload = {
        id,
        title,
        userId,
        createdAt,
        path,
        messages: [
          ...messages,
          {
            content:completion.replace(/，/g, ','),
            role: 'assistant'
          }
        ]
      }
      await kv.hmset(`chat:${id}`, payload)
      await kv.zadd(`user:chat:${userId}`, {
        score: createdAt,
        member: `chat:${id}`
      })
    }
  });
  
  // Respond with the stream
  return new StreamingTextResponse(stream);
}
