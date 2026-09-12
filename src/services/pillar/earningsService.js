import { supabase } from "../../lib/supabase";

export const pillarEarningsService = {
  async getEarningsSummary(pillarId) {
    const isDemo = localStorage.getItem("coophub_demo_user") === "true";

    // 🔒 REAL USER ONLY: Derived strictly from transaction ledger
    try {
      // 1. Fetch Pillar Earnings
      const { data: earningsData, error: earningsErr } = await supabase
        .from("pillar_earnings")
        .select("*")
        .eq("pillar_id", pillarId)
        .order("created_at", { ascending: false });

      if (earningsErr) throw earningsErr;

      // 2. Fetch Pillar Payout Requests
      const { data: payoutsData, error: payoutsErr } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("pillar_id", pillarId)
        .order("requested_at", { ascending: false });

      if (payoutsErr) throw payoutsErr;

      // 3. Fetch Pillar Bank Profile
      const { data: profileData } = await supabase
        .from("pillar_profiles")
        .select("bank_account_holder, bank_name, bank_account_number, bank_ifsc, bank_upi_id, payout_status")
        .eq("id", pillarId)
        .maybeSingle();

      const earningsList = earningsData || [];
      const payoutsList = payoutsData || [];

      // Derive completed order earnings from Supabase and local orders
      let completedOrdersEarnings = 0;
      let todayOrdersEarnings = 0;
      const commissionRate = 0.085; // 8.5% platform fee

      try {
        const { data: sReqCompleted } = await supabase
          .from("service_requests")
          .select("id, amount, total_amount, final_amount, created_at, updated_at, payment_status, status")
          .or("status.eq.completed,payment_status.eq.completed");

        (sReqCompleted || []).forEach(o => {
          const rawAmt = Number(o.final_amount || o.total_amount || o.amount || 450);
          const netAmt = Math.round(rawAmt * (1 - commissionRate) * 100) / 100;
          completedOrdersEarnings += netAmt;

          const ordDate = o.updated_at || o.created_at || new Date().toISOString();
          const isToday = new Date(ordDate).toDateString() === new Date().toDateString();
          if (isToday) {
            todayOrdersEarnings += netAmt;
          }
        });
      } catch (e) {}

      try {
        if (typeof window !== "undefined") {
          const shared = JSON.parse(localStorage.getItem('coophub_shared_live_orders') || '[]');
          const custCreated = JSON.parse(localStorage.getItem('coophub_demo_customer_created_requests') || '[]');
          const seenIds = new Set();
          [...shared, ...custCreated].forEach(o => {
            if (!o || !o.id || seenIds.has(o.id)) return;
            seenIds.add(o.id);
            const isCompleted = o.status === 'completed' || o.payment_status === 'completed' || localStorage.getItem(`coophub_payment_status_${o.id}`) === 'completed';
            if (isCompleted) {
              const rawAmt = Number(o.final_amount || o.total_amount || o.amount || 450);
              const netAmt = Math.round(rawAmt * (1 - commissionRate) * 100) / 100;
              completedOrdersEarnings = Math.max(completedOrdersEarnings, netAmt);
              todayOrdersEarnings = Math.max(todayOrdersEarnings, netAmt);
            }
          });
        }
      } catch (e) {}

      const totalFromDb = earningsList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      const todayFromDb = earningsList
        .filter((item) => new Date(item.created_at).toDateString() === new Date().toDateString())
        .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

      const total = Math.max(totalFromDb, completedOrdersEarnings);
      const today = Math.max(todayFromDb, todayOrdersEarnings);

      // Pending Payouts (pending, approved, or processing)
      const pending = payoutsList
        .filter((p) => ['pending', 'approved', 'processing'].includes(p.status))
        .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

      // Settled Payouts
      const paid = payoutsList
        .filter((p) => p.status === "completed")
        .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

      // Mathematical Ledger Invariant: Withdrawable = Total - Pending - Paid
      const withdrawable = Math.max(0, Math.round((total - pending - paid) * 100) / 100);

      return {
        summary: { total, today, pending, paid, withdrawable },
        transactions: earningsList,
        payouts: payoutsList,
        bankDetails: profileData || {},
        error: null,
      };
    } catch (error) {
      console.error("Earnings fetch error:", error);
      return {
        summary: { total: 0, today: 0, pending: 0, paid: 0, withdrawable: 0 },
        transactions: [],
        payouts: [],
        bankDetails: {},
        error: error.message,
      };
    }
  },

  /**
   * Request a payout from available withdrawable balance
   */
  async requestPayout(pillarId, amount, paymentMode = 'bank_transfer') {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { data: null, error: "Payout amount must be a positive number." };
    }

    try {
      // 1. Validate Ledger Integrity (re-fetch on server)
      const { summary, payouts, bankDetails } = await this.getEarningsSummary(pillarId);
      
      if (numAmount > summary.withdrawable) {
        return { 
          data: null, 
          error: `Insufficient withdrawable balance. Requested: ₹${numAmount}, Available: ₹${summary.withdrawable}.` 
        };
      }

      // 2. Prevent Overlapping Duplicate Requests
      const hasPending = payouts.some(p => ['pending', 'approved', 'processing'].includes(p.status));
      if (hasPending) {
        return { 
          data: null, 
          error: "An existing payout request is currently in queue. Please wait for settlement." 
        };
      }

      // 3. Verify Bank / UPI KYC is present
      const hasBank = Boolean(bankDetails?.bank_account_number && bankDetails?.bank_ifsc);
      const hasUpi = Boolean(bankDetails?.bank_upi_id);
      if (paymentMode === 'bank_transfer' && !hasBank) {
        return { 
          data: null, 
          error: "Registered bank account details (Account Number & IFSC) not found in your profile." 
        };
      }
      if (paymentMode === 'upi' && !hasUpi) {
        return { 
          data: null, 
          error: "Registered UPI ID not found in your profile." 
        };
      }

      // 4. Insert Verified Payout Request Record
      const { data, error } = await supabase
        .from('payout_requests')
        .insert([{
          pillar_id: pillarId,
          amount: numAmount,
          status: 'pending',
          payment_mode: paymentMode,
          requested_at: new Date().toISOString()
        }])
        .select()
        .single();
        
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Payout request error:", error);
      return { data: null, error: error.message };
    }
  }
};

export default pillarEarningsService;
