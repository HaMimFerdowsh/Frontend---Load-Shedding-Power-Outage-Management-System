import React from 'react';

const colors = {
    scheduled: 'badge-info',
    ongoing: 'badge-warning',
    completed: 'badge-success',
    cancelled: 'badge-error',

    reported: 'badge-info',
    investigating: 'badge-warning',
    resolved: 'badge-success',
    rejected: 'badge-error',
};

const StatusBadge = ({ status }) => {
    return (
        <span className={`badge ${colors[status] || 'badge-ghost'} capitalize`}>
            {status}
        </span>
    );
};

export default StatusBadge;