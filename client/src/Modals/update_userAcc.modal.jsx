import React from "react";
import "../Modalscss/update_userAcc_modal.css";


function UpdateAccountModal({ show, onClose }) {
 
    return (
        <div className={(show ? "update-acc-modal modal-visible" : "update-acc-modal modal-hidden")} id="modal">
            <div className="update-acc-container">
                <div className="update-acc-form-card">
                    <div className="update-acc-modal-header">
                        <h2 className="update-acc-modal-title">Update Account</h2>
                        <button className="update-acc-modal-close" onClick={onClose}>×</button>
                    </div>
                    <div className="update-acc-modal-body">
                    <form>
                        <div className="update-acc-form-group">
                            <label>Name</label>
                            <input type="text" name="name"  placeholder="e.g. John Doe" />
                        </div>
                        <div className="update-acc-form-group">
                            <label>Email</label>
                            <input type="email" name="email"  placeholder="e.g. example@email.com" />
                        </div>
                        <div className="update-acc-form-group">
                            <label>Password</label>
                            <input type="password" name="password"  placeholder="e.g. ********" />
                        </div>
                        <div className="update-acc-form-group">
                            <label>Role</label>
                            <select name="role" required>
                                <option value="">-- choose --</option>
                                <option value="admin">Admin</option>
                                <option value="staff">Staff</option>
                            </select>
                        </div>
                        
                    </form>
                    </div>
                    <div className="update-acc-modal-footer">
                        <button type="button" className="update-acc-btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="update-acc-btn-save">Update Account</button>
                    </div>
                 </div>
                </div>
            </div>
    );
}

export default UpdateAccountModal;