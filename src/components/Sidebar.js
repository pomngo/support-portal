import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {

  const mainNavItems = [
    { name: 'Home', path: '/' },
    { name: 'Service Request', path: '/service-request' },
    { name: 'Documents', path: '/documents' },
    { name: "What's App", path: '/whatsapp' },
    { name: 'Activities', path: '/activities' },
    { name: 'Flock', path: '/flock' },
    { name: 'Deals', path: '/deals' }
  ];

  const bottomNavItems = [
    { name: 'Settings', path: '/settings' },
    { name: 'Logout', path: '/logout' }
  ];

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
      </div>
      <ul className="nav-list">
        {mainNavItems.map((item) => (
          <li key={item.name} className="nav-item">
            <NavLink
              to={item.path}
              className={({ isActive }) => 
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-text">{item.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      
      <div className="sidebar-bottom">
        <ul className="nav-list">
          {bottomNavItems.map((item) => (
            <li key={item.name} className="nav-item">
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <span className="nav-text">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;
