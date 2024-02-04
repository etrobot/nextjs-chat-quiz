//api/quiz.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@/auth'

type QuizData = {
  [key: number]: {
    query: string;
    choices: [number, string][]; // score, choice_text
    explanation: string;
  };
};

const testQuiz: QuizData = {
  1: {
    query: "What is the capital of France?",
    choices: [[0, "Paris"], [1, "Berlin"], [0, "London"]],
    explanation: "Paris is the capital of France.",
  },
  2: {
    query: "Which planet is known as the Red Planet?",
    choices: [[0, "Earth"], [0, "Mars"], [1, "Venus"]],
    explanation: "Mars is known as the Red Planet.",
  },
  3: {
    query: "What is the largest mammal in the world?",
    choices: [[0, "Elephant"], [1, "Blue Whale"], [0, "Giraffe"]],
    explanation: "The Blue Whale is the largest mammal in the world.",
  },
};

export async function GET(req: Request) {
  const userId = (await auth())?.user.id
  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }
  return new Response(JSON.stringify(testQuiz), {
    status: 200
  })
}