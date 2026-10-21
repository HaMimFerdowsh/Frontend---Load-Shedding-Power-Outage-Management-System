import React, { createContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { baseUrl } from '../services/BaseUrl';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [accessToken, setAccessToken] = useState(
        () => localStorage.getItem('lm_token')
    );

    // Login (backend দুইটা token দেয়)
    const login = (token, refreshToken) => {
        localStorage.setItem('lm_token', token);
        if (refreshToken) localStorage.setItem('lm_refresh', refreshToken);
        setAccessToken(token);
    };

    // Logout
    const logout = () => {
        localStorage.removeItem('lm_token');
        localStorage.removeItem('lm_refresh');
        setAccessToken(null);
        setAuthUser(null);
    };

    // Refresh token দিয়ে নতুন access token আনা
    const refreshAccessToken = async () => {
        const refreshToken = localStorage.getItem('lm_refresh');
        if (!refreshToken) return null;

        try {
            const res = await fetch(`${baseUrl}/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });
            if (!res.ok) return null;

            const data = await res.json();
            localStorage.setItem('lm_token', data.access_token);
            setAccessToken(data.access_token);
            return data.access_token;
        } catch {
            return null;
        }
    };

    // সব protected API call এটা দিয়ে করবে
    // ব্যবহার: authFetch('/schedules?page=1')
    const authFetch = async (path, options = {}) => {
        const send = (token) =>
            fetch(`${baseUrl}${path}`, {
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${token}`,
                },
            });

        let res = await send(localStorage.getItem('lm_token'));

        if (res.status === 401) {
            const newToken = await refreshAccessToken();
            if (!newToken) {
                logout();
                toast.error('Session expired. Please login again.');
                return res;
            }
            res = await send(newToken);
        }
        return res;
    };

    // Fetch logged-in user
    const fetchUser = async () => {
        try {
            const userRes = await authFetch('/user');
            const userData = await userRes.json();

            if (!userRes.ok) {
                console.error('User authentication failed:', userData);
                setAuthUser(null);
                return;
            }

            setAuthUser(userData);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            setAuthUser(null);
        } finally {
            setLoading(false);
        }
    };

    // Token বদলালে user check করা
    useEffect(() => {
        if (!accessToken) {
            setAuthUser(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        fetchUser();
    }, [accessToken]);

    return (
        <AuthContext.Provider
            value={{
                authUser,
                setAuthUser,
                logout,
                login,
                authFetch,
                accessToken,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;