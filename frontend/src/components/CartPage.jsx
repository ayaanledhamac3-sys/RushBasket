// src/pages/Cart.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';
import { useCart } from '../CartContext';
import { cartStyles } from '../assets/dummyStyles';
import { API_BASE } from '../apiConfig';

const Cart = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  // Helpers to pull fields from either item.* or item.product.*
  const getItemPrice = item => item.price ?? item.product?.price ?? 0;
  const getItemName  = item => item.name  ?? item.product?.name  ?? 'Unnamed item';
  const getItemImage = item => {
    const path = item.image   ?? item.product?.imageUrl ?? '';
    return path ? `${API_BASE}${path}` : '';
  };

  // Compute subtotal
  const subtotal = cart.reduce((sum, item) => {
    return sum + getItemPrice(item) * item.quantity;
  }, 0);

  const handleQuantityChange = async (id, delta) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty > 0) {
      await updateQuantity(id, newQty);
    } else {
      await removeFromCart(id);
    }
  };

  if (cart.length === 0) {
    return (
      <div className={cartStyles.pageContainer}>
        <div className={cartStyles.maxContainer}>
          <Link to="/items" className={cartStyles.continueShopping}>
            <FiArrowLeft className="mr-2" /> Continue Shopping
          </Link>
          <div className={cartStyles.emptyCartContainer}>
            <div className={cartStyles.emptyCartIcon}>🛒</div>
            <h1 className={cartStyles.emptyCartHeading}>Your Cart is Empty</h1>
            <p className={cartStyles.emptyCartText}>
              Looks like you haven't added anything yet.
            </p>
            <Link to="/items" className={cartStyles.emptyCartButton}>
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cartStyles.pageContainer}>
      <div className={cartStyles.maxContainerLarge}>
        {/* Header */}
        <div className={cartStyles.headerContainer}>
          <h1 className={cartStyles.headerTitle}>Your Shopping Cart</h1>
          <button onClick={clearCart} className={cartStyles.clearCartButton}>
            <FiTrash2 className="mr-1" /> Clear Cart
          </button>
        </div>

        <div className={cartStyles.cartGrid}>
          {/* Items */}
          <div className={cartStyles.cartItemsSection}>
            <div className={cartStyles.cartItemsGrid}>
              {cart.map(item => {
                const id    = item.id;
                const name  = getItemName(item);
                const price = getItemPrice(item);
                const img   = getItemImage(item);

                return (
                  <div key={id} className={cartStyles.cartItemCard}>
                    <div className={cartStyles.cartItemImageContainer}>
                      {img ? (
                        <img
                          src={img}
                          alt={name}
                          className={cartStyles.cartItemImage}
                          onError={e => {
                            e.target.onerror = null;
                            e.target.src = '/no-image.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 rounded">
                          No Image
                        </div>
                      )}
                    </div>

                    <h3 className={cartStyles.cartItemName}>{name}</h3>
                    <p className={cartStyles.cartItemPrice}>
                      ${price.toFixed(2)}
                    </p>

                    <div className={cartStyles.cartItemQuantityContainer}>
                      <button
                        onClick={() => handleQuantityChange(id, -1)}
                        className={cartStyles.cartItemQuantityButton}
                      >
                        <FiMinus />
                      </button>
                      <span className={cartStyles.cartItemQuantity}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(id, 1)}
                        className={cartStyles.cartItemQuantityButton}
                      >
                        <FiPlus />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(id)}
                      className={cartStyles.cartItemRemoveButton}
                    >
                      <FiTrash2 className="mr-1" /> Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className={cartStyles.orderSummaryCard}>
              <h2 className={cartStyles.orderSummaryTitle}>Order Summary</h2>

              <div className="space-y-4 text-sm sm:text-base">
                <div className={cartStyles.orderSummaryRow}>
                  <span className={cartStyles.orderSummaryLabel}>Subtotal</span>
                  <span className={cartStyles.orderSummaryValue}>
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <div className={cartStyles.orderSummaryRow}>
                  <span className={cartStyles.orderSummaryLabel}>Shipping</span>
                  <span className={cartStyles.orderSummaryValue}>Free</span>
                </div>

                <div className={cartStyles.orderSummaryRow}>
                  <span className={cartStyles.orderSummaryLabel}>Taxes (5%)</span>
                  <span className={cartStyles.orderSummaryValue}>
                    ${(subtotal * 0.05).toFixed(2)}
                  </span>
                </div>

                <div className={cartStyles.orderSummaryDivider}></div>

                <div className={cartStyles.orderSummaryTotalRow}>
                  <span className={cartStyles.orderSummaryTotalLabel}>Total</span>
                  <span className={cartStyles.orderSummaryTotalValue}>
                    ${(subtotal * 1.05).toFixed(2)}
                  </span>
                </div>
              </div>

              <button className={cartStyles.checkoutButton}>
                <Link to="/checkout">Proceed to Checkout</Link>
              </button>

              <div className={cartStyles.continueShoppingBottom}>
                <Link to="/items" className={cartStyles.continueShopping}>
                  <FiArrowLeft className="mr-2" /> Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
