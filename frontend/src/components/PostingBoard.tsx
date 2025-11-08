import React, { useState, useEffect, useRef } from 'react';
import { NavBar } from './NavBar';
import { MessageSquare, Edit2, Trash2, Send, X, Image, Mic, Square } from 'lucide-react';

// ==================== Types ====================
interface User {
    id: number;
    loginName: string;
}

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

interface LoginResponseData {
    user: DiscordUserDTO;
    token: string;
}

interface LoginModalProps {
    onLogin: (loginName: string, password: string) => void;
    onClose: () => void;
}

interface MessageCardProps {
    message: Message;
    currentUser: User | null;
    onEdit: (message: Message) => void;
    onDelete: (id: number) => void;
}

interface NewMessageFormProps {
    onSubmit: (text: string, image: File | null, recording: File | null) => void;
    onCancel?: () => void;
    initialText?: string;
}

interface AlertModalProps {
    message: string;
    onClose: () => void;
    type?: 'error' | 'info' | 'warning';
}

interface ConfirmModalProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

// ==================== API Configuration and Helpers ====================

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

// --- API Functions ---

const loginUser = async (loginName: string, password: string): Promise<LoginResponseData> => {
    const response = await fetch(`${API_BASE_URL}/login?loginName=${loginName}&password=${password}`, {
        method: 'POST',
    });

    if (!response.ok) {
        await response.text();
        throw new Error('Invalid login name or password. Please try again.');
    }

    const loginData: LoginResponseData = await response.json();
    return loginData;
};

const fetchAllMessages = async (): Promise<Message[]> => {
    const response = await fetch(`${API_BASE_URL}/messages`);

    if (!response.ok) {
        throw new Error('Failed to fetch messages.');
    }

    const messageDtos: UserMessageDTO[] = await response.json();
    return messageDtos.map(transformMessage);
};

const createNewMessage = async (userId: number, text: string, image: File | null, recording: File | null): Promise<Message> => {
    const token = sessionStorage.getItem('jwtToken');
    if (!token) {
        throw new Error("Authentication required to post message.");
    }

    const formData = new FormData();
    formData.append('text', text);
    if (image) formData.append('image', image);
    if (recording) formData.append('recording', recording);

    const response = await fetch(`${API_BASE_URL}/${userId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        console.error("Failed to create message:", response.status, await response.text());
        throw new Error(`Failed to create message. Status: ${response.status}`);
    }

    const messageDto: UserMessageDTO = await response.json();
    return transformMessage(messageDto);
};

const modifyExistingMessage = async (userId: number, messageId: number, newText: string): Promise<Message> => {
    const token = sessionStorage.getItem('jwtToken');
    if (!token) {
        throw new Error("Authentication required to modify message.");
    }

    const response = await fetch(`${API_BASE_URL}/${userId}/messages/${messageId}?newText=${encodeURIComponent(newText)}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to modify message.');
    }

    const messageDto: UserMessageDTO = await response.json();
    return transformMessage(messageDto);
};

