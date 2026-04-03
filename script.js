/* ===== script.js — Sugantra ===== */

(function () {
  'use strict';

  /* ─── Header scroll behaviour ─── */
  const header = document.getElementById('site-header');

  function handleScroll() {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run once on load

  /* ─── Hero Canvas Particle System ─── */
  (function initHeroParticles() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const hero = document.getElementById('hero');
    let W, H, particles = [], animId;

    // Particle factory
    function createParticle() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 2.0 + 0.5,        // radius 0.5–2.5px
        opacity: Math.random() * 0.4 + 0.1,        // 0.1–0.5 for glow
        speedX: (Math.random() - 0.5) * 0.25,     // slow horizontal drift
        speedY: -(Math.random() * 0.4 + 0.1),     // gently rising
        pulse: Math.random() * Math.PI * 2,       // phase offset for twinkle
        pulseSpeed: Math.random() * 0.015 + 0.006, // twinkle speed
      };
    }

    function resize() {
      const rect = hero.getBoundingClientRect();
      W = canvas.width = rect.width;
      H = canvas.height = rect.height;
      // Rebuild particles scaled to new size
      const COUNT = Math.min(Math.floor((W * H) / 5000), 200);
      particles = Array.from({ length: COUNT }, createParticle);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      particles.forEach(p => {
        // Twinkle: pulse opacity slightly
        p.pulse += p.pulseSpeed;
        const twinkle = Math.sin(p.pulse) * 0.15;
        const alpha = Math.max(0, Math.min(1, p.opacity + twinkle));

        // Gradient per particle - glowing sun dust
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.8);
        grad.addColorStop(0, `rgba(255, 235, 180, ${alpha})`);
        grad.addColorStop(0.5, `rgba(230, 195, 130,  ${alpha * 0.7})`);
        grad.addColorStop(1, `rgba(210, 165, 100,  0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Move
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap: when a particle floats off top, respawn at bottom
        if (p.y + p.r < 0) { p.y = H + p.r; p.x = Math.random() * W; }
        if (p.x + p.r < 0) { p.x = W + p.r; }
        if (p.x - p.r > W) { p.x = -p.r; }
      });

      animId = requestAnimationFrame(draw);
    }

    // Pause when hero leaves viewport (performance)
    const heroObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          if (!animId) draw();
        } else {
          cancelAnimationFrame(animId);
          animId = null;
        }
      });
    }, { threshold: 0 });

    heroObserver.observe(hero);

    resize();
    draw();

    // Debounced resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cancelAnimationFrame(animId);
        animId = null;
        resize();
        draw();
      }, 200);
    });
  })();

  /* ─── Hamburger / Mobile Nav ─── */
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const navLinks = document.getElementById('nav-links');
  const navBackdrop = document.getElementById('nav-backdrop');
  const siteHeader = document.getElementById('site-header');

  function openMenu() {
    hamburgerBtn.classList.add('is-active');
    navLinks.classList.add('is-open');
    if (navBackdrop) navBackdrop.classList.add('show');
    if (siteHeader) siteHeader.classList.add('menu-open');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    hamburgerBtn.classList.remove('is-active');
    navLinks.classList.remove('is-open');
    if (navBackdrop) navBackdrop.classList.remove('show');
    if (siteHeader) siteHeader.classList.remove('menu-open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburgerBtn.addEventListener('click', () => {
    const isOpen = navLinks.classList.contains('is-open');
    isOpen ? closeMenu() : openMenu();
  });

  if (navBackdrop) navBackdrop.addEventListener('click', closeMenu);

  // Close menu when a nav link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('is-open')) {
      closeMenu();
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (
      navLinks.classList.contains('is-open') &&
      !navLinks.contains(e.target) &&
      !hamburgerBtn.contains(e.target)
    ) {
      closeMenu();
    }
  });

  /* ─── Product Filter ─── */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.product-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      productCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.classList.remove('hidden');
          // Trigger a small re-animation
          card.style.animation = 'none';
          card.offsetHeight; // reflow
          card.style.animation = '';
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  /* ─── Cart Toast ─── */
  const toast = document.getElementById('cart-toast');
  const toastMsg = document.getElementById('toast-msg');
  let toastTimer = null;

  function showToast(message) {
    toastMsg.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  /* ─── Cart System & Checkout ─── */
  const cartBadge = document.getElementById('cart-badge');
  const cartSidebar = document.getElementById('cart-sidebar');
  const cartBackdrop = document.getElementById('cart-backdrop');
  const cartOpenBtn = document.getElementById('cart-open-btn');
  const cartCloseBtn = document.getElementById('cart-close-btn');
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartSubtotalPrice = document.getElementById('cart-subtotal-price');
  const btnCheckout = document.getElementById('btn-checkout');
  const checkoutModal = document.getElementById('checkout-modal');
  const btnModalClose = document.getElementById('btn-modal-close');
  const emptyMsg = document.querySelector('.cart-empty-msg');

  // Load from local storage
  let cart = JSON.parse(localStorage.getItem('sugantra_cart')) || [];

  function saveCart() {
    localStorage.setItem('sugantra_cart', JSON.stringify(cart));
  }

  function toggleCart(show) {
    if (!cartSidebar) return;
    if (show) {
      cartSidebar.classList.add('open');
      cartBackdrop.classList.add('show');
      document.body.style.overflow = 'hidden'; // prevent background scrolling
    } else {
      cartSidebar.classList.remove('open');
      cartBackdrop.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  if (cartOpenBtn) cartOpenBtn.addEventListener('click', () => toggleCart(true));
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', () => toggleCart(false));
  if (cartBackdrop) cartBackdrop.addEventListener('click', () => toggleCart(false));

  function renderCart() {
    if (!cartBadge || !cartItemsContainer) return;

    // Calculate total quantity and subtotal
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Update Badge
    cartBadge.textContent = totalItems;
    if (totalItems > 0) {
      cartBadge.style.display = 'flex';
      btnCheckout.disabled = false;
      emptyMsg.classList.remove('show');
    } else {
      cartBadge.style.display = 'none';
      btnCheckout.disabled = true;
      emptyMsg.classList.add('show');
    }

    // Update Subtotal
    if (cartSubtotalPrice) cartSubtotalPrice.textContent = `₹ ${subtotal.toLocaleString()}`;

    // Clear current items (keep empty msg)
    Array.from(cartItemsContainer.children).forEach(child => {
      if (!child.classList.contains('cart-empty-msg')) child.remove();
    });

    // Render items
    cart.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
        <div class="cart-item-info">
          <span class="cart-item-title">${item.name}</span>
          <span class="cart-item-price">₹ ${item.price.toLocaleString()}</span>
          <div class="cart-qty-ctrl">
            <button class="qty-btn dec" data-id="${item.id}">-</button>
            <span class="qty-num">${item.quantity}</span>
            <button class="qty-btn inc" data-id="${item.id}">+</button>
          </div>
        </div>
        <button class="cart-item-remove" data-id="${item.id}" aria-label="Remove item">&times;</button>
      `;
      cartItemsContainer.insertBefore(itemEl, emptyMsg);
    });
  }

  // Handle Cart Interactions (Delegation)
  if (cartItemsContainer) {
    cartItemsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const id = btn.dataset.id;
      const itemIndex = cart.findIndex(i => i.id === id);
      if (itemIndex < 0) return;

      if (btn.classList.contains('inc')) {
        cart[itemIndex].quantity++;
      } else if (btn.classList.contains('dec')) {
        cart[itemIndex].quantity--;
        if (cart[itemIndex].quantity <= 0) {
          cart.splice(itemIndex, 1);
        }
      } else if (btn.classList.contains('cart-item-remove')) {
        cart.splice(itemIndex, 1);
      }

      saveCart();
      renderCart();
    });
  }

  document.querySelectorAll('.btn-add-cart').forEach((btn, index) => {
    // Assign generic ID if needed
    const card = btn.closest('.product-card');
    card.dataset.productId = `prod_${index}`;

    btn.addEventListener('click', (e) => {
      e.preventDefault();

      const id = card.dataset.productId;
      const name = card.querySelector('.product-name').textContent;
      const priceStr = card.querySelector('.product-price').textContent;
      const price = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
      const image = card.querySelector('.product-img').getAttribute('src');

      const existingItem = cart.find(i => i.id === id);
      if (existingItem) {
        existingItem.quantity++;
      } else {
        cart.push({ id, name, price, image, quantity: 1 });
      }

      saveCart();
      renderCart();
      toggleCart(true); // Automatically slide out cart to show feedback
    });
  });

  // Checkout Flow
  if (btnCheckout && checkoutModal) {
    btnCheckout.addEventListener('click', () => {
      toggleCart(false);
      checkoutModal.classList.add('show');
      // Clear cart on successful placement
      cart = [];
      saveCart();
      renderCart();
    });

    btnModalClose.addEventListener('click', () => {
      checkoutModal.classList.remove('show');
    });
  }

  // Initial render on load
  renderCart();

  /* ─── Newsletter Form ─── */
  const newsletterForm = document.getElementById('newsletter-form');
  const newsletterSuccess = document.getElementById('form-success');

  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameVal = document.getElementById('newsletter-name').value.trim();
    const emailVal = document.getElementById('newsletter-email').value.trim();

    if (!nameVal || !emailVal) {
      newsletterSuccess.textContent = 'Please fill in both fields.';
      newsletterSuccess.style.color = '#d4a0b0';
      return;
    }

    if (!isValidEmail(emailVal)) {
      newsletterSuccess.textContent = 'Please enter a valid email address.';
      newsletterSuccess.style.color = '#d4a0b0';
      return;
    }

    // Simulate success
    newsletterSuccess.textContent = `Welcome to the circle, ${nameVal.split(' ')[0]}! ✦`;
    newsletterSuccess.style.color = '#8fb8a4';
    newsletterForm.reset();

    setTimeout(() => {
      newsletterSuccess.textContent = '';
    }, 5000);
  });

  /* ─── Contact Form ─── */
  const contactForm = document.getElementById('contact-form');
  const contactSuccess = document.getElementById('contact-success');

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !email || !message) {
      contactSuccess.textContent = 'Please fill in the required fields.';
      contactSuccess.style.color = '#d4a0b0';
      return;
    }

    if (!isValidEmail(email)) {
      contactSuccess.textContent = 'Please enter a valid email address.';
      contactSuccess.style.color = '#d4a0b0';
      return;
    }

    // Simulate success
    const submitBtn = document.getElementById('contact-submit');
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    setTimeout(() => {
      contactSuccess.textContent = `Thank you, ${name.split(' ')[0]}! We'll get back to you within 24 hours. ✦`;
      contactSuccess.style.color = '#8fb8a4';
      contactForm.reset();
      submitBtn.textContent = 'Send Message';
      submitBtn.disabled = false;

      setTimeout(() => {
        contactSuccess.textContent = '';
      }, 6000);
    }, 1200);
  });

  /* ─── Utility: Email validation ─── */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* ─── FAQ Accordion ─── */
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const isExpanded = question.getAttribute('aria-expanded') === 'true';

      // Close all other accordions (Optional, but makes it cleaner)
      faqQuestions.forEach(q => {
        q.setAttribute('aria-expanded', 'false');
        const answer = q.nextElementSibling;
        answer.style.maxHeight = null;
      });

      // If it wasn't already expanded, open it
      if (!isExpanded) {
        question.setAttribute('aria-expanded', 'true');
        const answer = question.nextElementSibling;
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });

    // Handle resize to fix max-height bugs if window resizes while opened
    window.addEventListener('resize', () => {
      if (question.getAttribute('aria-expanded') === 'true') {
        const answer = question.nextElementSibling;
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });

  /* ─── Scroll-triggered fade-in ─── */
  const fadeEls = document.querySelectorAll(
    '.product-card, .ritual-step, .testimonial-card, .about-card, .pillar, .contact-item'
  );

  fadeEls.forEach(el => el.classList.add('fade-in'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  fadeEls.forEach(el => observer.observe(el));

  /* ─── Smooth active nav highlighting ─── */
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-link');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navItems.forEach(item => {
            item.classList.toggle(
              'nav-active',
              item.getAttribute('href') === `#${id}`
            );
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach(s => sectionObserver.observe(s));

  /* ─── Scroll to Top Button ─── */
  const scrollTopBtn = document.getElementById('scroll-top-btn');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      // Show button when scrolled down 500px
      if (window.scrollY > 500) {
        scrollTopBtn.classList.add('show');
      } else {
        scrollTopBtn.classList.remove('show');
      }
    });

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

})();
