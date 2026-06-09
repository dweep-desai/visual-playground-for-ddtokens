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
        "To tokenize or not to tokenize, that is the query.\n\nCost: $42.99!   Wait, a serendipitous bug? 🐛",
        "Data chunk #090-B:\n    Initializing sequence...\nWarning: Variable 'X' undefined. \nProceed anyway? 🤔",
        "The antidisestablishmentarianism movement began in 19th-century England.\n  (See page 45, line 2) 📖",
        "Defenestration: the act of throwing someone out of a window.\n\nRate = 9.81m/s^2.   Don't try this! 🪟",
        "var str = \"Hello\\nWorld\";\n   let sum = 0;\nfor(let i=0; i<100; i++) {\n  sum += i; // The result 🚀\n}",
        "Order ID: 77-XYZ-9002.\n  Customer: Jane Doe.\nStatus: Pending clearance @ customs.\nETA: 24/11/2026 📦",
        "The quintessential algorithm requires O(N log N) time complexity.\n\nCan we optimize the inner loop? 🧠",
        "Password requirements:\n- 1 uppercase\n- 1 symbol (!@#$)\n- 12+ characters\n    Is \"P@ssw0rd\" safe? 🔒",
        "A completely ubiquitous phenomenon!\n\nThe temperature dropped to -14.5°C in the isolated tundra. ❄️",
        "Equation: f(x) = x^2 - 4x + 4.\nRoots at x = 2.\n  What happens if we integrate from 0 to infinity? 📈",
        "Contact support@example.com for inquiries.\n\nTicket #55442 created.\n   Priority: HIGH. Over & out 📞",
        "They ventured into the labyrinthine cave...\n\nFound 500 gold coins, 2 ancient relics & a potion. 🏺",
        "SyntaxError: Unexpected token '<' at line 42.\n\n    Check your HTML tags! Did you miss a bracket? 💻",
        "The cacophony of the city streets was overwhelming.\n\nDecibel level: ~85dB.\n   Need some quiet... 🎧",
        "Ingredients:\n- 2.5 cups flour\n- 1 tsp salt\n- 3/4 cup warm water\n   Mix rigorously for 10 minutes. 🥖"
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
