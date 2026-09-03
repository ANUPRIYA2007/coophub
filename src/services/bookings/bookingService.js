// ==============================================================================
// COOP HUB — Unified Booking Service
// Database CRUD operations against public.service_requests and public.bookings
// ==============================================================================

import { supabase } from '../../lib/supabase';
import { serviceRequestService } from '../customer/serviceRequestService';

export const bookingService = {
  /**
   * Create a new booking / service request
   */
  async createBooking(bookingData) {
    return await serviceRequestService.createServiceRequest(bookingData);
  },

  /**
   * Retrieve booking details with related service and pillar info
   */
  async getBookingById(bookingId) {
    return await serviceRequestService.getRequestDetails(bookingId);
  },

  /**
   * Update booking status with state validation
   */
  async updateStatus(bookingId, status, metadata = {}) {
    const { data, error } = await supabase
      .from('service_requests')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...metadata
      })
      .eq('id', bookingId)
      .select()
      .maybeSingle();

    // Mirror to bookings table
    await supabase
      .from('bookings')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...metadata
      })
      .eq('id', bookingId);

    if (error) throw error;
    return data;
  },

  /**
   * Cancel booking with automated financial handling
   */
  async cancelBooking(bookingId, reason = 'Cancelled by customer', cancelledBy = 'customer') {
    // 1. Fetch current order state to inspect payment status and dispatch timing
    const { data: request } = await supabase
      .from('service_requests')
      .select('id, status, payment_status, created_at, accepted_at, customer_id')
      .eq('id', bookingId)
      .maybeSingle();

    const cancellationTimestamp = new Date().toISOString();

    // 2. Perform cancellation status update
    const result = await this.updateStatus(bookingId, 'cancelled', {
      cancellation_reason: reason,
      cancelled_by: cancelledBy,
      cancelled_at: cancellationTimestamp
    });

    // 3. Financial Handling: If order was paid, initiate refund workflow
    if (request && request.payment_status === 'completed') {
      try {
        const { data: settings } = await supabase
          .from('admin_settings')
          .select('cancellation_grace_minutes, cancellation_fee_fixed')
          .limit(1)
          .maybeSingle();

        const graceMinutes = settings?.cancellation_grace_minutes || 15;
        const fixedFee = Number(settings?.cancellation_fee_fixed || 50.00);

        // Fee applies only if technician was already en-route/arrived OR grace period exceeded
        const isDispatched = ['on_the_way', 'arrived', 'in_progress'].includes(request.status);
        const orderAgeMinutes = (Date.now() - new Date(request.created_at || Date.now()).getTime()) / 60000;
        const cancellationFee = (isDispatched || orderAgeMinutes > graceMinutes) ? fixedFee : 0;

        const { refundService } = await import('../payment/refundService');
        await refundService.requestRefund({
          requestId: bookingId,
          customerId: request.customer_id,
          reason: `Cancellation: ${reason}`,
          cancellationFee
        });
      } catch (refundErr) {
        console.warn("Cancellation refund initiation notice:", refundErr);
      }
    }

    return result;
  },

  /**
   * Fetch customer bookings
   */
  async getCustomerBookings() {
    return await serviceRequestService.getCustomerRequests();
  }
};

export default bookingService;
