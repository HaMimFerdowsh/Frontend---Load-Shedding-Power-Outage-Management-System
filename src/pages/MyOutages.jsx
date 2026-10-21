import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router';
import toast from 'react-hot-toast';
import { FaSearch, FaRedo, FaEdit, FaTrash } from 'react-icons/fa';
import { AuthContext } from '../context/AuthProvider';
import { baseUrl } from '../services/BaseUrl';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';

const CATEGORIES = [
    { value: 'transformer_fault', label: 'Transformer Fault' },
    { value: 'line_break', label: 'Line Break' },
    { value: 'storm', label: 'Storm' },
    { value: 'overload', label: 'Overload' },
    { value: 'other', label: 'Other' },
];

const SORT_OPTIONS = [
    { label: 'Newest first', value: 'created_at:desc' },
    { label: 'Oldest first', value: 'created_at:asc' },
    { label: 'Title (A-Z)', value: 'title:asc' },
    { label: 'Title (Z-A)', value: 'title:desc' },
    { label: 'Status (A-Z)', value: 'status:asc' },
];

const categoryLabel = (value) => CATEGORIES.find((c) => c.value === value)?.label || value;

const formatDate = (value) =>
    new Date(value).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

const getMessage = (data, fallback) =>
    Array.isArray(data.detail)
        ? data.detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(', ')
        : data.detail || fallback;

