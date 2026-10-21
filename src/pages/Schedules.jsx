import React, { useContext, useEffect, useState } from 'react';
import { FaSearch, FaRedo } from 'react-icons/fa';
import { AuthContext } from '../context/AuthProvider';
import { baseUrl } from '../services/BaseUrl';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';

const SORT_OPTIONS = [
    { label: 'Newest first', value: 'start_time:desc' },
    { label: 'Oldest first', value: 'start_time:asc' },
    { label: 'Title (A-Z)', value: 'title:asc' },
    { label: 'Title (Z-A)', value: 'title:desc' },
    { label: 'Status (A-Z)', value: 'status:asc' },
];

const formatDate = (value) =>
    new Date(value).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

const Schedules = () => {
    const { authFetch } = useContext(AuthContext);

    // Data
    const [schedules, setSchedules] = useState([]);
    const [total, setTotal] = useState(0);
    const [areas, setAreas] = useState([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');      // debounce-এর পর
    const [status, setStatus] = useState('');
    const [areaId, setAreaId] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [sort, setSort] = useState('start_time:desc');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);

    const totalPages = Math.ceil(total / pageSize);

    // Area-র নাম দেখানো ও filter dropdown-এর জন্য
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

    // Search debounce: 500ms থামলে তবেই API call হবে
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
            if (toDate) params.append('to_date', `${toDate}T23:59:59`);   // ওই দিনটাও ধরার জন্য

            try {
                const res = await authFetch(`/schedules?${params.toString()}`);
                const data = await res.json();

                if (!res.ok) {
                    const message = Array.isArray(data.detail)
                        ? data.detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(', ')
                        : data.detail;
                    setError(message || 'Failed to load schedules');
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
    }, [page, pageSize, search, status, areaId, fromDate, toDate, sort]);

    // Filter বদলালে page 1 এ ফেরা
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

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Load Shedding Schedules</h1>
            <p className="opacity-70 mb-6">Check when power will be off in your area.</p>

            {/* Filter bar */}
            <div className="card bg-base-100 shadow mb-6">
                <div className="card-body p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Search */}
                        <label className="input w-full">
                            <FaSearch className="opacity-50" />
                            <input
                                type="search"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by title or ID"
                            />
                        </label>

                        {/* Area */}
                        <select value={areaId} onChange={changeFilter(setAreaId)} className="select w-full">
                            <option value="">All areas</option>
                            {areas.map((a) => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>

                        {/* Status */}
                        <select value={status} onChange={changeFilter(setStatus)} className="select w-full">
                            <option value="">All status</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        {/* Sort */}
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
                        <button onClick={resetFilters} className="btn btn-outline" disabled={!hasFilters && sort === 'start_time:desc' && pageSize === 10}>
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
                    <button className="btn btn-sm" onClick={() => setPage((p) => p)}>
                        Retry
                    </button>
                </div>
            ) : schedules.length === 0 ? (
                <div className="text-center py-20 bg-base-100 rounded-box shadow">
                    <p className="text-xl font-semibold mb-1">No schedules found</p>
                    <p className="opacity-70">
                        {hasFilters ? 'Try changing or resetting your filters.' : 'No load shedding schedule has been added yet.'}
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
                                    <th>Reason</th>
                                    <th>Start</th>
                                    <th>End</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedules.map((s) => (
                                    <tr key={s.id} className="hover:bg-base-200">
                                        <td>{s.id}</td>
                                        <td className="font-semibold">{s.title}</td>
                                        <td>{areaName(s.area_id)}</td>
                                        <td className="max-w-xs">{s.reason}</td>
                                        <td className="whitespace-nowrap">{formatDate(s.start_time)}</td>
                                        <td className="whitespace-nowrap">{formatDate(s.end_time)}</td>
                                        <td><StatusBadge status={s.status} /></td>
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
        </div>
    );
};

export default Schedules;