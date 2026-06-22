import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../CartContext';
import { API_BASE } from '../apiConfig';

const VerifyPaymentPage = () => {
    const { clearCart } = useCart();
    const { search } = useLocation();
    const navigate = useNavigate();
    const [statusMsg, setStatusMsg] = useState('Verifying payment…');

    useEffect(() => {
        const params = new URLSearchParams(search);
        const session_id = params.get('session_id');
        const payment_status = params.get('payment_status');
        const token = localStorage.getItem('authToken');

        // If user cancelled on Stripe side, send them back to checkout
        if (payment_status === 'cancel') {
            navigate('/checkout', { replace: true });
            return;
        }

        if (!session_id) {
            setStatusMsg('No session ID provided.');
            return;
        }

        axios
            .get(`${API_BASE}/api/orders/confirm`, {
                params: { session_id },
                headers: token
                    ? { Authorization: `Bearer ${token}` }
                    : {}
            })
            .then(() => {
                // on true success clear the cart and go to your orders list
                clearCart();
                navigate('/myorders', { replace: true });
            })
            .catch(err => {
                console.error('Confirmation error:', err);
                setStatusMsg('There was an error confirming your payment.');
            });
    }, [search, clearCart, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center text-white">
            <p>{statusMsg}</p>
        </div>
    );
};

export default VerifyPaymentPage;
