# Lesson 1: What is an LLM and How Do You Use One Well?

> **Level:** Beginner · **Time:** 15 minutes · **No code required**

---

## What You'll Learn

- What LLMs actually are (without the hype)
- Why prompt quality determines output quality
- The 5 core prompting techniques that work on every model
- How to use `tri ask` effectively from day one

---

## What is an LLM?

An LLM (Large Language Model) is a neural network trained on massive amounts of text — books, code, websites, academic papers. It learns to **predict the next token** (roughly a word fragment) given everything that came before it.

That's it. That's all it does. But doing this at scale, with hundreds of billions of parameters, produces something remarkable: emergent reasoning, creativity, and knowledge synthesis.

**Key insight:** An LLM doesn't "know" things the way a database does. It has learned statistical patterns in language. This is why:
- It's excellent at reasoning, writing, and synthesis
- It can "hallucinate" — generate confident-sounding falsehoods
- How you phrase your request dramatically changes the response

---

## The 5 Prompting Principles

### 1. Be Specific, Not Vague

❌ `"Write about marketing"`  
✅ `"Write a 200-word LinkedIn post for a B2B SaaS founder announcing their Series A, targeting CTOs"`

The model fills in ambiguity with guesses. Remove the guesswork.

### 2. Give Context

❌ `"Fix this bug"`  
✅ `"Fix this bug in my Express.js API. The function should return a 401 if the JWT is expired, but it's returning 500. Here's the code: [code]"`

Models work with what you give them. More relevant context = better output.

### 3. Assign a Role

❌ `"Review my pitch deck"`  
✅ `"You are a Series A VC partner who has seen 500+ pitches. Review my pitch deck critically, focusing on market size and defensibility."`

Roles activate domain expertise and set the tone. This is exactly what `tri agent run` does automatically.

### 4. Specify Format

❌ `"Tell me about machine learning"`  
✅ `"Explain machine learning in 5 bullet points, each under 15 words, suitable for a non-technical CEO"`

Format instructions dramatically improve usability of the output.

### 5. Iterate, Don't Restart

After a response, instead of starting over:
- `"Make it shorter"`
- `"Add a section on pricing"`
- `"Now write a version for a technical audience"`

The model remembers your conversation. Use `--session my-project` in TriAgentOS to persist memory across sessions.

---

## Try It Now

```bash
# Bad prompt (vague)
tri ask "Help with my startup"

# Good prompt (specific + context + format)
tri ask "I'm building a B2B invoicing SaaS for freelancers. Give me 5 specific growth channels I should test in month 1, ranked by expected CAC. Format as a numbered list."

# Use the right agent
tri agent run investor "My startup does X, we have Y traction, asking for Z. How would you evaluate this?"
```

---

## The TriAgentOS Router

You don't need to remember which model is best for what. TriAgentOS does it:

```bash
tri route "Write Python unit tests for my auth module"
# → code task → anthropic/claude-opus-4-5 (strong reasoning)

tri route "Translate 500 product titles to Spanish" --cheap
# → fast task + cost preference → groq/llama-3.1-8b (90% cheaper)
```

---

## What's Next

- **Lesson 2:** Understanding model differences — when to use Claude vs GPT vs Gemini
- **Lesson 3:** Prompt engineering patterns — chain-of-thought, few-shot, self-critique
- **Lesson 4:** Building your first agent workflow

Run `tri learn` to continue.

---

*TriAgentOS University · Lesson 1 of 10 · [Back to index](../README.md)*
