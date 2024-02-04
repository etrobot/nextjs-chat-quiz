"use client"
import React, { useState } from 'react'

interface QuizDataInterface {
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

const Modal: React.FC<ModalProps> = ({ show, onClose, selectScore}) => {
  if (!show) return null;
  return (
      <div className="mask">
          <div className="bg-background p-4 rounded">
              <p>{selectScore}</p>
              <button onClick={onClose}>
                  OK
              </button>
          </div>
      </div>
  );
};
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

  const goToNextQuestion = () => {
    const selectedChoice = selectedOptions[currentQuestion];
    if (selectedChoice != undefined && quizdata) {
      setSelectScore(quizdata[currentQuestion].Exp[selectedChoice]);
      setShowModal(true);
      setTimeout(() => {
        setShowModal(false);
      }, 1000);
    }
    setCurrentQuestion(Math.min(quizdata ? Object.keys(quizdata).length-1 : 0, currentQuestion + 1));
  };

  const calculateScore = () => {
    let score = 0;
    Object.entries(setSelectedOptions).forEach(([questionNumber, selectedChoice]) => {
      const question = quizdata && quizdata[parseInt(questionNumber)];
      if (question) {
        score+=question.Exp[selectedChoice];
      }
    });
    setTotalScore(score);
  };
  return (
    <main>
    <Modal show={showModal} onClose={() => setShowModal(false)} selectScore={selectScore} />
      {quizdata ? (
        totalScore === null ? (
          <div key={currentQuestion}>
            <p>{quizdata[currentQuestion].Q}</p>
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
         <p className='center'>Total Score: {totalScore}</p>
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
