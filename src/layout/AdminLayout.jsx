import React, { useContext } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { FaBolt, FaMapMarkedAlt, FaRegClock, FaExclamationTriangle, FaHome, FaSignOutAlt } from 'react-icons/fa';
import { AuthContext } from '../context/AuthProvider';

const AdminLayout = () => {
    const { authUser, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/');
    };

    const linkClass = ({ isActive }) => (isActive ? 'menu-active' : '');

    return (
        <div className="drawer lg:drawer-open">
            <input id="admin-drawer" type="checkbox" className="drawer-toggle" />

            {/* Main content */}
            <div className="drawer-content flex flex-col bg-base-200 min-h-screen">
                {/* Mobile top bar */}
                <div className="navbar bg-base-100 shadow-sm lg:hidden">
                    <div className="flex-none">
                        <label htmlFor="admin-drawer" aria-label="open sidebar" className="btn btn-square btn-ghost">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block h-6 w-6 stroke-current">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                            </svg>
                        </label>
                    </div>
                    <div className="flex-1 text-lg font-bold">Admin Panel</div>
                </div>

                <main className="p-4 md:p-6 flex-1">
                    <Outlet />
                </main>
            </div>

            {/* Sidebar */}
            <div className="drawer-side z-50">
                <label htmlFor="admin-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
                <div className="bg-base-100 min-h-full w-72 p-4 flex flex-col">
                    <Link to="/admin/manage-area" className="flex items-center gap-2 text-xl font-bold mb-1">
                        <FaBolt className="text-warning" /> PowerWatch
                    </Link>
                    <p className="text-sm opacity-60 mb-4">
                        {authUser?.firstname} {authUser?.lastname} (admin)
                    </p>

                    <ul className="menu w-full gap-1 flex-1">
                        <li className="menu-title">Management</li>
                        <li>
                            <NavLink to="/admin/manage-area" className={linkClass}>
                                <FaMapMarkedAlt /> Manage Areas
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/manage-schedule" className={linkClass}>
                                <FaRegClock /> Manage Schedules
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/manage-outage" className={linkClass}>
                                <FaExclamationTriangle /> Manage Outages
                            </NavLink>
                        </li>
                    </ul>

                    <ul className="menu w-full gap-1 border-t border-base-300 pt-2">
                        <li>
                            <Link to="/"><FaHome /> Back to Website</Link>
                        </li>
                        <li>
                            <button onClick={handleLogout} className="text-error">
                                <FaSignOutAlt /> Logout
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;