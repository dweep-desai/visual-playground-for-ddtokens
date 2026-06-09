document.addEventListener('DOMContentLoaded', async () => {
    const textInput = document.getElementById('text-input');
    const tokenViz = document.getElementById('token-visualization');
    const tokenIds = document.getElementById('token-ids');
    const charCount = document.getElementById('char-count');
    const tokenCount = document.getElementById('token-count');
    const loadingOverlay = document.getElementById('loading-overlay');
    const clearBtn = document.getElementById('clear-btn');
    const sampleBtn = document.getElementById('sample-btn');
    const tokenListContainer = document.getElementById('token-list-container');
    const resizer = document.getElementById('resizer');

    let isResizing = false;
    let lastDownY = 0;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        lastDownY = e.clientY;
        resizer.classList.add('resizing');
        document.body.style.cursor = 'row-resize';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const deltaY = lastDownY - e.clientY;
        lastDownY = e.clientY;
        
        const currentHeight = tokenListContainer.getBoundingClientRect().height;
        let newHeight = currentHeight + deltaY;
        
        if (newHeight < 50) newHeight = 50;
        if (newHeight > window.innerHeight * 0.7) newHeight = window.innerHeight * 0.7;
        
        tokenListContainer.style.height = `${newHeight}px`;
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            resizer.classList.remove('resizing');
            document.body.style.cursor = '';
        }
    });

    const sampleTexts = [
        "In the heart of the bustling metropolis, a completely unprecedented phenomenon occurred at precisely 14:05 PM.\n\nTemperatures plummeted by -34.8°C!    The sheer juxtaposition left citizens flabbergasted. ❄️",
        "Data synchronization initialized... [Buffer: 8092 bytes]\n\nWARNING: The ubiquitous firewall at 192.168.0.255 is rejecting packets from node ~X7.\n   Please restart the subterranean routing algorithm immediately to prevent catastrophic failure! 🛠️",
        "Are you familiar with the concept of antidisestablishmentarianism? It's quite the mouthful!\n\nAccording to historical records from the 1800s, it involves intricate socio-political maneuvering.   (Page 45) 📚",
        "Invoice #994-Alpha has been processed successfully.\n\nTotal amount due: $1,450.75 or €1,320.00.\n   We kindly request that you remit payment by 31/12/2026. Failure to comply will automatically result in a non-negotiable 5.5% late penalty fee. 💼",
        "function calculateHypotenuse(a, b) {\n    // Pythagorean theorem: a^2 + b^2 = c^2\n    return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));\n}\n\nTesting with (3, 4)... Result is exactly 5.000!   This beautiful idiosyncratic logic fascinates me. 💻",
        "The recipe calls for a rather unconventional approach:\n- 3.5 cups of refined flour\n- 1/4 tsp of Himalayan pink salt\n- 2 large eggs\n\n   Whisk vigorously for exactly 15 minutes until it becomes viscous! 🧑‍🍳",
        "Defenestration—the act of throwing someone or something out of a window—is a peculiarly specific vocabulary word.\n\nImagine the chaotic velocity (v = 9.8m/s^2) of a 45kg object plummeting from the 12th floor!   Do not attempt this at home. 🪟",
        "Passenger manifest for Flight DL-8409:\n  Name: Alexander Supertramp\n  Seat: 14B (Aisle)\n  Status: Checked-in\n\nPlease proceed to Gate C-42 immediately. A journey of 1,000 miles begins with a single step. ✈️",
        "Did you know that the hexadecimal color code for pure cyan is #00FFFF?\n\nIt consists of 0% red, 100% green, and exactly 100% blue.   If you carefully mix it with magenta (#FF00FF), the resulting juxtaposition creates an entirely new spectrum! 🎨",
        "System Diagnostics [Run #4002]:\nCPU Temp: 85°C (CRITICAL)\nRAM Usage: 15.8GB / 16.0GB\n\n   The monolithic architecture is experiencing memory leaks. Execute the \"kill -9\" command on process ID 8080 ASAP! 🚨",
        "The philosophical debate surrounding existentialism often revolves around the inherent meaninglessness of the universe.\n\nIn 1943, Jean-Paul Sartre published 'Being and Nothingness'—an intricately woven 600-page tome exploring these concepts. 🤔",
        "A cacophony of sirens interrupted the otherwise tranquil evening.\n\nDecibel meter readings spiked from ~40dB to an ear-splitting 115dB in mere seconds!    Emergency vehicles rushed towards 5th & Main. 🚑",
        "Patient file #77-B:\nBlood pressure: 120/80 mmHg.\nHeart rate resting: 65 bpm.\nTemperature: 98.6°F.\n\n   The comprehensive electrocardiogram indicates absolutely zero abnormalities. We strongly recommend scheduling a follow-up check in 6 months. 🏥",
        "Have you ever tried navigating the Byzantine bureaucracy of the local DMV?\n\nIt required bringing 3 forms of ID, waiting for 4.5 hours, and filling out Document 1099-B... only to be in the wrong queue! 🐢",
        "Weather alert for zip code 90210:\nHeavy precipitation expected between 14:00 and 18:00.\nWind gusts reaching up to 45 mph (72 km/h).\n\n   We urgently advise all residents to secure loose outdoor items and avoid transcontinental travel entirely. ⛈️"
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
