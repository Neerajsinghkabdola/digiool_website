/* ==========================================================================
   Digiool — script.js
   Sticky nav, mobile menu, smooth scroll, scroll-reveal, battery-efficient
   custom cursor, contact form UI handling.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Sticky nav appearance on scroll (rAF throttled) ---------- */
  const nav = document.getElementById('nav');
  let navTicking = false;

  const onScroll = () => {
    if (!navTicking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 24) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
        navTicking = false;
      });
      navTicking = true;
    }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu with accessibility & escape key ---------- */
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  const closeMenu = () => {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.classList.remove('open');
    mobileMenu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.removeProperty('overflow');
  };

  const openMenu = () => {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.classList.add('open');
    mobileMenu.classList.add('open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        closeMenu();
        menuToggle.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && mobileMenu.classList.contains('open')) closeMenu();
    }, { passive: true });
  }

  /* ---------- Smooth scroll for all in-page anchor links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#' || href.length < 2) {
        closeMenu();
        return;
      }
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        closeMenu();
        const navHeight = nav ? nav.offsetHeight : 70;
        const top = target.getBoundingClientRect().top + window.pageYOffset - (navHeight - 8);
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ---------- Scroll-reveal (IntersectionObserver) ---------- */
  const revealTargets = document.querySelectorAll('.reveal, .reveal-line');

  if ('IntersectionObserver' in window && revealTargets.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    revealTargets.forEach(el => io.observe(el));
  } else {
    // Fallback: show everything immediately
    revealTargets.forEach(el => el.classList.add('in-view'));
  }

  /* ---------- Custom cursor (desktop fine-pointer, battery optimized) ---------- */
  const isFinePointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (isFinePointer && !prefersReducedMotion) {
    document.body.classList.add('has-cursor');

    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');

    if (dot && ring) {
      let dotX = null, dotY = null, ringX = null, ringY = null;
      let targetX = null, targetY = null;
      let animId = null;

      const updateCursor = () => {
        if (targetX === null) return;
        if (dotX === null) {
          dotX = targetX; dotY = targetY;
          ringX = targetX; ringY = targetY;
          document.body.classList.add('cursor-active');
        } else {
          dotX = targetX;
          dotY = targetY;
        }

        dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;

        ringX += (targetX - ringX) * 0.18;
        ringY += (targetY - ringY) * 0.18;
        ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;

        // Sleep the loop when ring reaches target to save battery/CPU
        const dist = Math.hypot(targetX - ringX, targetY - ringY);
        if (dist > 0.15) {
          animId = requestAnimationFrame(updateCursor);
        } else {
          animId = null;
        }
      };

      window.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        document.body.classList.remove('cursor-hidden');
        if (!animId) {
          animId = requestAnimationFrame(updateCursor);
        }
      }, { passive: true });

      document.addEventListener('mouseleave', () => {
        document.body.classList.add('cursor-hidden');
      });

      document.addEventListener('mouseenter', () => {
        document.body.classList.remove('cursor-hidden');
      });

      // Event delegation for hover states
      document.addEventListener('mouseover', (e) => {
        if (e.target.closest('a, button, .work-card, .service-row, input, select, textarea, .client-chip')) {
          ring.classList.add('hovering');
        }
      });
      document.addEventListener('mouseout', (e) => {
        if (e.target.closest('a, button, .work-card, .service-row, input, select, textarea, .client-chip')) {
          ring.classList.remove('hovering');
        }
      });
    }
  }

  /* ---------- Subtle parallax on hero board (desktop only, rAF throttled) ---------- */
  const heroBoard = document.querySelector('.hero-board');
  if (heroBoard && isFinePointer && !prefersReducedMotion) {
    let parallaxTicking = false;
    window.addEventListener('scroll', () => {
      if (!parallaxTicking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          if (y < window.innerHeight) {
            heroBoard.style.transform = `translateY(${y * 0.08}px)`;
          }
          parallaxTicking = false;
        });
        parallaxTicking = true;
      }
    }, { passive: true });
  }

  /* ---------- Contact form handling & validation ---------- */
  const form = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');

  if (form && formNote) {
    // Clear validation messages on input
    form.addEventListener('input', () => {
      if (formNote.textContent) formNote.textContent = '';
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameField = form.querySelector('#name');
      const emailField = form.querySelector('#email');

      if (!nameField || !nameField.value.trim()) {
        formNote.textContent = 'Please enter your name.';
        formNote.style.color = '#B3432B';
        if (nameField) nameField.focus();
        return;
      }

      const emailVal = emailField ? emailField.value.trim() : '';
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailVal || !emailPattern.test(emailVal)) {
        formNote.textContent = 'Please enter a valid email address.';
        formNote.style.color = '#B3432B';
        if (emailField) emailField.focus();
        return;
      }

      const formData = new FormData(form);
      const subject = encodeURIComponent(`New enquiry from ${formData.get('name')}`);
      const body = encodeURIComponent([
        `Name: ${formData.get('name')}`,
        `Business / Brand: ${formData.get('business') || 'Not provided'}`,
        `Email: ${formData.get('email')}`,
        `Phone / WhatsApp: ${formData.get('phone') || 'Not provided'}`,
        `Help needed: ${formData.get('need') || 'Not specified'}`,
        '',
        formData.get('message') || 'No additional details provided.'
      ].join('\n'));

      window.location.href = `mailto:connect@digiool.com?subject=${subject}&body=${body}`;
      formNote.textContent = 'Your email app is opening with the enquiry ready to send.';
      formNote.style.color = 'var(--accent)';
      form.reset();
    });
  }

});
