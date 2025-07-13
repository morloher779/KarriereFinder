window.onload = () => {
    // --- DOM-Elemente abrufen ---
    const reasonModal = document.getElementById('reasonModal');
    const declineButton = document.getElementById('declineButton');
    const closeModalButton = document.getElementById('closeModalButton');
    const submitReasonButton = document.getElementById('submitReasonButton');
    const reasonInput = document.getElementById('reasonInput');
    const careerSuggestionContainer = document.getElementById('careerSuggestionContainer');

    // Bestehende Elemente
    const freizeitInput = document.getElementById('freizeitInput'); // Dies ist jetzt Frage 2
    const charCount = document.getElementById('charCount'); // Zähler für Frage 2

    // Neue Elemente (basierend auf deinen Fragetypen)
    const question1Radios = document.querySelectorAll('input[name="ausbildung"]'); // Frage 1
    const question3Checkboxes = document.querySelectorAll('input[name="interests_checkbox"]'); // Frage 3 (Beispielname)
    const environmentInput = document.getElementById('environmentInput'); // Frage 4
    const ratingInput = document.getElementById('ratingInput'); // Frage 5
    const question6Radios = document.querySelectorAll('input[name="work_preference"]'); // Frage 6 (Beispielname)

    const MAX_SELECTIONS = 3; // Maximale Anzahl an Checkbox-Auswahlen für Frage 3


    const formGroups = [
        document.getElementById('question1'), // Frage 1 (Deine "ausbildung" Frage in HTML)
        document.getElementById('question2'), // Frage 2 (Freizeit-Input)
        document.getElementById('question3'), // Frage 3 (Interessen-Checkboxes)
        document.getElementById('question4'), // Frage 4 (Arbeitsumgebung)
        document.getElementById('question5'), // Frage 5 (Bewertung)
        document.getElementById('question6')  // Frage 6 (Arbeitspräferenz)
    ];

    const intro = document.getElementById('intro');
    const resultDiv = document.getElementById('result');
    const careerSuggestion = document.getElementById('careerSuggestion');
    const errorMessage = document.getElementById('errorMessage');
    const loadingOverlay = document.getElementById('loading-overlay');
    const apiKey = "Key_fehlt!"; // Deinen API-Key hier einfügen

    let currentQuestionIndex = 0; // Index der aktuell angezeigten Frage

    // --- Initialisierungs-Checks (optional, aber gut für Debugging) ---
    if (!reasonModal || !declineButton || !closeModalButton || !submitReasonButton || !reasonInput ||
        !freizeitInput || !charCount || !intro || !resultDiv || !careerSuggestion || !errorMessage ||
        !loadingOverlay) {
        console.error('Einige DOM-Elemente fehlen! Bitte überprüfe deine HTML-Struktur und IDs.');
        // Füge hier weitere spezifische Prüfungen für die neuen Elemente hinzu, wenn nötig
        return;
    }

    // --- Zeichenbegrenzung für das Textarea-Feld (Frage 2) ---
    if (freizeitInput && charCount) { // Sicherstellen, dass die Elemente existieren
        freizeitInput.addEventListener('input', () => {
            const currentLength = freizeitInput.value.length;
            charCount.textContent = `${currentLength}/200 Zeichen`;
        });
    }

    // --- Modal-Logik (Ablehnen des Berufs) ---
    declineButton.addEventListener('click', () => {
        reasonInput.value = ''; // Leere das Eingabefeld bei jedem Öffnen
        reasonModal.style.display = 'flex'; // Öffne das Modal
        // Aktualisiere den Button-Text beim Öffnen des Modals, um den aktuellen Zählerstand zu zeigen
        document.getElementById("submitReasonButton").textContent = `Begründung absenden (${clickCounter}/${maxClicks})`;
        // Deaktiviere den Button, wenn das Limit bereits erreicht ist
        if (clickCounter >= maxClicks) {
            document.getElementById("submitReasonButton").disabled = true;
        } else {
            document.getElementById("submitReasonButton").disabled = false;
        }
    });

    closeModalButton.addEventListener('click', () => {
        reasonInput.value = '';
        reasonModal.style.display = 'none'; // Schließe das Modal
    });

    // --- Zähler und Deaktivierung für den Begründungs-Button (bestehende Logik) ---
    let clickCounter = 0;
    const maxClicks = 2;

    function increaseCounter() {
        if (clickCounter >= maxClicks) {
            alert("Maximale Klickanzahl erreicht!");
            return;
        }
        const submitButton = document.getElementById("submitReasonButton");
        submitButton.textContent = `Begründung absenden (${clickCounter}/${maxClicks})`;

        isButtonDisabled = true;
        submitButton.disabled = true;
        if (submitButton.disabled === true) {
            clickCounter++;
        }

        setTimeout(() => {
            isButtonDisabled = false;
            submitButton.disabled = false;
            if (clickCounter >= maxClicks) {
                submitButton.disabled = true;
            }
        }, 1000);
    }

    // --- Checkbox-Begrenzung (JETZT HIER DIREKT IM WINDOW.ONLOAD-BLOCK) ---
    // Alle Checkboxen mit dem Namen "interests_checkbox" abrufen
    const checkboxes = document.querySelectorAll('input[name="interests_checkbox"]');
    // Die Konstante MAX_SELECTIONS ist bereits weiter oben definiert.
    // const MAX_SELECTIONS = 3;

    // Funktion, die ausgeführt wird, wenn eine Checkbox angeklickt wird
    function handleCheckboxChange() {
        // Zähle, wie viele Checkboxen gerade ausgewählt sind
        let checkedCount = 0;
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                checkedCount++;
            }
        });

        // Wenn die maximale Anzahl erreicht ist, deaktiviere die nicht ausgewählten Checkboxen
        if (checkedCount >= MAX_SELECTIONS) {
            checkboxes.forEach(checkbox => {
                if (!checkbox.checked) { // Wenn die Checkbox NICHT ausgewählt ist
                    checkbox.disabled = true; // Deaktiviere sie
                }
            });
        } else {
            // Wenn die maximale Anzahl unterschritten wird, aktiviere alle Checkboxen wieder
            checkboxes.forEach(checkbox => {
                checkbox.disabled = false; // Aktiviere alle Checkboxen
            });
        }
    }

    // Füge jeder Checkbox einen Event Listener hinzu
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });

   /* reasonInput.addEventListener('input', () => {
        // Aktualisiert den Button-Text dynamisch, aber nur den Zähler, nicht die Deaktivierung
        document.getElementById("submitReasonButton").textContent =
            `Begründung absenden (${reasonInput.value.trim().length}/2)`;
    });*/

    // Logik für den Begründungs-Button (submitReasonButton) anpassen
    submitReasonButton.addEventListener('click', async () => {

        const reason = reasonInput.value.trim();

        if (clickCounter >= maxClicks) {
            alert("Du hast bereits die maximale Anzahl an Begründungen abgegeben. Bitte starte neu.");
            reasonModal.style.display = 'none'; // Modal schließen
            return;
        }

        if (reason.length >= 2) {
            //increaseCounter(); // Zähler erhöhen
            if (clickCounter >= maxClicks) {
                alert("Du hast bereits die maximale Anzahl an Begründungen abgegeben.");
                reasonModal.style.display = 'none'; // Modal schließen, wenn Limit erreicht
                return;
            }

            loadingOverlay.style.display = 'flex';
            reasonModal.style.display = 'none'; // Modal schließen, wenn Begründung gültig ist und gesendet wird

            const data = collectFormData(); // Sammle alle aktuellen Daten
            data.reason = reason; // Füge die Begründung hinzu

            try {
                // Sende die Daten inklusive Begründung an dein Backend
                const response = await fetch('http://localhost:3001/career-suggestion', { // PASSE DEN PORT AN!
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Serverfehler: ${errorData.error || response.statusText}`);
                }

                const result = await response.json();
                const markdownText = result.suggestion; // Der Text von der KI

                // Auch hier Markdown zu HTML konvertieren
                careerSuggestionContainer.innerHTML = marked.parse(markdownText);

                clickCounter++;
                document.getElementById("submitReasonButton").textContent = `Begründung absenden (${clickCounter}/${maxClicks})`;

                if (clickCounter >= maxClicks) {
                    document.getElementById("submitReasonButton").disabled = true;
                    // Optional: Deaktiviere den Decline Button, wenn keine weiteren Versuche erlaubt sind
                    declineButton.disabled = true;
                }

                resultDiv.classList.add('active');
                // Buttons anzeigen
                declineButton.style.display = 'block';
                // Hier wurde fälschlicherweise loadingOverlay wieder auf flex gesetzt. Das entfernen wir.
                // document.querySelector('#result button:last-child').style.display = 'block';
                // Besser: Direkt die ID verwenden, falls vorhanden (siehe Vorschlag 'restartButton')
                const restartButton = document.getElementById('restartButton');
                if (restartButton) {
                    restartButton.style.display = 'block';
                }

                reasonModal.style.display = 'none';
                reasonInput.value = ''; // Leere das Eingabefeld
                // Keine window.location.reload() hier, um die neue Empfehlung zu zeigen
                // Wenn du nach Ablehnung immer neu starten willst, kannst du es lassen.
                // Ansonsten kannst du das Ergebnis-Div aktualisieren und den Ablehnen-Button wieder einblenden.

            } catch (error) {
                console.error('Fehler beim Abrufen des alternativen Vorschlags:', error);
                alert(`Fehler beim Abrufen des alternativen Vorschlags: ${error.message}. Bitte versuchen Sie es erneut.`);
                reasonModal.style.display = 'none';
                loadingOverlay.style.display = 'none';
            }
            finally {
                loadingOverlay.style.display = 'none'; // Lade-Overlay immer ausblenden
            }
        } else {
            alert("Bitte gib eine Begründung mit mindestens 2 Zeichen ein.");
        }
    });

    // --- Formular-Fortschritt und Validierung ---

    // Funktion zum Anzeigen der nächsten Frage
    const showNextQuestion = () => {
        errorMessage.style.display = 'none'; // Fehlermeldung ausblenden
        formGroups[currentQuestionIndex].classList.remove('active');
        currentQuestionIndex++;
        if (currentQuestionIndex < formGroups.length) {
            formGroups[currentQuestionIndex].classList.add('active');
        } else {
            // Alle Fragen beantwortet, Formular absenden
            submitForm();
        }
    };

    // Funktion zur Validierung der aktuellen Frage
    const validateCurrentQuestion = () => {
        const currentQuestionDiv = formGroups[currentQuestionIndex];

        // Temporäre Konsolen-Ausgabe zum Debuggen:
        console.log(`Validierung für Frage Index: ${currentQuestionIndex}`);
        console.log(`Aktuelles DIV ID: ${currentQuestionDiv ? currentQuestionDiv.id : 'Nicht gefunden'}`);

        switch (currentQuestionIndex) {
            case 0: // Frage 1: Geschlossene Frage (Radio-Buttons: ausbildung)
                const q1Radios = currentQuestionDiv.querySelectorAll('input[name="ausbildung"]');
                const isQ1Checked = [...q1Radios].some(radio => radio.checked);
                console.log(`Frage 1 Validierung (ausbildung): ${isQ1Checked}`);
                return isQ1Checked;

            case 1: // Frage 2: Offene Frage (Textfeld: freizeitInput)
                const freizeitInput = document.getElementById('freizeitInput'); // Sicherstellen, dass das Element korrekt abgerufen wird
                const isQ2Valid = freizeitInput && freizeitInput.value.trim().length > 0;
                console.log(`Frage 2 Validierung (freizeitInput): ${isQ2Valid}`);
                return isQ2Valid;

            case 2: // Frage 3: Geschlossene Frage (Checkboxes: interests_checkbox, bis zu 3 Antworten)
                const q3Checkboxes = currentQuestionDiv.querySelectorAll('input[name="interests_checkbox"]');
                const checkedCount = [...q3Checkboxes].filter(checkbox => checkbox.checked).length;
                const isQ3Valid = checkedCount > 0 && checkedCount <= 3;
                console.log(`Frage 3 Validierung (interests_checkbox): ${isQ3Valid}, Checked: ${checkedCount}`);
                return isQ3Valid;

            case 3: // Frage 4: Offene Frage (Textfeld: interestsInput, war deine urspr. Frage 3)
                const environmentInput = document.getElementById('environmentInput'); // Sicherstellen, dass das Element korrekt abgerufen wird
                const isQ4Valid = environmentInput && environmentInput.value.trim().length > 0;
                console.log(`Frage 4 Validierung (environmentInput): ${isQ4Valid}`);
                return isQ4Valid;

            case 4: // Frage 5: Bewertung (Range-Input: ratingInput)
                const ratingInput = document.getElementById('ratingInput'); // Sicherstellen, dass das Element korrekt abgerufen wird
                // Ein Range-Input hat immer einen Wert, es sei denn, es ist explizit leer
                // Wenn du eine Mindestauswahl erzwingen willst (z.B. nicht der Standardwert),
                // könntest du ratingInput.value !== '3' prüfen (wenn 3 der Standard ist)
                const isQ5Valid = ratingInput !== null; // Prüfen, ob das Element existiert
                console.log(`Frage 5 Validierung (ratingInput): ${isQ5Valid}`);
                return isQ5Valid; // Für einen Slider reicht meistens, dass er existiert

            case 5: // Frage 6: Geschlossene Frage (Radio-Buttons: work_preference)
                const q6Radios = currentQuestionDiv.querySelectorAll('input[name="beruf"]');
                const isQ6Checked = [...q6Radios].some(radio => radio.checked);
                console.log(`Frage 6 Validierung (beruf): ${isQ6Checked}`);
                return isQ6Checked;

            default:
                console.log(`Unbekannte Frage Index: ${currentQuestionIndex}`);
                return true; // Im Falle eines unbekannten Index annehmen, dass es gültig ist
        }
    };

    // Event Listener für den Start-Button
    document.getElementById('startButton').addEventListener('click', () => {
        intro.classList.remove('active');
        document.getElementById('careerForm').classList.add('active');
        formGroups[0].classList.add('active'); // Zeige die erste Frage
    });

    // Event Listener für alle "Weiter"-Buttons und den "Finish"-Button
    // Wir müssen die Buttons dynamisch ansprechen, da sie nicht alle die gleiche ID-Struktur haben.
    formGroups.forEach((questionDiv, index) => {
        // Finde den "Weiter"-Button innerhalb dieser Frage
        // Annahme: Jeder form-group DIV hat einen Button mit einer ID wie 'next1', 'next2', etc. oder 'finish'
        const nextButton = questionDiv.querySelector('button[id^="next"], button[id="finish"]');
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                if (validateCurrentQuestion()) {
                    showNextQuestion();
                } else {
                    errorMessage.style.display = 'block'; // Fehlermeldung anzeigen
                }
            });
        }
    });

    // --- Daten sammeln für die API-Anfrage ---
    const collectFormData = () => {
        const data = {};

        // Frage 1: Ausbildung/Studium/Arbeiten (Radio-Buttons)
        const q1Selected = document.querySelector('input[name="ausbildung"]:checked');
        data.ausbildung = q1Selected ? q1Selected.value : '';

        // Frage 2: Freizeitaktivitäten (Textarea)
        const freizeitInput = document.getElementById('freizeitInput'); // Sicherstellen, dass dies abgerufen wird
        data.freizeit = freizeitInput ? freizeitInput.value.trim() : '';

        // Frage 3: Interessen (Checkboxes)
        const question3Checkboxes = document.querySelectorAll('input[name="interests_checkbox"]'); // Sicherstellen, dass dies abgerufen wird
        data.interests = [...question3Checkboxes]
            .filter(cb => cb.checked)
            .map(cb => cb.value)
            .join(', ');

        // Frage 4: Arbeitsumgebung (Textarea)
        const environmentInput = document.getElementById('environmentInput'); // Hier ist ein Name-Mismatch, du hattest 'interestsInput' für Frage 4 in deinem HTML-Beispiel
        data.environment = environmentInput ? environmentInput.value.trim() : '';

        // Frage 5: Bewertung (Range-Input)
        const ratingInput = document.getElementById('ratingInput'); // Sicherstellen, dass dies abgerufen wird
        data.rating = ratingInput ? ratingInput.value : '';

        // Frage 6: Arbeitspräferenz (Radio-Buttons)
        const q6Selected = document.querySelector('input[name="beruf"]:checked');
        data.workPreference = q6Selected ? q6Selected.value : '';

        return data;
    };

    // Funktion zum Absenden des Formulars (am Ende des Fragenflusses)
    const submitForm = async () => {
        const data = collectFormData(); // Sammle alle gesammelten Daten

        // Frage 6 (die letzte Frage) ausblenden
        formGroups[formGroups.length - 1].classList.remove('active');
        document.getElementById('careerForm').classList.remove('active'); // Oder setze direkt style.display = 'none';
        loadingOverlay.style.display = 'flex'; // Lade-Overlay anzeigen

        try {
            // Sende Daten an deinen eigenen Backend-Server
            const response = await fetch('http://localhost:3001/career-suggestion', { // PASSE DEN PORT AN!
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                // Wenn die Antwort nicht OK ist (z.B. 400 oder 500 Fehler), werfe einen Fehler
                const errorData = await response.json(); // Versuche, die Fehlermeldung vom Server zu lesen
                throw new Error(`Serverfehler: ${errorData.error || response.statusText}`);
            }

            const result = await response.json(); // Erwarte { suggestion: "..." }
            const markdownText = result.suggestion; // Ergebnis vom Backend

            careerSuggestionContainer.innerHTML = marked.parse(markdownText);

            declineButton.style.display = 'block';
            loadingOverlay.style.display = 'flex'; // Lade-Overlay anzeigen
            document.querySelector('#result button:last-child').style.display = 'block';

        } catch (error) {
            console.error('Fehler beim Senden der Daten an das Backend oder beim Empfangen der Antwort:', error);
            alert(`Fehler beim Abrufen des Berufsvorschlags: ${error.message}. Bitte versuchen Sie es erneut.`);
            careerSuggestion.textContent = "Leider konnte kein Berufsvorschlag abgerufen werden. Bitte versuche es später noch einmal.";
        } finally {
            loadingOverlay.style.display = 'none'; // Lade-Overlay immer ausblenden
            resultDiv.classList.add('active'); // Ergebnis-Sektion immer anzeigen, auch bei Fehler
        }
    };

};