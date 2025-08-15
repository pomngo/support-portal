import React from 'react';
import './ServiceRequest.css';

const ServiceRequest = () => {
  return (
    <div className="service-request">
      <div className="service-request-content">
        <h1>Service Request</h1>
        <p className="subtitle">Submit and track your service requests</p>
        
        <div className="service-request-form">
          <div className="form-group">
            <label htmlFor="requestType">Request Type</label>
            <select id="requestType" className="form-control">
              <option value="">Select request type</option>
              <option value="technical">Technical Support</option>
              <option value="billing">Billing Issue</option>
              <option value="feature">Feature Request</option>
              <option value="bug">Bug Report</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select id="priority" className="form-control">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input type="text" id="subject" className="form-control" placeholder="Brief description of your request" />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" className="form-control" rows="5" placeholder="Detailed description of your request"></textarea>
          </div>
          
          <button className="submit-btn">Submit Request</button>
        </div>
      </div>
    </div>
  );
};

export default ServiceRequest;

