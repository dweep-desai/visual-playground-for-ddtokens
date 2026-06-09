document.addEventListener('DOMContentLoaded', async () => {
    const textInput = document.getElementById('text-input');
    const tokenViz = document.getElementById('token-visualization');
    const tokenIds = document.getElementById('token-ids');
    const charCount = document.getElementById('char-count');
    const tokenCount = document.getElementById('token-count');
    const loadingOverlay = document.getElementById('loading-overlay');
    const clearBtn = document.getElementById('clear-btn');
    const sampleBtn = document.getElementById('sample-btn');

    const sampleTexts = [
        "Hello world! 👋 Welcome to 2024.\nHere is a random number: 12345.\n    Let's see how this is tokenized!",
        "User 909 says:\n\"This UI is 🔥!\"\nWhat do you think about adding 5 more emojis? 🤔 Let me know ASAP! ✨",
        "Data block A7X:\nValue 1: $450.99\nValue 2: €120.00\n  --> Proceeding with transaction... 🚀 Success! 🎉",
        "Line 1...\n\nLine 3 after a blank! 😲\nCan it handle 4 spaces?    Yes, it can. Numbers like 3.14159 too! 🥧",
        "Error 404: Not Found 🚨\nPlease check the URL and try again. 🔄\nContact admin at 1-800-555-0199 for help.",
        "Task List 📋:\n1. Buy 3 apples 🍎\n2. Call Mom at 5:00 PM 📞\n3. Walk the dog 🐕\n  Done with all 3 tasks!",
        "Coordinates: 34.0522° N, 118.2437° W 📍\nLos Angeles, CA.\nPopulation: ~3.8 million 🏙️\nWeather: 72°F ☀️",
        "Code snippet:\n```js\nconst x = 42; 🧑‍💻\nconsole.log(\"Result:\", x * 2);\n```\nDoes this run properly? 🤔",
        "Flight BA249 ✈️ departs at 14:30.\nGate: 12B.\nPassenger: John Doe (ID: 987654321).\nHave a safe trip! 🌍",
        "Recipe for 🥞:\n- 2 cups flour\n- 1 cup milk 🥛\n- 3 eggs 🥚\nMix well and cook at 350°F for 10 mins. Enjoy!",
        "Invoice #77891 📄\nDate: 2026-06-09\nTotal: $1,250.50 💰\nStatus: PAID ✅\nThank you for your business! 🙏",
        "Event: Team Sync 📅\nTime: 10:00 AM - 11:30 AM.\nLocation: Room 4B 🏢\nAttendees: 8 people.\nBring coffee ☕!",
        "Temperature reads 98.6°F 🌡️.\nHeart rate: 72 bpm 💓.\nBlood pressure: 120/80.\nPatient is stable. 🏥👨‍⚕️",
        "The quick brown fox 🦊 jumps over 13 lazy dogs 🐶!\nWhat a crazy sight at 2:45 PM on a Tuesday. 🤯✨",
        "System Update ⚙️:\nVersion 10.4.2 installed.\nRestarting in 5... 4... 3... 2... 1... 💥\nSystem is UP! 🟢"
    ];

    // Initialize Tokenizer
    const tokenizer = new window.Tokenizer();
    
    try {
        await tokenizer.init();
        loadingOverlay.classList.add('hidden');
        
        // Initial tokenization if there's text (e.g. from browser cache)
        if (textInput.value) {
            updateVisualization();
        }
    } catch (error) {
        loadingOverlay.innerHTML = `<p style="color: #ef4444;">Failed to load tokenizer. Check console for details.</p>`;
    }

    let debounceTimeout;
    
    textInput.addEventListener('input', () => {
        // Debounce slightly to maintain performance on very large texts
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            updateVisualization();
        }, 10);
    });

    clearBtn.addEventListener('click', () => {
        textInput.value = '';
        updateVisualization();
        textInput.focus();
    });

    sampleBtn.addEventListener('click', () => {
        const randomIndex = Math.floor(Math.random() * sampleTexts.length);
        textInput.value = sampleTexts[randomIndex];
        updateVisualization();
    });

    function updateVisualization() {
        if (!tokenizer.isLoaded) return;
        
        const text = textInput.value;
        
        if (!text) {
            tokenViz.innerHTML = '';
            tokenIds.innerHTML = '';
            charCount.textContent = '0';
            tokenCount.textContent = '0';
            return;
        }

        const tokens = tokenizer.encode(text);
        
        // Update stats
        charCount.textContent = text.length.toLocaleString();
        tokenCount.textContent = tokens.length.toLocaleString();
        
        // Render visualization
        renderTokens(tokens);
    }

    function renderTokens(tokens) {
        // We use a DocumentFragment for performance
        const vizFragment = document.createDocumentFragment();
        const idsFragment = document.createDocumentFragment();
        
        tokens.forEach((token, index) => {
            // Color index 1 to 8
            const colorIndex = (index % 8) + 1;
            
            // Text visualization span
            const textSpan = document.createElement('span');
            textSpan.className = 'token-span';
            textSpan.style.backgroundColor = `var(--token-color-${colorIndex})`;
            
            // Replace newlines with visible return symbol + actual newline for accurate pre-wrap rendering
            // Or just rely on pre-wrap to render standard \n
            let displayStr = token.string;
            
            textSpan.textContent = displayStr;
            vizFragment.appendChild(textSpan);
            
            // ID chip
            const idChip = document.createElement('div');
            idChip.className = 'token-id-chip';
            idChip.textContent = token.id !== -1 ? token.id : `?`;
            
            // Add hover effects linking chip and text span
            idChip.addEventListener('mouseenter', () => {
                textSpan.style.filter = 'brightness(1.5) contrast(1.2)';
                idChip.style.backgroundColor = `var(--token-color-${colorIndex})`;
                idChip.style.color = '#fff';
            });
            idChip.addEventListener('mouseleave', () => {
                textSpan.style.filter = '';
                idChip.style.backgroundColor = '';
                idChip.style.color = '';
            });
            
            textSpan.addEventListener('mouseenter', () => {
                idChip.style.backgroundColor = `var(--token-color-${colorIndex})`;
                idChip.style.color = '#fff';
            });
            textSpan.addEventListener('mouseleave', () => {
                idChip.style.backgroundColor = '';
                idChip.style.color = '';
            });
            
            idsFragment.appendChild(idChip);
        });
        
        tokenViz.innerHTML = '';
        tokenViz.appendChild(vizFragment);
        
        tokenIds.innerHTML = '';
        tokenIds.appendChild(idsFragment);
    }
});
