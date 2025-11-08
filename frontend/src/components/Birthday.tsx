import React, { useState, useEffect } from 'react';
import { MessageSquare, Image, Mic, X } from 'lucide-react';

// ==================== Types ====================
interface Message {
    id: number;
    text: string;
    userId: number;
    userName: string;
    createdAt: string;
    hasImage: boolean;
    hasRecording: boolean;
    imageFilename: string | null;
    recordingFilename: string | null;
}

interface DiscordUserDTO {
    id: number;
    loginName: string;
}

interface UserMessageDTO {
    id: number;
    text: string;
    user: DiscordUserDTO;
    createdAt: string;
    hasImage: boolean;
    hasRecording: boolean;
    imageFilename: string | null;
    recordingFilename: string | null;
}

// ==================== Confetti Component ====================
const Confetti: React.FC = () => {
    const [particles, setParticles] = useState<Array<{
        id: number;
        left: number;
        delay: number;
        duration: number;
        color: string;
    }>>([]);

    useEffect(() => {
        const colors = ['#ef4444', '#ec4899', '#f97316', '#f59e0b', '#8b5cf6', '#06b6d4'];
        const newParticles = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 3,
            duration: 3 + Math.random() * 2,
            color: colors[Math.floor(Math.random() * colors.length)]
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute w-3 h-3 rounded-full animate-fall"
                    style={{
                        left: `${particle.left}%`,
                        top: '-20px',
                        backgroundColor: particle.color,
                        animationDelay: `${particle.delay}s`,
                        animationDuration: `${particle.duration}s`,
                    }}
                />
            ))}
            <style>{`
                @keyframes fall {
                    to {
                        transform: translateY(100vh) rotate(360deg);
                        opacity: 0;
                    }
                }
                .animate-fall {
                    animation: fall linear infinite;
                }
            `}</style>
        </div>
    );
};

// ==================== Message Modal ====================
interface MessageModalProps {
    message: Message;
    onClose: () => void;
}

