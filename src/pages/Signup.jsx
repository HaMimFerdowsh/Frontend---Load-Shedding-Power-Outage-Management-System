import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { baseUrl } from '../services/BaseUrl';

const Signup = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        area_id: '',
    });
    const [errors, setErrors] = useState({});
    const [areas, setAreas] = useState([]);
    const [areasLoading, setAreasLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Area dropdown-এর জন্য (public API, token লাগে না)
    useEffect(() => {
        const fetchAreas = async () => {
            try {
                const res = await fetch(`${baseUrl}/areas/all?page_size=100&sort_by=name&order=asc`);
                const data = await res.json();
                if (res.ok) setAreas(data.items);
            } catch (error) {
                toast.error('Could not load areas');
            } finally {
                setAreasLoading(false);
            }
        };
        fetchAreas();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    // Frontend validation (backend-এর rule-এর সাথে মিল রেখে)
    const validate = () => {
        const newErrors = {};
        const { firstname, lastname, username, email, password, confirmPassword } = formData;

        if (!firstname.trim()) newErrors.firstname = 'First name is required';
        else if (firstname.length > 50) newErrors.firstname = 'Maximum 50 characters';

        if (!lastname.trim()) newErrors.lastname = 'Last name is required';
        else if (lastname.length > 50) newErrors.lastname = 'Maximum 50 characters';

        if (!username.trim()) newErrors.username = 'Username is required';
        else if (username.trim().length < 3) newErrors.username = 'Minimum 3 characters';
        else if (username.trim().length > 30) newErrors.username = 'Maximum 30 characters';

        if (!email.trim()) newErrors.email = 'Email is required';
        else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Enter a valid email';

        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 8) newErrors.password = 'Minimum 8 characters';
        else if (password.length > 64) newErrors.password = 'Maximum 64 characters';

        if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
        else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

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
            const payload = {
                firstname: formData.firstname.trim(),
                lastname: formData.lastname.trim(),
                username: formData.username.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                area_id: formData.area_id ? Number(formData.area_id) : null,
            };

            const res = await fetch(`${baseUrl}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (!res.ok) {
                // 422 হলে detail একটা array, বাকিগুলোতে string
                const message = Array.isArray(data.detail)
                    ? data.detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(', ')
                    : data.detail;
                toast.error(message || 'Signup failed');
                return;
            }

            toast.success('Account created! Please login.');
            navigate('/login');
        } catch (error) {
            toast.error('Cannot connect to server');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="hero bg-base-200 min-h-screen py-10">
            <div className="hero-content flex-col w-full">
                <div className="card bg-base-100 w-full max-w-md shrink-0 shadow-2xl">
                    <form onSubmit={handleSubmit} className="card-body">
                        <h1 className="text-3xl font-bold text-center">Sign Up</h1>

                        <fieldset className="fieldset">
                            {/* First & Last name পাশাপাশি (mobile-এ নিচে নিচে) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                                <div>
                                    <label className="label">First Name</label>
                                    <input
                                        type="text"
                                        name="firstname"
                                        value={formData.firstname}
                                        onChange={handleChange}
                                        className={`input w-full ${errors.firstname ? 'input-error' : ''}`}
                                        placeholder="First name"
                                    />
                                    {errors.firstname && <p className="text-error text-sm">{errors.firstname}</p>}
                                </div>
                                <div>
                                    <label className="label">Last Name</label>
                                    <input
                                        type="text"
                                        name="lastname"
                                        value={formData.lastname}
                                        onChange={handleChange}
                                        className={`input w-full ${errors.lastname ? 'input-error' : ''}`}
                                        placeholder="Last name"
                                    />
                                    {errors.lastname && <p className="text-error text-sm">{errors.lastname}</p>}
                                </div>
                            </div>

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

                            <label className="label">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`input w-full ${errors.email ? 'input-error' : ''}`}
                                placeholder="Email"
                            />
                            {errors.email && <p className="text-error text-sm">{errors.email}</p>}

                            <label className="label">Area (optional)</label>
                            <select
                                name="area_id"
                                value={formData.area_id}
                                onChange={handleChange}
                                className="select w-full"
                                disabled={areasLoading}
                            >
                                <option value="">
                                    {areasLoading ? 'Loading areas...' : 'Select your area'}
                                </option>
                                {areas.map((area) => (
                                    <option key={area.id} value={area.id}>
                                        {area.name} ({area.zone}, {area.district})
                                    </option>
                                ))}
                            </select>

                            <label className="label">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`input w-full pr-10 ${errors.password ? 'input-error' : ''}`}
                                    placeholder="Password (min 8 characters)"
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

                            <label className="label">Confirm Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`input w-full ${errors.confirmPassword ? 'input-error' : ''}`}
                                placeholder="Confirm password"
                            />
                            {errors.confirmPassword && <p className="text-error text-sm">{errors.confirmPassword}</p>}

                            <button type="submit" className="btn btn-neutral mt-4" disabled={submitting}>
                                {submitting ? <span className="loading loading-spinner loading-sm"></span> : 'Sign Up'}
                            </button>
                        </fieldset>

                        <p className="text-center text-sm mt-2">
                            Already have an account?{' '}
                            <Link to="/login" className="link link-primary">Login</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;