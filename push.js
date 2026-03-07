// ============================================================
// AfriMarket — push.js v2
// Notifications en temps réel — inclure sur toutes les pages
// ============================================================
(function () {
  'use strict';

  var SUPA_URL = 'https://elgbvitijyjriozvzqpf.supabase.co';
  var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZ2J2aXRpanlqcmlvenZ6cXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzODczNDcsImV4cCI6MjA4Njk2MzM0N30.7juarApMsBUf4b2n8ObuWYl2hMHahQC-qwjORjCTkIM';

  var _sb      = null;
  var _userId  = null;
  var _swReg   = null;
  var _channel = null;

  // ── DÉMARRAGE ─────────────────────────────────────────────
  async function boot() {
    // Attendre que la lib Supabase soit chargée
    if (typeof supabase === 'undefined') return;
    _sb = supabase.createClient(SUPA_URL, SUPA_KEY);

    // Session
    var res = await _sb.auth.getSession();
    if (!res.data || !res.data.session) return;
    _userId = res.data.session.user.id;

    // Service Worker
    await registerSW();

    // Realtime écoute dès maintenant
    listenRealtime();

    // Demande permission après 4s (non intrusif)
    setTimeout(maybeAskPermission, 4000);
  }

  // ── SERVICE WORKER ────────────────────────────────────────
  async function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    try {
      _swReg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    } catch (e) { console.warn('[AfriPush] SW:', e.message); }
  }

  // ── REALTIME SUPABASE ─────────────────────────────────────
  function listenRealtime() {
    if (!_sb || !_userId) return;
    if (_channel) _sb.removeChannel(_channel);

    _channel = _sb.channel('push_' + _userId)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'notifications',
        filter: 'user_id=eq.' + _userId
      }, function (payload) {
        var n = payload.new;
        if (!n) return;
        // In-app toast si la fonction existe dans la page
        if (typeof toast === 'function')
          toast((n.icon || '🔔') + ' ' + (n.title || ''), n.type || 'info');
        // Badge
        if (typeof updateNotifDot === 'function') updateNotifDot(1);
        // Notification système
        pushSystem(n.title || 'AfriMarket', n.message || '', n.icon, n.url);
      })
      .subscribe();
  }

  // ── NOTIFICATION SYSTÈME ──────────────────────────────────
  function pushSystem(title, body, icon, url) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    var opts = {
      body:    body  || '',
      icon:    '/icons/icon-192.png',
      badge:   '/icons/icon-96.png',
      tag:     'am-' + Date.now(),
      vibrate: [120, 60, 120],
      data:    { url: url || '/dashboard.html' }
    };
    if (_swReg && _swReg.active) {
      _swReg.showNotification(title, opts).catch(function () {
        new Notification(title, opts);
      });
    } else {
      try { new Notification(title, opts); } catch (e) {}
    }
  }

  // ── DEMANDE DE PERMISSION ─────────────────────────────────
  function maybeAskPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    // Ne pas redemander si refus < 7 jours
    var deniedAt = localStorage.getItem('am_push_denied');
    if (deniedAt && Date.now() - +deniedAt < 7 * 86400 * 1000) return;

    showModal();
  }

  // ── MODAL PERMISSION ──────────────────────────────────────
  function showModal() {
    if (document.getElementById('am-pm')) return;

    var el = document.createElement('div');
    el.id = 'am-pm';
    el.style.cssText =
      'position:fixed;bottom:1.2rem;left:50%;transform:translateX(-50%) translateY(110px);' +
      'z-index:99998;width:min(90vw,370px);background:#fff;border-radius:20px;' +
      'box-shadow:0 20px 60px rgba(8,14,42,.18),0 0 0 1px rgba(8,14,42,.06);' +
      'padding:1.2rem 1.3rem;transition:transform .45s cubic-bezier(.34,1.56,.64,1);' +
      'font-family:Plus Jakarta Sans,system-ui,sans-serif;';

    el.innerHTML =
      '<div style="display:flex;gap:.85rem;align-items:center;margin-bottom:1rem;">' +
        '<div style="width:46px;height:46px;border-radius:14px;flex-shrink:0;' +
             'background:linear-gradient(135deg,#1B3FE4,#00C2B7);' +
             'display:flex;align-items:center;justify-content:center;font-size:1.4rem;">🔔</div>' +
        '<div>' +
          '<div style="font-size:.88rem;font-weight:800;color:#080E2A;line-height:1.2;">' +
            'Activer les notifications ?</div>' +
          '<div style="font-size:.72rem;color:#8892A8;margin-top:.2rem;line-height:1.45;">' +
            'Nouvelles annonces, messages, commissions de parrainage… soyez alerté(e) instantanément.' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:.5rem;">' +
        '<button id="am-pm-no"  style="flex:1;padding:.6rem;border:1.5px solid #DDE3F5;border-radius:11px;' +
                'background:#fff;font-size:.75rem;font-weight:600;color:#8892A8;cursor:pointer;">Non merci</button>' +
        '<button id="am-pm-yes" style="flex:2;padding:.6rem;border:none;border-radius:11px;' +
                'background:linear-gradient(135deg,#1B3FE4,#2D55FF);color:#fff;font-size:.75rem;' +
                'font-weight:700;cursor:pointer;box-shadow:0 6px 18px rgba(27,63,228,.32);">' +
          '🔔 Oui, activer</button>' +
      '</div>';

    document.body.appendChild(el);
    // Slide in
    requestAnimationFrame(function () {
      el.style.transform = 'translateX(-50%) translateY(0)';
    });

    document.getElementById('am-pm-yes').onclick = function () {
      closeModal();
      Notification.requestPermission().then(function (p) {
        if (p === 'granted') showToast('✅ Notifications activées !', 'success');
      });
    };
    document.getElementById('am-pm-no').onclick = function () {
      closeModal();
      localStorage.setItem('am_push_denied', Date.now());
    };
    setTimeout(closeModal, 12000);

    function closeModal() {
      el.style.transform = 'translateX(-50%) translateY(110px)';
      setTimeout(function () { el.remove(); }, 450);
    }
  }

  // ── TOAST FALLBACK ────────────────────────────────────────
  function showToast(msg, type) {
    if (typeof toast === 'function') { toast(msg, type); return; }
    var t = document.createElement('div');
    t.style.cssText =
      'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);' +
      'background:#080E2A;color:#fff;padding:.65rem 1.3rem;border-radius:12px;' +
      'font-size:.81rem;font-weight:600;z-index:99999;border-left:3px solid #00C2B7;' +
      'font-family:system-ui,sans-serif;white-space:nowrap;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3500);
  }

  // ── API PUBLIQUE ──────────────────────────────────────────
  window.AfriPush = {
    // Envoyer une notif système depuis la page
    send: function (title, body, url) {
      pushSystem(title, body, null, url);
    },
    // Forcer la demande de permission
    ask: function () { showModal(); },
    // Vérifier si activé
    granted: function () {
      return 'Notification' in window && Notification.permission === 'granted';
    }
  };

  // ── BOOT ─────────────────────────────────────────────────
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', boot);
  else
    boot();
})();