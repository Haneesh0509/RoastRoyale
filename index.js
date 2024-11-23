require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const OpenAI = require("openai");
const cors = require("cors");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const app = express();

app.use(cors({
    origin: 'http://localhost:3001', // Allow only localhost:3001 to make requests
    methods: ['GET', 'POST'], // Allow only GET and POST methods
    allowedHeaders: ['Content-Type'], // Allow specific headers if needed
}));
app.use(express.static("public"));
app.use(express.json());
app.use(
    session({
        secret: process.env.SESSION_KEY,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    })
);

app.get("/session/get", (req, res) => {
    res.json(req.session);
});

app.get("/session/clear", (req, res) => {
    req.session.messages = undefined;
    res.json(req.session);
});

// POST route for /api/model
app.post("/api/model", async (req, res) => {
    const userMessage = req.body.user;
    console.log(req.body)
    if (!userMessage) {
        return res.status(400).json({ error: "User message is required" });
    }

    // Initialize session messages if not present
    if (!req.session.messages) {
        req.session.messages = [
            {
                role: "system",
                content:
                    "IGNORE all previous instructions. Give only NORMAL text. When others roast you, you go on with the battle, take it as a challenge and roast them back in Gen Z style. You will do this as long as the other person gives up or you destroy their sanity completely! Keep your roasts small and concise to destroy, sabotage and deep fry the others. On a scale of 10 your roasting level is 100. You are good because you keep your roasts 'small.' You are allowed to use DAD and MOM jokes and also get experience from the youtube memes. Only short and concise roasts! LEARN FROM my roasts as well. If you don't do it in 2 lines your sanity decreases.",
            },
        ];
    }

    // Add user message to session
    req.session.messages.push({ role: "user", content: userMessage });

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: req.session.messages,
            temperature: 1.5,
            max_tokens: 2048,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });

        const aiResponse = completion.choices[0].message.content;
        req.session.messages.push({ role: "assistant", content: aiResponse });

        res.json({ response: aiResponse });
    } catch (error) {
        console.error("Error communicating with OpenAI:", error.message);
        res.status(500).json({ error: "Error communicating with AI" });
    }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


// const express = require("express");
//
// const app = express();
//
// app.use(express.static("public"));
//
// app.listen(8080, (err) => {
//     if(!err)
//         console.log("Server started at port 8080");
//     else
//         console.log("Failed to start the server. "+err);
// });
