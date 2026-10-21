import React, { useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { FaBolt } from 'react-icons/fa';
import { AuthContext } from '../context/AuthProvider';

const Navbar = () => {
    const { authUser, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/');
    };

    const linkClass = ({ isActive }) => (isActive ? 'menu-active' : '');

    const links = (
        <>
            <li><NavLink to="/" className={linkClass}>Home</NavLink></li>

            {authUser && authUser.role === 'user' && (
                <>
                    <li><NavLink to="/schedules" className={linkClass}>Schedules</NavLink></li>
                    <li><NavLink to="/outages/report" className={linkClass}>Report Outage</NavLink></li>
                    <li><NavLink to="/outages/my" className={linkClass}>My Outages</NavLink></li>
                </>
            )}

            {authUser && authUser.role === 'admin' && (
                <>
                    <li><NavLink to="/schedules" className={linkClass}>Schedules</NavLink></li>
                    <li><NavLink to="/admin/manage-area" className={linkClass}>Admin Panel</NavLink></li>
                </>
            )}
        </>
    );

    return (
        <div className="navbar bg-base-100 shadow-sm sticky top-0 z-50">
            <div className="navbar-start">
                <div className="dropdown">
                    <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                        <svg aria-label="Menu" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
                        </svg>
                    </div>
                    <ul
                        tabIndex={-1}
                        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
                        {links}
                    </ul>
                </div>
                <Link to="/" className="btn btn-ghost text-xl">
                    <FaBolt className="text-warning" /> PowerWatch
                </Link>
            </div>

            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1">
                    {links}
                </ul>
            </div>

            <div className="navbar-end gap-2">
                {!authUser ? (
                    <>
                        <Link to="/login" className="btn btn-ghost btn-sm sm:btn-md">Login</Link>
                        <Link to="/signup" className="btn btn-primary btn-sm sm:btn-md">Sign Up</Link>
                    </>
                ) : (
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar avatar-placeholder">
                            <div className="bg-primary text-primary-content w-10 rounded-full">
                                <span className="text-lg uppercase">
                                    {authUser.firstname?.charAt(0) || authUser.username?.charAt(0)}
                                </span>
                            </div>
                        </div>
                        <ul
                            tabIndex={-1}
                            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-56 p-2 shadow">
                            <li className="menu-title">
                                {authUser.firstname} {authUser.lastname}
                                <span className="block text-xs font-normal opacity-60">
                                    {authUser.role}
                                </span>
                            </li>
                            <li><Link to="/user/profile">Profile</Link></li>
                            <li><Link to="/change-password">Change Password</Link></li>
                            <li><button onClick={handleLogout} className="text-error">Logout</button></li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Navbar;