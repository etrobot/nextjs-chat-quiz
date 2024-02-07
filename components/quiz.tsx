"use client"
import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface QuizDataInterface {
  Eps: string;
  Q: string;
  A: [string, string][];
  Exp: number[];
}

type QuizData = QuizDataInterface[];

interface ModalProps {
  show: boolean;
  onClose: () => void;
  selectScore: number | null;
}


// 定义一个 Quiz 组件，接受 quizdata 作为 props
const Quiz = ({ quizdata }: { quizdata: QuizData }) => {
  const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: number | null }>({});
  const [totalScore, setTotalScore] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [selectScore, setSelectScore] = useState<number | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  const handleChoiceSelection = (selectedChoice: number) => {
    setSelectedOptions({ ...selectedOptions, [currentQuestion]: selectedChoice });
  };

  const goToPreviousQuestion = () => {
    setCurrentQuestion(Math.max(0, currentQuestion - 1));
  };

  function findEpsIndex(quizData: QuizData, targetEps: string): number {
    for (let i = 0; i < quizData.length; i++) {
      const eps = quizData[i].Eps;
      if (eps === targetEps) {
        return i;
      }
    }
    return -1; // 如果未找到目标eps，则返回-1表示未找到
  }
  const goToNextQuestion = () => {
    const selectedChoice = selectedOptions[currentQuestion];
    if (selectedChoice != undefined && quizdata) {
      setSelectScore(quizdata[currentQuestion].Exp[selectedChoice]);
      if(quizdata[currentQuestion].Exp[selectedChoice]!==0){
        setShowModal(true);
        setTimeout(() => {
          setShowModal(false);
        }, 1000);
      }
      const epsIndex = findEpsIndex(quizdata, quizdata[currentQuestion].Eps);
      if(epsIndex!=-1){
        setCurrentQuestion(epsIndex+1);
        return
      }
    }
    setCurrentQuestion(Math.min(quizdata ? Object.keys(quizdata).length-1 : 0, currentQuestion + 1));
  };

  const calculateScore = () => {
    let score = 0;
    for (let i = 0; i < Object.keys(quizdata).length; i++) {
      const selectedChoice = selectedOptions[i];
      if (selectedChoice != undefined && quizdata) {
        score += quizdata[i].Exp[selectedChoice];
      }
    }
    setTotalScore(score);
  };
  return (
    <main>
    <Dialog open={showModal} onOpenChange={setShowModal}>
    <DialogContent>
          <DialogHeader><DialogTitle>GOT EXP</DialogTitle></DialogHeader>
        <p className='w-full text-center my-8 font-bold text-2xl'>{selectScore}</p>
      </DialogContent>
      </Dialog>
      {quizdata ? (
        totalScore === null ? (
          <div key={currentQuestion}>
            <p className='my-2 w-full text-center'>{quizdata[currentQuestion].Eps}</p>
            <p className='my-4 w-full text-center font-bold'>{quizdata[currentQuestion].Q}</p>
            <div>
              {quizdata[currentQuestion].A.map(([choiceText, nextStep], index) => (
                <button
                  className={`option ${selectedOptions[currentQuestion] === index ? 'selected' : ''}`}
                  key={index}
                  onClick={() => handleChoiceSelection(index)}
                >
                  {choiceText}
                </button>
              ))}
            </div>
            <div>
              <button onClick={goToPreviousQuestion} disabled={currentQuestion === 0 || selectedOptions[currentQuestion-1] != undefined}>
                Previous
              </button>
              <button onClick={goToNextQuestion} disabled={currentQuestion === Object.keys(quizdata).length-1}>
                Next
              </button>
              {currentQuestion === Object.keys(quizdata).length-1 && totalScore === null && (
                <button
                  className='w-32'
                  onClick={calculateScore}
                  disabled={Object.keys(selectedOptions).length < 2}
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
         <p className='center font-bold'>Total Score</p>
         <p className='center font-bold text-3xl my-8'>{totalScore}</p>
            </div>
        )
      ) : (
        <p>Loading quiz data...</p>
      )}
      <button className='w-full mt-16' onClick={() => location.reload()}>Restart</button>
    </main>
  );

}

// 导出 Quiz 组件
export default Quiz;
