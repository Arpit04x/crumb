import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyByxmrxmbwsExmsTEgRE9yAGgaVM5qQbRQ",
    authDomain: "cookie-shop-app-e6368.firebaseapp.com",
    projectId: "cookie-shop-app-e6368",
    storageBucket: "cookie-shop-app-e6368.firebasestorage.app",
    messagingSenderId: "854491074800",
    appId: "1:854491074800:web:abaafecec9de94e2a2b235",
    measurementId: "G-G915TLE9M7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Logic
document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links a');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            const isExpanded = mobileBtn.getAttribute('aria-expanded') === 'true';
            mobileBtn.setAttribute('aria-expanded', !isExpanded);
            navLinks.classList.toggle('active');
            mobileBtn.classList.toggle('active');
        });

        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileBtn.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Scroll Header Effect
    const header = document.querySelector('header');
    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    window.addEventListener('scroll', handleScroll);

    // Fade In Animation
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => observer.observe(el));

    // Active Link Highlighting
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(li => {
            li.classList.remove('active');
            if (li.getAttribute('href').includes(current) && li.getAttribute('id') !== 'login-link') {
                li.classList.add('active');
            }
        });
    });

    // Add to cart animation
    const addToCartBtns = document.querySelectorAll('.btn-icon');
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', function (e) {
            const originalContent = this.innerHTML;
            this.innerHTML = '✓';
            this.style.backgroundColor = '#4CAF50';
            this.style.color = 'white';

            setTimeout(() => {
                this.innerHTML = originalContent;
                this.style.backgroundColor = '';
                this.style.color = '';
            }, 1500);
        });
    });

    // --- AUTH LOGIC ---
    const loginLink = document.getElementById('login-link');
    const modal = document.getElementById('auth-modal');
    const closeModal = document.getElementById('modal-close');
    const authForm = document.getElementById('auth-form');
    const authTabs = document.querySelectorAll('.auth-tab');
    const modalTitle = document.getElementById('modal-title');
    const authSubmitBtn = document.getElementById('auth-submit');
    const authError = document.getElementById('auth-error');
    const googleBtn = document.getElementById('google-btn');

    let isLogin = true;

    // Toggle Modal
    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        // If logged in, maybe logout or show profile? For now, if logged in, text is "Account"
        if (auth.currentUser) {
            // handle logout or profile
            // simple logout for demo
            if (confirm("Log out?")) {
                signOut(auth).then(() => {
                    alert("Logged out!");
                    loginLink.textContent = "Login";
                });
            }
        } else {
            modal.classList.add('open');
        }
    });

    closeModal.addEventListener('click', () => {
        modal.classList.remove('open');
        authError.textContent = '';
    });

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('open');
            authError.textContent = '';
        }
    });

    // Switch Tabs
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            isLogin = tab.dataset.tab === 'login';

            modalTitle.textContent = isLogin ? 'Welcome Back' : 'Create Account';
            authSubmitBtn.textContent = isLogin ? 'Log In' : 'Sign Up';
            authError.textContent = '';
        });
    });

    // Handle Form Submit
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        authError.textContent = '';
        authSubmitBtn.disabled = true;

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // Create user doc
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    email: email,
                    createdAt: new Date().toISOString()
                });
            }
            modal.classList.remove('open');
            authForm.reset();
        } catch (error) {
            console.error(error);
            let msg = error.message;
            if (error.code === 'auth/invalid-credential') msg = "Invalid email or password.";
            if (error.code === 'auth/email-already-in-use') msg = "Email already registered.";
            if (error.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
            authError.textContent = msg;
        } finally {
            authSubmitBtn.disabled = false;
        }
    });

    // Google Auth
    googleBtn.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            // Check if new user and create doc if needed
            const user = result.user;
            // We can set doc with merge true just in case
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                lastLogin: new Date().toISOString()
            }, { merge: true });

            modal.classList.remove('open');
        } catch (error) {
            console.error(error);
            authError.textContent = "Google Sign-in failed. Try again.";
        }
    });

    // Auth State Observer
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginLink.textContent = "Account (" + user.email.split('@')[0] + ")";
        } else {
            loginLink.textContent = "Login";
        }
    });
});
