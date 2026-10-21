import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { baseUrl } from '../services/BaseUrl';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tokenFromUrl = searchParams.get('token') || '';

    const [formData, setFormData] = useState({
        token: tokenFromUrl,
        newPassword: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const validate = () => {
        const newErrors = {};
        const { token, newPassword, confirmPassword } = formData;

        if (!token.trim()) newErrors.token = 'Reset token is required';

        if (!newPassword) newErrors.newPassword = 'New password is required';
        else if (newPassword.length < 8) newErrors.newPassword = 'Minimum 8 characters';
        else if (newPassword.length > 64) newErrors.newPassword = 'Maximum 64 characters';

        if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
        else if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${baseUrl}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: formData.token.trim(),
                    new_password: formData.newPassword,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                const message = Array.isArray(data.detail)
                    ? data.detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(', ')
                    : data.detail;
                toast.error(message || 'Reset failed');
                return;
            }

            toast.success('Password reset successfully. Please login.');
            navigate('/login');
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
                        <h1 className="text-3xl font-bold text-center">Reset Password</h1>

                        <fieldset className="fieldset">
                            {/* URL-এ token থাকলে লুকানো থাকে, না থাকলে হাতে বসানোর field দেখায় */}
                            {!tokenFromUrl && (
                                <>
                                    <label className="label">Reset Token</label>
                                    <input
                                        type="text"
                                        name="token"
                                        value={formData.token}
                                        onChange={handleChange}
                                        className={`input w-full ${errors.token ? 'input-error' : ''}`}
                                        placeholder="Paste your reset token"
                                    />
                                    {errors.token && <p className="text-error text-sm">{errors.token}</p>}
                                </>
                            )}

                            <label className="label">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className={`input w-full pr-10 ${errors.newPassword ? 'input-error' : ''}`}
                                    placeholder="New password (min 8 characters)"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-gray-500"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            {errors.newPassword && <p className="text-error text-sm">{errors.newPassword}</p>}

                            <label className="label">Confirm Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`input w-full ${errors.confirmPassword ? 'input-error' : ''}`}
                                placeholder="Confirm new password"
                            />
                            {errors.confirmPassword && <p className="text-error text-sm">{errors.confirmPassword}</p>}

                            <button type="submit" className="btn btn-neutral mt-4" disabled={submitting}>
                                {submitting ? <span className="loading loading-spinner loading-sm"></span> : 'Reset Password'}
                            </button>
                        </fieldset>

                        <p className="text-center text-sm mt-2">
                            <Link to="/login" className="link link-primary">Back to Login</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;