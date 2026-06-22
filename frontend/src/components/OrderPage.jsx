import React, { useEffect, useState } from 'react';
import {
  FiX, FiTruck, FiPackage,
  FiCreditCard, FiUser, FiMapPin, FiPhone, FiMail, FiArrowLeft, FiSearch
} from 'react-icons/fi';
import { ordersPageStyles } from "../assets/dummyStyles.js";
import axios from 'axios';
import { API_BASE } from '../apiConfig';

const UserOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 1) Grab the logged‑in user email from localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const userEmail = userData.email || '';

  const fetchAndFilterOrders = async () => {
    try {
      // 2) Fetch ALL orders publicly
      const resp = await axios.get(`${API_BASE}/api/orders`);
      const allOrders = resp.data;

      // 3) Client‑side filter by customer.email
      const mine = allOrders.filter(o =>
        o.customer?.email?.toLowerCase() === userEmail.toLowerCase()
      );

      setOrders(mine);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  // fetch once on mount
  useEffect(() => {
    fetchAndFilterOrders();
  }, []);

  // search filtering
  useEffect(() => {
    setFilteredOrders(
      orders.filter(o =>
        o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.items.some(i =>
          i.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    );
  }, [orders, searchTerm]);

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };
  const closeModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
  };
  
  return (
    <div className={ordersPageStyles.page}>
      <div className={ordersPageStyles.container}>
        {/* Header */}
        <div className={ordersPageStyles.header}>
          <a href="#" className={ordersPageStyles.backLink}>
            <FiArrowLeft className="mr-2" /> Back to Account
          </a>
          <h1 className={ordersPageStyles.mainTitle}>
            My <span className={ordersPageStyles.titleSpan}>Orders</span>
          </h1>
          <p className={ordersPageStyles.subtitle}>
            View your order history and track current orders
          </p>
          <div className={ordersPageStyles.titleDivider}>
            <div className={ordersPageStyles.dividerLine}></div>
          </div>
        </div>

        {/* Search */}
        <div className={ordersPageStyles.searchContainer}>
          <div className={ordersPageStyles.searchForm}>
            <input
              type="text"
              placeholder="Search orders or products..."
              className={ordersPageStyles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className={ordersPageStyles.searchButton}>
              <FiSearch size={18} />
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className={ordersPageStyles.ordersTable}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={ordersPageStyles.tableHeader}>
                <tr>
                  <th className={ordersPageStyles.tableHeaderCell}>Order ID</th>
                  <th className={ordersPageStyles.tableHeaderCell}>Date</th>
                  <th className={ordersPageStyles.tableHeaderCell}>Items</th>
                  <th className={ordersPageStyles.tableHeaderCell}>Total</th>
                  <th className={ordersPageStyles.tableHeaderCell}>Status</th>
                  <th className={ordersPageStyles.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-700/50">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FiPackage className="text-emerald-400 text-4xl mb-4" />
                        <h3 className="text-lg font-medium text-emerald-100 mb-1">No orders found</h3>
                        <p className="text-emerald-300">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order._id} className={ordersPageStyles.tableRow}>
                      <td className={`${ordersPageStyles.tableCell} font-medium text-emerald-200`}>
                        {order.orderId}
                      </td>
                      <td className={`${ordersPageStyles.tableCell} text-sm`}>
                        {order.date}
                      </td>
                      <td className={ordersPageStyles.tableCell}>
                        <div className="text-emerald-100">
                          {order.items.length} items
                        </div>
                      
                      </td>
                      <td className={`${ordersPageStyles.tableCell} font-medium`}>
                        ${order.total.toFixed(2)}
                      </td>
                      <td className={ordersPageStyles.tableCell}>
                        <span className={`${ordersPageStyles.statusBadge} ${order.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-200' :
                          order.status === 'Processing' ? 'bg-amber-500/20 text-amber-200' :
                            order.status === 'Shipped' ? 'bg-blue-500/20 text-blue-200' :
                              'bg-red-500/20 text-red-200'
                          }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className={ordersPageStyles.tableCell}>
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className={ordersPageStyles.actionButton}
                        >
                          View Details
                        </button>
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
        <div className={ordersPageStyles.modalOverlay}>
          <div className={ordersPageStyles.modalContainer}>
            {/* Modal Header */}
            <div className={ordersPageStyles.modalHeader}>
              <div className="flex justify-between items-center">
                <h2 className={ordersPageStyles.modalTitle}>
                  Order Details: {selectedOrder._id}
                </h2>
                <button
                  onClick={closeModal}
                  className={ordersPageStyles.modalCloseButton}
                >
                  <FiX size={24} />
                </button>
              </div>
              <p className="text-emerald-300 mt-1">
                Ordered on {selectedOrder.date} 
              </p>
            </div>

            {/* Modal Body */}
            <div className={ordersPageStyles.modalBody}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div>
                  {/* Customer Info */}
                  <div className={ordersPageStyles.modalSection}>
                    <h3 className={ordersPageStyles.modalSectionTitle}>
                      <FiUser className="mr-2 text-emerald-300" />
                      My Information
                    </h3>
                    <div className={ordersPageStyles.modalCard}>
                      <div className="mb-3">
                        <div className="font-medium text-emerald-100">{selectedOrder.customer.name}</div>
                        <div className="text-emerald-300 flex items-center mt-2">
                          <FiMail className="mr-2 flex-shrink-0" />
                          {selectedOrder.customer.email || 'No email provided'}
                        </div>
                        <div className="text-emerald-300 flex items-center mt-2">
                          <FiPhone className="mr-2 flex-shrink-0" />
                          {selectedOrder.customer.phone}
                        </div>
                      </div>
                      <div className="flex items-start mt-3">
                        <FiMapPin className="text-emerald-400 mr-2 mt-1 flex-shrink-0" />
                        <div className="text-emerald-300">{selectedOrder.customer.address}</div>
                      </div>
                    </div>
                  </div>

                  {/* Order Notes */}
                  {selectedOrder.notes && (
                    <div className={ordersPageStyles.modalSection}>
                      <h3 className={ordersPageStyles.modalSectionTitle}>
                        Delivery Notes
                      </h3>
                      <div className="bg-emerald-800/50 border-l-4 border-emerald-400 p-4 rounded-lg">
                        <p className="text-emerald-200">{selectedOrder.notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div>
                  {/* Order Summary */}
                  <div className={ordersPageStyles.modalSection}>
                    <h3 className={ordersPageStyles.modalSectionTitle}>
                      <FiPackage className="mr-2 text-emerald-300" />
                      Order Summary
                    </h3>
                    <div className="border border-emerald-700 rounded-xl overflow-hidden">
                      {selectedOrder.items.map((item, index) => (
                        <div
                          key={item._id || idx}
                          className={`flex items-center p-4 bg-emerald-900/30 ${index !== selectedOrder.items.length - 1 ? 'border-b border-emerald-700' : ''}`}
                        >
                          {item.imageUrl ? (
                            <img
                              src={`${API_BASE}${item.imageUrl}`}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-lg mr-4"
                            />
                          ) : (
                            <div className="bg-emerald-800 border-2 border-dashed border-emerald-700 rounded-xl w-16 h-16 mr-4 flex items-center justify-center">
                              <FiPackage className="text-emerald-500" />
                            </div>
                          )}
                          <div className="flex-grow">
                            <div className="font-medium text-emerald-100">{item.name}</div>
                            <div className="text-emerald-400">${item.price.toFixed(2)} × {item.quantity}</div>
                          </div>
                          <div className="font-medium text-emerald-100">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}

                      {/* Order Totals */}
                      <div className="p-4 bg-emerald-800/50">
                        <div className="flex justify-between py-2">
                          <span className="text-emerald-300">Subtotal</span>
                          <span className="font-medium text-emerald-100">${selectedOrder.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-emerald-300">Shipping</span>
                          <span className="font-medium text-emerald-400">Free</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-emerald-300">Tax</span>
                          <span className="font-medium text-emerald-100">${(selectedOrder.total * 0.05).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-4 mt-2 border-t border-emerald-700">
                          <span className="text-lg font-bold text-emerald-100">Total</span>
                          <span className="text-lg font-bold text-emerald-300">
                            ${(selectedOrder.total * 1.05).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment and Shipping Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Payment Info */}
                    <div>
                      <h3 className={ordersPageStyles.modalSectionTitle}>
                        <FiCreditCard className="mr-2 text-emerald-300" />
                        Payment
                      </h3>
                      <div className={ordersPageStyles.modalCard}>
                        <div className="flex justify-between mb-3">
                          <span className="text-emerald-300">Method:</span>
                          <span className="font-medium text-emerald-100">{selectedOrder.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-300">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedOrder.paymentStatus === 'Paid' ? 'bg-emerald-500/20 text-emerald-200' :
                            'bg-red-500/20 text-red-200'
                            }`}>
                            {selectedOrder.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Info */}
                    <div>
                      <h3 className={ordersPageStyles.modalSectionTitle}>
                        <FiTruck className="mr-2 text-emerald-300" />
                        Shipping
                      </h3>
                      <div className={ordersPageStyles.modalCard}>
                        <div className="flex justify-between mb-3">
                          <span className="text-emerald-300">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedOrder.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-200' :
                            selectedOrder.status === 'Shipped' ? 'bg-blue-500/20 text-blue-200' :
                              selectedOrder.status === 'Cancelled' ? 'bg-red-500/20 text-red-200' :
                                'bg-amber-500/20 text-amber-200'
                            }`}>
                            {selectedOrder.status}
                          </span>
                        </div>
                     
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={ordersPageStyles.modalFooter}>
              <div className="flex justify-end">
                <button
                  onClick={closeModal}
                  className={ordersPageStyles.closeButton}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserOrdersPage;