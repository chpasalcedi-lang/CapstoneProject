import React from "react";
import "../Modalscss/add_acc_modal.css";


function AddAccountModal({ show, onClose }) {
 
    return (
        <div className={(show ? "add-acc-modal modal-visible" : "add-acc-modal modal-hidden")} id="modal">
            <div className="add-acc-container">
                <div className="add-acc-form-card">
                    <div className="add-acc-modal-header">
                        <h2 className="add-acc-modal-title">Add Account</h2>
                        <button className="add-acc-modal-close" onClick={onClose}>×</button>
                    </div>
                    <div className="add-acc-modal-body">
                    <form>
                        <div className="add-acc-form-group">
                            <label>Name</label>
                            <input type="text" name="name"  placeholder="e.g. John Doe" />
                        </div>
                        <div className="add-acc-form-group">
                            <label>Email</label>
                            <input type="email" name="email"  placeholder="e.g. example@email.com" />
                        </div>
                        <div className="add-acc-form-group">
                            <label>Password</label>
                            <input type="password" name="password"  placeholder="e.g. ********" />
                        </div>
                        <div className="add-acc-form-group">
                            <label>Role</label>
                            <select name="role" required>
                                <option value="">-- choose --</option>
                                <option value="admin">Admin</option>
                                <option value="staff">Staff</option>
                            </select>
                        </div>
                        
                    </form>
                    </div>
                    <div className="add-acc-modal-footer">
                        <button type="button" className="add-acc-btn-cancel">Cancel</button>
                        <button type="submit" className="add-acc-btn-save">Save Account</button>
                    </div>
                 </div>
                </div>
            </div>
    );
}

export default AddAccountModal;