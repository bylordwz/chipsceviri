document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const pronunciationText = document.getElementById('pronunciationText');
    const translateBtn = document.getElementById('translateBtn');
    const switchBtn = document.getElementById('switchBtn');

    let isChipsToNormal = false;

    const replacements = {
        'yapıyorum': 'yapıyüm',
        'ediyorum': 'ediyüm',
        'bakıyorum': 'bakıyüm',
        'yorum': 'yüm',
        'baba': 'babiş',
        'saç kurutucu': 'saç kuruyutucu',
        'ayıp': 'ayip',
        'salak': 'amın düdüğü',
        'salaklar': 'amın düdüğülar',
        'mal': 'amın düdüğü',
        'mallar': 'amın düdüğülar',
        'kötü': 'vırrık',
        'chat': 'cha'
    };

    const pronunciations = {
        'yapıyüm': 'yapiyüm',
        'ediyüm': 'ediyüm',
        'bakıyüm': 'bakiyüm',
        'yüm': 'yüm',
        'babiş': 'babiş',
        'saç kuruyutucu': 'saç kuruyutucusu',
        'ayip': 'ayip',
        'amın düdüğü': 'amın düdüğü',
        'amın düdüğülar': 'amın düdüğülar',
        'vırrık': 'vırrık',
        'cha': 'çe'
    };

    const angerPhrases = [
        'amın düdüğü',
        'ebenin a...',
        'senin ananı sikeyim orospu çocuğu',
        'amınıza gorum',
        'olum pisleşmeyin',
        'regal ettiniz beni yav'
    ];

    function preserveCase(original, replacement) {
        if (original === original.toLowerCase()) return replacement.toLowerCase();
        if (original === original.toUpperCase()) return replacement.toUpperCase();
        if (original[0] === original[0].toUpperCase()) {
            return replacement[0].toUpperCase() + replacement.slice(1).toLowerCase();
        }
        return replacement.toLowerCase();
    }

    function replaceWithCase(text, search, replacement) {
        const regex = new RegExp(search, 'gi');
        return text.replace(regex, match => preserveCase(match, replacement));
    }

    function addHeğ(text) {
        // Split into paragraphs while preserving empty lines
        let paragraphs = text.split(/(\n\s*\n)/);
        
        return paragraphs.map((part, index) => {
            // If it's a paragraph separator (empty lines), keep it as is
            if (index % 2 === 1) return part;
            
            // Process paragraph
            let parts = part.split(/(?<=\S)([.!?]+\s*)/);
            let result = '';
            
            for (let i = 0; i < parts.length; i++) {
                if (i % 2 === 0) { // Sentence content
                    let sentence = parts[i].trimEnd();
                    if (sentence && !sentence.endsWith('heğ')) {
                        result += sentence + ' heğ';
                    } else {
                        result += sentence;
                    }
                } else { // Punctuation and spacing
                    result += parts[i];
                }
            }
            
            return result.trim();
        }).join('');
    }

    function removeHeğ(text) {
        // Split into paragraphs while preserving empty lines
        let paragraphs = text.split(/(\n\s*\n)/);
        
        return paragraphs.map((part, index) => {
            // If it's a paragraph separator (empty lines), keep it as is
            if (index % 2 === 1) return part;
            
            // Remove heğ from paragraph
            return part.replace(/\s+heğ(?=\s*[.!?]+|\s*$)/g, '');
        }).join('');
    }

    function handleSpecialPlurals(text) {
        // Replace 'amın düdükleri' with 'amın düdüğülar'
        text = text.replace(/amın düdükleri/gi, match => 
            preserveCase(match, 'amın düdüğülar')
        );
        return text;
    }

    function normalToChips(text) {
        let translated = text;
        
        // Replace words according to rules with case preservation
        Object.entries(replacements).forEach(([key, value]) => {
            translated = replaceWithCase(translated, key, value);
        });

        // Special case replacements with case preservation
        translated = replaceWithCase(translated, 'pıyorsunuz', 'püyünüz');
        translated = replaceWithCase(translated, 'pıyorsun', 'püyün');
        translated = replaceWithCase(translated, 'pıyon', 'püyün');
        translated = replaceWithCase(translated, 'mısın', 'müsün');
        translated = replaceWithCase(translated, 'misin', 'müsün');
        translated = replaceWithCase(translated, 'musun', 'müsün');

        // Handle special plural cases
        translated = handleSpecialPlurals(translated);

        // Add heğ to end of sentences
        translated = addHeğ(translated);

        return translated;
    }

    function chipsToNormal(text) {
        // Remove anger phrases
        for (const phrase of angerPhrases) {
            text = text.replace(new RegExp('\\s*' + phrase + '$', 'i'), '');
        }

        // Remove heğ from sentences
        text = removeHeğ(text);

        // Remove stutters
        text = text.replace(/([a-zçğıöşüA-ZÇĞIÖŞÜ])-\1[a-zçğıöşüA-ZÇĞIÖŞÜ]+/g, match => match.split('-')[1]);

        // Reverse special cases with case preservation
        text = replaceWithCase(text, 'püyünüz', 'pıyorsunuz');
        text = replaceWithCase(text, 'püyün', 'pıyorsun');

        // Reverse replacements with case preservation
        Object.entries(replacements).forEach(([normal, chips]) => {
            text = replaceWithCase(text, chips, normal);
        });

        // Replace "yünüz" back to "yorsunuz" and "yü" back to "yor" with case preservation
        text = text.replace(/([a-zçğıöşüA-ZÇĞIÖŞÜ])yünüz([^a-zçğıöşüA-ZÇĞIÖŞÜ]|$)/g, (match, p1, p2) => {
            return preserveCase(match, p1 + 'yorsunuz' + p2);
        });
        text = text.replace(/([a-zçğıöşüA-ZÇĞIÖŞÜ])yü([^a-zçğıöşüA-ZÇĞIÖŞÜ]|$)/g, (match, p1, p2) => {
            return preserveCase(match, p1 + 'yor' + p2);
        });

        return text;
    }

    function getPronunciation(text) {
        let pronunciation = text;
        
        // Apply all pronunciations
        Object.entries(pronunciations).forEach(([key, value]) => {
            const regex = new RegExp(key, 'gi');
            pronunciation = pronunciation.replace(regex, value);
        });

        // Handle special cases
        pronunciation = pronunciation.replace(/müsün/gi, 'müsün');
        pronunciation = pronunciation.replace(/yünüz/gi, 'yünüz');
        pronunciation = pronunciation.replace(/([a-zçğıöşüA-ZÇĞIÖŞÜ])yü([^a-zçğıöşüA-ZÇĞIÖŞÜ]|$)/gi, '$1yü$2');

        return pronunciation;
    }

    function translate() {
        const input = inputText.value;
        const translated = isChipsToNormal ? chipsToNormal(input) : normalToChips(input);
        outputText.value = translated;
        
        // Add pronunciation
        if (!isChipsToNormal) {
            pronunciationText.value = getPronunciation(translated);
        } else {
            pronunciationText.value = '';
        }
    }

    switchBtn.addEventListener('click', () => {
        isChipsToNormal = !isChipsToNormal;
        
        // Swap input and output labels
        const inputLabel = document.querySelector('.input-section h2');
        const outputLabel = document.querySelector('.output-section h2');
        
        inputLabel.textContent = isChipsToNormal ? "Chips Türkçesi" : "Normal Türkçe";
        outputLabel.textContent = isChipsToNormal ? "Normal Türkçe" : "Chips Türkçesi";
        
        // Update placeholder
        inputText.placeholder = isChipsToNormal ? 
            "Chips Türkçesi metni girin..." : 
            "Çevirmek istediğiniz metni buraya yazın...";
        
        // Clear all text areas
        inputText.value = '';
        outputText.value = '';
        pronunciationText.value = '';
        
        // Hide pronunciation section when translating from Chips to Normal
        const pronunciationSection = document.querySelector('.pronunciation-section');
        pronunciationSection.style.display = isChipsToNormal ? 'none' : 'block';
    });

    translateBtn.addEventListener('click', translate);

    // Also translate while typing with a small delay
    let timeout = null;
    inputText.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(translate, 500);
    });
});
