document.addEventListener('DOMContentLoaded', () => {
    const LOCAL_STORAGE_KEY = 'vokabeltrainer_cards';

    // DOM-Elemente
    const flashcard = document.getElementById('flashcard');
    const cardWord = document.getElementById('card-word');
    const cardTranslation = document.getElementById('card-translation');
    const cardImage = document.getElementById('card-image');
    const cardCounter = document.getElementById('card-counter');
    
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    const addWordForm = document.getElementById('add-word-form');
    const newWordInput = document.getElementById('new-word');
    const newTranslationInput = document.getElementById('new-translation');
    const imageUploadInput = document.getElementById('image-upload');
    const imageStatus = document.getElementById('image-status');
    
    // Anwendungsstatus
    let cards = [];
    let currentCardIndex = 0;
    let currentBase64Image = null; // Für das temporär hochgeladene Bild

    // --- Funktionen zum Laden und Speichern ---

    /** Lädt Vokabeln aus dem Local Storage. */
    function loadCards() {
        const storedCards = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedCards) {
            cards = JSON.parse(storedCards);
        } else {
            // Start-Vokabel, falls der Speicher leer ist
            cards = [{
                word: "Hund",
                translation: "Ein vierbeiniges Haustier",
                image: null
            }];
        }
        if (cards.length > 0) {
            currentCardIndex = 0;
        }
        updateCardDisplay();
    }

    /** Speichert Vokabeln im Local Storage. */
    function saveCards() {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cards));
    }

    // --- Anzeige- und Navigations-Funktionen ---
    
    /** * Bestimmt, welche Seite vorne angezeigt wird (Wort oder Bild/Beschreibung).
     * @param {Object} card - Die aktuelle Karte.
     */
    function setCardFace(card) {
        // 50/50 Chance, welche Seite zuerst angezeigt wird (0 = Wort, 1 = Bild/Text)
        const mode = Math.floor(Math.random() * 2); 
        
        if (mode === 0 || !card.image) { 
            // Modus 0 (Standard) ODER es gibt kein Bild: Wort ist Frage (Vorderseite)
            cardWord.innerHTML = `<span>${card.word}</span>`;
            cardTranslation.innerHTML = `<span>${card.translation}</span>`;
            
            // Bild wird auf der Rückseite angezeigt, falls vorhanden
            cardImage.src = card.image || ""; 
            cardImage.style.display = card.image ? 'block' : 'none';

            // Visuelle Anpassung (Klasse entfernen, um Wort-Frage hervorzuheben)
            flashcard.classList.remove('reverse-mode'); 
            
        } else {
            // Modus 1: Bild/Beschreibung ist Frage (Vorderseite)
            
            // Vorderseite (Frage): Bild und/oder Beschreibung
            cardWord.innerHTML = card.image 
                ? `<img src="${card.image}" alt="Fragebild" class="front-image">`
                : `<span>${card.translation}</span>`; // Wenn nur Text, diesen als Frage nehmen

            // Rückseite (Antwort): Das Wort
            cardTranslation.innerHTML = `<span class="answer-word">${card.word}</span>`;
            cardImage.src = ""; // Auf der Antwort-Seite kein zusätzliches Bild
            cardImage.style.display = 'none';

            // Visuelle Anpassung (Klasse hinzufügen, um Bild-Frage hervorzuheben)
            flashcard.classList.add('reverse-mode'); 
        }
    }

    /** Aktualisiert die angezeigte Karte und die Navigations-Buttons. */
    function updateCardDisplay() {
        if (cards.length === 0) {
            cardWord.textContent = "Keine Vokabeln vorhanden.";
            cardTranslation.textContent = "";
            cardImage.style.display = 'none';
            cardCounter.textContent = "0 / 0";
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            flashcard.classList.remove('flip', 'reverse-mode'); 
            return;
        }

        const card = cards[currentCardIndex];
        
        setCardFace(card); // Neue Logik für flexible Frage/Antwort
        
        // Counter aktualisieren
        cardCounter.textContent = `${currentCardIndex + 1} / ${cards.length}`;
        
        // Navigations-Buttons aktualisieren
        prevBtn.disabled = currentCardIndex === 0;
        nextBtn.disabled = currentCardIndex === cards.length - 1;

        // Karte auf die Vorderseite drehen, wenn eine neue Vokabel geladen wird
        flashcard.classList.remove('flip'); 
    }

    /** Blättert zur nächsten Karte. */
    function nextCard() {
        if (currentCardIndex < cards.length - 1) {
            currentCardIndex++;
            updateCardDisplay();
        }
    }

    /** Blättert zur vorherigen Karte. */
    function prevCard() {
        if (currentCardIndex > 0) {
            currentCardIndex--;
            updateCardDisplay();
        }
    }

    // --- Event Listener ---

    // 1. Karte umdrehen
    flashcard.addEventListener('click', () => {
        flashcard.classList.toggle('flip');
    });

    // 2. Navigation
    nextBtn.addEventListener('click', nextCard);
    prevBtn.addEventListener('click', prevCard);

    // 3. Bild hochladen und in Base64 umwandeln
    imageUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                currentBase64Image = e.target.result;
                imageStatus.textContent = `Bild ausgewählt: ${file.name}`;
            };
            
            reader.readAsDataURL(file);
        } else {
            currentBase64Image = null;
            imageStatus.textContent = "Kein Bild ausgewählt.";
        }
    });

    // 4. Formular zum Hinzufügen einer Vokabel
    addWordForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const newCard = {
            word: newWordInput.value.trim(),
            translation: newTranslationInput.value.trim(),
            image: currentBase64Image 
        };

        if (newCard.word === "" || newCard.translation === "") {
             alert("Bitte geben Sie ein Wort und eine Übersetzung ein.");
             return;
        }

        cards.push(newCard);
        saveCards(); 
        
        currentCardIndex = cards.length - 1; 
        updateCardDisplay();

        // Formular zurücksetzen
        addWordForm.reset();
        currentBase64Image = null;
        imageStatus.textContent = "Kein Bild ausgewählt.";
    });

    // Anwendung starten
    loadCards();
});
