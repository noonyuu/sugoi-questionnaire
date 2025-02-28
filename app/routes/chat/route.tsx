import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, CheckCircle2, FileQuestion, Mic, MicOff } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

type Message = {
  id: string;
  role: "system" | "user";
  content: string;
  isQuestion?: boolean;
  questionId?: string;
};

type FormQuestion = {
  id: string;
  question: string;
  type: string;
  options?: string[];
};

// Declare SpeechRecognitionStatic
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "system",
      content: "フォームのURLを入力してください。解析後、質問に順番に回答できます。",
    },
  ]);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // メッセージが追加されたときに自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition: SpeechRecognitionStatic | undefined = typeof window !== "undefined" && (window.SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (typeof window !== "undefined" && SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = "ja-JP";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");
        setInput(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    try {
      // 実際の実装ではHonoサーバーにリクエストを送信
      // ここではモックデータを使用
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockQuestions: FormQuestion[] = [
        { id: "name", question: "お名前を教えてください", type: "text" },
        { id: "age", question: "年齢を教えてください", type: "number" },
        { id: "preference", question: "好きな色はどれですか？", type: "select", options: ["赤", "青", "緑", "黄色"] },
      ];

      setQuestions(mockQuestions);
      setMessages([
        ...messages,
        { id: Date.now().toString(), role: "user", content: url },
        {
          id: (Date.now() + 1).toString(),
          role: "system",
          content: "フォームを解析しました。質問に順番に回答してください。",
        },
      ]);
      setCurrentQuestionIndex(0);
    } catch (error) {
      setMessages([
        ...messages,
        { id: Date.now().toString(), role: "user", content: url },
        {
          id: (Date.now() + 1).toString(),
          role: "system",
          content: "フォームの解析に失敗しました。URLを確認して再度お試しください。",
        },
      ]);
    } finally {
      setIsLoading(false);
      setUrl("");
    }
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) return;

    const currentQuestion = questions[currentQuestionIndex];
    const answer = input;

    // 回答を保存
    setAnswers({
      ...answers,
      [currentQuestion.id]: answer,
    });

    // メッセージに追加
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        role: "system",
        content: currentQuestion.question,
        isQuestion: true,
        questionId: currentQuestion.id,
      },
      { id: (Date.now() + 1).toString(), role: "user", content: answer },
    ]);

    setInput("");

    // 次の質問へ
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // 全ての質問が終了
      setIsProcessing(true);

      try {
        // 実際の実装ではHonoサーバーに回答を送信
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "system",
            content: "すべての回答が送信されました。ありがとうございました！",
          },
        ]);
        setIsComplete(true);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "system",
            content: "回答の送信に失敗しました。もう一度お試しください。",
          },
        ]);
      } finally {
        setIsProcessing(false);
        setCurrentQuestionIndex(-1);
      }
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "system",
        content: "フォームのURLを入力してください。解析後、質問に順番に回答できます。",
      },
    ]);
    setQuestions([]);
    setCurrentQuestionIndex(-1);
    setAnswers({});
    setIsComplete(false);
  };

  const getCurrentQuestion = () => {
    if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
      return questions[currentQuestionIndex];
    }
    return null;
  };

  const currentQuestion = getCurrentQuestion();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=20&width=20')] opacity-5 bg-repeat"></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <Card className="w-full overflow-hidden border-none shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <FileQuestion className="h-6 w-6" />
              フォームチャットボット
            </CardTitle>
          </CardHeader>

          <CardContent className="h-[60vh] overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, delay: index * 0.1 }} className={`flex items-start gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "system" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black flex items-center justify-center text-white">
                      <Bot className="h-5 w-5" />
                    </div>
                  )}

                  <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${message.role === "user" ? "bg-black text-white" : message.isQuestion ? "bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-300" : "bg-black border border-gray-300"}`}>{message.content}</div>

                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black flex items-center justify-center text-white">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
                <div className="bg-black rounded-full px-4 py-2 shadow-sm border border-purple-200">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                    <span className="text-sm text-violet-700">フォームを解析中...</span>
                  </div>
                </div>
              </motion.div>
            )}

            {isProcessing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-full px-4 py-2 shadow-sm border border-green-200">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                    <span className="text-sm text-green-700">回答を送信中...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          <CardFooter className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t">
            {isComplete ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full">
                <Button onClick={resetChat} className="w-full bg-black duration-300">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  新しいフォームを解析する
                </Button>
              </motion.div>
            ) : currentQuestionIndex >= 0 ? (
              <form onSubmit={handleAnswerSubmit} className="flex w-full space-x-2">
                {currentQuestion?.type === "select" && currentQuestion.options ? (
                  <select className="flex-1 px-4 py-2 border rounded-full focus:ring-2 focus:ring-violet-300 focus:border-violet-500 transition-all duration-200" value={input} onChange={(e) => setInput(e.target.value)}>
                    <option value="">選択してください</option>
                    {currentQuestion.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex-1 flex items-center space-x-2">
                    <Input type={currentQuestion?.type || "text"} value={input} onChange={(e) => setInput(e.target.value)} placeholder={`${currentQuestion?.question}に回答...`} className="flex-1 rounded-full px-4 border-gray-300 focus:ring-2 focus:ring-violet-300 focus:border-violet-500 transition-all duration-200" />
                    <Button type="button" size="icon" onClick={toggleListening} className={`rounded-full ${isListening ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"} text-white transition-all duration-300`}>
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
                <Button type="submit" size="icon" disabled={!input} className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 transition-all duration-300">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <form onSubmit={handleUrlSubmit} className="flex w-full space-x-2">
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="フォームのURLを入力..." className="flex-1 rounded-full px-4 border-gray-300 focus:ring-2 focus:ring-violet-300 focus:border-violet-500 transition-all duration-200" />
                <Button type="submit" size="icon" disabled={!url || isLoading} className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 transition-all duration-300">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
