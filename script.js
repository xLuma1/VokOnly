document.addEventListener('DOMContentLoaded', () => {
    // Schlüssel für den Local Storage
    const LOCAL_STORAGE_KEY = 'vokabeltrainer_sets';

    // DOM-Elemente
    const flashcard = document.getElementById('flashcard');
    const cardWord = document.getElementById('card-word');
    const cardTranslation = document.getElementById('card-translation');
    const cardImage = document.getElementById('card-image');
    const cardCounter = document.getElementById('card-counter');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const deleteCardBtn = document.getElementById('delete-card-btn'); // NEU
    
    const addWordForm = document.getElementById('add-word-form');
    const newWordInput = document.getElementById('new-word');
    const newTranslationInput = document.getElementById('new-translation');
    const imageUploadInput = document.getElementById('image-upload');
    const imageStatus = document.getElementById('image-status');
    const currentSetName = document.getElementById('current-set-name'); // NEU
    
    const setSelect = document.getElementById('set-select'); // NEU
    const addSetBtn = document.getElementById('add-set-btn'); // NEU
    
    // Anwendungsstatus
    let allSets = {}; // Format: { 'Set-Name': [{ id: 1, word: '...', translation: '...', image: '...' }], ... }
    let currentSetNameKey = 'Standard'; // Aktueller Set-Name
    let currentCards = []; // Vokabeln des aktuell ausgewählten Sets
    let currentCardIndex = 0;
    let currentBase64Image = null; // Für das temporär hochgeladene Bild

    // --- Core Funktionen ---

    /** Lädt alle Sets aus dem Local Storage. */
    function loadSets() {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
            allSets = JSON.parse(storedData);
        }
        
        // Sicherstellen, dass mindestens ein "Standard"-Set existiert
        if (Object.keys(allSets).length === 0) {
            allSets[currentSetNameKey] = [];
        }

        // Letzten Set-Namen speichern/laden
        const lastSet = localStorage.getItem('last_set_key');
        if (lastSet && allSets[lastSet]) {
            currentSetNameKey = lastSet;
        }

        populateSetSelect();
        loadCurrentSet();
    }

    /** Speichert alle Sets im Local Storage. */
    function saveSets() {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allSets));
        localStorage.setItem('last_set_key', currentSetNameKey);
    }

    // --- Set Management Funktionen ---
    
    /** Befüllt das Dropdown mit allen Set-Namen. */
    function populateSetSelect() {
        setSelect.innerHTML = '';
        Object.keys(allSets).forEach(setKey => {
            const option = document.createElement('option');
            option.value = setKey;
            option.textContent = `${setKey} (${allSets[setKey].length})`;
            setSelect.appendChild(option);
        });
        setSelect.value = currentSetNameKey;
    }

    /** Lädt die Vokabeln des aktuell ausgewählten Sets. */
    function loadCurrentSet() {
        currentCards = allSets[currentSetNameKey] || [];
        currentCardIndex = 0;
        currentSetName.textContent = currentSetNameKey;
        updateCardDisplay();
    }

    // --- Löschen Funktion (NEU) ---

    /** Löscht die aktuell angezeigte Vokabel. */
    function deleteCurrentCard() {
        if (currentCards.length === 0) return;

        const cardToDelete = currentCards[currentCardIndex];
        
        if (!confirm(`Soll die Vokabel "${cardToDelete.word}" wirklich gelöscht werden?`)) {
            return;
        }

        // Verwenden von Array.filter() zum Entfernen der Karte
        // Wir filtern alle Karten heraus, deren ID NICHT der ID der zu löschenden Karte entspricht
        allSets[currentSetNameKey] = currentCards.filter(card => card.id !== cardToDelete.id);
        currentCards = allSets[currentSetNameKey];
        saveSets();

        // Index anpassen, falls die letzte Karte gelöscht wurde
        if (currentCardIndex >= currentCards.length && currentCardIndex > 0) {
            currentCardIndex--;
        }

        populateSetSelect(); // Set-Anzahl aktualisieren
        updateCardDisplay(); // Anzeige aktualisieren
    }

    // --- Anzeige und Navigation (Angepasst) ---
    
    // Die setCardFace Funktion bleibt unverändert
    function setCardFace(card) {
        const mode = Math.floor(Math.random() * 2); 
        
        if (mode === 0 || !card.image) { 
            cardWord.innerHTML = `<span>${card.word}</span>`;
            cardTranslation.innerHTML = `<span>${card.translation}</span>`;
            cardImage.src = card.image || ""; 
            cardImage.style.display = card.image ? 'block' : 'none';
            flashcard.classList.remove('reverse-mode'); 
            
        } else {
            cardWord.innerHTML = card.image 
                ? `<img src="${card.image}" alt="Fragebild" class="front-image">`
                : `<span>${card.translation}</span>`;
            cardTranslation.innerHTML = `<span class="answer-word">${card.word}</span>`;
            cardImage.src = "";
            cardImage.style.display = 'none';
            flashcard.classList.add('reverse-mode'); 
        }
    }

    /** Aktualisiert die angezeigte Karte und die Navigations-Buttons. */
    function updateCardDisplay() {
        if (currentCards.length === 0) {
            cardWord.textContent = "Keine Vokabeln in diesem Set.";
            cardTranslation.textContent = "";
            cardImage.style.display = 'none';
            cardCounter.textContent = "0 / 0";
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            deleteCardBtn.disabled = true; // NEU: Löschen deaktivieren
            flashcard.classList.remove('flip', 'reverse-mode'); 
            return;
        }

        const card = currentCards[currentCardIndex];
        setCardFace(card);
        
        cardCounter.textContent = `${currentCardIndex + 1} / ${currentCards.length}`;
        prevBtn.disabled = currentCardIndex === 0;
        nextBtn.disabled = currentCardIndex === currentCards.length - 1;
        deleteCardBtn.disabled = false; // NEU: Löschen aktivieren
        flashcard.classList.remove('flip'); 
    }

    function nextCard() {
        if (currentCardIndex < currentCards.length - 1) {
            currentCardIndex++;
            updateCardDisplay();
        }
    }

    function prevCard() {
        if (currentCardIndex > 0) {
            currentCardIndex--;
            updateCardDisplay();
        }
    }

    // --- Event Listener ---

    // 1. Set-Auswahl ändern
    setSelect.addEventListener('change', (e) => {
        currentSetNameKey = e.target.value;
        loadCurrentSet();
        saveSets(); // Speichert den letzten ausgewählten Set-Namen
    });

    // 2. Neues Set hinzufügen
    addSetBtn.addEventListener('click', () => {
        const newSetName = prompt("Geben Sie einen Namen für das neue Vokabel-Set ein:");
        if (newSetName && newSetName.trim() !== "") {
            const cleanName = newSetName.trim();
            if (allSets[cleanName]) {
                alert("Ein Set mit diesem Namen existiert bereits!");
                return;
            }
            allSets[cleanName] = [];
            currentSetNameKey = cleanName;
            saveSets();
            populateSetSelect();
            loadCurrentSet();
        }
    });

    // 3. Karte umdrehen
    flashcard.addEventListener('click', () => {
        flashcard.classList.toggle('flip');
    });

    // 4. Navigation
    nextBtn.addEventListener('click', nextCard);
    prevBtn.addEventListener('click', prevCard);

    // 5. Karte löschen
    deleteCardBtn.addEventListener('click', deleteCurrentCard); // NEU

    // 6. Bild hochladen und in Base64 umwandeln (unverändert)
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

    // 7. Formular zum Hinzufügen einer Vokabel (angepasst)
    addWordForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const newCard = {
            // Eindeutige ID (Zeitstempel ist gut genug für Local Storage)
            id: Date.now(), 
            word: newWordInput.value.trim(),
            translation: newTranslationInput.value.trim(),
            image: currentBase64Image 
        };

        if (newCard.word === "" || newCard.translation === "") {
             alert("Bitte geben Sie ein Wort und eine Übersetzung ein.");
             return;
        }

        allSets[currentSetNameKey].push(newCard); // Zum aktuellen Set hinzufügen
        saveSets(); 
        
        // Zur neu hinzugefügten Karte navigieren
        currentCards = allSets[currentSetNameKey];
        currentCardIndex = currentCards.length - 1; 
        
        populateSetSelect(); // Set-Anzahl aktualisieren
        updateCardDisplay();

        // Formular zurücksetzen
        addWordForm.reset();
        currentBase64Image = null;
        imageStatus.textContent = "Kein Bild ausgewählt.";
    });

    // Anwendung starten
    loadSets();
});
