class Tokenizer {
    constructor() {
        this.vocab = new Map(); // Map from stringified byte array to Token ID
        this.merges = new Map(); // Map from 'b1,b2' to rank
        this.isLoaded = false;
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder('utf-8', { fatal: false });
    }

    // Helper to unescape strings like \x00, \n, \t
    unescapeBytes(str) {
        let bytes = [];
        let i = 0;
        while (i < str.length) {
            if (str[i] === '\\' && str[i+1] === 'x') {
                bytes.push(parseInt(str.slice(i+2, i+4), 16));
                i += 4;
            } else if (str[i] === '\\' && str[i+1] === 'n') {
                bytes.push(10);
                i += 2;
            } else if (str[i] === '\\' && str[i+1] === 't') {
                bytes.push(9);
                i += 2;
            } else if (str[i] === '\\' && str[i+1] === 'r') {
                bytes.push(13);
                i += 2;
            } else if (str[i] === '\\' && str[i+1] === '\\') {
                bytes.push(92);
                i += 2;
            } else {
                bytes.push(str.charCodeAt(i));
                i += 1;
            }
        }
        return bytes;
    }

    async init() {
        try {
            // Fetch vocab and merges from the ddtokens_files directory
            const [vocabRes, mergesRes] = await Promise.all([
                fetch('ddtokens_files/vocab.ddtok'),
                fetch('ddtokens_files/merges.ddtok')
            ]);

            if (!vocabRes.ok || !mergesRes.ok) {
                throw new Error("Failed to load tokenizer files");
            }

            const vocabText = await vocabRes.text();
            const mergesText = await mergesRes.text();

            this.parseVocab(vocabText);
            this.parseMerges(mergesText);
            
            this.isLoaded = true;
            console.log(`Tokenizer loaded: ${this.vocab.size} vocab entries, ${this.merges.size} merges.`);
        } catch (error) {
            console.error("Error initializing tokenizer:", error);
            throw error;
        }
    }

    parseVocab(text) {
        const lines = text.split('\n');
        for (const line of lines) {
            if (!line) continue;
            const firstTab = line.indexOf('\t');
            if (firstTab !== -1) {
                const id = parseInt(line.slice(0, firstTab));
                const tokenStr = line.slice(firstTab + 1);
                const bytes = this.unescapeBytes(tokenStr);
                this.vocab.set(bytes.join(','), id);
            }
        }
    }

    parseMerges(text) {
        const lines = text.split('\n');
        let rank = 0;
        for (const line of lines) {
            if (!line || line.startsWith('#')) continue;
            const parts = line.split('\t');
            if (parts.length === 2) {
                const p1 = this.unescapeBytes(parts[0]);
                const p2 = this.unescapeBytes(parts[1]);
                this.merges.set(p1.join(',') + '|' + p2.join(','), rank++);
            }
        }
    }

    encode(text) {
        if (!text) return [];
        if (!this.isLoaded) throw new Error("Tokenizer not loaded");

        // Start with raw bytes
        const rawBytes = this.encoder.encode(text);
        
        // Each token initially contains a single byte
        let tokens = Array.from(rawBytes).map(b => ({
            bytes: [b],
        }));

        while (tokens.length >= 2) {
            let minRank = Infinity;
            let minIndex = -1;
            
            for (let i = 0; i < tokens.length - 1; i++) {
                const p1 = tokens[i].bytes.join(',');
                const p2 = tokens[i+1].bytes.join(',');
                const pair = p1 + '|' + p2;
                const r = this.merges.get(pair);
                
                if (r !== undefined && r < minRank) {
                    minRank = r;
                    minIndex = i;
                }
            }
            
            if (minIndex === -1) break; // No more merges possible
            
            // Merge tokens[minIndex] and tokens[minIndex+1]
            const mergedBytes = [...tokens[minIndex].bytes, ...tokens[minIndex+1].bytes];
            tokens.splice(minIndex, 2, { bytes: mergedBytes });
        }

        // Finalize tokens by looking up IDs and decoding strings
        return tokens.map(t => {
            const byteStr = t.bytes.join(',');
            const id = this.vocab.get(byteStr);
            const decodedStr = this.decoder.decode(new Uint8Array(t.bytes));
            return {
                id: id !== undefined ? id : -1, // -1 for unknown
                bytes: t.bytes,
                string: decodedStr
            };
        });
    }
}

// Attach to window so app.js can use it
window.Tokenizer = Tokenizer;
