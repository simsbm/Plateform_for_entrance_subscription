import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { ChatbotAssistant } from './components/chatbot-assistant';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
      <ChatbotAssistant />
    </>
  );
}