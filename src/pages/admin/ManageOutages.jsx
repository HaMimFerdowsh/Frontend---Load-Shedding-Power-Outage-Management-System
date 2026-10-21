import React, { useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaSearch, FaRedo, FaEye } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthProvider';
import { baseUrl } from '../../services/BaseUrl';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';

const CATEGORIES = [
    { value: 'transformer_fault', label: 'Transformer Fault' },
    { value: 'line_break', label: 'Line Break' },
    { value: 'storm', label: 'Storm' },
    { value: 'overload', label: 'Overload' },
    { value: 'other', label: 'Other' },
];

const STATUSES = ['reported', 'investigating', 'resolved', 'rejected'];

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

const ManageOutages = () => {
    const { authFetch } = useContext(AuthContext);

    // Data
    const [outages, setOutages] = useState([]);
    const [total, setTotal] = useState(0);
    const [areas, setAreas] = useState([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reload, setReload] = useState(0);
    const [updatingId, setUpdatingId] = useState(null);
    const [viewing, setViewing] = useState(null);

    // Filters
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [category, setCategory] = useState('');
    const [areaId, setAreaId] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [sort, setSort] = useState('created_at:desc');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);

    const totalPages = Math.ceil(total / pageSize);

    // Area dropdown / নাম
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
            if (areaId) params.append('area_id', areaId);
            if (fromDate) params.append('from_date', `${fromDate}T00:00:00`);
            if (toDate) params.append('to_date', `${toDate}T23:59:59`);

            try {
                const res = await authFetch(`/admin/outages?${params.toString()}`);
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
    }, [page, pageSize, search, status, category, areaId, fromDate, toDate, sort, reload]);

    const changeFilter = (setter) => (e) => {
        setter(e.target.value);
        setPage(1);
    };

    const resetFilters = () => {
        setSearchInput('');
        setSearch('');
        setStatus('');
        setCategory('');
        setAreaId('');
        setFromDate('');
        setToDate('');
        setSort('created_at:desc');
        setPageSize(10);
        setPage(1);
    };

    const hasFilters = search || status || category || areaId || fromDate || toDate;

    // ---------- Status update ----------
    const handleStatusChange = async (outage, newStatus) => {
        if (newStatus === outage.status) return;

        setUpdatingId(outage.id);
        try {
            const res = await authFetch(`/admin/update_outage/${outage.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(getMessage(data, 'Status update failed'));
                return;
            }

            toast.success(`Outage #${outage.id} marked as ${newStatus}`);

            // status filter চালু থাকলে row সরে যেতে পারে, তাই আবার load করি
            setReload((r) => r + 1);
        } catch (err) {
            toast.error('Cannot connect to server');
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-1">Manage Outages</h1>
                <p className="opacity-70">Review outage reports and update their status.</p>
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
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>

                        <select value={category} onChange={changeFilter(setCategory)} className="select w-full">
                            <option value="">All categories</option>
                            {CATEGORIES.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                        <div>
                            <label className="label text-xs">From date</label>
                            <input type="date" value={fromDate} onChange={changeFilter(setFromDate)} className="input w-full" />
                        </div>
                        <div>
                            <label className="label text-xs">To date</label>
                            <input type="date" value={toDate} onChange={changeFilter(setToDate)} className="input w-full" />
                        </div>
                        <div>
                            <label className="label text-xs">Sort by</label>
                            <select value={sort} onChange={changeFilter(setSort)} className="select w-full">
                                {SORT_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
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
                    <p className="opacity-70">
                        {hasFilters ? 'Try changing or resetting your filters.' : 'No outage has been reported yet.'}
                    </p>
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
                                    <th>Reported</th>
                                    <th>Status</th>
                                    <th className="text-center">View</th>
                                </tr>
                            </thead>
                            <tbody>
                                {outages.map((o) => (
                                    <tr key={o.id} className="hover:bg-base-200">
                                        <td>{o.id}</td>
                                        <td className="max-w-xs">
                                            <p className="font-semibold">{o.title}</p>
                                            <p className="text-xs opacity-60 line-clamp-1">{o.description}</p>
                                        </td>
                                        <td>{areaName(o.area_id)}</td>
                                        <td>{categoryLabel(o.category)}</td>
                                        <td className="whitespace-nowrap">{formatDate(o.created_at)}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={o.status}
                                                    onChange={(e) => handleStatusChange(o, e.target.value)}
                                                    className="select select-sm w-36 capitalize"
                                                    disabled={updatingId === o.id}
                                                >
                                                    {STATUSES.map((s) => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                                {updatingId === o.id && (
                                                    <span className="loading loading-spinner loading-xs"></span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <button
                                                className="btn btn-sm btn-info btn-outline"
                                                onClick={() => setViewing(o)}
                                                title="View details"
                                            >
                                                <FaEye />
                                            </button>
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

            {/* Details modal */}
            {viewing && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-xl">
                        <h3 className="font-bold text-lg mb-3">Outage #{viewing.id}</h3>

                        <h4 className="font-semibold text-xl">{viewing.title}</h4>
                        <div className="flex flex-wrap gap-2 my-3">
                            <StatusBadge status={viewing.status} />
                            <span className="badge badge-outline">{categoryLabel(viewing.category)}</span>
                        </div>

                        <p className="whitespace-pre-wrap break-words mb-4">{viewing.description}</p>

                        <div className="divide-y divide-base-300 text-sm">
                            <div className="flex justify-between py-2">
                                <span className="opacity-60">Area</span>
                                <span>{areaName(viewing.area_id)}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="opacity-60">Reported by (user ID)</span>
                                <span>{viewing.reported_by}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="opacity-60">Reported at</span>
                                <span>{formatDate(viewing.created_at)}</span>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button className="btn" onClick={() => setViewing(null)}>Close</button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setViewing(null)}></div>
                </div>
            )}
        </div>
    );
};

export default ManageOutages;