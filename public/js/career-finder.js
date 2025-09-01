document.addEventListener('DOMContentLoaded', () => {
    // --- DOM-Elemente abrufen ---
    const reasonModal = document.getElementById('reasonModal');
    const declineButton = document.getElementById('declineButton');
    const restartButton = document.getElementById('restartButton');
    const closeModalButton = document.getElementById('closeModalButton');
    const submitReasonButton = document.getElementById('submitReasonButton');
    const reasonInput = document.getElementById('reasonInput');
    const careerSuggestionContainer = document.getElementById('careerSuggestionContainer');
    const freizeitInput = document.getElementById('freizeitInput');
    const charCount = document.getElementById('charCount');
    const question1Radios = document.querySelectorAll('input[name="ausbildung"]');
    const question3Checkboxes = document.querySelectorAll('input[name="interests_checkbox"]');
    const environmentInput = document.getElementById('environmentInput');
    const ratingInput = document.getElementById('ratingInput');
    const question6Radios = document.querySelectorAll('input[name="work_preference"]');

    const MAX_SELECTIONS = 3;

    const formGroups = [
        document.getElementById('question1'),
        document.getElementById('question2'),
        document.getElementById('question3'),
        document.getElementById('question4'),
        document.getElementById('question5'),
        document.getElementById('question6')
    ];

    const intro = document.getElementById('intro');
    const resultDiv = document.getElementById('result');
    const careerSuggestion = document.getElementById('careerSuggestion');
    const errorMessage = document.getElementById('errorMessage');
    const loadingOverlay = document.getElementById('loading-overlay');

    let currentQuestionIndex = 0;

    let isButtonDisabled = false;
    let clickCounter = 0;
    const maxClicks = 2;


    if (!reasonModal || !declineButton || !closeModalButton || !submitReasonButton || !reasonInput ||
        !freizeitInput || !charCount || !intro || !resultDiv || !careerSuggestion || !errorMessage ||
        !loadingOverlay) {
        console.error('Einige DOM-Elemente fehlen! Bitte überprüfe deine HTML-Struktur und IDs.');
        return;
    }

    if (freizeitInput && charCount) {
        freizeitInput.addEventListener('input', () => {
            const currentLength = freizeitInput.value.length;
            charCount.textContent = `${currentLength}/200 Zeichen`;
        });
    }

    declineButton.addEventListener('click', () => {
        reasonInput.value = '';
        reasonModal.style.display = 'flex';
        document.getElementById("submitReasonButton").textContent = `Begründung absenden (${clickCounter}/${maxClicks})`;
        if (clickCounter >= maxClicks) {
            document.getElementById("submitReasonButton").disabled = true;
        } else {
            document.getElementById("submitReasonButton").disabled = false;
        }
    });

    closeModalButton.addEventListener('click', () => {
        reasonInput.value = '';
        reasonModal.style.display = 'none';
    });

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

    const checkboxes = document.querySelectorAll('input[name="interests_checkbox"]');

    function handleCheckboxChange() {
        let checkedCount = 0;
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                checkedCount++;
            }
        });

        if (checkedCount >= MAX_SELECTIONS) {
            checkboxes.forEach(checkbox => {
                if (!checkbox.checked) {
                    checkbox.disabled = true;
                }
            });
        } else {
            checkboxes.forEach(checkbox => {
                checkbox.disabled = false;
            });
        }
    }

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });

    submitReasonButton.addEventListener('click', async () => {
        if (isButtonDisabled) return;

        const reason = reasonInput.value.trim();

        if (clickCounter >= maxClicks) {
            alert("Du hast bereits die maximale Anzahl an Begründungen abgegeben. Bitte starte neu.");
            reasonModal.style.display = 'none';
            return;
        }

        if (reason.length >= 2) {
            if (clickCounter >= maxClicks) {
                alert("Du hast bereits die maximale Anzahl an Begründungen abgegeben.");
                reasonModal.style.display = 'none';
                return;
            }

            loadingOverlay.style.display = 'flex';
            reasonModal.style.display = 'none';

            const data = collectFormData();
            data.reason = reason;

            try {
                const response = await fetch('/career-suggestion', {
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
                const markdownText = result.suggestion;

                careerSuggestionContainer.innerHTML = marked.parse(markdownText);

                clickCounter++;
                document.getElementById("submitReasonButton").textContent = `Begründung absenden (${clickCounter}/${maxClicks})`;

                if (clickCounter >= maxClicks) {
                    document.getElementById("submitReasonButton").disabled = true;
                    declineButton.disabled = true;
                }

                resultDiv.classList.add('active');

                declineButton.style.display = 'block';

                const restartButton = document.getElementById('restartButton');

                if (restartButton) {
                    restartButton.style.display = 'block';
                }

                reasonModal.style.display = 'none';
                reasonInput.value = '';
            } catch (error) {
                console.error('Fehler beim Abrufen des alternativen Vorschlags:', error);
                alert(`Fehler beim Abrufen des alternativen Vorschlags: ${error.message}. Bitte versuchen Sie es erneut.`);
                reasonModal.style.display = 'none';
                loadingOverlay.style.display = 'none';
            }
            finally {
                loadingOverlay.style.display = 'none';
            }
        } else {
            alert("Bitte gib eine Begründung mit mindestens 2 Zeichen ein.");
        }
    });

    const showNextQuestion = () => {
        errorMessage.style.display = 'none';
        formGroups[currentQuestionIndex].classList.remove('active');
        currentQuestionIndex++;
        if (currentQuestionIndex < formGroups.length) {
            formGroups[currentQuestionIndex].classList.add('active');
        } else {
            submitForm();
        }
    };

    const validateCurrentQuestion = () => {
        const currentQuestionDiv = formGroups[currentQuestionIndex];

        switch (currentQuestionIndex) {
            case 0:
                const q1Radios = currentQuestionDiv.querySelectorAll('input[name="ausbildung"]');
                const isQ1Checked = [...q1Radios].some(radio => radio.checked);
                console.log(`Frage 1 Validierung (ausbildung): ${isQ1Checked}`);
                return isQ1Checked;

            case 1:
                const freizeitInput = document.getElementById('freizeitInput');
                const isQ2Valid = freizeitInput && freizeitInput.value.trim().length > 0;
                console.log(`Frage 2 Validierung (freizeitInput): ${isQ2Valid}`);
                return isQ2Valid;

            case 2:
                const q3Checkboxes = currentQuestionDiv.querySelectorAll('input[name="interests_checkbox"]');
                const checkedCount = [...q3Checkboxes].filter(checkbox => checkbox.checked).length;
                const isQ3Valid = checkedCount > 0 && checkedCount <= 3;
                console.log(`Frage 3 Validierung (interests_checkbox): ${isQ3Valid}, Checked: ${checkedCount}`);
                return isQ3Valid;

            case 3:
                const environmentInput = document.getElementById('environmentInput');
                const isQ4Valid = environmentInput && environmentInput.value.trim().length > 0;
                console.log(`Frage 4 Validierung (environmentInput): ${isQ4Valid}`);
                return isQ4Valid;

            case 4:
                const ratingInput = document.getElementById('ratingInput');
                const isQ5Valid = ratingInput !== null;
                console.log(`Frage 5 Validierung (ratingInput): ${isQ5Valid}`);
                return isQ5Valid;

            case 5:
                const q6Radios = currentQuestionDiv.querySelectorAll('input[name="beruf"]');
                const isQ6Checked = [...q6Radios].some(radio => radio.checked);
                console.log(`Frage 6 Validierung (beruf): ${isQ6Checked}`);
                return isQ6Checked;

            default:
                console.log(`Unbekannte Frage Index: ${currentQuestionIndex}`);
                return true;
        }
    };

    document.getElementById('startButton').addEventListener('click', () => {
        intro.classList.remove('active');
        document.getElementById('careerForm').classList.add('active');
        formGroups[0].classList.add('active');
    });

    formGroups.forEach((questionDiv, index) => {
        const nextButton = questionDiv.querySelector('button[id^="next"], button[id="finish"]');
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                if (validateCurrentQuestion()) {
                    showNextQuestion();
                } else {
                    errorMessage.style.display = 'block';
                }
            });
        }
    });

    const collectFormData = () => {
        const data = {};

        const q1Selected = document.querySelector('input[name="ausbildung"]:checked');
        data.ausbildung = q1Selected ? q1Selected.value : '';

        const freizeitInput = document.getElementById('freizeitInput');
        data.freizeit = freizeitInput ? freizeitInput.value.trim() : '';

        const question3Checkboxes = document.querySelectorAll('input[name="interests_checkbox"]');
        data.interests = [...question3Checkboxes]
            .filter(cb => cb.checked)
            .map(cb => cb.value)
            .join(', ');

        const environmentInput = document.getElementById('environmentInput');
        data.environment = environmentInput ? environmentInput.value.trim() : '';

        const ratingInput = document.getElementById('ratingInput');
        data.rating = ratingInput ? ratingInput.value : '';

        const q6Selected = document.querySelector('input[name="beruf"]:checked');
        data.workPreference = q6Selected ? q6Selected.value : '';

        return data;
    };

    const submitForm = async () => {
        const data = collectFormData();

        formGroups[formGroups.length - 1].classList.remove('active');
        document.getElementById('careerForm').classList.remove('active');
        loadingOverlay.style.display = 'flex';

        try {
            const response = await fetch('/career-suggestion', {
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
            const markdownText = result.suggestion;

            careerSuggestionContainer.innerHTML = marked.parse(markdownText);

            declineButton.style.display = 'block';
            loadingOverlay.style.display = 'flex';
            document.querySelector('#result button:last-child').style.display = 'block';

        } catch (error) {
            console.error('Fehler beim Senden der Daten an das Backend oder beim Empfangen der Antwort:', error);
            alert(`Fehler beim Abrufen des Berufsvorschlags: ${error.message}. Bitte versuchen Sie es erneut.`);
            careerSuggestion.textContent = "Leider konnte kein Berufsvorschlag abgerufen werden. Bitte versuche es später noch einmal.";
        } finally {
            loadingOverlay.style.display = 'none';
            resultDiv.classList.add('active');
        }
    };

});