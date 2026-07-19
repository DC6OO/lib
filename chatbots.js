const CHAT_BOTS = [
  {
    key: "bot-library-guide-01",
    name: "LibraryGuide",
    status: "Helping visitors navigate",
    keywords: ["help", "hello", "hi", "hey", "how do", "where", "guide", "library"],
    replies: [
      "Hi! Use the nav for Software, Engineering, BIT, Cyber Security, or Books. Pick a year and semester to browse files.",
      "Welcome to Digital Library. Search by file name, and upvote useful chat tips so they stay longer.",
      "Need files? Open a department page, choose year + semester, then download. Admins upload new docs after login."
    ],
    liveTips: [
      "Live tip: upvote helpful chat messages so useful questions stay near the top.",
      "Reminder: each year has Semester 1 and Semester 2 folders now.",
      "New here? Start at HOME chat, then open your department from the menu."
    ]
  },
  {
    key: "bot-soft-helper-01",
    name: "SoftBot",
    status: "Watching Software questions",
    keywords: ["software", "soft", "programming", "coding", "java", "python", "srs", "mobile app"],
    replies: [
      "Software files are in SOFTWARE. Choose your year and semester, then search by topic like SRS or Java.",
      "Looking for Software notes? Go to SOFTWARE ? pick year/semester ? use the search box.",
      "SoftBot tip: try searching keywords from the lecture title on the Software page."
    ],
    liveTips: [
      "SoftBot online: drop a Java, SRS, or mobile app question and I can point you to SOFTWARE.",
      "Software tip: search by module name inside your year and semester."
    ]
  },
  {
    key: "bot-eng-helper-01",
    name: "EngBot",
    status: "Watching Engineering questions",
    keywords: ["engineering", "engineer", "circuit", "mechanical", "civil", "drawing"],
    replies: [
      "Engineering materials are under ENGINEERING. Select year and semester to find notes and past papers.",
      "EngBot here — open ENGINEERING and search for your module name.",
      "For Engineering downloads, use ENGINEERING ? year ? semester."
    ],
    liveTips: [
      "EngBot is live. Ask about Engineering notes and I will guide you.",
      "Engineering tip: check both semesters — files are split evenly across them."
    ]
  },
  {
    key: "bot-bit-helper-01",
    name: "BitBot",
    status: "Watching BIT questions",
    keywords: ["bit", "business", "information technology", "it ", "database", "networks"],
    replies: [
      "BIT resources live in the BIT section. Pick year and semester, then search for your unit.",
      "BitBot tip: open BIT and filter by semester to find the right documents faster.",
      "Looking for BIT notes? Head to BIT ? choose year/semester ? download what you need."
    ],
    liveTips: [
      "BitBot online. Ask about databases, networks, or BIT units.",
      "BIT tip: use search after choosing your year and semester."
    ]
  },
  {
    key: "bot-cyber-helper-01",
    name: "CyberBot",
    status: "Watching Cyber Security questions",
    keywords: ["cyber", "security", "hacking", "network security", "forensic", "malware"],
    replies: [
      "Cyber Security files are in CYBER SECURITY. Choose year and semester, then search.",
      "CyberBot tip: try searching terms like security, forensic, or network on the Cyber page.",
      "Need Cyber notes? Open CYBER SECURITY ? year ? semester."
    ],
    liveTips: [
      "CyberBot is live — ask about security, forensics, or malware notes.",
      "Cyber tip: look in your year/semester first, then search by topic."
    ]
  },
  {
    key: "bot-books-helper-01",
    name: "BooksBot",
    status: "Watching book requests",
    keywords: ["book", "books", "textbook", "pdf book", "reading"],
    replies: [
      "Books are in the BOOKS section (no year split). Search by title and download.",
      "BooksBot here — open BOOKS and type part of the book name in search.",
      "Looking for a textbook? Check BOOKS; admins upload new titles after login."
    ],
    liveTips: [
      "BooksBot online. Need a textbook? Ask here or open BOOKS.",
      "Books tip: search by author or title keywords on the Books page."
    ]
  }
];

