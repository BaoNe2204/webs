// assets/js/auth-local.js
(() => {
    const USERS_KEY = "users";
    const CURRENT_USER_KEY = "currentUser";

    // ---------- helpers ----------
    const $ = (s, r = document) => r.querySelector(s);
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const enc = new TextEncoder();

    const toast = (msg, type = "info", ms = 2000) => {
        const el = document.createElement("div");
        el.className = `toast toast--${type}`;
        Object.assign(el.style, {
            position: "fixed", top: "12px", right: "12px",
            background: type === "error" ? "#ef4444" : type === "success" ? "#22c55e" : "#2563eb",
            color: "#fff", padding: "10px 12px", borderRadius: "10px", zIndex: 9999, boxShadow: "0 6px 20px rgba(0,0,0,.15)"
        });
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), ms);
    };

    const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

    async function sha256Hex(data) {
        const buf = await crypto.subtle.digest("SHA-256", data);
        return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
    }

    async function hashPassword(password, saltHex) {
        const salt = saltHex || [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, "0")).join("");
        const data = enc.encode(password + ":" + salt);
        const hex = await sha256Hex(data);
        return `${salt}:${hex}`; // store "salt:hash"
    }

    async function verifyPassword(password, stored) {
        const [salt, hash] = String(stored || "").split(":");
        if (!salt || !hash) return false;
        const tryHash = await hashPassword(password, salt);
        return tryHash.split(":")[1] === hash;
    }

    function loadUsers() {
        try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; }
    }
    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    function getCurrentUser() {
        try { return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null"); } catch { return null; }
    }
    function setCurrentUser(user) {
        if (user) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        else localStorage.removeItem(CURRENT_USER_KEY);
    }

    // ---------- public-ish API on window (tiện dùng nơi khác) ----------
    const Auth = {
        async signUp({ name = "", email = "", password = "" }) {
            email = String(email || "").trim().toLowerCase();
            if (!emailRe.test(email)) throw new Error("Email không hợp lệ");
            if ((password || "").length < 6) throw new Error("Mật khẩu tối thiểu 6 ký tự");

            const users = loadUsers();
            if (users.some(u => u.email === email)) throw new Error("Email đã tồn tại");

            const passwordHash = await hashPassword(password);
            const user = { id: uid(), name: name.trim(), email, passwordHash, createdAt: new Date().toISOString() };
            users.push(user); saveUsers(users);

            const current = { id: user.id, name: user.name, email: user.email };
            setCurrentUser(current);
            return current;
        },

        async signIn({ email = "", password = "" }) {
            email = String(email || "").trim().toLowerCase();
            const users = loadUsers();
            const user = users.find(u => u.email === email);
            if (!user || !(await verifyPassword(password, user.passwordHash))) {
                throw new Error("Email hoặc mật khẩu không đúng");
            }
            const current = { id: user.id, name: user.name, email: user.email };
            setCurrentUser(current);
            return current;
        },

        signOut() { setCurrentUser(null); },
        me() { return getCurrentUser(); },

        // Bảo vệ trang: nếu chưa login thì chuyển hướng
        requireAuth(redirectTo = "sign-in.html") {
            if (!getCurrentUser()) location.href = redirectTo;
        }
    };
    window.Auth = Auth;

    // ---------- wire forms if present ----------
    const signUpForm = $("#sign-up-form");
    if (signUpForm) {
        signUpForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = $("#sign-up-name")?.value ?? "";
            const email = $("#sign-up-email")?.value ?? "";
            const password = $("#sign-up-password")?.value ?? "";
            const confirm = $("#sign-up-confirm")?.value ?? "";
            if (password !== confirm) { toast("Mật khẩu nhập lại không khớp", "error"); return; }
            try {
                const me = await Auth.signUp({ name, email, password });
                toast("Đăng ký thành công!", "success");
                location.href = "profile.html";
            } catch (err) { toast(err.message || "Lỗi đăng ký", "error"); }
        });
    }

    const signInForm = $("#sign-in-form");
    if (signInForm) {
        signInForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = $("#sign-in-email")?.value ?? "";
            const password = $("#sign-in-password")?.value ?? "";
            try {
                const me = await Auth.signIn({ email, password });
                toast("Đăng nhập thành công!", "success");
                location.href = "index.html";
            } catch (err) { toast(err.message || "Lỗi đăng nhập", "error"); }
        });
    }

    // ---------- header auth mini-UI ----------
    async function renderAuthSlot() {
        const slot = document.querySelector("[data-auth-slot]");
        if (!slot) return;
        const me = Auth.me();

        if (me) {
            // Khi đã login: render avatar + dropdown
            slot.innerHTML = `
      <div class="top-act__user">
        <img src="./assets/img/avatar.jpg" alt="" class="top-act__avatar" />

        <!-- Dropdown -->
        <div class="act-dropdown top-act__dropdown">
          <div class="act-dropdown__inner user-menu">
            <img src="./assets/icons/arrow-up.png" alt="" class="act-dropdown__arrow top-act__dropdown-arrow" />

            <div class="user-menu__top">
              <img src="./assets/img/avatar.jpg" alt="" class="user-menu__avatar" />
              <div>
                <p class="user-menu__name">${me.name || me.email}</p>
                <p>@${me.email.split("@")[0]}</p>
              </div>
            </div>

            <ul class="user-menu__list">
              <li><a href="./profile.html" class="user-menu__link">Profile</a></li>
              <li><a href="./favourite.html" class="user-menu__link">Favourite list</a></li>
              <li class="user-menu__separate">
                <a href="#!" class="user-menu__link" id="switch-theme-btn">
                  <span>Dark mode</span>
                  <img src="./assets/icons/sun.svg" alt="" class="icon user-menu__icon" />
                </a>
              </li>
              <li><a href="#!" class="user-menu__link">Settings</a></li>
              <li class="user-menu__separate">
                <!-- CHANGED: thêm data-logout để JS bắt sự kiện -->
                <a href="#!" class="user-menu__link" data-logout>Logout</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    `;
        } else {
            // Khi chưa login
            slot.innerHTML = `
      <a href="./sign-in.html" class="btn btn--text d-md-none">Sign In</a>
      <a href="./sign-up.html" class="top-act__sign-up btn btn--primary">Sign Up</a>
    `;
        }
    }

    renderAuthSlot();

    document.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-logout]");
        if (!btn) return;
        Auth.signOut();
        toast("Đã đăng xuất", "success");
        renderAuthSlot();
        // Nếu đang ở trang cần login, đẩy về sign-in
        if (document.body.hasAttribute("data-require-auth")) {
            location.href = "sign-in.html";
        }
    });
    function alignUserMenuArrow() {
        const user = document.querySelector('.top-act__user');
        if (!user) return;

        const avatar = user.querySelector('.top-act__avatar');
        const inner = user.querySelector('.act-dropdown__inner');
        const arrow = user.querySelector('.top-act__dropdown-arrow');
        if (!avatar || !inner || !arrow) return;

        const a = avatar.getBoundingClientRect();
        const i = inner.getBoundingClientRect();
        const centerX = a.left + a.width / 2;
        const x = centerX - i.left;              

        arrow.style.left = x + 'px';
        arrow.style.transform = 'translateX(-50%)';
    }

    document.addEventListener('pointerenter', (e) => {
        if (e.target.closest('.top-act__user')) {
            requestAnimationFrame(alignUserMenuArrow);
        }
    }, true);

    window.addEventListener('resize', alignUserMenuArrow);

    document.addEventListener('auth-slot-updated', alignUserMenuArrow);
    
})();
