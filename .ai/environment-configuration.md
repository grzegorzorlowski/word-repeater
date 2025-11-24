# Environment Configuration

## OpenRouter AI Integration

The application uses OpenRouter for AI-powered flashcard generation. You need to configure the following environment variables:

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# OpenRouter AI Configuration
# Get your API key from: https://openrouter.ai/keys
OPENROUTER_API_KEY=your_openrouter_api_key_here

# OpenRouter Model Name (optional, defaults to openai/gpt-4o-mini)
# Available models: https://openrouter.ai/models
# Recommended for flashcards: openai/gpt-4o-mini, openai/gpt-4o, anthropic/claude-3.5-sonnet
OPENROUTER_MODEL_NAME=openai/gpt-4o-mini
```

### Getting an OpenRouter API Key

1. Visit [https://openrouter.ai/keys](https://openrouter.ai/keys)
2. Sign up or log in to your account
3. Create a new API key
4. Copy the key and add it to your `.env` file

### Recommended Models

For flashcard generation, we recommend:

1. **openai/gpt-4o-mini** (Default)
   - Cost-effective
   - Good quality for educational content
   - Fast response times

2. **openai/gpt-4o**
   - Higher quality output
   - More expensive
   - Slower response times

3. **anthropic/claude-3.5-sonnet**
   - Excellent reasoning capabilities
   - Great for educational content
   - Mid-tier pricing

### Astro Environment Variable Configuration

Astro automatically loads environment variables from `.env` files. Make sure to:

1. Add `.env` to your `.gitignore` file
2. Never commit actual API keys to version control
3. Use `import.meta.env.VARIABLE_NAME` to access variables in your code

Example:

```typescript
const apiKey = import.meta.env.OPENROUTER_API_KEY;
```

### Testing the Integration

After configuring your environment variables:

1. Restart your development server
2. Test the flashcard generation endpoint: `POST /api/flashcards/generate`
3. Check the console for any error messages

### Troubleshooting

**Error: "OpenRouter API key is not configured"**

- Make sure you've created a `.env` file in the root directory
- Verify the API key is correctly set
- Restart your development server

**Error: "Authentication failed"**

- Check that your API key is valid
- Ensure you have credits on your OpenRouter account
- Visit [https://openrouter.ai/settings/limits](https://openrouter.ai/settings/limits) to check your balance

**Error: "Rate limit exceeded"**

- You've hit the rate limit for your account
- Wait a few minutes and try again
- Consider upgrading your OpenRouter plan
