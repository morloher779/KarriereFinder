// public/js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginMessage = document.getElementById('loginMessage');
    const registerMessage = document.getElementById('registerMessage');
    const logoutButton = document.getElementById('logoutButton');

    // --- Login Logik ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('#email').value;
            const password = loginForm.querySelector('#password').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('token', data.token); // JWT speichern
                    loginMessage.textContent = data.message + ' Weiterleitung zum KarriereFinder...';
                    loginMessage.style.color = 'green';
                    setTimeout(() => {
                        window.location.href = '/career-finder'; // Weiterleitung zum geschützten Tool
                    }, 1500);
                } else {
                    loginMessage.textContent = data.message || 'Login fehlgeschlagen.';
                    loginMessage.style.color = 'red';
                }
            } catch (error) {
                console.error('Fehler beim Login:', error);
                loginMessage.textContent = 'Verbindungsfehler oder Server nicht erreichbar.';
                loginMessage.style.color = 'red';
            }
        });
    }

    // --- Registrierungs Logik ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = registerForm.querySelector('#emailReg').value;
            const password = registerForm.querySelector('#passwordReg').value;
            const paymentConfirmed = registerForm.querySelector('#paymentConfirmed').checked;

            if (!paymentConfirmed) {
                registerMessage.textContent = 'Bitte bestätige die Zahlung, um fortzufahren.';
                registerMessage.style.color = 'red';
                return;
            }

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    registerMessage.textContent = data.message + ' Du kannst dich jetzt anmelden.';
                    registerMessage.style.color = 'green';
                    registerForm.reset(); // Formular leeren
                    setTimeout(() => {
                        window.location.href = '/login.html'; // Zur Login-Seite weiterleiten
                    }, 2000);
                } else {
                    registerMessage.textContent = data.message || 'Registrierung fehlgeschlagen.';
                    registerMessage.style.color = 'red';
                }
            } catch (error) {
                console.error('Fehler bei der Registrierung:', error);
                registerMessage.textContent = 'Verbindungsfehler oder Server nicht erreichbar.';
                registerMessage.style.color = 'red';
            }
        });
    }

    // --- Logout Logik (auf career-finder.html) ---
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token'); // Token entfernen
            alert('Du wurdest abgemeldet.');
            window.location.href = '/login.html'; // Zur Login-Seite zurück
        });
    }

    // --- Token-Check für geschützte Seiten (z.B. auf career-finder.html) ---
    // Diese Logik sollte idealerweise in career-finder.js liegen oder global,
    // um den Benutzer direkt umzuleiten, wenn kein Token da ist.
    // Für career-finder.html:
    if (window.location.pathname === '/career-finder') {
        const token = localStorage.getItem('token');
        if (!token) {
            // Optional: Zeige eine Meldung, bevor du weiterleitest
            alert('Du musst angemeldet sein, um auf diese Seite zuzugreifen.');
            window.location.href = '/login.html';
        }
        // Wenn ein Token da ist, wird das Backend es beim API-Aufruf prüfen
        // und ggf. eine 401/403 Antwort senden, die du dann im fetch() abfangen müsstest.
        // Für den Initial-Aufruf der Seite prüft es die Express-Middleware.
    }
});