import React, { useState, useEffect } from 'react';
import './UserDashboard.css';

const UserDashboard = () => {
    const [events, setEvents] = useState([]);
    const [myApplications, setMyApplications] = useState([]);

    useEffect(() => {
        fetchEvents();
        fetchMyApplications();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/events', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setEvents(data);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const fetchMyApplications = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/applications/my', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setMyApplications(data);
        } catch (error) {
            console.error('Error fetching applications:', error);
        }
    };

    const handleApply = async (eventId) => {
        try {
            const response = await fetch('http://localhost:5000/api/applications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ eventId })
            });
            if (response.ok) {
                fetchMyApplications();
            }
        } catch (error) {
            console.error('Error applying to event:', error);
        }
    };

    const isApplied = (eventId) => {
        return myApplications.some(app => app.eventId === eventId);
    };

    const getApplicationStatus = (eventId) => {
        const application = myApplications.find(app => app.eventId === eventId);
        return application ? application.status : null;
    };

    return (
        <div className="user-dashboard">
            <h1>Available Volunteering Events</h1>
            
            <div className="events-grid">
                {events.map(event => {
                    const applied = isApplied(event.id);
                    const status = getApplicationStatus(event.id);
                    
                    return (
                        <div key={event.id} className="event-card">
                            <h2>{event.title}</h2>
                            <p className="description">{event.description}</p>
                            <div className="event-details">
                                <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                                <p><strong>Location:</strong> {event.location}</p>
                                <p><strong>Spots Available:</strong> {event.maxApplicants - event.currentApplicants}</p>
                            </div>
                            <div className="event-status">
                                {applied ? (
                                    <div className={`status-badge ${status}`}>
                                        Status: {status}
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleApply(event.id)}
                                        disabled={event.currentApplicants >= event.maxApplicants}
                                        className="apply-button"
                                    >
                                        {event.currentApplicants >= event.maxApplicants ? 'Full' : 'Apply'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UserDashboard;
