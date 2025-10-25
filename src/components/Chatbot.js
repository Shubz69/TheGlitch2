import React, { useState, useEffect, useRef } from "react";
import "../styles/Chatbot.css";

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [showOptions, setShowOptions] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [connectError, setConnectError] = useState(false);
    const messagesEndRef = useRef(null);

    const toggleChat = () => {
        setIsOpen(!isOpen);
        
        // Reset connection error when reopening
        if (!isOpen) {
            setConnectError(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setMessages([
                {
                    from: "bot",
                    text: "👋 Welcome to <span className='glitch-brand' data-text='THE GLITCH'>THE GLITCH</span>! How can I help you today?\nChoose a question or type your own.",
                },
            ]);
            setShowOptions(true);
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (message) => {
        const updatedMessages = [...messages, { from: "user", text: message }];
        setMessages(updatedMessages);
        setInput("");
        setShowOptions(false);
        setIsLoading(true);

        try {
            // Try to use the live API first
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://theglitch.world';
            const res = await fetch(`${API_BASE_URL}/api/chatbot`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ message }),
            });

            let replyText = "⚠️ The chatbot encountered an error. Please try again later.";
            if (res.ok) {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const data = await res.json();
                    replyText = data.reply || data.message || data.response || "I received your message but couldn't generate a proper response.";
                } else {
                    replyText = await res.text();
                }
                setConnectError(false);
            } else {
                if (res.status === 404) {
                    replyText = "⚠️ The chatbot service is currently unavailable. I'll use simulated responses instead.";
                    setConnectError(true);
                    // Provide a simulated response based on the message
                    setTimeout(() => {
                        const simulatedResponse = getSimulatedResponse(message);
                        setMessages(prev => [...prev, { from: "bot", text: simulatedResponse }]);
                    }, 1000);
                    setIsLoading(false);
                    return;
                }
            }

            setMessages((prev) => [...prev, { from: "bot", text: replyText }]);
        } catch (err) {
            console.error("Chatbot API error:", err);
            setConnectError(true);
            const simulatedResponse = getSimulatedResponse(message);
            setMessages((prev) => [
                ...prev,
                { from: "bot", text: simulatedResponse }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // Improved fallback function with more comprehensive responses
    const getSimulatedResponse = (message) => {
        const msg = message.toLowerCase();
        
        // Greetings
        if (msg.includes("hello") || msg.includes("hi ") || msg.includes("hey") || msg.match(/^hi$/) || msg.match(/^hey$/)) {
            return "Hello! I'm THE GLITCH, your trading assistant. How can I help you today?";
        }
        
        // Course related queries
        if (msg.includes("course") || msg.includes("learn") || msg.includes("study") || msg.includes("tutorial")) {
            if (msg.includes("beginner") || msg.includes("start")) {
                return "We offer several beginner-friendly courses including 'Introduction to Trading' which is completely free! Visit our Courses page to get started.";
            }
            if (msg.includes("video")) {
                return "Yes, our courses include video tutorials, interactive lessons, quizzes, and downloadable resources.";
            }
            if (msg.includes("track") || msg.includes("progress")) {
                return "You can track your course progress in the 'My Courses' section after logging in. It shows completion percentage and which modules you've finished.";
            }
            return "We offer various trading courses from beginner to advanced levels. Popular options include Introduction to Trading (free), Technical Analysis ($49.99), and Advanced Options Trading ($79.99).";
        }
        
        // Pricing related queries
        if (msg.includes("price") || msg.includes("cost") || msg.includes("subscription") || msg.includes("pay") || msg.includes("fee")) {
            if (msg.includes("free")) {
                return "Yes, we offer free courses including 'Introduction to Trading' and limited access to the community.";
            }
            if (msg.includes("premium")) {
                return "Premium membership costs $19.99/month and includes access to all courses, advanced features, and priority support.";
            }
            return "We have a freemium model. Basic access is free, premium features start at $19.99/month, and individual courses range from free to $79.99.";
        }
        
        // Platform features
        if (msg.includes("feature") || msg.includes("tool") || msg.includes("function")) {
            return "THE GLITCH provides educational resources on various trading topics including stocks, forex, and cryptocurrencies. Our platform is focused on helping you learn trading strategies, not on providing direct trading capabilities. Is there something specific about THE GLITCH trading platform you'd like to know?";
        }
        
        // Community related
        if (msg.includes("community") || msg.includes("forum") || msg.includes("chat") || msg.includes("discuss")) {
            return "Our community is a great place to connect with other traders, share strategies, and get help. You can access it after logging in, and it's free for all users!";
        }
        
        // Technical support
        if (msg.includes("help") || msg.includes("support") || msg.includes("problem") || msg.includes("issue") || msg.includes("error")) {
            return "I'm here to help! For technical issues, you can <a href='/contact' style='color: #8B5CF6; text-decoration: underline;'>contact our support team</a>. For general questions about trading or our platform, feel free to ask me!";
        }
        
        // Account and payment issues
        if (msg.includes("account") || msg.includes("password") || msg.includes("login") || msg.includes("payment") || msg.includes("billing") || msg.includes("refund")) {
            return "For account, payment, or billing-related questions, please visit our <a href='/contact' style='color: #8B5CF6; text-decoration: underline;'>Contact Us page</a> to submit a support request. Our team will assist you within 24 hours.";
        }
        
        // About the platform
        if (msg.includes("about") || msg.includes("what") || msg.includes("how") || msg.includes("platform")) {
            return "THE GLITCH is your pathway to building generational wealth through multiple streams of knowledge. We teach you to make money work for you, break bad financial habits, and create lasting prosperity.";
        }
        
        // Generational wealth questions
        if (msg.includes("wealth") || msg.includes("income") || msg.includes("passive") || msg.includes("financial freedom")) {
            return "We focus on teaching you how to build generational wealth through multiple income streams. Our courses cover trading, investing, e-commerce, and more—all designed to help you achieve true financial freedom!";
        }
        
        // Default response - direct to contact if can't help
        return "I'm not quite sure how to help with that specific question. 🤔 For personalized assistance, please <a href='/contact' style='color: #8B5CF6; text-decoration: underline;'>visit our Contact Us page</a> and our team will get back to you. Is there anything else about THE GLITCH I can help you with?";
    };

    const handleOption = (message) => {
        sendMessage(message);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim()) {
            sendMessage(input);
        }
    };

    const groupedOptions = {
        "📚 Courses": [
            "What trading courses do you offer for beginners?",
            "Are there any video tutorials or just text?",
            "How do I track my course progress?",
            "Do the courses include quizzes or checkpoints?",
            "Can I access advanced courses without a subscription?",
        ],
        "💸 Pricing & Subscriptions": [
            "What's the difference between the Free and Premium plans?",
            "How much does the Premium plan cost?",
            "Can I cancel my subscription anytime?",
            "Is there a refund if I'm not happy?",
            "What payment methods are accepted?",
        ],
        "💬 Community": [
            "What's the THE GLITCH community?",
            "How do I unlock new chat channels?",
            "Is the community moderated?",
            "Can free users access the chatroom?",
            "How do XP and leveling up work?",
        ],
        "🛠️ Tech Help & Chatbot": [
            "Where can I use the chatbot?",
            "What can the chatbot help me with?",
            "Does the bot give live market data?",
            "Why can't I send messages in some channels?",
            "I purchased a course — why can't I access the community?",
        ]
    };

    return (
        <div className="chatbot-container">
            <button className="chatbot-toggle" onClick={toggleChat}>💬</button>
            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        THE GLITCH Chat
                        {connectError && <span className="offline-indicator">⚠️ Offline Mode</span>}
                        <button className="chatbot-close" onClick={toggleChat}>✕</button>
                    </div>
                    <div className="chatbot-messages">
                        {messages.map((msg, i) => (
                            <div 
                                key={i} 
                                className={`message ${msg.from}`}
                                dangerouslySetInnerHTML={{ __html: msg.text }}
                            />
                        ))}

                        {showOptions && (
                            <div className="message bot">
                                {Object.entries(groupedOptions).map(([group, questions]) => (
                                    <div key={group} style={{ marginBottom: "10px" }}>
                                        <strong>{group}</strong>
                                        <ul style={{ paddingLeft: "20px" }}>
                                            {questions.map((q, i) => (
                                                <li
                                                    key={i}
                                                    className="chatbot-option"
                                                    onClick={() => handleOption(q)}
                                                >
                                                    {q}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isLoading && (
                            <div className="message bot">🧠 Thinking...</div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chatbot-input" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            value={input}
                            placeholder="Ask me anything..."
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <button type="submit">➤</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Chatbot;