// ==================== Alert and Confirm Modals ====================
const AlertModal: React.FC<AlertModalProps> = ({ message, onClose, type = 'info' }) => {
    const colors = {
        error: 'border-red-500/50 from-red-600 to-pink-600',
        warning: 'border-yellow-500/50 from-yellow-600 to-orange-600',
        info: 'border-blue-500/50 from-blue-600 to-purple-600'
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className={`bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 border ${colors[type]}`}>
                <div className="text-center">
                    <p className="text-white text-lg mb-6">{message}</p>
                    <button
                        onClick={onClose}
                        className={`w-full bg-gradient-to-r ${colors[type]} text-white py-3 rounded-lg hover:opacity-90 transition-opacity font-semibold`}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-red-500/50">
                <div className="text-center">
                    <p className="text-white text-lg mb-6">{message}</p>
                    <div className="flex space-x-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-lg hover:from-red-700 hover:to-pink-700 transition-colors font-semibold"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==================== Login Modal (Themed) ====================
const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose }) => {
    const [loginName, setLoginName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!loginName.trim()) { setError('Please enter your name'); return; }
        if (!password.trim()) { setError('Please enter the password'); return; }
        setError('');
        onLogin(loginName, password);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-red-500/50">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Sign in to Post</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Your Name"
                        value={loginName}
                        onChange={(e) => setLoginName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-red-500 focus:border-red-500"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-red-500 focus:border-red-500"
                    />
                    {error && <div className="text-red-400 text-sm">{error}</div>}
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-lg hover:from-red-700 hover:to-pink-700 transition-colors font-semibold"
                    >
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
};

// ==================== Message Card (Themed and Media Display) ====================
const MessageCard: React.FC<MessageCardProps> = ({ message, currentUser, onEdit, onDelete }) => {
    const isOwner = currentUser?.id === message.userId;
    const [imageError, setImageError] = useState(false);
    const [audioError, setAudioError] = useState(false);

    const imageSource = message.hasImage
        ? `${API_BASE_URL}/messages/${message.id}/image`
        : null;

    const recordingSource = message.hasRecording
        ? `${API_BASE_URL}/messages/${message.id}/recording`
        : null;

    return (
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border-l-4 border-red-500">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                        {message.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <span className="font-semibold text-white block">{message.userName}</span>
                    </div>
                </div>
                {isOwner && (
                    <div className="flex space-x-2">
                        <button onClick={() => onEdit(message)} className="text-gray-400 hover:text-pink-400 p-2 rounded transition-colors">
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(message.id)} className="text-gray-400 hover:text-red-500 p-2 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {message.text && (
                <p className="text-gray-300 whitespace-pre-wrap mb-4">{message.text}</p>
            )}

            {imageSource && !imageError && (
                <div className="mb-4 bg-gray-900 rounded-lg p-2">
                    <img
                        src={imageSource}
                        alt="User uploaded image"
                        onError={() => {
                            console.error('Failed to load image:', imageSource);
                            setImageError(true);
                        }}
                        className="rounded-lg max-h-96 w-full object-contain"
                    />
                </div>
            )}
            {imageSource && imageError && (
                <div className="mb-4 bg-gray-900 rounded-lg p-4 text-center">
                    <Image className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Image failed to load</p>
                </div>
            )}

            {recordingSource && !audioError && (
                <div className="mb-4 bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-2">
                        <Mic className="w-5 h-5 text-pink-500" />
                        <span className="text-gray-400 text-sm font-medium">Voice Message</span>
                    </div>
                    <audio
                        controls
                        src={recordingSource}
                        onError={() => {
                            console.error('Failed to load audio:', recordingSource);
                            setAudioError(true);
                        }}
                        className="w-full h-10"
                        style={{
                            filter: 'hue-rotate(330deg) saturate(1.5)',
                        }}
                    >
                        Your browser does not support the audio element.
                    </audio>
                </div>
            )}
            {recordingSource && audioError && (
                <div className="mb-4 bg-gray-900 rounded-lg p-4 text-center">
                    <Mic className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Audio failed to load</p>
                </div>
            )}
        </div>
    );
};

