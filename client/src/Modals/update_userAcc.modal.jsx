import React from "react";
import "../Modalscss/update_userAcc_modal.css";


function UpdateAccountModal({ show, onClose, onSave, initialData }) {
    const [formData, setFormData] = React.useState({ name: '', email: '', password: '', confirmPassword: '', role: 'staff' });

    React.useEffect(() => {
        if (show && initialData) {
            setFormData({
                name: initialData.name || '',
                email: initialData.email || '',
                password: '',
                confirmPassword: '',
                role: initialData.role || 'staff'
            });
        }
    }, [show, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.role) {
            return;
        }
        if (formData.password && formData.password !== formData.confirmPassword) {
            return;
        }
        await onSave({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            password: formData.password || undefined
        });
    };

    return (
        <div className={(show ? "update-acc-modal modal-visible" : "update-acc-modal modal-hidden")} id="modal">
            <div className="update-acc-container">
                <div className="update-acc-form-card">
                    <div className="update-acc-modal-header">
                        <h2 className="update-acc-modal-title">Update Account</h2>
                        <button className="update-acc-modal-close" type="button" onClick={onClose}>×</button>
                    </div>
                    <div className="update-acc-modal-body">
                        <form onSubmit={handleSubmit}>
                            <div className="update-acc-form-group">
                                <label>Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. John Doe" required />
                            </div>
                            <div className="update-acc-form-group">
                                <label>Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="e.g. example@email.com" required />
                            </div>
                            <div className="update-acc-form-group">
                                <label>Password</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Leave blank to keep current password" />
                            </div>
                            <div className="update-acc-form-group">
                                <label>Confirm Password</label>
                                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat password" />
                            </div>
                            <div className="update-acc-form-group">
                                <label>Role</label>
                                <select name="role" value={formData.role} onChange={handleChange} required>
                                    <option value="">-- choose --</option>
                                    <option value="admin">Admin</option>
                                    <option value="staff">Staff</option>
                                </select>
                            </div>
                            <div className="update-acc-modal-footer">
                                <button type="button" className="update-acc-btn-cancel" onClick={onClose}>Cancel</button>
                                <button type="submit" className="update-acc-btn-save">Update Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UpdateAccountModal;