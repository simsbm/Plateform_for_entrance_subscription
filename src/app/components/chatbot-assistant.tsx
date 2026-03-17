import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function ChatbotAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your SUPPTIC assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const quickQuestions = [
    "How do I register?",
    "Required documents?",
    "Exam dates?",
    "Program information"
  ];

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('register') || lowerMessage.includes('registration')) {
      return "To register, click on 'Register Now' on the homepage. You'll need to create an account, complete the application form, upload required documents, and pay the registration fee of 15,000 XAF.";
    }
    
    if (lowerMessage.includes('document')) {
      return "Required documents:\n• Birth Certificate\n• Baccalauréat Diploma or equivalent\n• Passport Photo (4x4)\n• National ID Card\nAll documents should be in PDF, JPG, or PNG format (max 5MB).";
    }
    
    if (lowerMessage.includes('exam') || lowerMessage.includes('date')) {
      return "The entrance examination is scheduled for April 15, 2026. Registration deadline is March 31, 2026. Results will be published on May 30, 2026.";
    }
    
    if (lowerMessage.includes('program') || lowerMessage.includes('itt') || lowerMessage.includes('ipt')) {
      return "We offer 4 programs:\n• ITT - Telecommunications Engineering (3 years)\n• IPT - Postal & Telecom Inspection (3 years)\n• TT - Telecommunications Technician (2 years)\n• CPT - Postal & Telecom Controller (2 years)";
    }
    
    if (lowerMessage.includes('fee') || lowerMessage.includes('payment') || lowerMessage.includes('cost')) {
      return "The registration fee is 15,000 XAF. You can pay via MTN Mobile Money, Orange Money, or bank card.";
    }
    
    if (lowerMessage.includes('contact') || lowerMessage.includes('help')) {
      return "You can contact us at:\nEmail: info@supptic.cm\nPhone: +237 222 XX XX XX\nOffice hours: Monday-Friday, 8AM-5PM";
    }

    return "I understand you're asking about " + userMessage + ". For specific inquiries, please contact our support team at info@supptic.cm or call +237 222 XX XX XX.";
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Simulate bot response delay
    setTimeout(() => {
      const botMessage: Message = {
        id: messages.length + 2,
        text: getBotResponse(inputMessage),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 500);
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
    handleSendMessage();
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="w-16 h-16 rounded-full shadow-2xl bg-gradient-to-r from-primary to-secondary hover:shadow-xl transition-all"
            >
              <MessageCircle className="w-8 h-8" />
            </Button>
            {/* Notification Badge */}
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
              1
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)]"
          >
            <Card className="shadow-2xl border-2">
              <CardHeader className="bg-gradient-to-r from-primary to-secondary text-white p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">SUPPTIC Assistant</CardTitle>
                      <p className="text-xs text-blue-100">Online - Ready to help</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages */}
                <ScrollArea className="h-[400px] p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.sender === 'bot' && (
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                            <Bot className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-lg p-3 ${
                            message.sender === 'user'
                              ? 'bg-primary text-white'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line">{message.text}</p>
                          <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-muted-foreground'}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {message.sender === 'user' && (
                          <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-accent" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Quick Questions */}
                {messages.length === 1 && (
                  <div className="p-4 border-t bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickQuestion(question)}
                          className="text-xs h-auto py-2 px-3"
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t bg-white">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
