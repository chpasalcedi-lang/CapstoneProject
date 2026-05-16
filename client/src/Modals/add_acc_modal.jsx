import React from "react";
import "../Modalscss/add_acc_modal.css";


function AddAccountModal({ show, onClose, onSave }) {
    const [formData, setFormData] = React.useState({ name: '', email: '', password: '', role: '' });

    React.useEffect(() => {
        if (show) {
            setFormData({ name: '', email: '', password: '', role: '' });
        }
    }, [show]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.password || !formData.role) {
            return;
        }
        await onSave(formData);
    };

    return (
        <div className={(show ? "add-acc-modal modal-visible" : "add-acc-modal modal-hidden")} id="modal">
            <div className="add-acc-container">
                <div className="add-acc-form-card">
                    <div className="add-acc-modal-header">
                        <h2 className="add-acc-modal-title">Add Account</h2>
                        <button className="add-acc-modal-close" type="button" onClick={onClose}>×</button>
                    </div>
                    <div className="add-acc-modal-body">
                        <form onSubmit={handleSubmit}>
                            <div className="add-acc-form-group">
                                <label>Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. John Doe" required />
                            </div>
                            <div className="add-acc-form-group">
                                <label>Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="e.g. example@email.com" required />
                            </div>
                            <div className="add-acc-form-group">
                                <label>Password</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="e.g. ********" required />
                            </div>
                            <div className="add-acc-form-group">
                                <label>Role</label>
                                <select name="role" value={formData.role} onChange={handleChange} required>
                                    <option value="">-- choose --</option>
                                    <option value="admin">Admin</option>
                                    <option value="staff">Staff</option>
                                </select>
                            </div>
                            <div className="add-acc-modal-footer">
                                <button type="button" className="add-acc-btn-cancel" onClick={onClose}>Cancel</button>
                                <button type="submit" className="add-acc-btn-save">Save Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddAccountModal;