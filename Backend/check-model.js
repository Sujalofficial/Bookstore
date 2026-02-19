const API_KEY = "AIzaSyBdRkg1NXB8z_N-Tm2jIsLmJ0HcyjRSjgw"; // Aapki working key

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("❌ Error:", data.error.message);
            return;
        }

        console.log("\n✅ AVAILABLE MODELS FOR YOU:");
        console.log("-----------------------------");
        
        // Sirf generateContent wale models filter karenge
        const availableModels = data.models
            .filter(m => m.supportedGenerationMethods.includes("generateContent"))
            .map(m => m.name.replace("models/", ""));

        availableModels.forEach(name => console.log(`👉 ${name}`));
        console.log("-----------------------------\n");
        console.log("Server.js mein inmein se koi ek naam use karein!");

    } catch (error) {
        console.error("Network Error:", error);
    }
}

listModels();