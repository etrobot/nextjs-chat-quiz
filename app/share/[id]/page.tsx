import { type Metadata } from 'next'
import { notFound } from 'next/navigation'

import { formatDate } from '@/lib/utils'
import { getSharedChat } from '@/app/actions'
import { ChatList } from '@/components/chat-list'
import { FooterText } from '@/components/footer'
import Quiz from '@/components/quiz'
interface SharePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({
  params
}: SharePageProps): Promise<Metadata> {
  const chat = await getSharedChat(params.id)

  return {
    title: chat?.title.slice(0, 50) ?? 'Chat'
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const chat = await getSharedChat(params.id)

  if (!chat || !chat?.sharePath) {
    notFound()
  }
  const jstr = chat.messages.slice(-1)[0].content; // 这里是您的原始字符串

  // 使用正则表达式匹配并提取内容
  const regex = /```json\n([\s\S]*?)\n```/;
  const match = jstr.match(regex);

  let extractedContent = "";
  if (match && match[1]) {
    extractedContent = match[1];
  }

  interface QuizDataInterface {
    Q: string;
    A: [string, string][];
    Exp: number[];
  }
  
  type QuizData = QuizDataInterface[];

  const quizdata:QuizData=JSON.parse(extractedContent)
  
// 在 SharePage 组件中渲染 Quiz 组件，传入 quizdata 作为 props
return (
  <>
    <div className="flex-1 space-y-6">
      <div className="px-4 py-6 border-b md:px-6 md:py-8">
        <div className="max-w-2xl mx-auto md:px-6">
          <div className="space-y-1 md:-mx-8">
            <h1 className="text-2xl font-bold">{chat.title}</h1>
            <div className="text-sm text-muted-foreground">
              {formatDate(chat.createdAt)}
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 py-6 md:px-6 md:py-8">
        <div className="max-w-2xl mx-auto md:px-6">
          <Quiz quizdata={quizdata} />
        </div>
      </div>
    </div>
    <FooterText className="py-8" />
  </>
)

}
