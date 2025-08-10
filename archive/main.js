// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const goToCareerFinderButton = document.getElementById('goToCareerFinder');

    if (goToCareerFinderButton) {
        goToCareerFinderButton.addEventListener('click', () => {
            // Leitet zur Login-Seite weiter, da das Tool geschützt ist
            window.location.href = '/login.html';
        });
    }
});