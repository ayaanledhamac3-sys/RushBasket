import React, { useState, useRef } from "react";
import axios from "axios";
import { FiUpload, FiX, FiSave } from "react-icons/fi";
import { addItemPageStyles as styles } from "../assets/adminStyles";
import { API_BASE } from "../apiConfig";

const initialFormState = {
  name: "",
  description: "",
  category: "",
  oldPrice: "",
  price: "",
  image: null,
  preview: "",
};

const categories = [
  "Fruits",
  "Vegetables",
  "Dairy",
  "Beverages",
  "Snacks",
  "Seafood",
  "Bakery",
  "Meat",
];

export default function AddItemPage() {
  const [formData, setFormData] = useState(initialFormState);
  const fileInputRef = useRef();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData((f) => ({
      ...f,
      image: file,
      preview: URL.createObjectURL(file),
    }));
  };

  const removeImage = () => {
    setFormData((f) => ({ ...f, image: null, preview: "" }));
    fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = new FormData();
      body.append("name", formData.name);
      body.append("description", formData.description);
      body.append("category", formData.category);
      body.append("oldPrice", formData.oldPrice);
      body.append("price", formData.price);
      if (formData.image) {
        body.append("image", formData.image);
      }

      const res = await axios.post(`${API_BASE}/api/items`, body, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Created", res.data);
      alert("Product added!");

      // Reset form
      setFormData(initialFormState);
      fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  const { name, description, category, oldPrice, price, preview } = formData;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.innerContainer}>
        <h1 className={styles.heading}>Add New Product</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Name & Category */}
          <div className={styles.gridContainer}>
            <div>
              <label className={styles.label}>Product Name *</label>
              <input
                type="text"
                name="name"
                value={name}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>
            <div>
              <label className={styles.label}>Category *</label>
              <select
                name="category"
                value={category}
                onChange={handleChange}
                required
                className={styles.input}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={styles.label}>Description</label>
            <textarea
              name="description"
              value={description}
              onChange={handleChange}
              rows="3"
              className={styles.textarea}
            />
          </div>

          {/* Prices */}
          <div className={styles.priceGrid}>
            <div>
              <label className={styles.label}>Original Price ($) *</label>
              <input
                type="number"
                name="oldPrice"
                value={oldPrice}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>
            <div>
              <label className={styles.label}>Selling Price ($) *</label>
              <input
                type="number"
                name="price"
                value={price}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className={styles.label}>Product Image</label>
            <div
              onClick={() => fileInputRef.current.click()}
              className={styles.imageUploadContainer}
            >
              {preview ? (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className={styles.previewImage}
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className={styles.removeButton}
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <FiUpload className={styles.uploadIcon} />
                  <p className={styles.uploadText}>
                    Click to upload image (max 5 MB)
                  </p>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className={styles.hiddenInput}
              />
            </div>
          </div>

          <button type="submit" className={styles.submitButton}>
            <FiSave className="mr-2" />
            Add Product
          </button>
        </form>
      </div>
    </div>
  );
}
