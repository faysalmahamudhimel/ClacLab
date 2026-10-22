(() => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const config = window.CALCLAB_CONTACT || { email: '', socialLinks: [] };
  const methods = document.getElementById('contactMethods');
  const fields = [
    { name: 'name', errorId: 'contactNameError', label: 'Full name', invalid: (input) => !input.value.trim() ? 'Please enter your name.' : '' },
    { name: 'from_email', errorId: 'contactEmailError', label: 'Email address', invalid: (input) => !input.value.trim() ? 'Please enter your email address.' : !input.validity.valid ? 'Enter a valid email address.' : '' },
    { name: 'title', errorId: 'contactSubjectError', label: 'Subject', invalid: (input) => !input.value.trim() ? 'Please add a subject.' : '' },
    { name: 'message', errorId: 'contactMessageError', label: 'Message', invalid: (input) => !input.value.trim() ? 'Please write a message.' : '' }
  ];

  function addMethodCard(title, description, href, icon, external = false) {
    const link = document.createElement('a');
    link.className = 'contact-method-card';
    link.href = href;
    if (external) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    link.innerHTML = `<span class="contact-method-icon" aria-hidden="true">${icon}</span><span class="contact-method-copy"><strong></strong><small></small></span><span class="contact-method-arrow" aria-hidden="true">↗</span>`;
    link.querySelector('strong').textContent = title;
    link.querySelector('small').textContent = description;
    methods.append(link);
  }

  let hasConfiguredContact = false;
  if (config.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email)) {
    const gmailCompose = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(config.email)}`;
    addMethodCard('Email', config.email, gmailCompose, '✉', true);
    hasConfiguredContact = true;
  } else {
    addMethodCard('Email', 'No public email set · use the form', '#contactForm', '✉');
  }
  (Array.isArray(config.socialLinks) ? config.socialLinks : []).forEach((profile) => {
    if (!profile || typeof profile.label !== 'string' || typeof profile.url !== 'string') return;
    try {
      const url = new URL(profile.url);
      if (url.protocol === 'https:') {
        addMethodCard(profile.label, profile.handle || 'Visit profile', url.href, profile.icon || '↗', true);
        hasConfiguredContact = true;
      }
    } catch (_) { /* Ignore invalid optional contact links. */ }
  });
  if (!hasConfiguredContact) {
    const note = document.createElement('p');
    note.className = 'contact-config-note';
    note.textContent = 'Public email and social links can be added in contact-config.js.';
    methods.append(note);
  }

  const status = document.getElementById('contactStatus');
  const submitButton = document.getElementById('contactSubmit');
  const buttonText = submitButton.querySelector('span');

  function validateField(field) {
    const input = form.elements.namedItem(field.name);
    const error = document.getElementById(field.errorId);
    const message = field.invalid(input);
    input.setAttribute('aria-invalid', String(Boolean(message)));
    error.textContent = message;
    return !message;
  }

  fields.forEach((field) => {
    const input = form.elements.namedItem(field.name);
    input.addEventListener('blur', () => validateField(field));
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validateField(field);
      status.textContent = '';
      status.className = 'contact-status';
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitButton.disabled) return;
    const valid = fields.map(validateField).every(Boolean);
    if (!valid) {
      status.textContent = 'Please fix the highlighted fields and try again.';
      status.className = 'contact-status is-error';
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    submitButton.disabled = true;
    form.setAttribute('aria-busy', 'true');
    buttonText.textContent = 'Sending…';
    status.textContent = 'Sending your message…';
    status.className = 'contact-status is-pending';

    try {
      const emailjsConfig = config.emailjs || {};
      if (!window.emailjs || !emailjsConfig.serviceId || !emailjsConfig.templateId || !emailjsConfig.publicKey) {
        throw new Error('Email service is not configured.');
      }
      if (form.elements.namedItem('bot-field').value) {
        form.reset();
        status.textContent = 'Thanks! Your message was sent successfully.';
        status.className = 'contact-status is-success';
        return;
      }
      await window.emailjs.sendForm(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        form,
        { publicKey: emailjsConfig.publicKey }
      );
      form.reset();
      fields.forEach((field) => {
        const input = form.elements.namedItem(field.name);
        input.removeAttribute('aria-invalid');
        document.getElementById(field.errorId).textContent = '';
      });
      status.textContent = 'Thanks! Your message was sent successfully.';
      status.className = 'contact-status is-success';
    } catch (_) {
      status.textContent = 'Your message could not be sent. Please try again in a moment.';
      status.className = 'contact-status is-error';
    } finally {
      submitButton.disabled = false;
      form.setAttribute('aria-busy', 'false');
      buttonText.textContent = 'Send message';
    }
  });
})();
