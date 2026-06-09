import { getEncoding } from 'https://cdn.jsdelivr.net/npm/js-tiktoken@1.0.12/+esm';
import { env, AutoTokenizer } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js';
env.allowLocalModels = false;

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
    const compareBtn = document.getElementById('compare-btn');
    const compareDropdown = document.getElementById('compare-dropdown');
    const comparisonContainer = document.getElementById('comparison-container');
    const compareTitle = document.getElementById('compare-title');
    const compareTokenCount = document.getElementById('compare-token-count');
    const compareTokenViz = document.getElementById('compare-token-visualization');

    let currentCompareValue = 'none';
    const extraTokenizers = {};

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

    compareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        compareDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
        compareDropdown.classList.add('hidden');
    });

    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', async (e) => {
            currentCompareValue = e.target.getAttribute('data-value');
            const label = e.target.textContent;
            
            if (currentCompareValue === 'none') {
                comparisonContainer.classList.add('hidden');
                compareBtn.textContent = 'Compare ▼';
                updateVisualization();
                return;
            }

            compareBtn.textContent = `Comparing: ${label} ▼`;
            comparisonContainer.classList.remove('hidden');
            compareTitle.textContent = `Comparing with: ${label}`;

            if (currentCompareValue === 'llama-3') {
                if (!window.llama3Tokenizer) {
                    loadingOverlay.querySelector('p').textContent = `Loading LLaMA 3...`;
                    loadingOverlay.classList.remove('hidden');
                    await new Promise(r => setTimeout(r, 50));
                    loadingOverlay.classList.add('hidden');
                }
                updateVisualization();
            } else if (!extraTokenizers[currentCompareValue]) {
                loadingOverlay.querySelector('p').textContent = `Loading ${label}...`;
                loadingOverlay.classList.remove('hidden');
                
                try {
                    if (currentCompareValue === 'bert') {
                        extraTokenizers[currentCompareValue] = await AutoTokenizer.from_pretrained('Xenova/bert-base-uncased');
                    } else {
                        let encodingId = currentCompareValue === 'gpt-4' ? 'cl100k_base' : 'p50k_base';
                        extraTokenizers[currentCompareValue] = getEncoding(encodingId);
                    }
                } catch (err) {
                    console.error(err);
                    loadingOverlay.innerHTML = `<p style="color: #ef4444;">Failed to load tokenizer.</p>`;
                    return;
                }
                loadingOverlay.classList.add('hidden');
                loadingOverlay.querySelector('p').textContent = 'Loading Vocabulary & Merges...';
                updateVisualization();
            } else {
                updateVisualization();
            }
        });
    });

    function updateVisualization() {
        if (!tokenizer.isLoaded) return;
        
        const text = textInput.value;
        
        if (!text) {
            tokenViz.innerHTML = '';
            tokenIds.innerHTML = '';
            charCount.textContent = '0';
            tokenCount.textContent = '0';
            
            if (currentCompareValue !== 'none') {
                compareTokenViz.innerHTML = '';
                compareTokenCount.textContent = '0';
            }
            return;
        }

        // Render main ddtokens
        const tokens = tokenizer.encode(text);
        const tokensToRender = tokens.map(t => ({ id: t.id, string: t.string }));
        
        charCount.textContent = text.length.toLocaleString();
        tokenCount.textContent = tokensToRender.length.toLocaleString();
        
        renderTokens(tokensToRender, true, tokenViz, tokenIds);
        
        // Render comparison if active
        if (currentCompareValue !== 'none') {
            let compareTokensToRender = [];
            
            if (currentCompareValue === 'llama-3' && window.llama3Tokenizer) {
                const encodedIds = window.llama3Tokenizer.encode(text);
                compareTokensToRender = encodedIds.map(id => {
                    let str = window.llama3Tokenizer.decode([id]);
                    return { id: id, string: str };
                });
            } else if (extraTokenizers[currentCompareValue]) {
                const extraTok = extraTokenizers[currentCompareValue];
                
                if (currentCompareValue === 'bert') {
                    const encoded = extraTok(text);
                    const ids = Array.from(encoded.input_ids.data);
                    compareTokensToRender = ids.map(id => {
                        let str = extraTok.decode([id]);
                        return { id: id, string: str };
                    });
                } else {
                    const encodedIds = extraTok.encode(text);
                    compareTokensToRender = encodedIds.map(id => {
                        let str = '';
                        try {
                            str = new TextDecoder('utf-8', { fatal: false }).decode(extraTok.decodeSingleTokenBytes(id));
                        } catch(e) {
                            str = extraTok.decode([id]);
                        }
                        return { id: id, string: str };
                    });
                }
            }
            
            compareTokenCount.textContent = compareTokensToRender.length.toLocaleString();
            renderTokens(compareTokensToRender, false, compareTokenViz, null);
        }
    }

    function renderTokens(tokens, showIds = true, targetViz, targetIds) {
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
            
            if (showIds) {
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
            }
        });
        
        targetViz.innerHTML = '';
        targetViz.appendChild(vizFragment);
        
        if (showIds && targetIds) {
            targetIds.innerHTML = '';
            targetIds.appendChild(idsFragment);
        }
    }
});