const MyOutages = () => {
    const { authFetch } = useContext(AuthContext);

    // Data
    const [outages, setOutages] = useState([]);
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
    const [category, setCategory] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [sort, setSort] = useState('created_at:desc');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);

    // Edit modal
    const [editing, setEditing] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', category: 'other' });
    const [editErrors, setEditErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // Delete modal
    const [deleting, setDeleting] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const totalPages = Math.ceil(total / pageSize);

    // Area নাম দেখানোর জন্য
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

    // Outage fetch
    useEffect(() => {
        const fetchOutages = async () => {
            setLoading(true);
            setError('');

            const [sort_by, order] = sort.split(':');
            const params = new URLSearchParams({ page, page_size: pageSize, sort_by, order });

            if (search) params.append('search', search);
            if (status) params.append('status', status);
            if (category) params.append('category', category);
            if (fromDate) params.append('from_date', `${fromDate}T00:00:00`);
            if (toDate) params.append('to_date', `${toDate}T23:59:59`);

            try {
                const res = await authFetch(`/outages/my?${params.toString()}`);
                const data = await res.json();

                if (!res.ok) {
                    setError(getMessage(data, 'Failed to load outages'));
                    return;
                }

                setOutages(data.items);
                setTotal(data.total);
            } catch (err) {
                setError('Cannot connect to server');
            } finally {
                setLoading(false);
            }
        };

        fetchOutages();
    }, [page, pageSize, search, status, category, fromDate, toDate, sort, reload]);

    const changeFilter = (setter) => (e) => {
        setter(e.target.value);
        setPage(1);
    };

    const resetFilters = () => {
        setSearchInput('');
        setSearch('');
        setStatus('');
        setCategory('');
        setFromDate('');
        setToDate('');
        setSort('created_at:desc');
        setPageSize(10);
        setPage(1);
    };

    const hasFilters = search || status || category || fromDate || toDate;

    // ---------- Edit ----------
    const openEdit = (outage) => {
        setEditing(outage);
        setEditForm({
            title: outage.title,
            description: outage.description,
            category: outage.category,
        });
        setEditErrors({});
    };

    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
        setEditErrors({ ...editErrors, [e.target.name]: '' });
    };

    const validateEdit = () => {
        const newErrors = {};
        const { title, description } = editForm;

        if (!title.trim()) newErrors.title = 'Title is required';
        else if (title.trim().length < 3) newErrors.title = 'Minimum 3 characters';
        else if (title.trim().length > 150) newErrors.title = 'Maximum 150 characters';

        if (!description.trim()) newErrors.description = 'Description is required';
        else if (description.trim().length < 10) newErrors.description = 'Minimum 10 characters';
        else if (description.trim().length > 1000) newErrors.description = 'Maximum 1000 characters';

        return newErrors;
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validateEdit();
        if (Object.keys(validationErrors).length > 0) {
            setEditErrors(validationErrors);
            return;
        }

        setSaving(true);
        try {
            const res = await authFetch(`/outages/edit/${editing.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editForm.title.trim(),
                    description: editForm.description.trim(),
                    category: editForm.category,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(getMessage(data, 'Update failed'));
                return;
            }

            toast.success('Outage report updated');
            setEditing(null);
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
            const res = await authFetch(`/outages/delete/${deleting.id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) {
                toast.error(getMessage(data, 'Delete failed'));
                return;
            }

            toast.success('Outage report deleted');
            setDeleting(null);

            // শেষ page-এর একমাত্র item মুছলে আগের page-এ যাও
            if (outages.length === 1 && page > 1) setPage(page - 1);
            else setReload((r) => r + 1);
        } catch (err) {
            toast.error('Cannot connect to server');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-1">My Outage Reports</h1>
                    <p className="opacity-70">Track the problems you have reported.</p>
                </div>
                <Link to="/outages/report" className="btn btn-primary">+ Report Outage</Link>
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

                        <select value={status} onChange={changeFilter(setStatus)} className="select w-full">
                            <option value="">All status</option>
                            <option value="reported">Reported</option>
                            <option value="investigating">Investigating</option>
                            <option value="resolved">Resolved</option>
                            <option value="rejected">Rejected</option>
                        </select>

                        <select value={category} onChange={changeFilter(setCategory)} className="select w-full">
                            <option value="">All categories</option>
                            {CATEGORIES.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
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
                            disabled={!hasFilters && sort === 'created_at:desc' && pageSize === 10}
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
            ) : outages.length === 0 ? (
                <div className="text-center py-20 bg-base-100 rounded-box shadow">
                    <p className="text-xl font-semibold mb-1">No outage reports found</p>
                    <p className="opacity-70 mb-4">
                        {hasFilters ? 'Try changing or resetting your filters.' : 'You have not reported any outage yet.'}
                    </p>
                    {!hasFilters && <Link to="/outages/report" className="btn btn-primary btn-sm">Report your first outage</Link>}
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
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Reported</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {outages.map((o) => {
                                    const canModify = o.status === 'reported';
                                    return (
                                        <tr key={o.id} className="hover:bg-base-200">
                                            <td>{o.id}</td>
                                            <td className="max-w-xs">
                                                <p className="font-semibold">{o.title}</p>
                                                <p className="text-xs opacity-60 line-clamp-1">{o.description}</p>
                                            </td>
                                            <td>{areaName(o.area_id)}</td>
                                            <td>{categoryLabel(o.category)}</td>
                                            <td><StatusBadge status={o.status} /></td>
                                            <td className="whitespace-nowrap">{formatDate(o.created_at)}</td>
                                            <td>
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        className="btn btn-sm btn-info btn-outline"
                                                        onClick={() => openEdit(o)}
                                                        disabled={!canModify}
                                                        title={canModify ? 'Edit' : 'Only "reported" outages can be edited'}
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-error btn-outline"
                                                        onClick={() => setDeleting(o)}
                                                        disabled={!canModify}
                                                        title={canModify ? 'Delete' : 'Only "reported" outages can be deleted'}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
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

            {/* Edit modal */}
            {editing && (
                <div className="modal modal-open">
                    <form onSubmit={handleEditSubmit} className="modal-box">
                        <h3 className="font-bold text-lg mb-2">Edit Outage Report #{editing.id}</h3>

                        <fieldset className="fieldset">
                            <label className="label">Category</label>
                            <select
                                name="category"
                                value={editForm.category}
                                onChange={handleEditChange}
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
                                value={editForm.title}
                                onChange={handleEditChange}
                                className={`input w-full ${editErrors.title ? 'input-error' : ''}`}
                            />
                            {editErrors.title && <p className="text-error text-sm">{editErrors.title}</p>}

                            <label className="label">Description</label>
                            <textarea
                                name="description"
                                value={editForm.description}
                                onChange={handleEditChange}
                                rows={5}
                                className={`textarea w-full ${editErrors.description ? 'textarea-error' : ''}`}
                            ></textarea>
                            {editErrors.description && <p className="text-error text-sm">{editErrors.description}</p>}
                        </fieldset>

                        <div className="modal-action">
                            <button type="button" className="btn" onClick={() => setEditing(null)} disabled={saving}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-neutral" disabled={saving}>
                                {saving ? <span className="loading loading-spinner loading-sm"></span> : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                    <div className="modal-backdrop" onClick={() => !saving && setEditing(null)}></div>
                </div>
            )}

            {/* Delete confirm modal */}
            <ConfirmModal
                open={!!deleting}
                title="Delete outage report?"
                message={deleting ? `"${deleting.title}" will be permanently deleted. This cannot be undone.` : ''}
                confirmText="Delete"
                loading={deleteLoading}
                onConfirm={handleDelete}
                onCancel={() => setDeleting(null)}
            />
        </div>
    );
};

export default MyOutages;