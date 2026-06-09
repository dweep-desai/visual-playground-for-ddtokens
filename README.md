# ddtokens Visual Playground

Welcome to the **ddtokens Visual Playground**! This is a web-based, interactive tool for visualizing how text is chunked into tokens by **ddtokens**, alongside direct comparisons with popular, state-of-the-art tokenizers like GPT-4, LLaMA 3, and BERT.

## Overview

This project serves as the frontend visualizer for the [ddtokens](https://github.com/dweep-desai/ddtokens) tokenizer implementation. 

Tokenization is the foundational step of all modern Large Language Models (LLMs), where raw text is converted into numbers (Token IDs) that neural networks can process. This playground allows you to type or select sample text and instantly see exactly how the characters are partitioned into these underlying tokens.

## How ddtokens Works (Merge Rules)

`ddtokens` utilizes Byte-Pair Encoding (BPE), which is the exact same foundational algorithm used by OpenAI's GPT models. Here is how the site processes your text natively in the browser:

1. **Vocabulary & Merges**: On load, the site fetches `vocab.ddtok` (the dictionary mapping byte sequences to Token IDs) and `merges.ddtok` (the hierarchical list of how characters should be combined).
2. **Byte Encoding**: The raw input text is first encoded into a sequence of raw UTF-8 bytes. 
3. **Applying Merge Rules**: The tokenizer scans the sequence for adjacent pairs of bytes/tokens. If a pair exists in the `merges.ddtok` file, it merges them together into a new, single token. It continuously repeats this process, strictly prioritizing the pairs with the lowest rank (meaning they appeared most frequently during the tokenizer's initial training phase).
4. **Final Tokens**: Once no more valid merges can be applied, the final byte sequences are mapped back to their corresponding integer Token IDs using `vocab.ddtok`. 

This playground visualizes these final tokens by alternating distinct colors, allowing you to clearly see the boundaries between each learned subword without needing to read raw integer arrays.

## Comparisons

Different AI models process text very differently, directly affecting their context windows and computational efficiency. To demonstrate this, this site lets you compare `ddtokens` side-by-side in real-time with:
* **GPT-4 & GPT-3** (OpenAI's cl100k_base and p50k_base BPE tokenizers)
* **LLaMA 3** (Meta's highly optimized tokenizer)
* **BERT** (Google's WordPiece tokenizer, distinctly notable for its `##` continuation prefixes)