// ==================== Voice Recorder Component ====================
const VoiceRecorder: React.FC<{ onRecordingComplete: (file: File) => void; onCancel: () => void }> = ({ onRecordingComplete, onCancel }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
                onRecordingComplete(file);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
        onCancel();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    return (
        <div className="bg-gray-900 rounded-lg p-4 border border-pink-500/50">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <Mic className={`w-6 h-6 ${isRecording ? 'text-red-500 animate-pulse' : 'text-pink-500'}`} />
                    <span className="text-white font-medium">
                        {isRecording ? 'Recording...' : 'Ready to Record'}
                    </span>
                </div>
                {isRecording && (
                    <span className="text-red-400 font-mono text-lg">{formatTime(recordingTime)}</span>
                )}
            </div>

            <div className="flex space-x-3">
                {!isRecording ? (
                    <>
                        <button
                            onClick={startRecording}
                            className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-lg hover:from-red-700 hover:to-pink-700 transition-colors font-semibold flex items-center justify-center space-x-2"
                        >
                            <Mic className="w-4 h-4" />
                            <span>Start Recording</span>
                        </button>
                        <button
                            onClick={onCancel}
                            className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={stopRecording}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-semibold flex items-center justify-center space-x-2"
                        >
                            <Square className="w-4 h-4" />
                            <span>Stop & Save</span>
                        </button>
                        <button
                            onClick={cancelRecording}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

// ==================== New Message Form (Themed and Media Input) ====================
const NewMessageForm: React.FC<NewMessageFormProps> = ({ onSubmit, onCancel, initialText = '' }) => {
    const [text, setText] = useState(initialText);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [recordingFile, setRecordingFile] = useState<File | null>(null);
    const [showRecorder, setShowRecorder] = useState(false);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const recordingInputRef = useRef<HTMLInputElement>(null);

    // Clean up audio preview URL when component unmounts or recording changes
    useEffect(() => {
        return () => {
            if (audioPreviewUrl) {
                URL.revokeObjectURL(audioPreviewUrl);
            }
        };
    }, [audioPreviewUrl]);

    const handleSubmit = () => {
        if (text.trim() || imageFile || recordingFile) {
            onSubmit(text, imageFile, recordingFile);
            setText('');
            setImageFile(null);
            setRecordingFile(null);
            setShowRecorder(false);
            if (imageInputRef.current) imageInputRef.current.value = '';
            if (recordingInputRef.current) recordingInputRef.current.value = '';
            // Clean up preview URL
            if (audioPreviewUrl) {
                URL.revokeObjectURL(audioPreviewUrl);
                setAudioPreviewUrl(null);
            }
        }
    };

    const handleRecordingComplete = (file: File) => {
        // Clean up old preview URL if exists
        if (audioPreviewUrl) {
            URL.revokeObjectURL(audioPreviewUrl);
        }
        // Clear the file input if it has something
        if (recordingInputRef.current) {
            recordingInputRef.current.value = '';
        }
        // Create new preview URL
        const newUrl = URL.createObjectURL(file);
        setAudioPreviewUrl(newUrl);
        setRecordingFile(file);
        setShowRecorder(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            // Clean up old preview URL if exists
            if (audioPreviewUrl) {
                URL.revokeObjectURL(audioPreviewUrl);
            }
            // Create new preview URL for uploaded file
            const newUrl = URL.createObjectURL(file);
            setAudioPreviewUrl(newUrl);
            setRecordingFile(file);
        }
    };

    const getFileLabel = (file: File | null, defaultText: string) => {
        return file ? `✅ ${file.name}` : defaultText;
    };

    const removeRecording = () => {
        setRecordingFile(null);
        if (audioPreviewUrl) {
            URL.revokeObjectURL(audioPreviewUrl);
            setAudioPreviewUrl(null);
        }
        if (recordingInputRef.current) recordingInputRef.current.value = '';
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 mb-8 border border-red-500/50">
            <textarea
                rows={4}
                placeholder="Write something special for Rei..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg mb-4 resize-none bg-gray-700 text-white placeholder-gray-400 focus:ring-red-500 focus:border-red-500"
            />

            <div className="flex space-x-4 mb-4">
                <label
                    htmlFor="image-upload"
                    className="flex-1 cursor-pointer flex items-center justify-center space-x-2 px-4 py-2 border border-gray-600 rounded-lg text-gray-400 hover:bg-gray-700 transition-colors"
                >
                    <Image className="w-5 h-5" />
                    <span className="truncate text-sm">
                        {getFileLabel(imageFile, "Add Photo")}
                    </span>
                    <input
                        id="image-upload"
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        className="hidden"
                    />
                </label>

                <label
                    htmlFor="recording-upload"
                    className="flex-1 cursor-pointer flex items-center justify-center space-x-2 px-4 py-2 border border-gray-600 rounded-lg text-gray-400 hover:bg-gray-700 transition-colors"
                >
                    <Mic className="w-5 h-5" />
                    <span className="truncate text-sm">
                        {getFileLabel(recordingFile, "Upload Audio")}
                    </span>
                    <input
                        id="recording-upload"
                        ref={recordingInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </label>
            </div>

            {!showRecorder && !recordingFile && (
                <button
                    onClick={() => setShowRecorder(true)}
                    className="w-full mb-4 px-4 py-3 border-2 border-pink-500/50 rounded-lg text-pink-400 hover:bg-pink-500/10 transition-colors flex items-center justify-center space-x-2 font-medium"
                >
                    <Mic className="w-5 h-5" />
                    <span>Record Voice Message</span>
                </button>
            )}

            {showRecorder && (
                <div className="mb-4">
                    <VoiceRecorder
                        onRecordingComplete={handleRecordingComplete}
                        onCancel={() => setShowRecorder(false)}
                    />
                </div>
            )}

            {recordingFile && !showRecorder && (
                <div className="mb-4 bg-gray-900 rounded-lg p-4 border border-pink-500/50">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <Mic className="w-5 h-5 text-pink-500" />
                            <span className="text-gray-300 text-sm font-medium">Recording ready</span>
                        </div>
                        <button
                            onClick={removeRecording}
                            className="text-red-400 hover:text-red-300 text-sm"
                        >
                            Remove
                        </button>
                    </div>
                    {audioPreviewUrl && (
                        <audio
                            controls
                            src={audioPreviewUrl}
                            className="w-full h-10"
                            style={{ filter: 'hue-rotate(330deg) saturate(1.5)' }}
                        >
                            Your browser does not support the audio element.
                        </audio>
                    )}
                </div>
            )}

            <div className="flex space-x-3">
                <button
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-lg flex items-center justify-center space-x-2 hover:from-red-700 hover:to-pink-700 transition-colors font-semibold"
                    disabled={!text.trim() && !imageFile && !recordingFile}
                >
                    <Send className="w-4 h-4" /> <span>Post Message</span>
                </button>
                {onCancel && (
                    <button onClick={onCancel} className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
};

// ==================== PostingBoard (Main Component - Layout/Logic) ====================
export const PostingBoard: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [loading, setLoading] = useState(true);
    const [alertModal, setAlertModal] = useState<{ message: string; type: 'error' | 'info' | 'warning' } | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

    const refreshMessages = async () => {
        try {
            const fetchedMessages = await fetchAllMessages();
            setMessages(fetchedMessages);
        } catch (e) {
            console.error("Error loading messages:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Force logout on page reload
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('jwtToken');
        setUser(null);

        refreshMessages();
    }, []);

    const login = async (loginName: string, password: string) => {
        try {
            const loginData = await loginUser(loginName, password);

            const loggedInUser: User = { id: loginData.user.id, loginName: loginData.user.loginName };
            const jwtToken = loginData.token;

            setUser(loggedInUser);
            sessionStorage.setItem('currentUser', JSON.stringify(loggedInUser));
            sessionStorage.setItem('jwtToken', jwtToken);

            setShowLoginModal(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed.';
            setAlertModal({ message: errorMessage, type: 'error' });
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('jwtToken');
        }
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('jwtToken');
        setEditingMessage(null);
    };

    const createMessage = async (text: string, image: File | null, recording: File | null) => {
        if (!user) {
            setAlertModal({ message: "You must be logged in to post a message.", type: 'warning' });
            return;
        }
        try {
            await createNewMessage(user.id, text, image, recording);
            await refreshMessages();
        } catch (error) {
            console.error("Failed to create message:", error);
            setAlertModal({ message: "Could not post message. Please ensure you are logged in and try again.", type: 'error' });
        }
    };

    const updateMessage = async (messageId: number, newText: string) => {
        if (!user) return;
        try {
            await modifyExistingMessage(user.id, messageId, newText);
            await refreshMessages();
            setEditingMessage(null);
        } catch (error) {
            console.error("Failed to update message:", error);
            setAlertModal({ message: "Could not update message. Please try again.", type: 'error' });
        }
    };

    const deleteMessage = (messageId: number) => {
        if (!user) return;
        setConfirmModal({
            message: 'Are you sure you want to delete this message?',
            onConfirm: () => {
                console.warn(`[API TO DO] Attempted to delete message ID: ${messageId}. Need to implement DELETE API call.`);
                refreshMessages();
                setConfirmModal(null);
            }
        });
    };

    return (
        <div className="min-h-screen flex flex-col justify-between">
            <div className="flex-grow">
                <NavBar user={user} onLogout={logout} onLoginClick={() => setShowLoginModal(true)} />

                {showLoginModal && <LoginModal onLogin={login} onClose={() => setShowLoginModal(false)} />}

                {alertModal && (
                    <AlertModal
                        message={alertModal.message}
                        type={alertModal.type}
                        onClose={() => setAlertModal(null)}
                    />
                )}

                {confirmModal && (
                    <ConfirmModal
                        message={confirmModal.message}
                        onConfirm={confirmModal.onConfirm}
                        onCancel={() => setConfirmModal(null)}
                    />
                )}

                <main className="max-w-4xl mx-auto px-4 py-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-red-500 via-pink-500 to-red-500 bg-clip-text text-transparent mb-4">
                            Birthday Wishes for Rei
                        </h2>
                        <p className="text-gray-300 text-lg">Share your heartfelt birthday message! 🎂✨</p>
                    </div>

                    {user && !editingMessage && <NewMessageForm onSubmit={createMessage} />}
                    {editingMessage && (
                        <NewMessageForm
                            initialText={editingMessage.text}
                            onSubmit={(text) => updateMessage(editingMessage.id, text)}
                            onCancel={() => setEditingMessage(null)}
                        />
                    )}

                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-white flex items-center space-x-2">
                            <MessageSquare className="w-6 h-6 text-red-500" />
                            <span>Birthday Messages ({messages.length})</span>
                        </h3>

                        {loading ? (
                            <div className="text-center py-12 text-gray-400">Loading messages...</div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-12 bg-gray-800 rounded-xl shadow-xl border border-red-500/50">
                                <MessageSquare className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                                <p className="text-gray-400 text-lg">No messages yet. Be the first to wish Rei a happy birthday!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((message) => (
                                    <MessageCard
                                        key={message.id}
                                        message={message}
                                        currentUser={user}
                                        onEdit={setEditingMessage}
                                        onDelete={deleteMessage}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
            <footer className="text-center py-8 text-gray-400">Made with ❤️ for Rei's Special Day</footer>
        </div>
    );
};