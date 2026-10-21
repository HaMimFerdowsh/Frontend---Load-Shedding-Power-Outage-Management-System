import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { AuthContext } from '../context/AuthProvider';
import { baseUrl } from '../services/BaseUrl';

const Login = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ username: '', password: '' });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    // Frontend validation
    const validate = () => {
        const newErrors = {};
        if (!formData.username.trim()) newErrors.username = 'Username is required';
        if (!formData.password) newErrors.password = 'Password is required';
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
            // Backend OAuth2PasswordRequestForm ব্যবহার করে, তাই form-data
            const res = await fetch(`${baseUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    username: formData.username.trim(),
                    password: formData.password,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.detail || 'Login failed');
                return;
            }

            login(data.access_token, data.refresh_token);
            toast.success('Login successful');
            navigate('/');
        } catch (error) {
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
                        <h1 className="text-3xl font-bold text-center">Login</h1>

                        <fieldset className="fieldset">
                            <label className="label">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={`input w-full ${errors.username ? 'input-error' : ''}`}
                                placeholder="Username"
                            />
                            {errors.username && <p className="text-error text-sm">{errors.username}</p>}

                            <label className="label">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`input w-full pr-10 ${errors.password ? 'input-error' : ''}`}
                                    placeholder="Password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-gray-500"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            {errors.password && <p className="text-error text-sm">{errors.password}</p>}

                            <div>
                                <Link to="/forgot-password" className="link link-hover">Forgot password?</Link>
                            </div>

                            <button type="submit" className="btn btn-neutral mt-4" disabled={submitting}>
                                {submitting ? <span className="loading loading-spinner loading-sm"></span> : 'Login'}
                            </button>
                        </fieldset>

                        <p className="text-center text-sm mt-2">
                            Don't have an account?{' '}
                            <Link to="/signup" className="link link-primary">Sign Up</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;