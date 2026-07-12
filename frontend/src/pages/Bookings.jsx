import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, AlertTriangle, CheckCircle, Trash2, CalendarRange, X } from 'lucide-react';

const Bookings = () => {
  const { apiCall, user } = useAuth();
  const [resources, setResources] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Booking Form State
  const [bookModal, setBookModal] = useState(false);
  const [formResourceId, setFormResourceId] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  // Reschedule Form State
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reschedStart, setReschedStart] = useState('');
  const [reschedEnd, setReschedEnd] = useState('');
  const [reschedError, setReschedError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const assets = await apiCall('/assets');
      const bookables = assets.filter(a => a.sharedBookable);
      setResources(bookables);

      // Pre-select first resource if none is selected
      let resId = selectedResourceId;
      if (!resId && bookables.length > 0) {
        resId = bookables[0].id;
        setSelectedResourceId(bookables[0].id);
      }

      if (resId) {
        const bookingsList = await apiCall(`/bookings?assetId=${resId}`);
        setBookings(bookingsList);
      }
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedResourceId]);

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');

    if (!formResourceId || !formStart || !formEnd) {
      setBookingError('All fields are required.');
      return;
    }

    try {
      await apiCall('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          assetId: formResourceId,
          startTime: formStart,
          endTime: formEnd
        })
      });
      setBookingSuccess('Booking confirmed! Reminder notification dispatched.');
      setFormStart('');
      setFormEnd('');
      // Reload current selected resource bookings
      if (formResourceId === selectedResourceId) {
        await loadData();
      } else {
        setSelectedResourceId(formResourceId);
      }
      setTimeout(() => {
        setBookModal(false);
        setBookingSuccess('');
      }, 1500);
    } catch (error) {
      setBookingError(error.message || 'Booking slot reservation failed.');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await apiCall(`/bookings/${bookingId}/cancel`, { method: 'PUT' });
      await loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRescheduleClick = (booking) => {
    setSelectedBooking(booking);
    // Format to datetime-local values (YYYY-MM-DDTHH:MM)
    const formatDt = (d) => new Date(d).toISOString().slice(0, 16);
    setReschedStart(formatDt(booking.startTime));
    setReschedEnd(formatDt(booking.endTime));
    setRescheduleModal(true);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    setReschedError('');

    try {
      await apiCall(`/bookings/${selectedBooking.id}/reschedule`, {
        method: 'PUT',
        body: JSON.stringify({
          startTime: reschedStart,
          endTime: reschedEnd
        })
      });
      setRescheduleModal(false);
      setSelectedBooking(null);
      await loadData();
    } catch (error) {
      setReschedError(error.message || 'Rescheduling failed.');
    }
  };

  const formatDateTime = (dtStr) => {
    return new Date(dtStr).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="space-y-8 animate-fadeIn text-sm">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Shared Resource Bookings</h2>
          <p className="text-slate-400 text-sm mt-1">Reserve meeting rooms, equipment, and shared fleet assets without scheduling conflicts.</p>
        </div>
        <button
          onClick={() => {
            setFormResourceId(selectedResourceId);
            setBookModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-primary-600/15"
        >
          <Calendar className="w-4 h-4" />
          Book Slot
        </button>
      </div>

      {/* Select Resource & Schedule View split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Resources Selector Panel */}
        <div className="glass rounded-xl p-6 border border-slate-800 lg:col-span-1 h-fit">
          <h3 className="font-bold text-white mb-4 text-xs uppercase tracking-wider text-slate-400">Available Resources</h3>
          {resources.length === 0 ? (
            <p className="text-slate-500 text-xs">No shared bookable resources available in directory.</p>
          ) : (
            <div className="space-y-2">
              {resources.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedResourceId(r.id)}
                  className={`w-full text-left p-3 rounded-lg border text-xs font-semibold transition-all ${
                    selectedResourceId === r.id 
                      ? 'bg-primary-600/10 border-primary-500 text-primary-400' 
                      : 'bg-slate-900/30 border-slate-850 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="font-bold">{r.name}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">{r.assetTag} | {r.location}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bookings Timeline Scheduler */}
        <div className="glass rounded-xl p-6 border border-slate-800 lg:col-span-3">
          <h3 className="font-bold text-white mb-4 text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-indigo-400" />
            Reservation Schedule - {resources.find(r => r.id === selectedResourceId)?.name}
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-slate-500 text-center py-12">No active bookings scheduled for this resource. Free slot available!</p>
          ) : (
            <div className="space-y-3">
              {bookings.map(b => (
                <div key={b.id} className={`border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                  b.status === 'Cancelled' ? 'bg-slate-950/20 border-slate-900 text-slate-500' : 'bg-slate-900/30 border-slate-850 text-slate-200'
                }`}>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-300">{b.User?.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'Upcoming' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        b.status === 'Ongoing' ? 'bg-success/10 text-success border border-success/20 animate-pulse' :
                        b.status === 'Completed' ? 'bg-slate-800 text-slate-400 border border-slate-700/60' :
                        'bg-danger/10 text-danger border border-danger/20'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDateTime(b.startTime)} — {formatDateTime(b.endTime)}</span>
                    </div>
                  </div>

                  {b.status === 'Upcoming' && (b.userId === user.id || user.role === 'Admin' || user.role === 'Asset Manager') && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRescheduleClick(b)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 rounded-lg transition-colors"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        className="p-1 hover:text-danger text-slate-500 transition-colors"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* --- MODAL: Create Booking --- */}
      {bookModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl max-w-md w-full p-6 relative">
            <button onClick={() => setBookModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">Book Shared Resource</h3>

            {bookingError && (
              <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-xs flex items-start gap-2">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{bookingError}</span>
              </div>
            )}
            
            {bookingSuccess && (
              <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg text-success text-xs flex items-center gap-2">
                <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{bookingSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Select Resource *</label>
                <select
                  required
                  value={formResourceId}
                  onChange={(e) => setFormResourceId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none focus:border-primary-500 text-slate-300 text-xs"
                >
                  <option value="">-- Choose Resource --</option>
                  {resources.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.location})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Start Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={formStart}
                  onChange={(e) => setFormStart(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none focus:border-primary-500 text-slate-100 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">End Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={formEnd}
                  onChange={(e) => setFormEnd(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none focus:border-primary-500 text-slate-100 text-xs"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setBookModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: Reschedule Booking --- */}
      {rescheduleModal && selectedBooking && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl max-w-md w-full p-6 relative">
            <button onClick={() => setRescheduleModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-2">Reschedule Booking</h3>
            <p className="text-xs text-slate-400 mb-4">
              Rescheduling booking for <strong>{selectedBooking.Asset?.name}</strong>.
            </p>

            {reschedError && (
              <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-xs flex items-start gap-2">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{reschedError}</span>
              </div>
            )}

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">New Start Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={reschedStart}
                  onChange={(e) => setReschedStart(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none focus:border-primary-500 text-slate-100 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">New End Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={reschedEnd}
                  onChange={(e) => setReschedEnd(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 focus:outline-none focus:border-primary-500 text-slate-100 text-xs"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold"
                >
                  Update Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Bookings;
