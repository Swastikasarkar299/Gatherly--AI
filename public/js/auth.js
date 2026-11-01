// Gatherly Authentication Controller

const auth = {
  currentUser: null,

  async init() {
    const token = api.getToken();
    if (token) {
      try {
        const res = await api.getMe();
        if (res.success && res.user) {
          this.currentUser = res.user;
          this.updateUserUI();
          return;
        }
      } catch (e) {
        api.setToken('');
      }
    }

    // Default demo session if no token
    this.currentUser = {
      name: 'Sarah Jenkins',
      email: 'demo@gatherly.ai',
      role: 'planner'
    };
    this.updateUserUI();
  },

  updateUserUI() {
    const nameEl = document.getElementById('user-display-name');
    const roleEl = document.getElementById('user-display-role');
    const avatarEl = document.getElementById('user-avatar-initials');

    if (nameEl) nameEl.textContent = this.currentUser?.name || 'Guest User';
    if (roleEl) roleEl.textContent = (this.currentUser?.role || 'User').toUpperCase();
    if (avatarEl) {
      const initials = (this.currentUser?.name || 'GU')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      avatarEl.textContent = initials;
    }
  },

  openAuthModal(mode = 'login') {
    const loginTab = document.getElementById('auth-login-tab');
    const registerTab = document.getElementById('auth-register-tab');
    if (mode === 'login' && loginTab) {
      new bootstrap.Tab(loginTab).show();
    } else if (registerTab) {
      new bootstrap.Tab(registerTab).show();
    }
    new bootstrap.Modal(document.getElementById('authModal')).show();
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const res = await api.login(email, password);
      if (res.success && res.token) {
        api.setToken(res.token);
        this.currentUser = res.user;
        this.updateUserUI();
        app.showToast(`Welcome back, ${res.user.name}!`, 'success');
        bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
        await app.loadEvents();
      }
    } catch (err) {
      app.showToast(`Login failed: ${err.message}`, 'danger');
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;

    try {
      const res = await api.register(name, email, password, role);
      if (res.success && res.token) {
        api.setToken(res.token);
        this.currentUser = res.user;
        this.updateUserUI();
        app.showToast(`Account created! Welcome to Gatherly, ${res.user.name}!`, 'success');
        bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
        await app.loadEvents();
      }
    } catch (err) {
      app.showToast(`Registration failed: ${err.message}`, 'danger');
    }
  },

  demoLogin() {
    document.getElementById('login-email').value = 'demo@gatherly.ai';
    document.getElementById('login-password').value = 'password123';
    document.getElementById('login-form').dispatchEvent(new Event('submit'));
  },

  logout() {
    api.setToken('');
    this.currentUser = null;
    app.showToast('You have been logged out.', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
};

