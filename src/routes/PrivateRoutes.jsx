import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthProvider';
import { Navigate } from 'react-router';

const PrivateRoutes = ({ children }) => {

    const { authUser, loading } = useContext(AuthContext);

    if (loading) return <p>Loading.....</p>

    if (!authUser) {
        return <Navigate to={"/login"}></Navigate>
    }
    return children
};

export default PrivateRoutes;