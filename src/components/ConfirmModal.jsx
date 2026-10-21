import React from 'react';

const ConfirmModal = ({
    open,
    title = 'Are you sure?',
    message,
    confirmText = 'Confirm',
    loading = false,
    onConfirm,
    onCancel,
}) => {
    if (!open) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="py-4">{message}</p>
                <div className="modal-action">
                    <button className="btn" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
                    <button className="btn btn-error" onClick={onConfirm} disabled={loading}>
                        {loading ? <span className="loading loading-spinner loading-sm"></span> : confirmText}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={loading ? undefined : onCancel}></div>
        </div>
    );
};

export default ConfirmModal;