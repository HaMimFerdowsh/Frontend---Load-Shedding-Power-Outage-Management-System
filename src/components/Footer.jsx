import React from 'react';
import { Link } from 'react-router';
import { FaBolt } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="footer sm:footer-horizontal bg-base-200 text-base-content p-10">
            <aside>
                <FaBolt className="text-warning" size={40} />
                <p>
                    <span className="font-bold text-lg">PowerWatch</span>
                    <br />
                    Load Shedding & Power Outage Management System
                </p>
            </aside>
            <nav>
                <h6 className="footer-title">Quick Links</h6>
                <Link to="/" className="link link-hover">Home</Link>
                <Link to="/schedules" className="link link-hover">Schedules</Link>
                <Link to="/outages/report" className="link link-hover">Report Outage</Link>
            </nav>
            <nav>
                <h6 className="footer-title">Account</h6>
                <Link to="/login" className="link link-hover">Login</Link>
                <Link to="/signup" className="link link-hover">Sign Up</Link>
                <Link to="/forgot-password" className="link link-hover">Forgot Password</Link>
            </nav>
            <nav>
                <h6 className="footer-title">Legal</h6>
                <a className="link link-hover">Terms of use</a>
                <a className="link link-hover">Privacy policy</a>
                <a className="link link-hover">Cookie policy</a>
            </nav>
        </footer>
    );
};

export default Footer;