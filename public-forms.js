/* Public discovery request forms: validated Supabase write with local/Telegram fallback. */

(function () {
  'use strict';

  const FORM_SELECTOR = [
    'form[data-public-request-form]',
    'form[data-public-request]',
    'form[data-request-type="suggest_listing"]',
    'form[data-request-type="looking_for"]',
    'form#suggest-listing-form',
    'form#looking-for-form'
  ].join(',');
  const RPC_NAME = 'submit_public_discovery_request';
  const TELEGRAM_URL = 'https://t.me/santioago_bot?start=public_request';
  const DRAFT_PREFIX = 'lumeya-public-request-draft:';
  const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
  const REQUEST_TYPES = new Set(['suggest_listing', 'looking_for']);
  const LISTING_TYPES = new Set(['practitioner', 'service', 'place']);
  const PREFERENCES = new Set(['online', 'in_person', 'either']);
  const MAX = {
    subject: 160,
    details: 2500,
    location: 160,
    contact: 240,
    referenceUrl: 500
  };

  class ValidationError extends Error {}

  function localIntake() {
    return window.location.hostname === '127.0.0.1' && window.LumeyaLocalIntake?.mode === 'local-preview' ? window.LumeyaLocalIntake : null;
  }

  function routeAvailable() {
    return navigator.onLine && (localIntake() || typeof window.supabaseClient?.rpc === 'function');
  }

  function trim(value) {
    return String(value || '').trim();
  }

  function firstValue(values, names) {
    for (const name of names) {
      const value = trim(values[name]);
      if (value) return value;
    }
    return '';
  }

  function formValues(form) {
    const values = {};
    for (const [name, value] of new FormData(form).entries()) {
      if (typeof value === 'string') values[name] = value;
    }
    return values;
  }

  function requestTypeFor(form, values = formValues(form)) {
    const explicit = trim(
      form.dataset.publicRequestForm ||
      form.dataset.publicRequest ||
      form.dataset.requestType ||
      values.request_type ||
      values.kind
    );

    if (explicit) return explicit;
    if (form.id === 'suggest-listing-form') return 'suggest_listing';
    if (form.id === 'looking-for-form') return 'looking_for';
    return '';
  }

  function requireText(value, label, minimum, maximum) {
    const normalized = trim(value);
    if (normalized.length < minimum) {
      throw new ValidationError(`${label} must be at least ${minimum} characters.`);
    }
    if (normalized.length > maximum) {
      throw new ValidationError(`${label} must be ${maximum} characters or fewer.`);
    }
    return normalized;
  }

  function optionalText(value, label, maximum) {
    const normalized = trim(value);
    if (normalized.length > maximum) {
      throw new ValidationError(`${label} must be ${maximum} characters or fewer.`);
    }
    return normalized || null;
  }

  function validatedUrl(value) {
    const normalized = optionalText(value, 'Link', MAX.referenceUrl);
    if (!normalized) return null;

    let url;
    try {
      url = new URL(normalized);
    } catch (error) {
      throw new ValidationError('Link must be a complete http or https URL.');
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new ValidationError('Link must use http or https.');
    }
    return url.toString();
  }

  function collectRequest(form) {
    const values = formValues(form);
    const requestType = requestTypeFor(form, values);
    if (!REQUEST_TYPES.has(requestType)) {
      throw new ValidationError('This request type is not supported.');
    }

    const subject = requireText(
      firstValue(values, ['subject', 'title', 'name', 'topic']),
      requestType === 'suggest_listing' ? 'Listing name' : 'Request title',
      2,
      MAX.subject
    );
    const details = requireText(
      firstValue(values, ['details', 'description', 'request_details']),
      'Details',
      10,
      MAX.details
    );
    const listingType = firstValue(values, ['listing_type', 'entity_type', 'type']);
    const preference = firstValue(values, ['preference', 'format']);

    if (requestType === 'suggest_listing' && !LISTING_TYPES.has(listingType)) {
      throw new ValidationError('Choose practitioner, service, or place.');
    }
    if (requestType === 'looking_for' && preference && !PREFERENCES.has(preference)) {
      throw new ValidationError('Choose online, in person, or either.');
    }

    let sourcePage = window.location.pathname;
    if (values.editorial_intent === 'correction') {
      if (!['services', 'providers', 'places', 'eventFormats', 'scheduledEvents'].includes(values.target_collection) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.target_id || '')) throw new ValidationError('Open the correction link from the listing you want to update.');
      const target = new URLSearchParams({ intent: 'correction', collection: values.target_collection, id: values.target_id });
      sourcePage += '?' + target.toString();
    }
    const contact = requireText(firstValue(values, ['contact', 'contact_details', 'email']), 'Contact', 3, MAX.contact);
    const phoneDigits = contact.replace(/\D/g, '').length;
    const phoneValid = /^\+?[\d ()-]{7,25}$/.test(contact) && phoneDigits >= 7 && phoneDigits <= 15;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) && !/^@[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(contact) && !/^https:\/\/t\.me\/[a-zA-Z][a-zA-Z0-9_]{4,31}\/?$/.test(contact) && !phoneValid) throw new ValidationError('Use an email address, Telegram handle starting with @, or phone number we can reply to.');
    return {
      requestType,
      subject,
      details,
      listingType: requestType === 'suggest_listing' ? listingType : null,
      location: optionalText(firstValue(values, ['location', 'city_country', 'city']), 'Location', MAX.location),
      preference: requestType === 'looking_for' ? (preference || null) : null,
      contact,
      referenceUrl: validatedUrl(firstValue(values, ['reference_url', 'website_url', 'url'])),
      sourcePage: sourcePage.slice(0, MAX.referenceUrl),
      honeypot: firstValue(values, ['_company', 'company_website', 'website'])
    };
  }

  function rpcPayload(request) {
    return {
      p_request_type: request.requestType,
      p_subject: request.subject,
      p_details: request.details,
      p_listing_type: request.listingType,
      p_location: request.location,
      p_preference: request.preference,
      p_contact: request.contact,
      p_reference_url: request.referenceUrl,
      p_source_page: request.sourcePage,
      p_honeypot: request.honeypot || null
    };
  }

  function draftKey(form) {
    // Keep M1 drafts accessible on the general form; bind contextual requests
    // and corrections to their URL so they cannot restore another listing.
    return window.location.search
      ? `${DRAFT_PREFIX}${form.id || requestTypeFor(form)}:${window.location.search}`
      : `${DRAFT_PREFIX}${requestTypeFor(form) || form.id || 'unknown'}`;
  }

  function saveDraft(form) {
    try {
      const values = formValues(form);
      delete values._company;
      delete values.company_website;
      delete values.website;
      localStorage.setItem(draftKey(form), JSON.stringify({
        values,
        savedAt: new Date().toISOString()
      }));
      return true;
    } catch (error) {
      return false;
    }
  }

  function clearDraft(form) {
    try {
      localStorage.removeItem(draftKey(form));
    } catch (error) {
      // Storage can be unavailable in privacy modes; submission still succeeded.
    }
  }

  function restoreDraft(form) {
    let draft;
    try {
      draft = JSON.parse(localStorage.getItem(draftKey(form)) || 'null');
    } catch (error) {
      return false;
    }
    if (!draft || !draft.values || typeof draft.values !== 'object') return false;

    const savedAt = new Date(draft.savedAt).getTime();
    if (!Number.isFinite(savedAt) || Date.now() - savedAt > DRAFT_MAX_AGE_MS) {
      clearDraft(form);
      return false;
    }

    Object.entries(draft.values).forEach(([name, value]) => {
      const field = form.elements.namedItem(name);
      if (!field || field.type === 'hidden' || ['_company', 'company_website', 'website'].includes(name)) return;

      if (typeof RadioNodeList !== 'undefined' && field instanceof RadioNodeList) {
        field.value = value;
      } else if (field.type === 'checkbox') {
        field.checked = value === field.value || value === 'on' || value === 'true';
      } else if (!field.files) {
        field.value = value;
      }
    });
    return true;
  }

  function prefillFromLocation(form) {
    if (form.id === 'join-form') {
      const params = new URLSearchParams(window.location.search);
      const collection = params.get('correct');
      const id = params.get('id');
      const listing = window.LumeyaData?.getById(collection, id);
      const context = form.querySelector('[data-editorial-context]');
      if (collection && listing && ['services', 'providers', 'places', 'eventFormats', 'scheduledEvents'].includes(collection)) {
        form.elements.editorial_intent.value = 'correction';
        form.elements.target_collection.value = collection;
        form.elements.target_id.value = id;
        form.elements.listing_type.value = collection === 'providers' ? 'practitioner' : collection === 'places' ? 'place' : 'service';
        form.elements.subject.value = listing.title || listing.name;
        context.textContent = 'Correction for ' + (listing.title || listing.name) + ' (' + id + '). Explain the change and a source below. Lumeya checks your relationship to the listing before reviewing it; sending does not change the public record.';
      } else if (collection) {
        context.textContent = 'This correction link does not match a published listing. Open the correction link from the current listing.';
        form.dataset.invalidCorrection = 'true';
      }
      return;
    }
    if (requestTypeFor(form) !== 'looking_for') return;
    const params = new URLSearchParams(window.location.search);
    const values = {
      topic: trim(params.get('topic')).slice(0, 120),
      details: trim(params.get('details')).slice(0, 2000),
      city: trim(params.get('city')).slice(0, 100),
      preference: trim(params.get('preference')).slice(0, 20)
    };
    if (values.preference && !PREFERENCES.has(values.preference)) values.preference = '';

    Object.entries(values).forEach(([name, value]) => {
      if (!value) return;
      const field = form.elements.namedItem(name);
      if (field && !trim(field.value)) field.value = value;
    });
  }

  function statusElement(form) {
    let status = form.querySelector('[data-public-request-status], [data-form-status], .public-request-status');
    if (!status) {
      status = document.createElement('p');
      status.className = 'public-request-status';
      status.dataset.publicRequestStatus = '';
      status.setAttribute('aria-live', 'polite');
      form.appendChild(status);
    }
    return status;
  }

  function setStatus(form, message, state) {
    const status = statusElement(form);
    status.textContent = message;
    status.dataset.state = state;
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('role', state === 'error' ? 'alert' : 'status');
  }

  function fallbackElement(form) {
    let fallback = form.querySelector('[data-public-request-fallback], [data-telegram-fallback], .public-request-fallback');
    if (!fallback) {
      fallback = document.createElement('div');
      fallback.className = 'public-request-fallback';
      fallback.dataset.publicRequestFallback = '';
      form.appendChild(fallback);
    }
    return fallback;
  }

  function requestSummary(request) {
    const lines = [
      `Lumeya public request: ${request.requestType}`,
      `Subject: ${request.subject}`
    ];
    if (request.listingType) lines.push(`Listing type: ${request.listingType}`);
    if (request.location) lines.push(`Location: ${request.location}`);
    if (request.preference) lines.push(`Preference: ${request.preference}`);
    if (request.contact) lines.push(`Contact: ${request.contact}`);
    if (request.referenceUrl) lines.push(`Link: ${request.referenceUrl}`);
    lines.push(`Source: ${request.sourcePage}`);
    lines.push('', 'Details:', request.details);
    return lines.join('\n');
  }

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('copy_failed');
  }

  function hideFallback(form) {
    const fallback = form.querySelector('[data-public-request-fallback], [data-telegram-fallback], .public-request-fallback');
    if (fallback) {
      fallback.hidden = true;
      fallback.replaceChildren();
    }
  }

  function showFallback(form, request) {
    const fallback = fallbackElement(form);
    fallback.replaceChildren();
    fallback.hidden = false;

    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = 'button public-request-copy';
    copyButton.dataset.copyRequest = '';
    copyButton.textContent = 'Copy details';
    copyButton.addEventListener('click', async () => {
      try {
        let currentRequest = request;
        try {
          currentRequest = collectRequest(form);
        } catch (error) {
          // Preserve the last valid submission snapshot if fields were edited invalidly.
        }
        await copyText(requestSummary(currentRequest));
        setStatus(form, 'Details copied; nothing has been sent. Open Telegram, paste the details, and send the message to the Lumeya operator.', 'draft');
      } catch (error) {
        setStatus(form, 'Copy failed. Select the details manually or retry copying. Nothing has been sent.', 'error');
      }
    });

    const telegramLink = document.createElement('a');
    telegramLink.className = 'button button--primary public-request-telegram';
    telegramLink.href = TELEGRAM_URL;
    telegramLink.target = '_blank';
    telegramLink.rel = 'noopener noreferrer';
    telegramLink.textContent = 'Open Telegram';
    telegramLink.addEventListener('click', () => setStatus(form, 'Opening Telegram does not send the request. Paste the copied details and press Send in the chat with the Lumeya operator.', 'draft'));

    fallback.append(copyButton, telegramLink);
  }

  function setSubmitting(form, submitting) {
    form.setAttribute('aria-busy', String(submitting));
    form.querySelectorAll('button[type="submit"], input[type="submit"]').forEach((button) => {
      button.disabled = submitting || form.dataset.invalidCorrection === 'true';
    });
  }

  async function submitRequest(form) {
    if (form.getAttribute('aria-busy') === 'true') return;
    if (form.dataset.invalidCorrection === 'true') {
      setStatus(form, 'Open the correction link from a current listing before sending.', 'error');
      return;
    }
    if (!form.reportValidity()) return;

    let request;
    try {
      request = collectRequest(form);
    } catch (error) {
      setStatus(form, error instanceof ValidationError ? error.message : 'Check the form and try again.', 'error');
      return;
    }

    const draftSaved = saveDraft(form);
    const draftMessage = draftSaved ? 'A draft is saved in this browser for seven days.' : 'Browser storage is unavailable; keep or copy these details before leaving.';
    hideFallback(form);

    if (!routeAvailable()) {
      setStatus(form, (navigator.onLine ? 'Online requests are not configured here. ' : 'You are offline. ') + draftMessage + ' Nothing has been sent; choose a manual option below.', 'error');
      showFallback(form, request);
      return;
    }

    setSubmitting(form, true);
    setStatus(form, 'Sending…', 'sending');
    try {
      let timer;
      const result = await Promise.race([
        localIntake() ? localIntake().submit(rpcPayload(request)) : window.supabaseClient.rpc(RPC_NAME, rpcPayload(request)),
        new Promise((resolve, reject) => { timer = setTimeout(() => reject(new Error('receipt_timeout')), 15000); })
      ]).finally(() => clearTimeout(timer));
      const { data, error } = result;
      if (error) throw error;
      const receiptId = typeof data === 'string' ? data : data?.id;
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(receiptId || '')) throw new Error('receipt_not_confirmed');

      clearDraft(form);
      hideFallback(form);
      setStatus(form, localIntake()
        ? 'Saved to the operator’s private local queue. Receipt: ' + receiptId + '. This is a local preview; no hosted receipt or Telegram delivery is confirmed. The operator must review before publication.'
        : 'Saved to Lumeya’s private request queue. Receipt: ' + receiptId + '. A Lumeya operator reviews it and follows up using your contact. Notification delivery is not confirmed; this does not book a service or publish a listing.', 'success');
    } catch (error) {
      setStatus(form, 'A receipt could not be confirmed. ' + draftMessage + ' Retry the same details or choose a manual option; the operator checks duplicates before publication.', 'error');
      showFallback(form, request);
    } finally {
      setSubmitting(form, false);
    }
  }

  function initForm(form) {
    if (form.dataset.publicRequestReady === 'true') return;
    form.dataset.publicRequestReady = 'true';
    let updateRouteAvailability = null;
    if (form.dataset.requiresPublicClient === 'true') {
      updateRouteAvailability = function () {
        const available = routeAvailable();
        form.dataset.publicRequestUnavailable = String(!available);
        form.querySelectorAll('button[type="submit"], input[type="submit"]').forEach((button) => {
          button.disabled = form.dataset.invalidCorrection === 'true' || form.getAttribute('aria-busy') === 'true';
        });
        if (!available) {
          setStatus(form, navigator.onLine ? 'Online requests are not configured here. You can prepare details and choose a manual contact option.' : 'You are offline. You can prepare a draft and send it when connected.', 'error');
        } else if (form.dataset.publicRequestUnavailable === 'false' && form.dataset.routeWasUnavailable === 'true') {
          setStatus(form, 'Online submission is available.', 'success');
        } else if (form.querySelector('[data-form-status]')?.textContent === 'Checking online request availability…') {
          setStatus(form, localIntake() ? 'Local preview: requests are saved to a private operator queue on this computer. Hosted receipt and notification delivery are untested.' : 'Online submission is configured here. A saved receipt will confirm persistence; notification delivery is separate.', 'success');
        }
        form.dataset.routeWasUnavailable = String(!available);
      };
      window.addEventListener('online', updateRouteAvailability);
      window.addEventListener('offline', updateRouteAvailability);
    }
    if (restoreDraft(form)) {
      setStatus(form, 'Draft restored from this browser.', 'draft');
    }
    prefillFromLocation(form);
    if (updateRouteAvailability) updateRouteAvailability();

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitRequest(form);
    });
  }

  function init(root = document) {
    root.querySelectorAll(FORM_SELECTOR).forEach(initForm);
  }

  window.LumeyaPublicForms = { init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  } else {
    init();
  }
})();