const MessageModal: React.FC<MessageModalProps> = ({ message, onClose }) => {
    const [imageError, setImageError] = useState(false);
    const [audioError, setAudioError] = useState(false);

    const API_BASE_URL = 'https://api.beginning.gg/api/users';
    const imageSource = message.hasImage
        ? `${API_BASE_URL}/messages/${message.id}/image`
        : null;
    const recordingSource = message.hasRecording
        ? `${API_BASE_URL}/messages/${message.id}/recording`
        : null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-red-500/50" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {message.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-white text-lg">{message.userName}</span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {message.text && (
                        <p className="text-gray-200 text-lg whitespace-pre-wrap mb-6">{message.text}</p>
                    )}

                    {imageSource && !imageError && (
                        <div className="mb-6 bg-gray-900 rounded-lg p-2">
                            <img
                                src={imageSource}
                                alt="User uploaded image"
                                onError={() => setImageError(true)}
                                className="rounded-lg w-full object-contain max-h-96"
                            />
                        </div>
                    )}

                    {recordingSource && !audioError && (
                        <div className="bg-gray-900 rounded-lg p-4">
                            <div className="flex items-center space-x-3 mb-3">
                                <Mic className="w-5 h-5 text-pink-500" />
                                <span className="text-gray-400 text-sm font-medium">Voice Message</span>
                            </div>
                            <audio
                                controls
                                src={recordingSource}
                                onError={() => setAudioError(true)}
                                className="w-full h-10"
                                style={{ filter: 'hue-rotate(330deg) saturate(1.5)' }}
                            >
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ==================== Message Card (Grid Style) ====================
interface MessageCardProps {
    message: Message;
    onClick: () => void;
}

const MessageCard: React.FC<MessageCardProps> = ({ message, onClick }) => {
    const [imageError, setImageError] = useState(false);
    const [audioError, setAudioError] = useState(false);

    const API_BASE_URL = 'http://localhost:8080/api/users';
    const imageSource = message.hasImage
        ? `${API_BASE_URL}/messages/${message.id}/image`
        : null;
    const recordingSource = message.hasRecording
        ? `${API_BASE_URL}/messages/${message.id}/recording`
        : null;

    const truncatedText = message.text.length > 100
        ? message.text.substring(0, 100) + '...'
        : message.text;

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-6 border-2 border-red-500/30 hover:border-red-500 transition-all hover:shadow-2xl flex flex-col">
            <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                    {message.userName.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-white">{message.userName}</span>
            </div>

            {message.text && (
                <div>
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed mb-4">
                        {truncatedText}
                    </p>
                    {message.text.length > 100 && (
                        <button
                            onClick={onClick}
                            className="text-pink-400 hover:text-pink-300 text-sm font-medium mb-4"
                        >
                            Read more →
                        </button>
                    )}
                </div>
            )}

            {/* Image Display */}
            {imageSource && !imageError && (
                <div className="mb-4 bg-gray-900 rounded-lg p-2">
                    <img
                        src={imageSource}
                        alt="User uploaded image"
                        onError={() => setImageError(true)}
                        className="rounded-lg w-full object-cover max-h-64"
                    />
                </div>
            )}
            {imageSource && imageError && (
                <div className="mb-4 bg-gray-900 rounded-lg p-4 text-center">
                    <Image className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">Image failed to load</p>
                </div>
            )}

            {/* Audio Player */}
            {recordingSource && !audioError && (
                <div className="bg-gray-900 rounded-lg p-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center space-x-2 mb-2">
                        <Mic className="w-4 h-4 text-pink-500" />
                        <span className="text-gray-400 text-xs font-medium">Voice Message</span>
                    </div>
                    <audio
                        controls
                        src={recordingSource}
                        onError={() => setAudioError(true)}
                        className="w-full h-8"
                        style={{ filter: 'hue-rotate(330deg) saturate(1.5)' }}
                    >
                        Your browser does not support the audio element.
                    </audio>
                </div>
            )}
            {recordingSource && audioError && (
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <Mic className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">Audio failed to load</p>
                </div>
            )}
        </div>
    );
};

// ==================== Main Birthday Component ====================
export const Birthday: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [showConfetti, setShowConfetti] = useState(true);

    const API_BASE_URL = 'https://api.beginning.gg/api/users';

    const transformMessage = (dto: UserMessageDTO): Message => ({
        id: dto.id,
        text: dto.text,
        userId: dto.user.id,
        userName: dto.user.loginName,
        createdAt: dto.createdAt,
        hasImage: dto.hasImage,
        hasRecording: dto.hasRecording,
        imageFilename: dto.imageFilename,
        recordingFilename: dto.recordingFilename,
    });

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/messages`);
                if (response.ok) {
                    const messageDtos: UserMessageDTO[] = await response.json();
                    setMessages(messageDtos.map(transformMessage));
                }
            } catch (e) {
                console.error("Error loading messages:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        // Hide confetti after 8 seconds
        const timer = setTimeout(() => setShowConfetti(false), 8000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen">
            {showConfetti && <Confetti />}

            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="text-center mb-16">
                    <h1 className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent mb-6 animate-pulse">
                        🎉 Happy Birthday Rei! 🎂
                    </h1>
                    <p className="text-gray-300 text-2xl font-light">
                        Your friends have something special to say...
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500"></div>
                        <p className="text-gray-400 mt-4 text-lg">Loading birthday wishes...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-20 bg-gray-800/50 rounded-2xl border border-red-500/30">
                        <MessageSquare className="w-20 h-20 text-gray-500 mx-auto mb-6" />
                        <p className="text-gray-400 text-xl">No birthday messages yet!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {messages.map((message) => (
                            <MessageCard
                                key={message.id}
                                message={message}
                                onClick={() => setSelectedMessage(message)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {selectedMessage && (
                <MessageModal
                    message={selectedMessage}
                    onClose={() => setSelectedMessage(null)}
                />
            )}

            <footer className="text-center py-12 text-gray-400 text-lg">
                Made with ❤️ for Rei's Special Day ✨
            </footer>
        </div>
    );
};