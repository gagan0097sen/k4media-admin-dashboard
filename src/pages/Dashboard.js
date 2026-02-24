import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { imageService } from '../services/api';
import Swal from 'sweetalert2';
import './Dashboard.css';

const Dashboard = () => {
  const { admin, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [searchTitle, setSearchTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', image: null });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    let list = Array.isArray(images) ? images.slice() : [];
    if (searchTitle) {
      list = list.filter((img) => img.title && img.title.toLowerCase().includes(searchTitle.toLowerCase()));
    }
    if (sortBy === 'oldest') list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sortBy === 'title') list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    else list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setFilteredImages(list);
    setPage(1);
  }, [images, searchTitle, sortBy]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await imageService.getMyImages();
      setImages(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch images');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', image: null, imageUrl: null });
    setShowModal(true);
  };

  const openEditModal = (imageId) => {
    const imageToEdit = images.find(img => img._id === imageId);
    if (!imageToEdit) return;
    setEditingId(imageId);
    setFormData({ title: imageToEdit.title || '', description: imageToEdit.description || '', image: null, imageUrl: imageToEdit.imageUrl || imageToEdit.image || imageToEdit.image_url || imageToEdit.url || '' });
    setShowModal(true);
  };

  const deleteImage = async (imageId) => {
    const result = await Swal.fire({
      title: 'Delete Image?',
      text: 'Are you sure you want to delete this image?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it',
    });

    if (result.isConfirmed) {
      try {
        await imageService.deleteImage(imageId);
        await fetchImages();
        Swal.fire('Deleted!', 'Image has been deleted.', 'success');
      } catch (err) {
        Swal.fire({ title: 'Error', text: 'Failed to delete image', icon: 'error' });
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file' && files[0]) {
      // Create preview URL for selected image
      const previewUrl = URL.createObjectURL(files[0]);
      setFormData((prev) => ({ 
        ...prev, 
        [name]: files[0],
        imageUrl: previewUrl  // Update preview immediately
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: type === 'file' ? files[0] : value }));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ title: '', description: '', image: null, imageUrl: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || formData.title.trim() === '') {
      Swal.fire('Error', 'Please enter image title', 'error');
      return;
    }
    
    try {
      setLoading(true);
      if (editingId) {
        // EDIT MODE
        const updateData = new FormData();
        updateData.append('title', formData.title.trim());
        updateData.append('description', formData.description.trim());
        if (formData.image) {
          updateData.append('image', formData.image);
        }
        
        console.log('Updating image:',editingId,formData);
        const response = await imageService.updateImage(editingId, updateData);
        console.log('Update response:', response);
        
        // Check if response indicates success
        if (response?.data?.success === true) {
          setLoading(false);
          Swal.fire('Success!', 'Image updated successfully', 'success');
          await fetchImages();
          closeModal();
        } else {
          throw new Error(response?.data?.message || response?.data?.error || 'Update failed');
        }
      } else {
        // CREATE MODE
        if (!formData.image) {
          Swal.fire('Error', 'Please select an image', 'error');
          setLoading(false);
          return;
        }
        const uploadFormData = new FormData();
        uploadFormData.append('title', formData.title.trim());
        uploadFormData.append('description', formData.description.trim());
        uploadFormData.append('image', formData.image);
        
        console.log('Uploading new image');
        const response = await imageService.uploadImage(uploadFormData);
        console.log('Upload response:', response);
        
        if (response?.data?.success === true) {
          setLoading(false);
          Swal.fire('Success!', 'Image uploaded successfully', 'success');
          await fetchImages();
          closeModal();
        } else {
          throw new Error(response?.data?.message || response?.data?.error || 'Upload failed');
        }
      }
    } catch (err) {
      console.error('Submit error details:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || (editingId ? 'Failed to update image' : 'Failed to upload image');
      Swal.fire('Error', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Pagination helpers
  const totalPages = Math.max(1, Math.ceil(filteredImages.length / pageSize));
  const pagedImages = filteredImages.slice((page - 1) * pageSize, page * pageSize);
  const gotoPage = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, logout',
    });

    if (result.isConfirmed) {
      logout();
      Swal.fire('Logged out!', 'You have been logged out.', 'success');
      navigate('/login');
    }
  };

  const showAllImages = () => {
    const el = document.querySelector('.images-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="dashboard-container">
      <Sidebar onImagesUpdated={(imgs) => setImages(imgs)} onShowAllImages={showAllImages} />

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>Welcome to Image Gallery</h1>
            <div className="header-right">
              <div className="user-info">
                <span className="user-name">{admin?.name}</span>
                {/* <span className="user-email">{admin?.email}</span> */}
              </div>
              <button className="logout-header-btn" onClick={handleLogout} title="Logout">
                🚪 Logout
              </button>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="images-section">
            <div className="images-header">
              <h3>All Images</h3>
              <div className="images-actions">
                <button className="btn-add" onClick={openModal}>➕ Add New Image</button>
              </div>
            </div>

            <div className="filters-row">
              <div className="search-box">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by title..."
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                />
              </div>
              <div className="sort-box">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="title">Title</option>
                </select>
              </div>
            </div>

            {loading && filteredImages.length === 0 ? (
              <p className="loading-text">Loading images...</p>
            ) : filteredImages.length === 0 ? (
              <p className="no-images">
                {images.length === 0
                  ? 'No images yet. Add one to get started!'
                  : 'No images found matching your search.'}
              </p>
            ) : (
              <div className="images-table-container">
                <table className="images-table">
                  <thead>
                    <tr>
                      <th>Sno</th>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Image</th>
                      <th>Likes ❤️</th>
                      <th>Unlikes 💔</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedImages.map((img) => (
                      <tr key={img._id}>
                        <td className="sno-cell">{images.indexOf(img) + 1}.</td>
                        <td className="title-cell">{img.title}</td>
                        <td className="description-cell">{img.description}</td>
                        <td className="image-cell">
                          <img src={img.imageUrl || img.image || img.image_url || img.url} alt={img.title} className="image-preview" onError={(e)=>{e.target.src='https://via.placeholder.com/100?text=Image'}} />
                        </td>
                        <td className="likes-cell">
                          <span className="like-badge">{img.likeCount || 0}</span>
                        </td>
                        <td className="unlikes-cell">
                          <span className="unlike-badge">{img.unlikeCount || 0}</span>
                        </td>
                        <td className="actions-cell">
                          <button className="action-btn edit-btn" onClick={() => openEditModal(img._id)} title="Edit">✏️</button>
                          <button className="action-btn delete-btn" onClick={() => deleteImage(img._id)} title="Delete">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="pagination">
                  <button onClick={() => gotoPage(page - 1)} disabled={page === 1}>Prev</button>
                  <span>Page {page} / {totalPages}</span>
                  <button onClick={() => gotoPage(page + 1)} disabled={page === totalPages}>Next</button>
                </div>
              </div>
            )}
                      </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? '✏️ Edit Image' : '➕ Add New Image'}</h2>
                <button className="modal-close" onClick={closeModal}>✕</button>
              </div>

              <form onSubmit={handleSubmit} className="image-form">
                <div className="form-group">
                  <label htmlFor="title">Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="Enter image title"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Enter image description"
                    rows="3"
                  ></textarea>
                </div>

                {/* Image Preview Section */}
                {formData.imageUrl && (
                  <div className="form-group">
                    <label>
                      {editingId && !formData.image ? 'Current Image' : 'Image Preview'}
                    </label>
                    <div className="image-preview-container">
                      <img 
                        src={formData.imageUrl} 
                        alt="Preview" 
                        className="edit-image-preview"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Image'; }}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="image">Image {editingId ? '(Optional - leave empty to keep current)' : '*'}</label>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    onChange={handleFormChange}
                    accept="image/*"
                    required={!editingId}
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={closeModal} disabled={loading}>Cancel</button>
                  <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Processing...' : editingId ? 'Update' : 'Upload'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
