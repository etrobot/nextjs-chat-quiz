//api/quiz.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@/auth'
import { kv } from '@vercel/kv'

export async function POST(req: Request) {
  const userId = (await auth())?.user.id
  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }
  const json = await req.json()
  const title = json.messages[0].content.substring(0, 100);
  const id = json.id;
  const createdAt = Date.now();
  const path = `/chat/${id}`
  const payload = {
    id,
    title,
    userId,
    createdAt,
    path,
    messages:json.messages
  }
  await kv.hmset(`chat:${id}`, payload)
  return new Response(JSON.stringify('success'), {
    status: 200
  })
}