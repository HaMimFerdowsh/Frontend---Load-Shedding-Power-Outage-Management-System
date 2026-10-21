import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { AuthContext } from '../context/AuthProvider';

const ChangePassword = () => {
    const { authFetch, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        oldPassword: '',
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
        const { oldPassword, newPassword, confirmPassword } = formData;

        if (!oldPassword) newErrors.oldPassword = 'Old password is required';

        if (!newPassword) newErrors.newPassword = 'New password is required';
        else if (newPassword.length < 8) newErrors.newPassword = 'Minimum 8 characters';
        else if (newPassword.length > 64) newErrors.newPassword = 'Maximum 64 characters';
        else if (newPassword === oldPassword) newErrors.newPassword = 'Must be different from old password';

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
            const res = await authFetch('/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    old_password: formData.oldPassword,
                    new_password: formData.newPassword,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                const message = Array.isArray(data.detail)
                    ? data.detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(', ')
                    : data.detail;
                toast.error(message || 'Failed to change password');
                return;
            }

            toast.success('Password changed. Please login again.');
            logout();
            navigate('/login');
        } catch (err) {
            toast.error('Cannot connect to server');
        } finally {
            setSubmitting(false);
        }
    };

    const eyeButton = (
        <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-gray-500"
        >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
    );

    return (
        <div className="hero bg-base-200 min-h-screen">
            <div className="hero-content flex-col">
                <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
                    <form onSubmit={handleSubmit} className="card-body">
                        <h1 className="text-3xl font-bold text-center">Change Password</h1>

                        <fieldset className="fieldset">
                            <label className="label">Old Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="oldPassword"
                                    value={formData.oldPassword}
                                    onChange={handleChange}
                                    className={`input w-full pr-10 ${errors.oldPassword ? 'input-error' : ''}`}
                                    placeholder="Old password"
                                />
                                {eyeButton}
                            </div>
                            {errors.oldPassword && <p className="text-error text-sm">{errors.oldPassword}</p>}

                            <label className="label">New Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                className={`input w-full ${errors.newPassword ? 'input-error' : ''}`}
                                placeholder="New password (min 8 characters)"
                            />
                            {errors.newPassword && <p className="text-error text-sm">{errors.newPassword}</p>}

                            <label className="label">Confirm New Password</label>
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
                                {submitting ? <span className="loading loading-spinner loading-sm"></span> : 'Change Password'}
                            </button>
                        </fieldset>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;