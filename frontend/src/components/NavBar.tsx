import React, { useState } from 'react';
import { Menu, X, User, LogOut, Heart } from 'lucide-react';

interface NavBarProps {
    user?: { id: number; loginName: string } | null;
    onLogout: () => void;
    onLoginClick: () => void;
}

export const NavBar: React.FC<NavBarProps> = ({ user, onLogout, onLoginClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-2">
                        <Heart className="text-white w-8 h-8 animate-pulse" fill="white" />
                        <h1 className="text-white text-xl sm:text-2xl font-bold">
                            Happy Birthday Rei! 🎉
                        </h1>
                    </div>

                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <>
                <span className="text-white flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span className="font-medium">{user.loginName}</span>
                </span>
                                <button
                                    onClick={onLogout}
                                    className="flex items-center space-x-2 bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors font-medium"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onLoginClick}
                                className="bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                            >
                                Login to Post
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden text-white p-2"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {isMenuOpen && (
                    <div className="md:hidden pb-4 space-y-2">
                        {user ? (
                            <>
                                <div className="text-white flex items-center space-x-2 px-2 py-2">
                                    <User className="w-5 h-5" />
                                    <span className="font-medium">{user.loginName}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        onLogout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full flex items-center justify-center space-x-2 bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors font-medium"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    onLoginClick();
                                    setIsMenuOpen(false);
                                }}
                                className="w-full bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                            >
                                Login to Post
                            </button>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};
