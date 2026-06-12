const GEMINI_API_KEY = "שים_את_המפתח_שלך_כאן";

const videoElement = document.getElementById('video-feed');
const canvasElement = document.getElementById('output-canvas');
const canvasCtx = canvasElement.getContext('2d');
const statusText = document.getElementById('status-text');
const chatText = document.getElementById('chat-text');
const startBtn = document.getElementById('start-btn');

// הגדרות זיהוי קול
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'he-IL';
recognition.interimResults = false;

// כשהמערכת שומעת אותך מדבר
recognition.onresult = async (event) => {
    const userText = event.results[0][0].transcript;
    chatText.innerText = "אתה: " + userText;
    statusText.innerText = "J.A.R.V.I.S חושב...";
    await askGemini(userText);
};

recognition.onend = () => {
    recognition.start(); // חוזר להקשיב אחרי שסיים
};

// פונקציית דיבור
function speak(text) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'he-IL';
    synth.speak(utterance);
}

// שליחת בקשה ל-Gemini
async function askGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        
        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        chatText.innerText += "\nג'ארוויס: " + aiResponse;
        statusText.innerText = "הקשבה פעילה...";
        speak(aiResponse);
    } catch (error) {
        chatText.innerText += "\nשגיאה בחיבור ל-AI.";
    }
}

// הגדרות זיהוי ידיים (MediaPipe)
function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            for (let i = 0; i < landmarks.length; i++) {
                const x = landmarks[i].x * canvasElement.width;
                const y = landmarks[i].y * canvasElement.height;
                canvasCtx.beginPath();
                canvasCtx.arc(x, y, 5, 0, 2 * Math.PI);
                canvasCtx.fillStyle = "#00ffff";
                canvasCtx.fill();
            }
        }
    }
    canvasCtx.restore();
}

const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 1280,
  height: 720
});

// הפעלת המערכת בלחיצת כפתור
startBtn.addEventListener('click', () => {
    startBtn.style.display = 'none';
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    
    camera.start();
    recognition.start();
    
    statusText.innerText = "המערכת מקשיבה ומזהה ידיים. דבר עכשיו!";
    speak("מערכת הופעלה. אני מאזין.");
});
