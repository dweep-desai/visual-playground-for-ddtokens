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
        "Exploring the vast universe, one small step at a time.",
        "The silent night was broken by a sudden, loud thunder.",
        "She quickly typed the complex code into the terminal.",
        "A gentle breeze whispered through the ancient oak trees.",
        "Mountains stood tall against the vibrant sunset sky.",
        "He sipped his hot coffee while watching the morning rain.",
        "The clever fox outsmarted the hounds with a quick dash.",
        "Robots are learning to perform intricate surgical tasks.",
        "Music has the power to heal the soul and uplift spirits.",
        "A mysterious shadow moved gracefully across the dark alley.",
        "The old clock chimed exactly at midnight, echoing loudly.",
        "They discovered a hidden treasure buried beneath the sand.",
        "The sparkling stars guided the lost sailors back home.",
        "Reading a good book can transport you to another world.",
        "Freshly baked bread filled the room with a delightful aroma."
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
