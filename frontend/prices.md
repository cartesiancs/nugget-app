## 📊 Current Pricing (Hardcoded in CreditService)

| Output | Model                      | Avg cost per output | credits | per edit call credits | Unit                 | Pricing                                                            |
| ------ | -------------------------- | ------------------- | ------- | --------------------- | -------------------- | ------------------------------------------------------------------ |
| Image  | Imagen                     | 0.04                | 2       | 4                     | per image            | $0.04 per image                                                    |
|        | recraft                    | 0.02                | 1       | 2                     | per image            | $0 for 50 images/daily, $20 for 1000/monthly, $69 for 9000/monthly |
| Video  | veo2                       | 0.5                 | 25      | 37.5                  | per second           | $0.50/second (we generate 8 second clip)                           |
|        | runway ml                  | 0.05                | 2.5     | 3.75                  | per second           | https://docs.dev.runwayml.com/guides/pricing/                      |
|        | kling v2.1 master (fal ai) | 0.28                | 20      | 30                    | per second           | $0.28/second (we generate 8 second clip)                           |
|        | veo3 (optional)            | 0.75                | 37.5    | 0                     | per second           |                                                                    |
| Audio  | elevenlabs                 | 0.11                | 2       | 2                     | per minute           | https://elevenlabs.io/pricing/api                                  |
| Text   | perplexity                 | 0.008               | 1       | 2                     | per internal request | $0.008/request (we do medium, will cost $0.012 if we go for high)  |
|        | concept generator          | 0.0021              | 1       | 2                     | per internal request | ~$0.0021/request to concept generator API                          |
|        | script & segmentation      | 0.06                | 3       | 6                     | per internal request | $0.048/request if Gemini-2.0-pro used, $0.06/req if GPT-4o used    |

---
