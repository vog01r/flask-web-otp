// ===========================================
// 🚀 WEB OTP - JavaScript SIMPLE ET FONCTIONNEL
// ===========================================

console.log('📄 app.js chargé');

// ===========================================
// 🔧 FONCTIONS UTILITAIRES
// ===========================================

// Récupérer un code depuis l'API
async function fetchCode(id) {
    try {
        const response = await fetch(`/api/code/${id}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error(`❌ Erreur fetch pour token ${id}:`, error);
        return null;
    }
}

// Mettre à jour le cercle SVG
function updateCircle(id, remaining, period) {
    const circle = document.getElementById(`progress-${id}`);
    if (!circle) return;
    
    const circumference = 2 * Math.PI * 36; // rayon = 36
    const percentage = remaining / period;
    const offset = circumference * (1 - percentage);
    
    // Mettre à jour le stroke-dashoffset
    circle.style.transition = 'stroke-dashoffset 0.3s ease-out';
    circle.style.strokeDashoffset = offset;
    
    // Changer la couleur du gradient selon l'urgence
    const gradientId = `gradient-${id}`;
    const gradient = document.getElementById(gradientId);
    
    if (gradient) {
        if (remaining <= 5) {
            gradient.innerHTML = `
                <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1" />
            `;
        } else if (remaining <= 10) {
            gradient.innerHTML = `
                <stop offset="0%" style="stop-color:#f59e0b;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#d97706;stop-opacity:1" />
            `;
        } else {
            gradient.innerHTML = `
                <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
            `;
        }
    }
}

// Mettre à jour SEULEMENT l'affichage (sans appel API) - ULTRA FLUIDE !
function updateDisplay(id, remaining, period) {
    const codeEl = document.getElementById(`code-${id}`);
    const remEl = document.getElementById(`rem-${id}`);
    
    // Mettre à jour le compteur
    if (remEl) {
        remEl.textContent = remaining;
        
        // Classes selon l'urgence
        remEl.className = 'timer-text';
        if (remaining <= 5) {
            remEl.classList.add('urgent');
        } else if (remaining <= 10) {
            remEl.classList.add('warning');
        } else {
            remEl.classList.add('normal');
        }
    }
    
    // Mettre à jour le cercle
    updateCircle(id, remaining, period);
    
    // Changer la couleur du code selon l'urgence
    // IMPORTANT : Ne modifier QUE la couleur, rien d'autre pour éviter les décalages
    if (codeEl) {
        // Sauvegarder les propriétés importantes
        const currentDisplay = codeEl.style.display || '';
        const currentJustify = codeEl.style.justifyContent || '';
        const currentAlign = codeEl.style.alignItems || '';
        
        // Changer uniquement la couleur
        if (remaining <= 5) {
            codeEl.style.color = '#ef4444'; // Rouge
        } else if (remaining <= 10) {
            codeEl.style.color = '#f59e0b'; // Orange
        } else {
            codeEl.style.color = '#60a5fa'; // Bleu
        }
        
        // S'assurer que les propriétés de layout restent intactes
        if (currentDisplay) codeEl.style.display = currentDisplay;
        if (currentJustify) codeEl.style.justifyContent = currentJustify;
        if (currentAlign) codeEl.style.alignItems = currentAlign;
    }
}

// Mettre à jour un token via l'API (pour récupérer le nouveau code)
function updateToken(id, period) {
    return fetchCode(id).then(data => {
        if (!data) return;
        
        const codeEl = document.getElementById(`code-${id}`);
        const remEl = document.getElementById(`rem-${id}`);
        
        // Sauvegarder l'ancien code pour détecter les changements
        const oldCode = codeEl ? codeEl.textContent.trim() : '';
        const newCode = data.code;
        
        // Mettre à jour le code
        if (codeEl && newCode !== oldCode) {
            // IMPORTANT : Modifier uniquement le texte, rien d'autre
            // Utiliser innerText au lieu de textContent pour préserver l'alignement
            codeEl.innerText = newCode;
            
            // Animation quand le code change (court pour éviter les décalages)
            codeEl.classList.add('bounce');
            setTimeout(() => {
                codeEl.classList.remove('bounce');
                // S'assurer que tout est bien remis à zéro après l'animation
                codeEl.style.transform = '';
                codeEl.style.transformOrigin = 'center center';
            }, 300);
            
            // Effet sur la carte
            const card = codeEl.closest('.card');
            if (card) {
                card.style.borderColor = 'rgba(16, 185, 129, 0.5)';
                card.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.3)';
                setTimeout(() => {
                    card.style.borderColor = '';
                    card.style.boxShadow = '';
                }, 500);
            }
        }
        
        // Mettre à jour le compteur et le cercle
        updateDisplay(id, data.remaining, period);
        
        // Mettre à jour le countdown local
        if (countdowns[id]) {
            countdowns[id].remaining = data.remaining;
        }
        
        return data;
    }).catch(error => {
        console.error(`❌ Erreur updateToken pour ${id}:`, error);
        return null;
    });
}

// ===========================================
// ⏱️ COMPTE À REBOURS FLUIDE
// ===========================================

// Stocker les intervalles et les états pour chaque token
const intervals = {};
const countdowns = {};

// Démarrer le compte à rebours pour un token
function startCountdown(id, period) {
    console.log(`▶️ Démarrage compte à rebours pour token ${id} (période: ${period}s)`);
    
    // Arrêter l'intervalle existant si il y en a un
    if (intervals[id]) {
        clearInterval(intervals[id]);
    }
    
    // Récupérer la valeur initiale depuis le DOM
    const remEl = document.getElementById(`rem-${id}`);
    let remaining = period;
    if (remEl) {
        const text = remEl.textContent.trim();
        const num = parseInt(text);
        if (!isNaN(num)) {
            remaining = num;
        }
    }
    
    // Initialiser le compte à rebours
    countdowns[id] = {
        remaining: remaining,
        period: period
    };
    
    // Mise à jour initiale depuis l'API pour avoir le bon code
    updateToken(id, period);
    
    // Puis décrémenter localement toutes les secondes (ULTRA FLUIDE !)
    intervals[id] = setInterval(() => {
        const countdown = countdowns[id];
        if (!countdown) return;
        
        // Décrémenter le compteur
        countdown.remaining--;
        
        // Si on arrive à 0, récupérer le nouveau code
        if (countdown.remaining <= 0) {
            // Récupérer le nouveau code et remettre à period
            updateToken(id, period).then(() => {
                // Mettre à jour depuis le DOM après l'update
                const remEl = document.getElementById(`rem-${id}`);
                if (remEl) {
                    const text = remEl.textContent.trim();
                    const num = parseInt(text);
                    if (!isNaN(num)) {
                        countdown.remaining = num;
                    } else {
                        countdown.remaining = period;
                    }
                } else {
                    countdown.remaining = period;
                }
            });
        } else {
            // Sinon, juste mettre à jour l'affichage localement (ULTRA FLUIDE !)
            updateDisplay(id, countdown.remaining, period);
        }
    }, 1000);
}

// Arrêter le compte à rebours pour un token
function stopCountdown(id) {
    if (intervals[id]) {
        clearInterval(intervals[id]);
        delete intervals[id];
        console.log(`⏹️ Compte à rebours arrêté pour token ${id}`);
    }
}

// ===========================================
// 🚀 INITIALISATION
// ===========================================

// Fonction principale pour démarrer tous les compteurs
function startLive(ids, periods) {
    console.log('🚀 Démarrage de tous les compteurs...');
    console.log('📋 Tokens:', ids);
    console.log('⏱ Périodes:', periods);
    
    ids.forEach(id => {
        const period = periods[id] || 30;
        startCountdown(id, period);
    });
    
    console.log('✅ Tous les compteurs démarrés !');
}

// ===========================================
// 🗑️ FONCTION DE SUPPRESSION
// ===========================================

async function deleteToken(id) {
    // Demander confirmation
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce code OTP ?')) {
        return;
    }
    
    try {
        // Arrêter le compte à rebours pour ce token
        stopCountdown(id);
        
        // Supprimer le token via l'API
        const response = await fetch(`/api/token/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la suppression');
        }
        
        // Animation de suppression
        const card = document.getElementById(`card-${id}`);
        if (card) {
            card.style.transition = 'all 0.3s ease-out';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9) translateY(-20px)';
            
            setTimeout(() => {
                card.remove();
                
                // Si plus de cartes, recharger la page pour afficher l'état vide
                const remainingCards = document.querySelectorAll('.card[id^="card-"]');
                if (remainingCards.length === 0) {
                    window.location.reload();
                }
            }, 300);
        }
        
        console.log(`✅ Token ${id} supprimé avec succès`);
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du code OTP. Veuillez réessayer.');
    }
}

