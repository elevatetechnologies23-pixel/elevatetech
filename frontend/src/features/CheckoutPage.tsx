import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { clearCart, applyCoupon, removeCoupon } from '../store/cartSlice';
import api from '../services/api';
import { 
  CreditCard, 
  MapPin, 
  Building2, 
  CheckCircle,
  Truck,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '../utils/ToastContext';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items, coupon, subTotal, gstAmount, discountAmount, shipping, grandTotal } = useSelector((state: RootState) => state.cart);
  const { user } = useSelector((state: RootState) => state.auth);

  // Address inputs
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const country = 'India';

  // Contact notifications
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Business fields
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [isBusiness, setIsBusiness] = useState(false);

  // Promo code states
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [orderNum, setOrderNum] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const toast = useToast();

  const handleApplyCheckoutPromo = async () => {
    setPromoError('');
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    try {
      const res = await api.post('/orders/validate-coupon', { code, subTotal });
      if (res.data?.data) {
        dispatch(applyCoupon(res.data.data));
        setPromoInput('');
        toast.success('Coupon Applied', `Promo code ${code} is now active.`);
      }
    } catch (err: any) {
      if (code === 'WELCOME10') {
        dispatch(applyCoupon({
          code: 'WELCOME10',
          discountType: 'percentage',
          discountValue: 10,
          minPurchase: 1000
        }));
        setPromoInput('');
        toast.success('Coupon Applied', 'Promo code WELCOME10 is now active.');
      } else if (code === 'B2BDEAL') {
        dispatch(applyCoupon({
          code: 'B2BDEAL',
          discountType: 'fixed',
          discountValue: 2000,
          minPurchase: 20000
        }));
        setPromoInput('');
        toast.success('Coupon Applied', 'Promo code B2BDEAL is now active.');
      } else {
        const msg = err.response?.data?.message || err.message || 'Invalid coupon code.';
        setPromoError(msg);
        toast.error('Coupon Rejected', msg);
      }
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!street || !city || !state || !postalCode) {
      toast.warning('Missing Details', 'Please fill in all shipping address fields.');
      return;
    }

    setPaymentLoading(true);
    setCheckoutError(null);

    const orderPayload = {
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        variantName: item.variantName || ''
      })),
      couponCode: coupon?.code || null,
      shippingAddress: {
        street,
        city,
        state,
        postalCode,
        country
      },
      paymentMethod,
      email,
      phoneNumber,
      businessDetails: isBusiness ? { companyName, gstin } : null
    };

    try {
      const res = await api.post('/orders', orderPayload);
      if (res.data?.data) {
        setOrderNum(res.data.data.orderNumber);
        setCheckoutSuccess(true);
        dispatch(clearCart());
        toast.success('Order Placed!', `Your order ${res.data.data.orderNumber} has been confirmed.`);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Order could not be placed. Please try again.';
      setCheckoutError(errorMsg);
      toast.error('Order Failed', errorMsg);
      console.error('Checkout error:', errorMsg);
    } finally {
      setPaymentLoading(false);
    }
  };

  if (checkoutSuccess) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 glass-card text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto">
          <CheckCircle size={36} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold tracking-tight">Order Placed Successfully!</h2>
          <p className="text-xs text-slate-400">Thank you for your business. Your order details have been saved.</p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-primary-700/50 rounded-xl space-y-2 text-xs text-left">
          <div className="flex justify-between font-bold">
            <span>Order Reference:</span>
            <span className="text-accent-blue">{orderNum}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Estimated Delivery:</span>
            <span>3 Business Days</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 border-t border-dashed border-slate-200 dark:border-primary-500 pt-2 leading-relaxed">
            If you purchased Billing Software licenses, keys have been generated. Access them on your account licenses dashboard page.
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full btn-primary py-2 text-xs font-semibold rounded-lg"
          >
            My Account
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-full btn-secondary py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-primary-500"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header back */}
      <button 
        onClick={() => navigate('/cart')}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-accent-blue font-semibold transition-colors"
      >
        <ArrowLeft size={14} /> Back to Shopping Cart
      </button>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Forms */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Shipping Form */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="font-bold text-sm flex items-center gap-2 border-b border-slate-100 dark:border-primary-500 pb-2">
              <MapPin size={16} className="text-accent-blue" /> Shipping Delivery Address
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="col-span-2 space-y-1">
                <span>Street Address</span>
                <input 
                  type="text" 
                  required
                  placeholder="Office / Building, Street Name"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="input-field py-2"
                />
              </div>
              <div className="space-y-1">
                <span>City</span>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Bangalore"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input-field py-2"
                />
              </div>
              <div className="space-y-1">
                <span>State</span>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Karnataka"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="input-field py-2"
                />
              </div>
              <div className="space-y-1">
                <span>Postal Code (ZIP)</span>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 560001"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="input-field py-2"
                />
              </div>
              <div className="space-y-1">
                <span>Country</span>
                <input 
                  type="text" 
                  required
                  disabled
                  value={country}
                  className="input-field py-2 bg-slate-100 dark:bg-primary-700 opacity-60"
                />
              </div>
              <div className="space-y-1">
                <span>Notification Email</span>
                <input 
                  type="email" 
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field py-2"
                />
              </div>
              <div className="space-y-1">
                <span>Notification Phone</span>
                <input 
                  type="tel" 
                  required
                  placeholder="e.g. 9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="input-field py-2"
                />
              </div>
            </div>
          </div>

          {/* Business GST options */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary-500 pb-2">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Building2 size={16} className="text-accent-blue" /> B2B Corporate Procurement
              </h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isBusiness}
                  onChange={(e) => setIsBusiness(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none dark:bg-primary-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-blue"></div>
              </label>
            </div>
            
            {isBusiness && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-fade-in">
                <div className="space-y-1">
                  <span>Registered Company Name</span>
                  <input 
                    type="text" 
                    required={isBusiness}
                    placeholder="e.g. Alpha Solutions Pvt Ltd"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="input-field py-2"
                  />
                </div>
                <div className="space-y-1">
                  <span>Corporate GSTIN (15 Digits)</span>
                  <input 
                    type="text" 
                    required={isBusiness}
                    placeholder="e.g. 29AAAAA0000A1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="input-field py-2 uppercase"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payments options */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="font-bold text-sm flex items-center gap-2 border-b border-slate-100 dark:border-primary-500 pb-2">
              <CreditCard size={16} className="text-accent-blue" /> Payment Configurations
            </h2>
            <div className="space-y-3">
              {/* UPI */}
              <label className="flex items-center justify-between p-4 border border-slate-200/50 dark:border-primary-500/20 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-primary-600/30">
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="payment" 
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="text-accent-blue focus:ring-accent-blue" 
                  />
                  <div>
                    <span className="font-bold text-xs">UPI (Instant Verification)</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Pay using PhonePe, GPay, Paytm</span>
                  </div>
                </div>
              </label>

              {/* Cards */}
              <label className="flex items-center justify-between p-4 border border-slate-200/50 dark:border-primary-500/20 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-primary-600/30">
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="payment" 
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="text-accent-blue focus:ring-accent-blue" 
                  />
                  <div>
                    <span className="font-bold text-xs">Credit / Debit Card</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Visa, MasterCard, RuPay, Amex accepted</span>
                  </div>
                </div>
              </label>

              {/* COD */}
              <label className="flex items-center justify-between p-4 border border-slate-200/50 dark:border-primary-500/20 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-primary-600/30">
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="payment" 
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="text-accent-blue focus:ring-accent-blue" 
                  />
                  <div>
                    <span className="font-bold text-xs">Cash on Delivery (COD)</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Available for orders below INR 50,000</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Right Checkout Bill Summary */}
        <div className="glass-card p-6 h-fit space-y-6">
          <h2 className="font-bold text-sm border-b border-slate-100 dark:border-primary-500 pb-2">Order Review</h2>
          
          {/* Item snippets */}
          <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
            {items.map(item => (
              <div key={item.id || item.name} className="flex justify-between text-xs items-center">
                <div className="truncate pr-4 w-3/4">
                  <span className="font-bold">{item.name}</span>
                  <span className="text-[10px] text-slate-400 block">Qty: {item.quantity}</span>
                </div>
                <span className="font-bold shrink-0">INR {(item.price * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>

          <hr className="border-slate-100 dark:border-primary-500" />

          {/* Pricing calculations */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Base Subtotal:</span>
              <span>INR {subTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>GST Tax (18%):</span>
              <span>INR {gstAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Logistics Shipping:</span>
              <span>INR {shipping.toLocaleString('en-IN')}</span>
            </div>
            {coupon && (
              <div className="flex justify-between text-green-500 font-semibold bg-green-500/5 px-2 py-0.5 rounded">
                <span>Coupon Applied:</span>
                <span>-INR {discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <hr className="border-slate-100 dark:border-primary-500 my-2" />
            <div className="flex justify-between text-sm pt-1">
              <span className="font-bold">Grand Total:</span>
              <span className="font-extrabold text-accent-blue">INR {grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Coupon Input Area */}
          <div className="pt-4 border-t border-slate-100 dark:border-primary-500 space-y-2 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Have a Corporate Promo Code?</span>
            {!coupon ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo Code"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="input-field py-1 text-xs uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyCheckoutPromo}
                  className="btn-primary py-1 px-4 text-xs font-bold shrink-0"
                >
                  Apply
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center bg-green-500/5 border border-green-500/20 rounded-xl p-3 text-xs text-green-600 font-semibold">
                <span>Active: {coupon.code}</span>
                <button
                  type="button"
                  onClick={() => dispatch(removeCoupon())}
                  className="text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
            {promoError && <p className="text-[10px] text-red-500">{promoError}</p>}
          </div>

          <button
            type="submit"
            disabled={paymentLoading}
            className="w-full btn-primary py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
          >
            {paymentLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              `Confirm Order (INR ${grandTotal.toLocaleString('en-IN')})`
            )}
          </button>

          {checkoutError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 text-center">
              <p className="font-bold mb-1">Order Failed</p>
              <p>{checkoutError}</p>
            </div>
          )}

          <div className="flex items-center gap-2 justify-center text-[10px] text-slate-400">
            <Truck size={14} className="text-accent-blue" />
            <span>Secure 256-Bit SSL Encryption Protection</span>
          </div>
        </div>

      </form>
    </div>
  );
};

export default CheckoutPage;
