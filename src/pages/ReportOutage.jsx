import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthProvider';
import { baseUrl } from '../services/BaseUrl';

const CATEGORIES = [
    { value: 'transformer_fault', label: 'Transformer Fault' },
    { value: 'line_break', label: 'Line Break' },
    { value: 'storm', label: 'Storm' },
    { value: 'overload', label: 'Overload' },
    { value: 'other', label: 'Other' },
];

const ReportOutage = () => {
    const { authUser, authFetch } = useContext(AuthContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        area_id: authUser?.area_id ? String(authUser.area_id) : '',
        title: '',
        description: '',
        category: 'other',
    });
    const [errors, setErrors] = useState({});
    const [areas, setAreas] = useState([]);
    const [areasLoading, setAreasLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Area dropdown (public API)
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

    // Frontend validation (backend-এর rule অনুযায়ী)
    const validate = () => {
        const newErrors = {};
        const { area_id, title, description } = formData;

        if (!area_id) newErrors.area_id = 'Please select an area';

        if (!title.trim()) newErrors.title = 'Title is required';
        else if (title.trim().length < 3) newErrors.title = 'Minimum 3 characters';
        else if (title.trim().length > 150) newErrors.title = 'Maximum 150 characters';

        if (!description.trim()) newErrors.description = 'Description is required';
        else if (description.trim().length < 10) newErrors.description = 'Minimum 10 characters';
        else if (description.trim().length > 1000) newErrors.description = 'Maximum 1000 characters';

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
            const res = await authFetch('/outages/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    area_id: Number(formData.area_id),
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    category: formData.category,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                const message = Array.isArray(data.detail)
                    ? data.detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(', ')
                    : data.detail;
                toast.error(message || 'Failed to report outage');
                return;
            }

            toast.success('Outage reported successfully');
            navigate('/outages/my');
        } catch (error) {
            toast.error('Cannot connect to server');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-base-200 min-h-screen py-10 px-4">
            <div className="card bg-base-100 w-full max-w-xl mx-auto shadow-2xl">
                <form onSubmit={handleSubmit} className="card-body">
                    <h1 className="text-3xl font-bold text-center">Report an Outage</h1>
                    <p className="text-center text-sm opacity-70">
                        Tell us about a power problem in your area.
                    </p>

                    <fieldset className="fieldset">
                        <label className="label">Area</label>
                        <select
                            name="area_id"
                            value={formData.area_id}
                            onChange={handleChange}
                            className={`select w-full ${errors.area_id ? 'select-error' : ''}`}
                            disabled={areasLoading}
                        >
                            <option value="">
                                {areasLoading ? 'Loading areas...' : 'Select area'}
                            </option>
                            {areas.map((area) => (
                                <option key={area.id} value={area.id}>
                                    {area.name} ({area.zone}, {area.district})
                                </option>
                            ))}
                        </select>
                        {errors.area_id && <p className="text-error text-sm">{errors.area_id}</p>}

                        <label className="label">Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="select w-full"
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>

                        <label className="label">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={`input w-full ${errors.title ? 'input-error' : ''}`}
                            placeholder="e.g. No power since morning"
                        />
                        {errors.title && <p className="text-error text-sm">{errors.title}</p>}

                        <label className="label">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={5}
                            className={`textarea w-full ${errors.description ? 'textarea-error' : ''}`}
                            placeholder="Describe the problem in detail (min 10 characters)"
                        ></textarea>
                        <div className="flex justify-between">
                            {errors.description
                                ? <p className="text-error text-sm">{errors.description}</p>
                                : <span></span>}
                            <span className="text-xs opacity-60">{formData.description.length}/1000</span>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button
                                type="button"
                                className="btn btn-outline flex-1"
                                onClick={() => navigate(-1)}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-neutral flex-1" disabled={submitting}>
                                {submitting ? <span className="loading loading-spinner loading-sm"></span> : 'Submit Report'}
                            </button>
                        </div>
                    </fieldset>
                </form>
            </div>
        </div>
    );
};

export default ReportOutage;