// ===========================================
// 📋 FONCTION DE COPIE
// ===========================================

async function copyCode(id) {
    try {
        const response = await fetch(`/api/code/${id}`);
        if (!response.ok) {
            console.error('❌ Erreur lors de la récupération du code');
            return;
        }
        
        const data = await response.json();
        const code = data.code;
        
        // Copier dans le presse-papier
        await navigator.clipboard.writeText(code);
        
        // Feedback visuel
        const button = document.querySelector(`button[onclick="copyCode(${id})"]`);
        const codeEl = document.getElementById(`code-${id}`);
        const card = codeEl?.closest('.card');
        
        if (button) {
            const originalText = button.textContent;
            button.textContent = '✅ Copié !';
            button.style.background = '#10b981';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
            }, 2000);
        }
        
        if (codeEl) {
            codeEl.classList.add('bounce');
            setTimeout(() => codeEl.classList.remove('bounce'), 600);
        }
        
        if (card) {
            card.style.borderColor = 'rgba(16, 185, 129, 0.5)';
            card.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.3)';
            setTimeout(() => {
                card.style.borderColor = '';
                card.style.boxShadow = '';
            }, 500);
        }
        
        console.log(`✅ Code copié: ${code}`);
    } catch (error) {
        console.error('❌ Erreur lors de la copie:', error);
    }
}

// ===========================================
// 🎯 INITIALISATION
// ===========================================

console.log('✅ app.js prêt !');
