import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { baseUrl } from '../services/BaseUrl';

const ForgotPassword = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim()) return setError('Email is required');
        if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email');

        setSubmitting(true);
        try {
            const res = await fetch(`${baseUrl}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });
            const data = await res.json();

            if (!res.ok) {
                const message = Array.isArray(data.detail)
                    ? data.detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(', ')
                    : data.detail;
                toast.error(message || 'Request failed');
                return;
            }

            // Debug mode: backend token ফেরত দেয়, সরাসরি reset page-এ নিয়ে যাই
            if (data.reset_token) {
                toast.success('Reset token generated');
                navigate(`/reset-password?token=${encodeURIComponent(data.reset_token)}`);
                return;
            }

            // Production: email-এ link যাবে
            setSent(true);
            toast.success(data.message);
        } catch (err) {
            toast.error('Cannot connect to server');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="hero bg-base-200 min-h-screen">
            <div className="hero-content flex-col">
                <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
                    <form onSubmit={handleSubmit} className="card-body">
                        <h1 className="text-3xl font-bold text-center">Forgot Password</h1>

                        {sent ? (
                            <div className="text-center py-4">
                                <p className="mb-4">
                                    If this email is registered, a reset link has been sent. Please check your inbox.
                                </p>
                                <Link to="/login" className="btn btn-neutral">Back to Login</Link>
                            </div>
                        ) : (
                            <fieldset className="fieldset">
                                <p className="text-sm opacity-70 text-center">
                                    Enter your email and we will help you reset your password.
                                </p>

                                <label className="label">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                    className={`input w-full ${error ? 'input-error' : ''}`}
                                    placeholder="Email"
                                />
                                {error && <p className="text-error text-sm">{error}</p>}

                                <button type="submit" className="btn btn-neutral mt-4" disabled={submitting}>
                                    {submitting ? <span className="loading loading-spinner loading-sm"></span> : 'Send Reset Link'}
                                </button>
                            </fieldset>
                        )}

                        {!sent && (
                            <p className="text-center text-sm mt-2">
                                Remember your password?{' '}
                                <Link to="/login" className="link link-primary">Login</Link>
                            </p>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;