import React from 'react';
import { X, Printer, CheckCircle2, Clock, Building2, User, Calendar, CreditCard, QrCode, AlertCircle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export default function ReceiptModal({ booking, onClose }) {
  const { settings, formatPrice } = useSettings();
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = (booking.payment_status || '').toLowerCase() === 'paid';
  const nights = (booking.check_in && booking.check_out && booking.check_out > booking.check_in)
    ? Math.max(1, Math.round((new Date(booking.check_out) - new Date(booking.check_in)) / (1000 * 60 * 60 * 24)))
    : 1;

  const ratePerNight = Math.round(Number(booking.booking_amount || 0) / nights);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Print stylesheet to only print the clean receipt */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-voucher, #printable-voucher * {
            visibility: visible;
          }
          #printable-voucher {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 30px;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden my-6">
        {/* Header bar */}
        <div className="no-print flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Building2 className="text-amber-600" size={20} />
            <span className="font-bold text-gray-800 text-sm">Official Booking Voucher & Pass</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-voucher" className="p-8 space-y-6 bg-white text-gray-800">
          {/* Header */}
          <div className="border-b-2 border-dashed border-gray-200 pb-5 text-center relative">
            <div className="inline-block p-2 bg-amber-50 rounded-xl mb-2">
              <Building2 className="text-amber-600" size={32} />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 font-serif uppercase">
              {settings.hotelName || 'TRAVELLERS INN SENSE'}
            </h2>
            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase mt-0.5">
              Hotel & Hospitality Management
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              {settings.address || 'Baler, Aurora, Philippines'} • {settings.contactEmail || 'reservations@travellersinnsense.com'}
            </p>

            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-mono font-semibold text-gray-800">
              <span>REFERENCE:</span>
              <span className="text-amber-700">{booking.booking_reference}</span>
            </div>
          </div>

          {/* Payment & Booking Status Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
            isPaid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-3">
              {isPaid ? (
                <div className="h-10 w-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 size={22} />
                </div>
              ) : (
                <div className="h-10 w-10 bg-amber-500 text-white rounded-full flex items-center justify-center shrink-0">
                  <Clock size={22} />
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Payment Status
                </p>
                <p className={`text-base font-extrabold ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isPaid ? 'PAID IN FULL' : 'PAY AT FRONT DESK (Over-The-Counter)'}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Method: <strong>{booking.payment_method || 'Pay at Front Desk'}</strong>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider block text-gray-400">Stay Status</span>
              <span className="inline-block px-2.5 py-0.5 bg-white border border-gray-200 rounded text-xs font-bold text-gray-800 uppercase mt-0.5">
                {booking.status}
              </span>
            </div>
          </div>

          {/* Guest & Reservation Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-1.5">
              <span className="font-bold text-gray-500 uppercase tracking-wider block text-[10px]">Guest Information</span>
              <div className="font-bold text-sm text-gray-900">{booking.guest_name || 'Guest'}</div>
              <div className="text-gray-500">Guests: <strong>{booking.number_of_guests} Person(s)</strong></div>
              <div className="text-gray-500">Booked On: {booking.created_at?.split('T')[0] || '-'}</div>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-1.5">
              <span className="font-bold text-gray-500 uppercase tracking-wider block text-[10px]">Room Accommodation</span>
              <div className="font-bold text-sm text-gray-900">{booking.room_name || 'Assigned Room'}</div>
              <div className="text-gray-500">Check-in: <strong>{booking.check_in} (2:00 PM)</strong></div>
              <div className="text-gray-500">Check-out: <strong>{booking.check_out} (12:00 PM)</strong></div>
            </div>
          </div>

          {/* Billing Breakdown */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 font-bold text-xs uppercase text-gray-700 tracking-wider">
              Billing & Charges Summary
            </div>
            <div className="p-4 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Room Stay ({nights} Night{nights > 1 ? 's' : ''} @ {formatPrice(ratePerNight)}/night)</span>
                <span className="font-medium text-gray-900">{formatPrice(booking.booking_amount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Service Fee & Hotel Taxes</span>
                <span className="font-medium text-emerald-600">INCLUDED</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm">
                <span className="font-bold text-gray-900">Total Amount Due:</span>
                <span className="font-black text-lg text-amber-700">
                  {formatPrice(booking.booking_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Front Desk Verification Note & QR Simulation */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-gray-900 flex items-center gap-1.5">
                <AlertCircle size={15} className="text-amber-600" />
                Front Desk Check-In Reminder:
              </p>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                Present this voucher/pass at the lobby desk upon arrival. If unpaid, please settle payment at the reception desk to receive your room key card.
              </p>
            </div>
            <div className="shrink-0 p-2 bg-white rounded-lg border border-gray-300 text-center shadow-xs">
              <QrCode size={42} className="text-gray-800 mx-auto" />
              <span className="text-[9px] font-mono font-bold block text-gray-500 mt-1">VERIFY PASS</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="no-print p-4 bg-gray-50 border-t flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Printer size={15} />
            Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
