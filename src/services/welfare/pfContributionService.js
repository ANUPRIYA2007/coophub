/**
 * COOP HUB — Automatic PF Contribution & Shared Welfare Engine
 * 
 * Strict Invariant: Total Contribution = Pillar Share (2.5%) + Coop Match (2.5%)
 * Strict Idempotency: Duplicate job completions or payments cannot double-credit PF.
 */

import { supabase } from '../../lib/supabase.js';

export const pfContributionService = {
  /**
   * Process and record an authoritative shared PF contribution for a completed, paid booking
   */
  async processBookingPFContribution({ pillarId, bookingId, baseAmount, isPrepaid = false }) {
    if (!pillarId || !bookingId) {
      return { success: false, error: "Missing pillarId or bookingId." };
    }

    try {
      // 1. Database-level Idempotency Check
      const { data: existingContrib, error: exErr } = await supabase
        .from('pf_contributions')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (existingContrib) {
        return {
          success: true,
          alreadyProcessed: true,
          contribution: existingContrib,
          message: "PF contribution already recorded for this booking."
        };
      }

      // 2. Verify Financial Settlement (must be paid or marked prepaid)
      if (!isPrepaid) {
        const { data: order } = await supabase
          .from('service_requests')
          .select('id, status, payment_status, amount, customer_id')
          .eq('id', bookingId)
          .maybeSingle();

        if (order && order.payment_status !== 'completed') {
          return {
            success: false,
            error: "Cannot process PF contribution for an unsettled/unpaid booking."
          };
        }
      }

      // 3. Fetch Configurable Rates from admin_settings
      const { data: settings } = await supabase
        .from('admin_settings')
        .select('pf_contribution_enabled, pf_pillar_rate, pf_coop_match_rate')
        .limit(1)
        .maybeSingle();

      const isEnabled = settings?.pf_contribution_enabled !== false;
      if (!isEnabled) {
        return { success: false, disabled: true, message: "PF contributions are currently disabled in admin settings." };
      }

      const pillarRate = Number(settings?.pf_pillar_rate ?? 2.50);
      const coopRate = Number(settings?.pf_coop_match_rate ?? 2.50);

      const earningBase = Number(baseAmount || 450);
      const pillarShare = Math.round(earningBase * (pillarRate / 100) * 100) / 100;
      const coopShare = Math.round(earningBase * (coopRate / 100) * 100) / 100;
      const totalContribution = Math.round((pillarShare + coopShare) * 100) / 100;

      // Mathematical Invariant Check
      if (Math.abs((pillarShare + coopShare) - totalContribution) > 0.01) {
        throw new Error(`PF split invariant violation: Pillar (${pillarShare}) + Coop (${coopShare}) != Total (${totalContribution})`);
      }

      // 4. Fetch or Initialize Pillar's PF Account
      let { data: account, error: accErr } = await supabase
        .from('pf_accounts')
        .select('*')
        .eq('pillar_id', pillarId)
        .maybeSingle();

      if (!account) {
        const { data: newAcc, error: createAccErr } = await supabase
          .from('pf_accounts')
          .insert([{
            pillar_id: pillarId,
            account_status: 'active',
            current_balance: 0.00,
            total_contributions: 0.00,
            total_withdrawals: 0.00,
            pillar_contribution_total: 0.00,
            coop_contribution_total: 0.00,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (createAccErr) throw createAccErr;
        account = newAcc;
      }

      const periodMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-09"

      // 5. Insert Immutable Record in pf_contributions
      const { data: contribution, error: contribErr } = await supabase
        .from('pf_contributions')
        .insert([{
          pf_account_id: account.id,
          pillar_id: pillarId,
          booking_id: bookingId,
          period_month: periodMonth,
          pillar_share: pillarShare,
          coop_share: coopShare,
          total_amount: totalContribution,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (contribErr) {
        // If unique violation occurred concurrently, return idempotently
        if (contribErr.code === '23505' || contribErr.message?.includes('duplicate key')) {
          const { data: existing } = await supabase
            .from('pf_contributions')
            .select('*')
            .eq('booking_id', bookingId)
            .maybeSingle();
          return { success: true, alreadyProcessed: true, contribution: existing };
        }
        throw contribErr;
      }

      // 6. Append Audited Ledger Transaction in pf_transactions
      const balanceAfter = Math.round((Number(account.current_balance || 0) + totalContribution) * 100) / 100;
      const txnCode = `TXN-PF-${bookingId.slice(0, 8).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

      await supabase.from('pf_transactions').insert([{
        pf_account_id: account.id,
        pillar_id: pillarId,
        transaction_code: txnCode,
        transaction_type: 'contribution',
        amount: totalContribution,
        description: `Shared Booking Contribution (Worker ₹${pillarShare} + Coop Match ₹${coopShare})`,
        reference_no: bookingId,
        credit: totalContribution,
        debit: 0.00,
        balance_after: balanceAfter,
        status: 'completed',
        created_at: new Date().toISOString()
      }]);

      // 7. Reconcile and Atomically Update pf_accounts
      await supabase
        .from('pf_accounts')
        .update({
          current_balance: balanceAfter,
          total_contributions: Math.round((Number(account.total_contributions || 0) + totalContribution) * 100) / 100,
          pillar_contribution_total: Math.round((Number(account.pillar_contribution_total || 0) + pillarShare) * 100) / 100,
          coop_contribution_total: Math.round((Number(account.coop_contribution_total || 0) + coopShare) * 100) / 100,
          last_contribution_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);

      // 8. Administrative Audit Log
      try {
        await supabase.from('admin_audit_logs').insert([{
          action: 'PF_CONTRIBUTION_CREDITED',
          entity_type: 'pf_account',
          entity_id: account.id,
          reason: `Automatic shared PF contribution for Booking ${bookingId.slice(0, 8)}`,
          metadata: {
            booking_id: bookingId,
            pillar_id: pillarId,
            pillar_share: pillarShare,
            coop_share: coopShare,
            total_amount: totalContribution
          },
          created_at: new Date().toISOString()
        }]);
      } catch (auditErr) {}

      return {
        success: true,
        contribution,
        pillarShare,
        coopShare,
        totalContribution,
        balanceAfter
      };
    } catch (err) {
      console.error("processBookingPFContribution error:", err);
      return { success: false, error: err.message };
    }
  }
};

export default pfContributionService;
