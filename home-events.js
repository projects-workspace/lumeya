(function () {
  'use strict';

  const track = document.getElementById('home-events-track');

  const sb = window.supabaseClient;
  const DEFAULT_LANG = 'en';
  const MAX_EVENTS = 5;
  const LOOKAHEAD_MONTHS = 6;
  const EVENTS_UNAVAILABLE_TEXT = 'Events temporarily unavailable';

  const emptyLabel = 'No upcoming events';

  function getLang() {
    return DEFAULT_LANG;
  }

  function getLocale(lang) {
    return 'en-US';
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function renderEmpty() {
    const lang = getLang();
    track.innerHTML = `
      <div class="state-card state-card--success home-events-status" role="status">
        <strong>${emptyLabel}</strong>
        <span>${new Date().toLocaleDateString(getLocale(lang), { month: 'long', year: 'numeric' })}</span>
      </div>
    `;
  }

  function renderUnavailable() {
    track.innerHTML = `
      <div class="state-card state-card--unavailable home-events-status" role="status">
        <strong>${EVENTS_UNAVAILABLE_TEXT}</strong>
        <span>Please try again later.</span>
      </div>
    `;
  }

  function expandRecurrence(event, startDate, endDate) {
    if (!event.recurrence_rule || !window.RRule) return [event];

    try {
      const rule = window.RRule.fromString(event.recurrence_rule);
      const duration = event.duration_minutes || Math.max(60, Math.round((new Date(event.end_time) - new Date(event.start_time)) / 60000));
      return rule.between(startDate, endDate, true).map(date => ({
        ...event,
        id: `${event.id}_${date.getTime()}`,
        start_time: date.toISOString(),
        end_time: new Date(date.getTime() + duration * 60000).toISOString()
      }));
    } catch (err) {
      console.warn('[HomeEvents] Recurrence expansion failed:', err);
      return [event];
    }
  }

  function eventVisibleForRole(event) {
    const role = window.MA3Auth?.user?.role || 'guest';
    if (role === 'admin' || role === 'instructor') return true;
    if (role === 'resident') return event.type === 'public' || event.type === 'club';
    return event.type === 'public';
  }

  function renderEvents(events) {
    if (!events.length) {
      renderEmpty();
      return;
    }

    const lang = getLang();
    const locale = getLocale(lang);
    const formatter = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    track.innerHTML = events.slice(0, MAX_EVENTS).map(event => {
      const title = escapeHtml(event.title);
      const date = formatter.format(new Date(event.start_time));
      return `
        <a class="event-card glass-card home-event-card" href="calendar.html" aria-label="${title}">
          <h3>${title}</h3>
          <p>${date}</p>
        </a>
      `;
    }).join('');
  }

  async function fetchUpcomingEvents() {
    if (!sb) {
      throw new Error('public_event_source_unavailable');
    }

    const now = new Date();
    const lookahead = new Date(now);
    lookahead.setMonth(lookahead.getMonth() + LOOKAHEAD_MONTHS);

    try {
      const { data, error } = await sb
        .from('events')
        .select('*')
        .eq('type', 'public')
        .eq('status', 'confirmed')
        .lte('start_time', lookahead.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;

      const upcoming = (data || [])
        .filter(eventVisibleForRole)
        .flatMap(event => expandRecurrence(event, now, lookahead))
        .filter(event => new Date(event.start_time) >= now)
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

      return upcoming;
    } catch (err) {
      console.warn('[HomeEvents] Could not load events:', err);
      throw err;
    }
  }

  function publicEventRecord(event) {
    return {
      id: event.id,
      title: event.title,
      description: event.description || '',
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location || event.address || [event.city, event.country].filter(Boolean).join(', ') || '',
      organizer: event.organizer || event.organizer_name || '',
      status: event.status || '',
      url: event.public_url || event.url || ''
    };
  }

  window.LumeyaEventsProvider = {
    load: () => fetchUpcomingEvents().then(events => events.map(publicEventRecord))
  };

  async function loadHomeEvents() {
    try {
      const events = await fetchUpcomingEvents();
      if (track) renderEvents(events);
    } catch (err) {
      if (track) renderUnavailable();
    }
  }

  if (track) {
    document.addEventListener('ma3-auth-changed', loadHomeEvents);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadHomeEvents, { once: true });
    } else {
      loadHomeEvents();
    }
  }
})();
