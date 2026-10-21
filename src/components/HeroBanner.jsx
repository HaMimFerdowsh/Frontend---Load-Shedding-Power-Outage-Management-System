import React, { useContext } from 'react';
import { Link } from 'react-router';
import { AuthContext } from '../context/AuthProvider';

const HeroBanner = () => {
    const { authUser } = useContext(AuthContext);

    return (
        <div
            className="hero min-h-screen"
            style={{
                backgroundImage:
                    "url(https://images.unsplash.com/photo-1640238489584-621fcee3f155?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D)",
            }}
        >
            <div className="hero-overlay"></div>
            <div className="hero-content text-neutral-content text-center">
                <div className="max-w-md">
                    <h1 className="mb-4 text-3xl md:text-5xl font-bold">
                        Stay Ahead of Power Cuts
                    </h1>

                    <p className="mb-6 text-base md:text-lg">
                        Check load shedding schedules for your area and report power outages
                        quickly, all in one place.
                    </p>

                    <div className="mt-6 flex flex-row justify-center items-center gap-6">
                        {!authUser && (
                            <>
                                <Link to="/signup" className="btn btn-primary mx-2">
                                    Get Started
                                </Link>

                                <Link to="/login" className="btn btn-outline text-white mx-2">
                                    Login
                                </Link>
                            </>
                        )}

                        {authUser?.role === 'user' && (
                            <>
                                <Link to="/schedules" className="btn btn-primary">
                                    View Schedules
                                </Link>
                                <Link to="/outages/report" className="btn btn-outline text-white">
                                    Report Outage
                                </Link>
                            </>
                        )}

                        {authUser?.role === 'admin' && (
                            <Link to="/admin/manage-area" className="btn btn-primary">
                                Go to Admin Panel
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroBanner;