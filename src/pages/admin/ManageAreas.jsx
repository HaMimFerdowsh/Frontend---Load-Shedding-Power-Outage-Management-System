import React, { useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaSearch, FaRedo, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthProvider';
import { baseUrl } from '../../services/BaseUrl';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';

const SORT_OPTIONS = [
    { label: 'Name (A-Z)', value: 'name:asc' },
    { label: 'Name (Z-A)', value: 'name:desc' },
    { label: 'Zone (A-Z)', value: 'zone:asc' },
    { label: 'District (A-Z)', value: 'district:asc' },
    { label: 'Newest first', value: 'created_at:desc' },
    { label: 'Oldest first', value: 'created_at:asc' },
];

const EMPTY_FORM = { name: '', zone: '', district: '' };

const getMessage = (data, fallback) =>
    Array.isArray(data.detail)
        ? data.detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(', ')
        : data.detail || fallback;

const ManageAreas = () => {
    const { authFetch } = useContext(AuthContext);

    // Data
    const [areas, setAreas] = useState([]);
    const [total, setTotal] = useState(0);
    const [zones, setZones] = useState([]);
    const [districts, setDistricts] = useState([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reload, setReload] = useState(0);

    // Filters
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [zone, setZone] = useState('');
    const [district, setDistrict] = useState('');
    const [sort, setSort] = useState('name:asc');
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

    // Zone ও District filter dropdown-এর জন্য unique মান আনা
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const res = await fetch(`${baseUrl}/areas/all?page_size=100`);
                const data = await res.json();
                if (res.ok) {
                    setZones([...new Set(data.items.map((a) => a.zone))].sort());
                    setDistricts([...new Set(data.items.map((a) => a.district))].sort());
                }
            } catch (err) {
                console.error('Failed to load filter options', err);
            }
        };
        fetchOptions();
    }, [reload]);

    // Search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Area fetch (public API)
    useEffect(() => {
        const fetchAreas = async () => {
            setLoading(true);
            setError('');

            const [sort_by, order] = sort.split(':');
            const params = new URLSearchParams({ page, page_size: pageSize, sort_by, order });

            if (search) params.append('search', search);
            if (zone) params.append('zone', zone);
            if (district) params.append('district', district);

            try {
                const res = await fetch(`${baseUrl}/areas/all?${params.toString()}`);
                const data = await res.json();

                if (!res.ok) {
                    setError(getMessage(data, 'Failed to load areas'));
                    return;
                }

                setAreas(data.items);
                setTotal(data.total);
            } catch (err) {
                setError('Cannot connect to server');
            } finally {
                setLoading(false);
            }
        };

        fetchAreas();
    }, [page, pageSize, search, zone, district, sort, reload]);

    const changeFilter = (setter) => (e) => {
        setter(e.target.value);
        setPage(1);
    };

    const resetFilters = () => {
        setSearchInput('');
        setSearch('');
        setZone('');
        setDistrict('');
        setSort('name:asc');
        setPageSize(10);
        setPage(1);
    };

    const hasFilters = search || zone || district;

    // ---------- Create / Edit ----------
    const openCreate = () => {
        setEditing(null);
        setFormData(EMPTY_FORM);
        setErrors({});
        setShowForm(true);
    };

    const openEdit = (area) => {
        setEditing(area);
        setFormData({ name: area.name, zone: area.zone, district: area.district });
        setErrors({});
        setShowForm(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const validate = () => {
        const newErrors = {};
        const { name, zone, district } = formData;

        if (!name.trim()) newErrors.name = 'Name is required';
        else if (name.trim().length < 2) newErrors.name = 'Minimum 2 characters';
        else if (name.trim().length > 100) newErrors.name = 'Maximum 100 characters';

        if (!zone.trim()) newErrors.zone = 'Zone is required';
        else if (zone.trim().length < 2) newErrors.zone = 'Minimum 2 characters';
        else if (zone.trim().length > 50) newErrors.zone = 'Maximum 50 characters';

        if (!district.trim()) newErrors.district = 'District is required';
        else if (district.trim().length < 2) newErrors.district = 'Minimum 2 characters';
        else if (district.trim().length > 50) newErrors.district = 'Maximum 50 characters';

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSaving(true);
        try {
            const url = editing ? `/admin/update_area/${editing.id}` : '/admin/create_area';
            const res = await authFetch(url, {
                method: editing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    zone: formData.zone.trim(),
                    district: formData.district.trim(),
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(getMessage(data, 'Save failed'));
                return;
            }

            toast.success(editing ? 'Area updated successfully' : 'Area added successfully');
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
            const res = await authFetch(`/admin/delete_area/${deleting.id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) {
                // যেমন: "Area is in use by users, schedules or outages"
                toast.error(getMessage(data, 'Delete failed'));
                return;
            }

            toast.success('Area deleted successfully');
            setDeleting(null);

            if (areas.length === 1 && page > 1) setPage(page - 1);
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
                    <h1 className="text-2xl md:text-3xl font-bold mb-1">Manage Areas</h1>
                    <p className="opacity-70">Add, edit or remove service areas.</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    <FaPlus /> Add Area
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
                                placeholder="Search by name or ID"
                            />
                        </label>

                        <select value={zone} onChange={changeFilter(setZone)} className="select w-full">
                            <option value="">All zones</option>
                            {zones.map((z) => <option key={z} value={z}>{z}</option>)}
                        </select>

                        <select value={district} onChange={changeFilter(setDistrict)} className="select w-full">
                            <option value="">All districts</option>
                            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>

                        <select value={sort} onChange={changeFilter(setSort)} className="select w-full">
                            {SORT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
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
                            disabled={!hasFilters && sort === 'name:asc' && pageSize === 10}
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
            ) : areas.length === 0 ? (
                <div className="text-center py-20 bg-base-100 rounded-box shadow">
                    <p className="text-xl font-semibold mb-1">No areas found</p>
                    <p className="opacity-70 mb-4">
                        {hasFilters ? 'Try changing or resetting your filters.' : 'No area has been added yet.'}
                    </p>
                    {!hasFilters && (
                        <button className="btn btn-primary btn-sm" onClick={openCreate}>Add first area</button>
                    )}
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto bg-base-100 rounded-box shadow">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Zone</th>
                                    <th>District</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {areas.map((a) => (
                                    <tr key={a.id} className="hover:bg-base-200">
                                        <td>{a.id}</td>
                                        <td className="font-semibold">{a.name}</td>
                                        <td>{a.zone}</td>
                                        <td>{a.district}</td>
                                        <td>
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    className="btn btn-sm btn-info btn-outline"
                                                    onClick={() => openEdit(a)}
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-error btn-outline"
                                                    onClick={() => setDeleting(a)}
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
                    <form onSubmit={handleSubmit} className="modal-box">
                        <h3 className="font-bold text-lg mb-2">
                            {editing ? `Edit Area #${editing.id}` : 'Add New Area'}
                        </h3>

                        <fieldset className="fieldset">
                            <label className="label">Area Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`input w-full ${errors.name ? 'input-error' : ''}`}
                                placeholder="e.g. Savar"
                            />
                            {errors.name && <p className="text-error text-sm">{errors.name}</p>}

                            <label className="label">Zone</label>
                            <input
                                type="text"
                                name="zone"
                                value={formData.zone}
                                onChange={handleChange}
                                className={`input w-full ${errors.zone ? 'input-error' : ''}`}
                                placeholder="e.g. Zone A"
                            />
                            {errors.zone && <p className="text-error text-sm">{errors.zone}</p>}

                            <label className="label">District</label>
                            <input
                                type="text"
                                name="district"
                                value={formData.district}
                                onChange={handleChange}
                                className={`input w-full ${errors.district ? 'input-error' : ''}`}
                                placeholder="e.g. Dhaka"
                            />
                            {errors.district && <p className="text-error text-sm">{errors.district}</p>}
                        </fieldset>

                        <div className="modal-action">
                            <button type="button" className="btn" onClick={() => setShowForm(false)} disabled={saving}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-neutral" disabled={saving}>
                                {saving
                                    ? <span className="loading loading-spinner loading-sm"></span>
                                    : editing ? 'Save Changes' : 'Add Area'}
                            </button>
                        </div>
                    </form>
                    <div className="modal-backdrop" onClick={() => !saving && setShowForm(false)}></div>
                </div>
            )}

            {/* Delete confirm modal */}
            <ConfirmModal
                open={!!deleting}
                title="Delete area?"
                message={deleting ? `"${deleting.name}" will be permanently deleted. This cannot be undone.` : ''}
                confirmText="Delete"
                loading={deleteLoading}
                onConfirm={handleDelete}
                onCancel={() => setDeleting(null)}
            />
        </div>
    );
};

export default ManageAreas;