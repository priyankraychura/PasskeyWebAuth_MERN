// App.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

const api = axios.create({
    baseURL: 'https://passkeywebauth-mern-backend.onrender.com',
});

function App() {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const showMessage = (text, type = 'info') => {
        setMessage(text);
        setMessageType(type);
    };

    const handleRegister = async () => {
        if (!username.trim()) {
            showMessage('Please enter a username', 'error');
            return;
        }

        setIsLoading(true);
        showMessage('Initializing registration...', 'info');

        try {
            // Step 1: Get registration options from server
            const optionsRes = await api.post('/api/register/options', { username });
            const options = optionsRes.data;

            showMessage('Please authenticate with your device...', 'info');

            // Step 2: Use browser WebAuthn API to create credential
            const credential = await startRegistration(options);

            showMessage('Verifying registration...', 'info');

            // Step 3: Send credential to server for verification
            const verifyRes = await api.post('/api/register/verify', {
                username,
                credential
            });

            if (verifyRes.data.verified) {
                showMessage(verifyRes.data.message, 'success');
            } else {
                throw new Error('Registration not verified');
            }
        } catch (error) {
            console.error('Registration error:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Registration failed';
            showMessage(`Registration failed: ${errorMsg}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async () => {
        setIsLoading(true);
        showMessage('Initializing login...', 'info');

        try {
            // Step 1: Get authentication options from server
            const optionsRes = await api.post('/api/login/options');
            const options = optionsRes.data;

            showMessage('Please authenticate with your device...', 'info');

            // Step 2: Use browser WebAuthn API to get credential
            const credential = await startAuthentication(options);

            showMessage('Verifying login...', 'info');

            // Step 3: Send credential to server for verification
            const verifyRes = await api.post('/api/login/verify', {
                credential
            });

            if (verifyRes.data.verified) {
                setUsername(verifyRes.data.username);
                setIsLoggedIn(true);
                showMessage(verifyRes.data.message, 'success');
            } else {
                throw new Error('Login not verified');
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Login failed';
            showMessage(`Login failed: ${errorMsg}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setUsername('');
        showMessage('Logged out successfully', 'info');
    };

    const getMessageStyle = () => {
        const baseStyle = 'p-4 rounded-lg text-sm font-medium transition-all duration-300';
        switch (messageType) {
            case 'success':
                return `${baseStyle} bg-green-50 text-green-800 border border-green-200`;
            case 'error':
                return `${baseStyle} bg-red-50 text-red-800 border border-red-200`;
            default:
                return `${baseStyle} bg-blue-50 text-blue-800 border border-blue-200`;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Passkey Auth</h1>
                        <p className="text-gray-600">Secure passwordless authentication</p>
                    </div>

                    {/* Status Message */}
                    {message && (
                        <div className={getMessageStyle()}>
                            {message}
                        </div>
                    )}

                    {/* Main Content */}
                    {!isLoggedIn ? (
                        <div className="space-y-4">
                            {/* Username Input */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleRegister}
                                    disabled={isLoading || !username.trim()}
                                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
                                >
                                    {isLoading ? 'Processing...' : 'Register New Passkey'}
                                </button>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white text-gray-500">or</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleLogin}
                                    disabled={isLoading}
                                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
                                >
                                    {isLoading ? 'Processing...' : 'Login with Passkey'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Logged In State */}
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 text-center">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
                                <p className="text-lg text-gray-700">{username}</p>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                            >
                                Logout
                            </button>
                        </div>
                    )}

                    {/* Footer Info */}
                    <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs text-center text-gray-500">
                            🔒 Using WebAuthn/FIDO2 for secure authentication
                        </p>
                        <p className="text-xs text-center text-gray-400 mt-1">
                            Server restart will clear all data
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;