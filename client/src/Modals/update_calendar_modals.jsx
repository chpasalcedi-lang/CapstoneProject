/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import "../Modalscss/update_calendar_modal.css";

function UpdateCalendarModal({ showModal, setShowModal, refreshData, calendarData }) {
    const [values, setValues] = useState({
        id: "",
        event_name: "",
        event_date: "",
        event_time: "",
        event_description: ""
    });
    const getInitialValues = (data) => ({
        id: data.id || "",
        event_name: data.event_name || "",  
        event_date: data.event_date || "",
        event_time: data.event_time || "",
        event_description: data.event_description || ""
    });

    useEffect(() => {
        if (calendarData) {
            setValues(getInitialValues(calendarData));
        }
    }, [calendarData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const updateData = {
            event_name: values.event_name,
            event_date: values.event_date,
            event_time: values.event_time,
            event_description: values.event_description
        };
        console.log("Sending update for calendar event:", values.id, updateData);   
        axios.post(`http://localhost:3000/update_calendar/${values.id}`, updateData)
            .then((res) => {
                console.log("Success: ", res.data);
                setShowModal(false);
                refreshData();
            })
            .catch((err) => {
                console.error("Error sa pag-save: ", err);
                Swal.fire({ icon: 'error', title: 'Error', text: 'May sala sa pag-save sang data!' });
            });
    };

    const closeModal = () => {
        setShowModal(false);
    }


    return (
        <div className={(showModal ? "update-calendar modal-visible" : "update-calendar modal-hidden")} id="modal">
            <div className="update-calendar-modal">
                <div className="update-calendar-modal-header">
                    <div>
                        <p className="update-calendar-modal-eyebrow">Update Record</p>
                        <h2 className="update-calendar-modal-title">Edit Calendar Event</h2>
                    </div>
                    <button className="update-calendar-modal-close" onClick={closeModal}>X</button>
                </div>
                <form className="update-calendar-modal-body" onSubmit={handleSubmit}>
                    <div className="update-calendar-form-row">
                        <p>closing resort</p>
                    </div>
                    <div className="update-calendar-form-row">
                        <label>Event Date close :</label>
                        <input
                            type="date"
                            name="event_date"
                            required
                            value={values.event_date}
                            onChange={handleChange}
                        />      
                    </div>
                    <div className="update-calendar-form-row">
                        <label>Event Date to Open:</label>
                        <input
                            type="date"
                            name="event_date"
                            required
                            value={values.event_date}
                            onChange={handleChange}
                        />    
                    </div>
                    <div className="update-calendar-form-row">
                        <label>Event Description:</label>
                        <textarea
                            name="event_description"
                            value={values.event_description}
                            onChange={handleChange}
                            placeholder="Additional details about the event"
                        />
                    </div>
                    <button type="submit" className="update-calendar-submit">Update Event</button>  
                </form>
            </div>
        </div>
    );
}
export default UpdateCalendarModal;
