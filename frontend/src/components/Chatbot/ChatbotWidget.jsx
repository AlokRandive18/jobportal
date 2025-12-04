import React, { useState, useRef, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiChat, HiPaperAirplane, HiUpload, HiDocumentText } from 'react-icons/hi';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ChatbotWidget = () => {
  const { isAuthorized, user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('initial'); // initial, upload, paste, chat
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or DOCX file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await api.post('/api/chatbot/upload-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSessionId(response.data.session_id);
      setRecommendedJobs(response.data.recommended_jobs || []);
      setMessages([
        {
          role: 'assistant',
          content: response.data.analysis,
        },
      ]);
      setView('chat');
      toast.success('Resume analyzed successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload resume');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteResume = async () => {
    if (!resumeText.trim()) {
      toast.error('Please paste your resume text');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/chatbot/paste-resume', {
        resume_text: resumeText,
        session_id: sessionId,
      });

      setSessionId(response.data.session_id);
      setRecommendedJobs(response.data.recommended_jobs || []);
      setMessages([
        {
          role: 'assistant',
          content: response.data.analysis,
        },
      ]);
      setView('chat');
      toast.success('Resume analyzed successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to analyze resume');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !sessionId) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/api/chatbot/chat', {
        message: input,
        session_id: sessionId,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.data.response,
        },
      ]);
    } catch (error) {
      toast.error('Failed to send message');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setView('initial');
    setMessages([]);
    setInput('');
    setResumeText('');
    setSessionId(null);
    setRecommendedJobs([]);
  };

  // Don't show for unauthenticated users or employers
  if (!isAuthorized || user?.role === 'Employer') {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
          >
            <HiChat className="w-8 h-8" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[600px] glass rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <HiChat className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">AI Career Advisor</h3>
                  <p className="text-white/80 text-xs">Get personalized job recommendations</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
              {view === 'initial' && (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                  <div className="text-center space-y-2">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                      Get Started
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Upload or paste your resume to get AI-powered job recommendations
                    </p>
                  </div>

                  <div className="w-full space-y-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-600 hover:border-purple-500 transition-all flex items-center justify-center gap-3 group"
                    >
                      <HiUpload className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white">Upload Resume</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">PDF or DOCX</p>
                      </div>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <button
                      onClick={() => setView('paste')}
                      className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-600 hover:border-blue-500 transition-all flex items-center justify-center gap-3 group"
                    >
                      <HiDocumentText className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white">Paste Resume Text</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Copy & paste</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {view === 'paste' && (
                <div className="h-full flex flex-col space-y-4">
                  <button
                    onClick={() => setView('initial')}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline self-start"
                  >
                    \u2190 Back
                  </button>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your resume text here..."
                    className="flex-1 p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  />
                  <button
                    onClick={handlePasteResume}
                    disabled={loading || !resumeText.trim()}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {loading ? 'Analyzing...' : 'Analyze Resume'}
                  </button>
                </div>
              )}

              {view === 'chat' && (
                <div className="h-full flex flex-col">
                  {/* Recommended Jobs */}
                  {recommendedJobs.length > 0 && (
                    <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-xs font-semibold text-purple-800 dark:text-purple-300 mb-2">
                        Recommended Jobs ({recommendedJobs.length})
                      </p>
                      <div className="space-y-1">
                        {recommendedJobs.slice(0, 3).map((job) => (
                          <div key={job.id} className="text-xs text-purple-700 dark:text-purple-400">
                            \u2022 {job.title} - {job.city}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] p-3 rounded-2xl ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-200 dark:border-gray-700">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-200"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}
            </div>

            {/* Input (only show in chat view) */}
            {view === 'chat' && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
                    placeholder="Ask about jobs, interview tips..."
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    disabled={loading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={loading || !input.trim()}
                    className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <HiPaperAirplane className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Loading Overlay */}
            {loading && view !== 'chat' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-900 dark:text-white font-semibold">Analyzing resume...</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotWidget;
