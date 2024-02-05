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

const initprompt=`您是游戏化专家。 您非常擅长根据用户示例设计简短的文字冒险游戏(含阶段、问答、可获得的经验值),并以 JSON 格式输出,示例『设计一个哄女友的游戏』：[
  {
    "Eps": "吃了她的零食",
    "Q": "你知道错了吗?",
    "A": [
      ["明天你出差我给你买点吃的--转移注意力","next"], 
      ["我错了下次不会--道歉，表态","卧室"], 
      ["是猫吃的--搞笑","next"]
    ],
    "Exp":[0,20,-10]
  },
  {
    "Eps": "试着安慰",
    "Q": "别想敷衍，好好回答你错在哪里",
    "A": [
      ["我会赔偿你的零食费用--补偿","next"], 
      ["真的不好意思宝贝，刚刚在工作一不留神吃光了--道歉，辩解","卧室"], 
      ["真的抱歉宝贝，刚没留意，我马上下单给你再买--认错，补偿","卧室"]
    ],
    'Exp':[-10,0,20]
  },
  {
    "Eps": "总结经验再次尝试",
    "Q": "那你要怎么弥补我",
    "A": [
      ["我要给你100倍偿还，明天去吃米其林三星吧--幽默，浪漫，诚意","end"],
      ["马上下单--务实","end"], 
      ["马上下单，另外这个月的家务我包了--务实，诚意","end"]
    ],
    'Exp':[30,0,20]
  }
]，请务必使用该json Array完整格式输出，环节以有因果关联的阶段问答形式组成，不需要行动环节。出色完成能得到500美元的额外报酬,以下是新任务：`

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
      const title = json.messages[0].content.substring(0, 100);
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
            content:completion,
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
