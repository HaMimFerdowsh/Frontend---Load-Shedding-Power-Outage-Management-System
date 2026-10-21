import React from 'react';

const Pagination = ({ page, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    return (
        <div className="join flex justify-center">
            <button className="join-item btn btn-sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
                «
            </button>

            {start > 1 && (
                <>
                    <button className="join-item btn btn-sm" onClick={() => onPageChange(1)}>1</button>
                    {start > 2 && <button className="join-item btn btn-sm btn-disabled">...</button>}
                </>
            )}

            {pages.map((p) => (
                <button
                    key={p}
                    className={`join-item btn btn-sm ${p === page ? 'btn-active btn-primary' : ''}`}
                    onClick={() => onPageChange(p)}
                >
                    {p}
                </button>
            ))}

            {end < totalPages && (
                <>
                    {end < totalPages - 1 && <button className="join-item btn btn-sm btn-disabled">...</button>}
                    <button className="join-item btn btn-sm" onClick={() => onPageChange(totalPages)}>
                        {totalPages}
                    </button>
                </>
            )}

            <button className="join-item btn btn-sm" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
                »
            </button>
        </div>
    );
};

export default Pagination;