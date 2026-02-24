import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ onLogout, onImagesUpdated, onShowAllImages }) => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };


  return (
    <>
      <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {isOpen ? '☰' : '→'}
        </button>

        <div className="sidebar-header">
          {isOpen && <h2> Image Gallery</h2>}
        </div>

        <div className="sidebar-content">
          {/* <div className="sidebar-section-title">Navigation</div> */}
          <button className="sidebar-btn" onClick={onShowAllImages} title="View All Images">
            <span className="btn-icon">🖼️</span>
            {isOpen && <span>All Images</span>}
          </button>
        </div>

        
      </div>

      {/* Gallery view moved to Dashboard for full table, filters and pagination */}

      {/* Modal handled by Dashboard now */}
    </>
  );
};

export default Sidebar;
