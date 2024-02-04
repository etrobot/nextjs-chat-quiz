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

export async function POST(req: Request) {
  const json = await req.json()
  const { messages, previewToken } = json
  // Extract the prompt from the body of the request
  if(messages.length<2){
    messages.push({role: 'user', 
    content: `您是游戏化专家。 您非常擅长根据用户示例测验设计测验游戏。\
     总结用户的示例测验并将其转换为测验游戏设计原则。\
     几个问题以及相关选项、答案、经验点和跳转,示例『设计一个哄女友的游戏』并以 JSON 格式输出：\[
      {
        "Q": "你知道错了吗?",
        "A": [
          ["明天你出差我给你买点吃的--转移注意力","next"], 
          ["我错了下次不会--道歉，表态","3"], 
          ["是猫吃的--搞笑","next"]
        ],
        "Exp":[10,20,-10]
      },
      {
        "Q": "别想敷衍，好好回答你错在哪里",
        "A": [
          ["我会赔偿你的零食费用--补偿","next"], 
          ["真的不好意思宝贝，刚刚在工作一不留神吃光了--道歉，辩解","end"], 
          ["真的抱歉宝贝，刚没留意，我马上下单给你再买--认错，补偿","end"]
        ],
        'Exp':[-10,10,20]
      },
      {
        "Q": "那你要怎么弥补我",
        "A": [
          ["我要给你100倍偿还，明天去吃米其林三星吧--幽默，浪漫，诚意","end"],
          ["马上下单--务实","end"], 
          ["马上下单，另外这个月的家务我包了--务实，诚意","end"]
        ],
        'Exp':[30,10,20]
      }
    ]，请务必使用该json格式输出，出色完成能得到500美元的额外报酬`+messages[0].content})
  }

  const geminiStream = await genAI
    .getGenerativeModel({ model: 'gemini-pro' })
    .generateContentStream(buildGoogleGenAIPrompt(messages));

  // Convert the response into a friendly text-stream
  const stream = GoogleGenerativeAIStream(geminiStream,{
    onCompletion: async (completion: string) => {
      // Store the response in KV
      const title = json.messages[0].content.substring(0, 100)
      const id = nanoid();
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
          ...messages.slice(0,messages.length-messages.length%2),
          {
            content: completion,
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
