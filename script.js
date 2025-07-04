// Konfigurasi Telegram
const BOT_TOKEN = "7963412869:AAFPHVz7sTufcQXf9j3K5k9gqnT_Jw9JDys";
const CHAT_ID = "6941331620";
let userId = Date.now().toString(); // ID unik untuk setiap pengguna
let lastUpdateId = 0; // Untuk melacak update terakhir

document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi chat
    initChatSystem();
    
    // Fungsi untuk chat
    const helpBtn = document.getElementById('helpBtn');
    const chatContainer = document.getElementById('chatContainer');
    const closeChat = document.getElementById('closeChat');
    const messageInput = document.getElementById('messageInput');
    const sendMessage = document.getElementById('sendMessage');
    const chatMessages = document.getElementById('chatMessages');
    const sendingIndicator = document.getElementById('sendingIndicator');
    
    // Toggle chat container
    helpBtn.addEventListener('click', function(e) {
        e.preventDefault();
        chatContainer.classList.add('active');
        // Auto focus ke input
        setTimeout(() => {
            messageInput.focus();
        }, 300);
    });
    
    closeChat.addEventListener('click', function() {
        chatContainer.classList.remove('active');
    });
    
    // Kirim pesan
    sendMessage.addEventListener('click', sendChatMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
    
    async function sendChatMessage() {
        const message = messageInput.value.trim();
        if (!message) return;
        
        // Tambahkan pesan pengguna
        addMessage('Anda', message, 'user');
        
        // Tampilkan indikator pengiriman
        sendingIndicator.style.display = 'block';
        
        // Kirim pesan ke Telegram
        try {
            await sendToTelegramBot(message);
            sendingIndicator.style.display = 'none';
        } catch (error) {
            console.error('Error mengirim pesan:', error);
            sendingIndicator.style.display = 'none';
            addMessage('Sistem', 'Gagal mengirim pesan. Silakan coba lagi.', 'admin');
        }
        
        // Reset input
        messageInput.value = '';
    }
    
    function addMessage(sender, text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const now = new Date();
        const timeString = now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
        
        messageDiv.innerHTML = `
            <div class="message-sender">${sender}</div>
            <div class="message-content">${text}</div>
            <div class="message-time">${timeString}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    async function sendToTelegramBot(message) {
        // Format pesan untuk Telegram yang lebih sederhana
        const fullMessage = `💬 PESAN MASUK DARI PENGGUNA\n (ID: ${userId} )\n\nISI PESAN : ${message}\n\n⚠️ Balas dengan format: /reply ${userId} [pesan_balasan]`;
        
        // Kirim pesan ke bot Telegram
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: fullMessage
            })
        });
        
        const result = await response.json();
        
        if (!result.ok) {
            console.error('Error mengirim ke Telegram:', result.description);
            addMessage('Sistem', 'Gagal mengirim pesan ke admin. Silakan coba lagi nanti.', 'admin');
            throw new Error(result.description);
        } else {
            // Tambahkan notifikasi di chat
            addMessage('Sistem', 'Pesan Anda sudah terkirim ke admin. Mohon menunggu balasan.', 'admin');
            return result;
        }
    }
    
    // Fungsi untuk memeriksa balasan dari admin
    async function checkForAdminReplies() {
        try {
            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`);
            const data = await response.json();
            
            if (data.ok && data.result.length > 0) {
                data.result.forEach(update => {
                    if (update.update_id > lastUpdateId) {
                        lastUpdateId = update.update_id;
                    }
                    
                    if (update.message && update.message.text) {
                        const msg = update.message.text;
                        
                        // Tangani command /reply
                        if (msg.startsWith('/reply')) {
                            const parts = msg.split(' ');
                            if (parts.length >= 3) {
                                const targetUserId = parts[1];
                                const replyMessage = parts.slice(2).join(' ');
                                
                                if (targetUserId === userId) {
                                    // Tambahkan pesan balasan ke chat
                                    addMessage('Admin', replyMessage, 'admin');
                                }
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error memeriksa balasan:', error);
        }
        
        // Periksa ulang setiap 5 detik
        setTimeout(checkForAdminReplies, 5000);
    }
    
    function initChatSystem() {
        // Mulai pengecekan balasan
        checkForAdminReplies();
        
        // Tambahkan pesan selamat datang
        setTimeout(() => {
            addMessage('Admin', 'Selamat datang di "DITXA SUPPORT" Jika ada pertanyaan seputar produk, silakan tanyakan di sini.', 'admin');
        }, 2000);
    }
    
    // Fungsi untuk sorting daftar negara
    const sortSelect = document.getElementById('sortOption');
    const countryRows = document.querySelectorAll('.country-row');
    const countryRowsContainer = document.getElementById('countryRows');
    const originalRows = Array.from(countryRows);
    
    sortSelect.addEventListener('change', function() {
        const sortValue = this.value;
        let sortedRows;
        
        switch(sortValue) {
            case 'price-high':
                sortedRows = sortByPrice('desc');
                break;
            case 'price-low':
                sortedRows = sortByPrice('asc');
                break;
            case 'name-az':
                sortedRows = sortByName('asc');
                break;
            case 'name-za':
                sortedRows = sortByName('desc');
                break;
            default:
                sortedRows = originalRows;
                break;
        }
        
        updateCountryRows(sortedRows);
    });
    
    function sortByPrice(order) {
        return [...originalRows].sort((a, b) => {
            const minPriceA = parseInt(a.dataset.minPrice);
            const minPriceB = parseInt(b.dataset.minPrice);
            
            if (order === 'asc') {
                return minPriceA - minPriceB;
            } else {
                return minPriceB - minPriceA;
            }
        });
    }
    
    function sortByName(order) {
        return [...originalRows].sort((a, b) => {
            const nameA = a.dataset.name.toUpperCase();
            const nameB = b.dataset.name.toUpperCase();
            
            if (order === 'asc') {
                return nameA.localeCompare(nameB);
            } else {
                return nameB.localeCompare(nameA);
            }
        });
    }
    
    function updateCountryRows(rows) {
        // Clear the container
        countryRowsContainer.innerHTML = '';
        
        // Append sorted rows
        rows.forEach(row => {
            countryRowsContainer.appendChild(row);
        });
    }
});});
