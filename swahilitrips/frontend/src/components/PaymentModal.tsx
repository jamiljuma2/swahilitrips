'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { api } from '@/lib/api';

export default function PaymentModal({
  bookingId,
  onClose,
}: {
  bookingId: string;
  onClose: () => void;
}) {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleClose = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setStatus('sending');
    setMessage('');
    try {
      await api.post('/api/payments/mpesa/initiate', { booking_id: bookingId, phone: phone.trim() });
      setMessage('STK Push sent. Complete payment on your phone.');
      setStatus('success');
      pollRef.current = setInterval(async () => {
        try {
          const payment = await api.get<{ status: string }>(`/api/payments/${bookingId}`);
          if (payment.status === 'paid') {
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            setMessage('Payment successful!');
            setTimeout(handleClose, 1500);
          }
        } catch {
          // ignore
        }
      }, 3000);
    } catch (err) {
      setMessage((err as Error).message);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="glass-card max-w-md w-full p-8 animate-slide-up shadow-lg rounded-xl bg-white/80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-2xl text-ocean">Pay with M-Pesa</h3>
          <button onClick={handleClose} type="button" className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-base text-gray-600 mb-6">
          Enter your M-Pesa phone number (e.g. 07XXXXXXXX or 2547XXXXXXXX).
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-ocean text-base transition"
            required
          />
          {message && (
            <p className={`text-base ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={handleClose} className="flex-1 py-3 rounded-xl border border-gray-300 text-base">
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === 'sending'}
              className="flex-1 btn-primary text-base"
            >
              {status === 'sending' ? 'Sending…' : 'Send STK Push'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