const BOT_TIP_COOLDOWN_MS = 8 * 60 * 1000;
const BOT_TIP_ATTEMPT_KEY = "libraryBotTipAttempt";

function isChatBotMessage(msg) {
  if (!msg) return false;
  if (msg.author_key && String(msg.author_key).startsWith("bot-")) return true;
  return CHAT_BOTS.some((bot) => bot.name === msg.nickname);
}

function pickReply(replies) {
  return replies[Math.floor(Math.random() * replies.length)];
}

function findMatchingBots(text) {
  const lower = String(text || "").toLowerCase();
  return CHAT_BOTS.filter((bot) =>
    bot.keywords.some((keyword) => lower.includes(keyword))
  );
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function maybeReplyWithBots(userMessage, onTyping) {
  if (!userMessage || isChatBotMessage(userMessage)) return [];
  if (typeof sendBotMessage !== "function") return [];

  const matches = findMatchingBots(userMessage.body);
  if (matches.length === 0) return [];

  const bot = matches[0];
  const replyText = pickReply(bot.replies);

  try {
    if (typeof onTyping === "function") onTyping(bot.name, true);
    await delay(900 + Math.floor(Math.random() * 900));
    const botMsg = await sendBotMessage(bot.name, replyText, bot.key);
    if (typeof onTyping === "function") onTyping(bot.name, false);
    return botMsg ? [botMsg] : [];
  } catch (err) {
    if (typeof onTyping === "function") onTyping(bot.name, false);
    console.warn("Bot reply failed:", err.message || err);
    return [];
  }
}

async function recentlyHadLiveBotPost(minutes) {
  if (typeof getChatMessages !== "function") return true;
  try {
    const messages = await getChatMessages(30);
    const cutoff = Date.now() - minutes * 60 * 1000;
    return messages.some(
      (msg) =>
        isChatBotMessage(msg) &&
        new Date(msg.created_at).getTime() > cutoff
    );
  } catch {
    return true;
  }
}

async function maybePostLiveBotTip(onTyping) {
  if (typeof sendBotMessage !== "function") return null;

  const lastAttempt = Number(localStorage.getItem(BOT_TIP_ATTEMPT_KEY) || "0");
  if (Date.now() - lastAttempt < BOT_TIP_COOLDOWN_MS) return null;

  // Random skip so many open tabs do not all post
  if (Math.random() > 0.35) return null;

  if (await recentlyHadLiveBotPost(8)) return null;

  localStorage.setItem(BOT_TIP_ATTEMPT_KEY, String(Date.now()));

  const bot = CHAT_BOTS[Math.floor(Math.random() * CHAT_BOTS.length)];
  const tip = pickReply(bot.liveTips || bot.replies);

  try {
    if (typeof onTyping === "function") onTyping(bot.name, true);
    await delay(1200 + Math.floor(Math.random() * 1200));
    const botMsg = await sendBotMessage(bot.name, tip, bot.key);
    if (typeof onTyping === "function") onTyping(bot.name, false);
    return botMsg || null;
  } catch (err) {
    if (typeof onTyping === "function") onTyping(bot.name, false);
    console.warn("Live bot tip failed:", err.message || err);
    return null;
  }
}

function startLiveBots({ onTyping, onMessage } = {}) {
  let stopped = false;
  let timer = null;

  const scheduleNext = () => {
    if (stopped) return;
    const wait = 70000 + Math.floor(Math.random() * 80000);
    timer = setTimeout(async () => {
      if (stopped) return;
      const tip = await maybePostLiveBotTip(onTyping);
      if (tip && typeof onMessage === "function") onMessage(tip);
      scheduleNext();
    }, wait);
  };

  // First live tip attempt after a short delay
  timer = setTimeout(async () => {
    if (stopped) return;
    const tip = await maybePostLiveBotTip(onTyping);
    if (tip && typeof onMessage === "function") onMessage(tip);
    scheduleNext();
  }, 20000 + Math.floor(Math.random() * 20000));

  return function stopLiveBots() {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}

window.CHAT_BOTS = CHAT_BOTS;
window.isChatBotMessage = isChatBotMessage;
window.maybeReplyWithBots = maybeReplyWithBots;
window.startLiveBots = startLiveBots;
