// src/pages/admin/OrdersPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCheck, FiX, FiTruck, FiPackage, FiCreditCard, FiUser, FiMapPin, FiPhone, FiMail, FiEdit } from 'react-icons/fi';
import { ordersPageStyles as styles } from '../assets/adminStyles';
import { API_BASE } from '../apiConfig';
import { BsCurrencyRupee } from "react-icons/bs";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, _setSearchTerm] = useState('');
  const [statusFilter, _setStatusFilter] = useState('All');
  const [paymentFilter, _setPaymentFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const statusOptions = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  const fetchOrders = async () => {
    try {
      const { data: raw } = await axios.get(`${API_BASE}/api/orders`);
      const data = (raw || []).map(d => ({
        ...d,
        customer: d.customer || { name: '—', phone: '', email: '', address: '' },
        items: Array.isArray(d.items) ? d.items : []
      }));
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let result = [...orders];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order =>
        ((order.orderId || order._id || order.id || '').toString().toLowerCase().includes(term)) ||
        (order.customer?.name && order.customer.name.toLowerCase().includes(term)) ||
        (order.customer?.phone || '').includes(term) ||
        (order.customer?.email && order.customer.email.toLowerCase().includes(term)))
    }

    if (statusFilter !== 'All') {
      result = result.filter(order => order.status === statusFilter);
    }

    if (paymentFilter !== 'All') {
      result = result.filter(order => order.paymentStatus === paymentFilter);
    }

    setFilteredOrders(result);
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_BASE}/api/orders/${orderId}`, { status: newStatus });
      setOrders(prev =>
        prev.map(order =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );

      setFilteredOrders(prev =>
        prev.map(o =>
          o._id === orderId ? { ...o, status: newStatus } : o
        )
      );
    }
    catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const cancelOrder = (orderId) => {
    updateOrderStatus(orderId, 'Cancelled');
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const closeModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.innerContainer}>
        {/* Header */}
        <div className={styles.headerContainer}>
          <h1 className={styles.headerTitle}>Order Management</h1>
          <p className={styles.headerSubtitle}>
            View, manage, and track customer orders
          </p>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statsCard('border-blue-500')}>
            <div className={styles.statsCardInner}>
              <div className={styles.statsCardIconContainer('bg-blue-100')}>
                <FiPackage className={styles.statsCardIcon('text-blue-600')} />
              </div>
              <div>
                <p className={styles.statsCardLabel}>Total Orders</p>
                <p className={styles.statsCardValue}>{orders.length}</p>
              </div>
            </div>
          </div>

          <div className={styles.statsCard('border-amber-500')}>
            <div className={styles.statsCardInner}>
              <div className={styles.statsCardIconContainer('bg-amber-100')}>
                <FiTruck className={styles.statsCardIcon('text-amber-600')} />
              </div>
              <div>
                <p className={styles.statsCardLabel}>Processing</p>
                <p className={styles.statsCardValue}>
                  {orders.filter(o => o.status === 'Processing').length}
                </p>
              </div>
            </div>
          </div>

          <div className={styles.statsCard('border-emerald-500')}>
            <div className={styles.statsCardInner}>
              <div className={styles.statsCardIconContainer('bg-emerald-100')}>
                <FiCheck className={styles.statsCardIcon('text-emerald-600')} />
              </div>
              <div>
                <p className={styles.statsCardLabel}>Delivered</p>
                <p className={styles.statsCardValue}>
                  {orders.filter(o => o.status === 'Delivered').length}
                </p>
              </div>
            </div>
          </div>

          <div className={styles.statsCard('border-red-500')}>
            <div className={styles.statsCardInner}>
              <div className={styles.statsCardIconContainer('bg-red-100')}>
                <BsCurrencyRupee className={styles.statsCardIcon('text-red-600')} />
              </div>
              <div>
                <p className={styles.statsCardLabel}>Pending Payment</p>
                <p className={styles.statsCardValue}>
                  {orders.filter(o => o.paymentStatus === 'Unpaid').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className={styles.contentContainer}>
          <div className="overflow-x-auto">
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th className={styles.tableHeaderCell}>Order ID</th>
                  <th className={styles.tableHeaderCell}>Customer</th>
                  <th className={styles.tableHeaderCell}>Date</th>
                  <th className={styles.tableHeaderCell}>Items</th>
                  <th className={styles.tableHeaderCell}>Total</th>
                  <th className={styles.tableHeaderCell}>Status</th>
                  <th className={styles.tableHeaderCell}>Payment</th>
                  <th className={styles.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className={styles.emptyStateCell}>
                      <div className={styles.emptyStateContainer}>
                        <FiPackage className={styles.emptyStateIcon} />
                        <h3 className={styles.emptyStateTitle}>No orders found</h3>
                        <p className={styles.emptyStateText}>Try changing your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order._id} className={styles.tableRowHover}>
                      <td className={`${styles.tableDataCell} ${styles.orderId}`}>
                        {order.orderId}
                      </td>
                      <td className={styles.tableDataCell}>
                        <div className="font-medium">{order.customer?.name || '—'}</div>
                        <div className="text-sm text-gray-500">{order.customer?.phone || '—'}</div>
                      </td>
                      <td className={`${styles.tableDataCell} text-sm text-gray-500`}>
                        {order.date}
                      </td>
                      <td className={`${styles.tableDataCell} text-sm text-gray-500`}>
                        {order.items.length} items
                      </td>
                      <td className={`${styles.tableDataCell} font-medium`}>
                        ${order.total.toFixed(2)}
                      </td>
                      <td className={styles.tableDataCell}>
                        <span className={styles.statusBadge(order.status)}>
                          {order.status}
                        </span>
                      </td>
                      <td className={styles.tableDataCell}>
                        <span className={styles.paymentBadge(order.paymentStatus)}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className={styles.tableDataCell}>
                        <div className={styles.actionButtons}>
                          <button
                            onClick={() => viewOrderDetails(order)}
                            className={styles.viewButton}
                          >
                            View
                          </button>
                          <button
                            onClick={() => cancelOrder(order._id)}
                            className={styles.cancelButton(order.status === 'Cancelled' || order.status === 'Delivered')}
                            disabled={order.status === 'Cancelled' || order.status === 'Delivered'}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {isDetailModalOpen && selectedOrder && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div className="flex justify-between items-center">
                <h2 className={styles.modalHeaderTitle}>
                  Order Details: {selectedOrder._id}
                </h2>
                <button
                  onClick={closeModal}
                  className={styles.modalHeaderClose}
                >
                  <FiX size={24} />
                </button>
              </div>
              <p className="text-gray-600 mt-1">
                Ordered on {selectedOrder.date} 
              </p>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              <div className={styles.modalGrid}>
                {/* Left Column */}
                <div>
                  {/* Customer Info */}
                  <div className={styles.modalSection}>
                    <h3 className={styles.modalSectionTitle}>
                      <FiUser className={styles.modalIcon} />
                      Customer Information
                    </h3>
                    <div className={styles.modalInfoBox}>
                      <div className="mb-3">
                        <div className="font-medium">{selectedOrder.customer?.name || '—'}</div>
                        <div className="text-gray-600 flex items-center mt-1">
                          <FiMail className="mr-2 flex-shrink-0" />
                          {selectedOrder.customer?.email || 'No email provided'}
                        </div>
                        <div className="text-gray-600 flex items-center mt-1">
                          <FiPhone className="mr-2 flex-shrink-0" />
                          {selectedOrder.customer?.phone || '—'}
                        </div>
                      </div>
                      <div className="flex items-start mt-3">
                        <FiMapPin className="text-gray-500 mr-2 mt-1 flex-shrink-0" />
                        <div className="text-gray-600">{selectedOrder.customer?.address || '—'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Order Notes */}
                  {selectedOrder.notes && (
                    <div className={styles.modalSection}>
                      <h3 className={styles.modalSectionTitle}>
                        <FiEdit className={styles.modalIcon} />
                        Delivery Notes
                      </h3>
                      <div className={styles.modalNoteBox}>
                        <p className="text-gray-700">{selectedOrder.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Status Controls */}
                  <div className={styles.modalSection}>
                    <h3 className={styles.modalSectionTitle}>
                      Update Order Status
                    </h3>
                    <div className={styles.modalStatusControl}>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Order Status
                        </label>
                        <select
                          value={selectedOrder.status}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            setSelectedOrder({ ...selectedOrder, status: newStatus });
                            updateOrderStatus(selectedOrder._id, newStatus);
                          }}
                          className={styles.modalSelect}
                        >
                          {statusOptions.filter(o => o !== 'All').map(option => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  {/* Order Summary */}
                  <div className={styles.modalSection}>
                    <h3 className={styles.modalSectionTitle}>
                      <FiPackage className={styles.modalIcon} />
                      Order Summary
                    </h3>
                    <div className={styles.modalOrderSummary}>
                      {selectedOrder.items?.map((item, index) => (
                        <div
                          key={item?._id || index}
                          className={styles.modalOrderItem(index, selectedOrder.items.length)}
                        >
                          {item?.imageUrl ? (
                            <img
                              src={`${API_BASE}${item.imageUrl}`}
                              alt={item?.name || ''}
                              className={styles.modalOrderImage}
                            />
                          ) : (
                            <div className={styles.modalPlaceholderImage} />
                          )}
                          <div className="flex-grow">
                            <div className="font-medium">{item?.name || '—'}</div>
                            <div className="text-gray-600">${(item?.price || 0).toFixed(2)} × {item?.quantity || 0}</div>
                          </div>
                          <div className="font-medium">
                            ${((item?.price || 0) * (item?.quantity || 0)).toFixed(2)}
                          </div>
                        </div>
                      ))}

                      {/* Order Totals */}
                      <div className={styles.modalOrderTotalSection}>
                        <div className={styles.modalOrderTotalRow}>
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">${selectedOrder.total.toFixed(2)}</span>
                        </div>
                        <div className={styles.modalOrderTotalRow}>
                          <span className="text-gray-600">Shipping</span>
                          <span className="font-medium text-emerald-600">Free</span>
                        </div>
                        <div className={styles.modalOrderTotalRow}>
                          <span className="text-gray-600">Tax (5%)</span>
                          <span className="font-medium">${(selectedOrder.total * 0.05).toFixed(2)}</span>
                        </div>
                        <div className={styles.modalOrderTotalRowLast}>
                          <span className="text-lg font-bold">Total</span>
                          <span className="text-lg font-bold text-emerald-700">
                            ${(selectedOrder.total * 1.05).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div>
                    <h3 className={styles.modalSectionTitle}>
                      <FiCreditCard className={styles.modalIcon} />
                      Payment Information
                    </h3>
                    <div className={styles.modalInfoBox}>
                      <div className="flex justify-between mb-3">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-medium">{selectedOrder.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Status:</span>
                        <span className={styles.paymentBadge(selectedOrder.paymentStatus)}>
                          {selectedOrder.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className={styles.modalFooterButton}
                >
                  Close
                </button>
                <button
                  onClick={closeModal}
                  className={styles.modalFooterPrimaryButton}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;