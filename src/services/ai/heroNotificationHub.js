/**
 * COOP HUB — Unified Hero AI Notification & Speech Hub
 * 
 * Bridges incoming system alerts, order updates, OTP requests, and broadcast notifications
 * directly to Hero AI across all portals (Pillar, Admin, Customer).
 * 
 * Features:
 * - Realtime Supabase notifications subscription
 * - Web Audio API synthesized notification chimes (zero external audio file dependencies)
 * - Multilingual Web Speech Synthesis TTS (English, Tamil, Hindi)
 * - Proactive Mascot alert queue & unread badge tracking
 * - Event-driven dispatch for in-app simulated/live notifications
 */

import { supabase } from '../../lib/supabase';
import { getLanguageMetadata } from '../../i18n/languages.js';

class HeroNotificationHub {
  constructor() {
    this.subscribers = new Set();
    this.notifications = [];
    this.unreadCount = 0;
    this.isMuted = localStorage.getItem('coophub_hero_voice_muted') === 'true';
    this.channel = null;
    this.audioContext = null;

    this.initRealtime();
    this.initWindowListeners();
  }

  // Initialize Web Audio synthesizer chime
  playChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const now = this.audioContext.currentTime;
      const osc1 = this.audioContext.createOscillator();
      const osc2 = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      // Pleasant ascending chime: C6 (1046.5Hz) -> E6 (1318.5Hz) -> G6 (1567.9Hz)
      osc1.frequency.setValueAtTime(1046.5, now);
      osc1.frequency.exponentialRampToValueAtTime(1318.5, now + 0.08);
      osc1.frequency.exponentialRampToValueAtTime(1567.9, now + 0.16);

      osc2.frequency.setValueAtTime(523.25, now);
      osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioContext.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.46);
      osc2.stop(now + 0.46);
    } catch (e) {
      console.debug('[HeroNotificationHub] Audio chime note:', e);
    }
  }

  // Speak notification text aloud using browser SpeechSynthesis TTS
  speakNotification(text, lang = 'en') {
    if (this.isMuted) return;
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const meta = getLanguageMetadata(lang);
      utterance.lang = meta?.bcp47 || 'en-IN';
      utterance.rate = 1.05;
      utterance.pitch = 1.1; // Friendly Hero AI pitch
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.debug('[HeroNotificationHub] Speech synthesis note:', err);
    }
  }

  // Subscribe to realtime Supabase changes on notifications & requests
  initRealtime() {
    try {
      this.channel = supabase
        .channel('hero-global-notification-hub')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload) => {
            console.log('[HeroNotificationHub] Realtime notification received:', payload);
            if (payload.new) {
              this.notify({
                id: payload.new.id || `notif-${Date.now()}`,
                title: payload.new.title || 'New Alert',
                message: payload.new.message || payload.new.content || 'You have a new update.',
                type: payload.new.type || 'info',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                data: payload.new
              });
            }
          }
        )
        .subscribe();
    } catch (e) {
      console.debug('[HeroNotificationHub] Realtime subscription note:', e);
    }
  }

  // Listen to in-app custom window events
  initWindowListeners() {
    window.addEventListener('coophub-notification', (e) => {
      if (e.detail) {
        this.notify({
          id: e.detail.id || `notif-${Date.now()}`,
          title: e.detail.title || 'Notification Received',
          message: e.detail.message || 'You have received a new notification.',
          type: e.detail.type || 'info',
          voiceText: e.detail.voiceText,
          actionUrl: e.detail.actionUrl,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          data: e.detail
        });
      }
    });

    window.addEventListener('order-status-changed', (e) => {
      if (e.detail) {
        const order = e.detail;
        let title = 'Order Update';
        let message = `Order #${order.booking_code || order.id?.slice(0, 6)} status is now ${order.status}.`;
        let voiceText = `Order update: ${order.service_name || 'Your service'} is now ${order.status}.`;

        if (order.status === 'assigned') {
          title = 'Technician Assigned';
          message = `${order.pillar?.full_name || 'A verified technician'} has been dispatched for ${order.service_name}.`;
          voiceText = `Good news! ${order.pillar?.full_name || 'A technician'} has been assigned to your order.`;
        } else if (order.status === 'completed') {
          title = 'Service Completed & Paid';
          message = `Service completed successfully! Total amount ₹${order.final_amount || order.amount || '—'}.`;
          voiceText = `Service successfully completed! Receipt is now available.`;
        }

        this.notify({
          id: `order-${Date.now()}`,
          title,
          message,
          type: 'success',
          voiceText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          data: order
        });
      }
    });
  }

  // Primary dispatch method
  notify(notification) {
    const notifObj = {
      id: notification.id || `notif-${Date.now()}`,
      title: notification.title || 'New Notification',
      message: notification.message || 'You have received a new alert.',
      type: notification.type || 'info',
      voiceText: notification.voiceText || `${notification.title}. ${notification.message}`,
      actionUrl: notification.actionUrl || null,
      timestamp: notification.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      data: notification.data || {}
    };

    this.notifications.unshift(notifObj);
    this.unreadCount += 1;

    // 1. Play sound chime
    this.playChime();

    // 2. Speak voice announcement aloud
    this.speakNotification(notifObj.voiceText);

    // 3. Broadcast to all Hero AI subscribers
    this.broadcast(notifObj);

    return notifObj;
  }

  // Subscribe UI component (e.g. MascotFloating or GlobalHeroAgent)
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  broadcast(latestNotif) {
    this.subscribers.forEach((cb) => {
      try {
        cb({
          latest: latestNotif,
          notifications: this.notifications,
          unreadCount: this.unreadCount,
          isMuted: this.isMuted
        });
      } catch (err) {
        console.error('[HeroNotificationHub] Subscriber error:', err);
      }
    });
  }

  markAllRead() {
    this.notifications.forEach((n) => (n.read = true));
    this.unreadCount = 0;
    this.broadcast(null);
  }

  toggleVoiceMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('coophub_hero_voice_muted', String(this.isMuted));
    if (this.isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.broadcast(null);
    return this.isMuted;
  }

  getUnreadCount() {
    return this.unreadCount;
  }
}

export const heroNotificationHub = new HeroNotificationHub();
export default heroNotificationHub;
