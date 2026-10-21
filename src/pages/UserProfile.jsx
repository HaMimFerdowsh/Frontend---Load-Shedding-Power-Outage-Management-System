import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { FaUserEdit, FaKey, FaTrash } from 'react-icons/fa';
import { AuthContext } from '../context/AuthProvider';
import { baseUrl } from '../services/BaseUrl';
import ConfirmModal from '../components/ConfirmModal';

const getMessage = (data, fallback) =>
    Array.isArray(data.detail)
        ? data.detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(', ')
        : data.detail || fallback;

const UserProfile = () => {
    const { authUser, setAuthUser, authFetch, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [areas, setAreas] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        firstname: authUser.firstname,
        lastname: authUser.lastname,
        username: authUser.username,
        email: authUser.email,
        area_id: authUser.area_id ? String(authUser.area_id) : '',
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const [showDelete, setShowDelete] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        const fetchAreas = async () => {
            try {
                const res = await fetch(`${baseUrl}/areas/all?page_size=100&sort_by=name&order=asc`);
                const data = await res.json();
                if (res.ok) setAreas(data.items);
            } catch (err) {
                console.error('Failed to load areas', err);
            }
        };
        fetchAreas();
    }, []);

    const areaName = (id) => {
        if (!id) return 'Not set';
        const a = areas.find((x) => x.id === id);
        return a ? `${a.name} (${a.zone}, ${a.district})` : `Area #${id}`;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const validate = () => {
        const newErrors = {};
        const { firstname, lastname, username, email } = formData;

        if (!firstname.trim()) newErrors.firstname = 'First name is required';
        else if (firstname.length > 50) newErrors.firstname = 'Maximum 50 characters';

        if (!lastname.trim()) newErrors.lastname = 'Last name is required';
        else if (lastname.length > 50) newErrors.lastname = 'Maximum 50 characters';

        if (!username.trim()) newErrors.username = 'Username is required';
        else if (username.trim().length < 3) newErrors.username = 'Minimum 3 characters';
        else if (username.trim().length > 30) newErrors.username = 'Maximum 30 characters';

        if (!email.trim()) newErrors.email = 'Email is required';
        else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Enter a valid email';

        return newErrors;
    };

    const cancelEdit = () => {
        setFormData({
            firstname: authUser.firstname,
            lastname: authUser.lastname,
            username: authUser.username,
            email: authUser.email,
            area_id: authUser.area_id ? String(authUser.area_id) : '',
        });
        setErrors({});
        setEditMode(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSaving(true);
        try {
            const payload = {
                firstname: formData.firstname.trim(),
                lastname: formData.lastname.trim(),
                username: formData.username.trim(),
                email: formData.email.trim().toLowerCase(),
            };
            // area খালি রাখলে পাঠাবো না (backend null মানে "বদলাবে না" ধরা নিরাপদ)
            if (formData.area_id) payload.area_id = Number(formData.area_id);

            const res = await authFetch('/edituser', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(getMessage(data, 'Update failed'));
                return;
            }

            // নতুন data context-এ বসাই
            setAuthUser({ ...authUser, ...payload, area_id: payload.area_id ?? authUser.area_id });
            toast.success('Profile updated');
            setEditMode(false);
        } catch (err) {
            toast.error('Cannot connect to server');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            const res = await authFetch('/deleteuser', { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) {
                toast.error(getMessage(data, 'Delete failed'));
                return;
            }

            toast.success('Account deleted');
            logout();
            navigate('/');
        } catch (err) {
            toast.error('Cannot connect to server');
        } finally {
            setDeleteLoading(false);
            setShowDelete(false);
        }
    };

    return (
        <div className="bg-base-200 min-h-screen py-10 px-4">
            <div className="card bg-base-100 w-full max-w-2xl mx-auto shadow-2xl">
                <div className="card-body">
                    {/* Header */}
                    <div className="flex flex-col items-center gap-2 mb-2">
                        <div className="avatar avatar-placeholder">
                            <div className="bg-primary text-primary-content w-20 rounded-full">
                                <span className="text-3xl uppercase">{authUser.firstname?.charAt(0)}</span>
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold">{authUser.firstname} {authUser.lastname}</h1>
                        <div className="flex gap-2">
                            <span className="badge badge-primary capitalize">{authUser.role}</span>
                            <span className={`badge ${authUser.is_active ? 'badge-success' : 'badge-error'}`}>
                                {authUser.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>

                    {editMode ? (
                        <form onSubmit={handleSave}>
                            <fieldset className="fieldset">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                                    <div>
                                        <label className="label">First Name</label>
                                        <input
                                            type="text"
                                            name="firstname"
                                            value={formData.firstname}
                                            onChange={handleChange}
                                            className={`input w-full ${errors.firstname ? 'input-error' : ''}`}
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
                                />
                                {errors.username && <p className="text-error text-sm">{errors.username}</p>}

                                <label className="label">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`input w-full ${errors.email ? 'input-error' : ''}`}
                                />
                                {errors.email && <p className="text-error text-sm">{errors.email}</p>}

                                <label className="label">Area</label>
                                <select
                                    name="area_id"
                                    value={formData.area_id}
                                    onChange={handleChange}
                                    className="select w-full"
                                >
                                    <option value="">Not set</option>
                                    {areas.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.name} ({a.zone}, {a.district})
                                        </option>
                                    ))}
                                </select>

                                <div className="flex gap-3 mt-4">
                                    <button type="button" className="btn btn-outline flex-1" onClick={cancelEdit} disabled={saving}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-neutral flex-1" disabled={saving}>
                                        {saving ? <span className="loading loading-spinner loading-sm"></span> : 'Save Changes'}
                                    </button>
                                </div>
                            </fieldset>
                        </form>
                    ) : (
                        <>
                            <div className="divide-y divide-base-300">
                                <div className="flex justify-between py-3">
                                    <span className="opacity-60">Username</span>
                                    <span className="font-medium">{authUser.username}</span>
                                </div>
                                <div className="flex justify-between py-3">
                                    <span className="opacity-60">Email</span>
                                    <span className="font-medium break-all text-right">{authUser.email}</span>
                                </div>
                                <div className="flex justify-between py-3">
                                    <span className="opacity-60">Area</span>
                                    <span className="font-medium text-right">{areaName(authUser.area_id)}</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mt-4">
                                <button className="btn btn-neutral flex-1" onClick={() => setEditMode(true)}>
                                    <FaUserEdit /> Edit Profile
                                </button>
                                <Link to="/change-password" className="btn btn-outline flex-1">
                                    <FaKey /> Change Password
                                </Link>
                            </div>
                        </>
                    )}

                    {/* Danger zone */}
                    {!editMode && (
                        <div className="border border-error/40 rounded-box p-4 mt-6">
                            <h3 className="font-bold text-error">Danger Zone</h3>
                            <p className="text-sm opacity-70 mb-3">
                                Deleting your account is permanent and cannot be undone.
                            </p>
                            <button className="btn btn-error btn-outline btn-sm" onClick={() => setShowDelete(true)}>
                                <FaTrash /> Delete My Account
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                open={showDelete}
                title="Delete your account?"
                message="Your account will be permanently deleted. This cannot be undone."
                confirmText="Delete Account"
                loading={deleteLoading}
                onConfirm={handleDelete}
                onCancel={() => setShowDelete(false)}
            />
        </div>
    );
};

export default UserProfile;