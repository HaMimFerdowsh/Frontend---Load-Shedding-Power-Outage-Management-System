import React, { useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaSearch, FaRedo, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthProvider';
import { baseUrl } from '../../services/BaseUrl';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';

const SORT_OPTIONS = [
    { label: 'Newest first', value: 'start_time:desc' },
    { label: 'Oldest first', value: 'start_time:asc' },
    { label: 'End time (latest)', value: 'end_time:desc' },
    { label: 'Title (A-Z)', value: 'title:asc' },
    { label: 'Title (Z-A)', value: 'title:desc' },
    { label: 'Status (A-Z)', value: 'status:asc' },
];

const STATUSES = ['scheduled', 'ongoing', 'completed', 'cancelled'];

const EMPTY_FORM = {
    area_id: '',
    title: '',
    reason: '',
    start_time: '',
    end_time: '',
    status: 'scheduled',
};

const formatDate = (value) =>
    new Date(value).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

// Backend datetime -> <input type="datetime-local"> format (YYYY-MM-DDTHH:mm)
const toInputValue = (value) => (value ? value.slice(0, 16) : '');

const getMessage = (data, fallback) =>
    Array.isArray(data.detail)
        ? data.detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(', ')
        : data.detail || fallback;

const ManageSchedules = () => {
    const { authFetch } = useContext(AuthContext);

    // Data
    const [schedules, setSchedules] = useState([]);
    const [total, setTotal] = useState(0);
    const [areas, setAreas] = useState([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reload, setReload] = useState(0);

    // Filters
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [areaId, setAreaId] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [sort, setSort] = useState('start_time:desc');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);

    // Create / Edit modal
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);   // null = create mode
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // Delete modal
    const [deleting, setDeleting] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const totalPages = Math.ceil(total / pageSize);

    // Area dropdown
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

    const areaName = (id) => areas.find((a) => a.id === id)?.name || `Area #${id}`;

    // Search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Schedule fetch
    useEffect(() => {
        const fetchSchedules = async () => {
            setLoading(true);
            setError('');

            const [sort_by, order] = sort.split(':');
            const params = new URLSearchParams({ page, page_size: pageSize, sort_by, order });

            if (search) params.append('search', search);
            if (status) params.append('status', status);
            if (areaId) params.append('area_id', areaId);
            if (fromDate) params.append('from_date', `${fromDate}T00:00:00`);
            if (toDate) params.append('to_date', `${toDate}T23:59:59`);

            try {
                const res = await authFetch(`/schedules?${params.toString()}`);
                const data = await res.json();

                if (!res.ok) {
                    setError(getMessage(data, 'Failed to load schedules'));
                    return;
                }

                setSchedules(data.items);
                setTotal(data.total);
            } catch (err) {
                setError('Cannot connect to server');
            } finally {
                setLoading(false);
            }
        };

        fetchSchedules();
    }, [page, pageSize, search, status, areaId, fromDate, toDate, sort, reload]);

    const changeFilter = (setter) => (e) => {
        setter(e.target.value);
        setPage(1);
    };

    const resetFilters = () => {
        setSearchInput('');
        setSearch('');
        setStatus('');
        setAreaId('');
        setFromDate('');
        setToDate('');
        setSort('start_time:desc');
        setPageSize(10);
        setPage(1);
    };

    const hasFilters = search || status || areaId || fromDate || toDate;

    // ---------- Create / Edit ----------
    const openCreate = () => {
        setEditing(null);
        setFormData(EMPTY_FORM);
        setErrors({});
        setShowForm(true);
    };

    const openEdit = (s) => {
        setEditing(s);
        setFormData({
            area_id: String(s.area_id),
            title: s.title,
            reason: s.reason,
            start_time: toInputValue(s.start_time),
            end_time: toInputValue(s.end_time),
            status: s.status,
        });
        setErrors({});
        setShowForm(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const validate = () => {
        const newErrors = {};
        const { area_id, title, reason, start_time, end_time } = formData;

        if (!area_id) newErrors.area_id = 'Please select an area';

        if (!title.trim()) newErrors.title = 'Title is required';
        else if (title.trim().length < 3) newErrors.title = 'Minimum 3 characters';
        else if (title.trim().length > 150) newErrors.title = 'Maximum 150 characters';

        if (!reason.trim()) newErrors.reason = 'Reason is required';
        else if (reason.trim().length < 3) newErrors.reason = 'Minimum 3 characters';
        else if (reason.trim().length > 200) newErrors.reason = 'Maximum 200 characters';

        if (!start_time) newErrors.start_time = 'Start time is required';
        if (!end_time) newErrors.end_time = 'End time is required';
        if (start_time && end_time && new Date(end_time) <= new Date(start_time)) {
            newErrors.end_time = 'End time must be after start time';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        // datetime-local "YYYY-MM-DDTHH:mm" -> seconds যোগ করে timezone ছাড়া পাঠাই
        const payload = {
            area_id: Number(formData.area_id),
            title: formData.title.trim(),
            reason: formData.reason.trim(),
            start_time: `${formData.start_time}:00`,
            end_time: `${formData.end_time}:00`,
        };
        if (editing) payload.status = formData.status;

        setSaving(true);
        try {
            const url = editing ? `/admin/update_schedule/${editing.id}` : '/admin/create_schedule';
            const res = await authFetch(url, {
                method: editing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(getMessage(data, 'Save failed'));
                return;
            }

            toast.success(editing ? 'Schedule updated successfully' : 'Schedule created successfully');
            setShowForm(false);
            setReload((r) => r + 1);
        } catch (err) {
            toast.error('Cannot connect to server');
        } finally {
            setSaving(false);
        }
    };

    // ---------- Delete ----------
    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            const res = await authFetch(`/admin/delete_schedule/${deleting.id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) {
                toast.error(getMessage(data, 'Delete failed'));
                return;
            }

            toast.success('Schedule deleted successfully');

            if (schedules.length === 1 && page > 1) setPage(page - 1);
            else setReload((r) => r + 1);
        } catch (err) {
            toast.error('Cannot connect to server');
        } finally {
            setDeleteLoading(false);
            setDeleting(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-1">Manage Schedules</h1>
                    <p className="opacity-70">Create and manage load shedding schedules.</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    <FaPlus /> Add Schedule
                </button>
            </div>

            {/* Filter bar */}
            <div className="card bg-base-100 shadow mb-6">
                <div className="card-body p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <label className="input w-full">
                            <FaSearch className="opacity-50" />
                            <input
                                type="search"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by title or ID"
                            />
                        </label>

                        <select value={areaId} onChange={changeFilter(setAreaId)} className="select w-full">
                            <option value="">All areas</option>
                            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>

                        <select value={status} onChange={changeFilter(setStatus)} className="select w-full">
                            <option value="">All status</option>
                            {STATUSES.map((s) => (
                                <option key={s} value={s} className="capitalize">{s}</option>
                            ))}
                        </select>

                        <select value={sort} onChange={changeFilter(setSort)} className="select w-full">
                            {SORT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                        <div>
                            <label className="label text-xs">From date</label>
                            <input type="date" value={fromDate} onChange={changeFilter(setFromDate)} className="input w-full" />
                        </div>
                        <div>
                            <label className="label text-xs">To date</label>
                            <input type="date" value={toDate} onChange={changeFilter(setToDate)} className="input w-full" />
                        </div>
                        <div>
                            <label className="label text-xs">Per page</label>
                            <select
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                                className="select w-full"
                            >
                                {[5, 10, 20, 50].map((n) => (
                                    <option key={n} value={n}>{n} per page</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={resetFilters}
                            className="btn btn-outline"
                            disabled={!hasFilters && sort === 'start_time:desc' && pageSize === 10}
                        >
                            <FaRedo /> Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Content: loading / error / empty / data */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
            ) : error ? (
                <div role="alert" className="alert alert-error">
                    <span>{error}</span>
                    <button className="btn btn-sm" onClick={() => setReload((r) => r + 1)}>Retry</button>
                </div>
            ) : schedules.length === 0 ? (
                <div className="text-center py-20 bg-base-100 rounded-box shadow">
                    <p className="text-xl font-semibold mb-1">No schedules found</p>
                    <p className="opacity-70 mb-4">
                        {hasFilters ? 'Try changing or resetting your filters.' : 'No schedule has been added yet.'}
                    </p>
                    {!hasFilters && (
                        <button className="btn btn-primary btn-sm" onClick={openCreate}>Add first schedule</button>
                    )}
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto bg-base-100 rounded-box shadow">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Area</th>
                                    <th>Start</th>
                                    <th>End</th>
                                    <th>Status</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedules.map((s) => (
                                    <tr key={s.id} className="hover:bg-base-200">
                                        <td>{s.id}</td>
                                        <td className="max-w-xs">
                                            <p className="font-semibold">{s.title}</p>
                                            <p className="text-xs opacity-60 line-clamp-1">{s.reason}</p>
                                        </td>
                                        <td>{areaName(s.area_id)}</td>
                                        <td className="whitespace-nowrap">{formatDate(s.start_time)}</td>
                                        <td className="whitespace-nowrap">{formatDate(s.end_time)}</td>
                                        <td><StatusBadge status={s.status} /></td>
                                        <td>
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    className="btn btn-sm btn-info btn-outline"
                                                    onClick={() => openEdit(s)}
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-error btn-outline"
                                                    onClick={() => setDeleting(s)}
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                        <p className="text-sm opacity-70">
                            Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}
                        </p>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                </>
            )}

            {/* Create / Edit modal */}
            {showForm && (
                <div className="modal modal-open">
                    <form onSubmit={handleSubmit} className="modal-box max-w-xl">
                        <h3 className="font-bold text-lg mb-2">
                            {editing ? `Edit Schedule #${editing.id}` : 'Add New Schedule'}
                        </h3>

                        <fieldset className="fieldset">
                            <label className="label">Area</label>
                            <select
                                name="area_id"
                                value={formData.area_id}
                                onChange={handleChange}
                                className={`select w-full ${errors.area_id ? 'select-error' : ''}`}
                            >
                                <option value="">Select area</option>
                                {areas.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.name} ({a.zone}, {a.district})
                                    </option>
                                ))}
                            </select>
                            {errors.area_id && <p className="text-error text-sm">{errors.area_id}</p>}

                            <label className="label">Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className={`input w-full ${errors.title ? 'input-error' : ''}`}
                                placeholder="e.g. Evening load shedding"
                            />
                            {errors.title && <p className="text-error text-sm">{errors.title}</p>}

                            <label className="label">Reason</label>
                            <input
                                type="text"
                                name="reason"
                                value={formData.reason}
                                onChange={handleChange}
                                className={`input w-full ${errors.reason ? 'input-error' : ''}`}
                                placeholder="e.g. Peak demand"
                            />
                            {errors.reason && <p className="text-error text-sm">{errors.reason}</p>}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                                <div>
                                    <label className="label">Start Time</label>
                                    <input
                                        type="datetime-local"
                                        name="start_time"
                                        value={formData.start_time}
                                        onChange={handleChange}
                                        className={`input w-full ${errors.start_time ? 'input-error' : ''}`}
                                    />
                                    {errors.start_time && <p className="text-error text-sm">{errors.start_time}</p>}
                                </div>
                                <div>
                                    <label className="label">End Time</label>
                                    <input
                                        type="datetime-local"
                                        name="end_time"
                                        value={formData.end_time}
                                        onChange={handleChange}
                                        className={`input w-full ${errors.end_time ? 'input-error' : ''}`}
                                    />
                                    {errors.end_time && <p className="text-error text-sm">{errors.end_time}</p>}
                                </div>
                            </div>

                            {/* Status শুধু edit-এ (create-এ backend সবসময় "scheduled" বসায়) */}
                            {editing && (
                                <>
                                    <label className="label">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="select w-full capitalize"
                                    >
                                        {STATUSES.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </>
                            )}
                        </fieldset>

                        <div className="modal-action">
                            <button type="button" className="btn" onClick={() => setShowForm(false)} disabled={saving}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-neutral" disabled={saving}>
                                {saving
                                    ? <span className="loading loading-spinner loading-sm"></span>
                                    : editing ? 'Save Changes' : 'Add Schedule'}
                            </button>
                        </div>
                    </form>
                    <div className="modal-backdrop" onClick={() => !saving && setShowForm(false)}></div>
                </div>
            )}

            {/* Delete confirm modal */}
            <ConfirmModal
                open={!!deleting}
                title="Delete schedule?"
                message={deleting ? `"${deleting.title}" will be permanently deleted. This cannot be undone.` : ''}
                confirmText="Delete"
                loading={deleteLoading}
                onConfirm={handleDelete}
                onCancel={() => setDeleting(null)}
            />
        </div>
    );
};

export default ManageSchedules;