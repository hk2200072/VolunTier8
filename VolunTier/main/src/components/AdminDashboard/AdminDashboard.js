import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [events, setEvents] = useState([]);
    const [applications, setApplications] = useState([]);
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        date: '',
        location: '',
        maxApplicants: ''
    });

    useEffect(() => {
        fetchEvents();
        fetchApplications();
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

    const fetchApplications = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/applications', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setApplications(data);
        } catch (error) {
            console.error('Error fetching applications:', error);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newEvent)
            });
            if (response.ok) {
                setNewEvent({
                    title: '',
                    description: '',
                    date: '',
                    location: '',
                    maxApplicants: ''
                });
                fetchEvents();
            }
        } catch (error) {
            console.error('Error creating event:', error);
        }
    };

    const handleApplicationStatus = async (applicationId, status) => {
        try {
            const response = await fetch(`http://localhost:5000/api/applications/${applicationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                fetchApplications();
            }
        } catch (error) {
            console.error('Error updating application:', error);
        }
    };

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            
            <section className="create-event-section">
                <h2>Create New Event</h2>
                <form onSubmit={handleCreateEvent} className="event-form">
                    <input
                        type="text"
                        placeholder="Event Title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                        required
                    />
                    <textarea
                        placeholder="Event Description"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                        required
                    />
                    <input
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Location"
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                        required
                    />
                    <input
                        type="number"
                        placeholder="Maximum Applicants"
                        value={newEvent.maxApplicants}
                        onChange={(e) => setNewEvent({...newEvent, maxApplicants: e.target.value})}
                        required
                    />
                    <button type="submit">Create Event</button>
                </form>
            </section>

            <section className="applications-section">
                <h2>Applications</h2>
                <div className="applications-list">
                    {applications.map(application => (
                        <div key={application.id} className="application-item">
                            <div className="application-info">
                                <h3>Application #{application.id}</h3>
                                <p>Event: {events.find(e => e.id === application.eventId)?.title}</p>
                                <p>Status: {application.status}</p>
                            </div>
                            <div className="application-actions">
                                <button 
                                    onClick={() => handleApplicationStatus(application.id, 'approved')}
                                    className="approve-btn"
                                >
                                    Approve
                                </button>
                                <button 
                                    onClick={() => handleApplicationStatus(application.id, 'rejected')}
                                    className="reject-btn"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default AdminDashboard;
