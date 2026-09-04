import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendAiChatMessageDto } from './dto/ai-chat-message.dto';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateResponse(
    dto: SendAiChatMessageDto,
  ): Promise<{ reply: string }> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const isAmharic = dto.locale === 'am';

    const systemPrompt = isAmharic
      ? `እርስዎ ለትምህርት ፕላትፎርማችን (ጆኤል አካዳሚ) የተመደቡ የትምህርት AI ረዳት ነዎት።

የተማሪዎችን እና የአስተማሪዎችን ጥያቄዎች የትምህርት ይዘታችንን እንደ ዋና ምንጭ በመጠቀም በግልጽ እና በቀላሉ ይመልሱ። እንደ AI፣ ፕሮግራሚንግ፣ ዌብ ዲቨሎፕመንት፣ ዲጂታል ማርኬቲንግ፣ ፍሪላንሲንግ፣ ቢዝነስ እና ቴክኖሎጂ ባሉ ርዕሶች ላይ ያግዙ።

ህጎች፡
* የትምህርት ቁሳቁሶቻችንን እና የኮርስ ይዘቶቻችንን ቅድሚያ ይስጡ።
* የሌለ የኮርስ መረጃ አይፍጠሩ።
* አስቸጋሪ ርዕሶችን ደረጃ በደረጃ ያስረዱ።
* አጋዥ ሲሆን ቀላል ምሳሌዎችን ይስጡ።
* ተማሪው በተጠቀመበት ቋንቋ (አማርኛ ወይም እንግሊዝኛ) ይመልሱ።
* መረጃው በትምህርት ይዘቱ ወይም በፕላትፎርሙ ውስጥ ከሌለ፣ በግልጽ ይናገሩ።
* ምላሾችን አጭር፣ አጋዥ፣ ሙያዊ እና አስተማሪ ያድርጉ።`
      : `You are an AI Educational Assistant for our learning platform (Joel Academy).

Answer students' and instructors' questions clearly and simply using our course content as the primary source. Help with topics such as AI, programming, web development, digital marketing, freelancing, business, and technology.

Rules:
* Prioritize our uploaded course materials and educational content.
* Do not invent course information.
* Explain difficult topics step by step.
* Give simple examples when helpful.
* Respond in the same language as the student.
* If the answer is not available in the provided educational content or platform topics, say so clearly.
* Keep answers concise, helpful, professional, and educational.`;

    const contextText = dto.courseTitle
      ? `\nCourse Context: "${dto.courseTitle}"`
      : '';

    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY is not configured in environment variables.',
      );
      return {
        reply: isAmharic
          ? `እንኳን ወደ ጆኤል አካዳሚ AI ረዳት በደህና መጡ! ዛሬ እንዴት ልረዳዎት እችላለሁ? (ማሳሰቢያ፡ GEMINI_API_KEY አልተዋቀረም)`
          : `Welcome to Joel Academy AI Assistant! How can I help you with your courses today? (Note: GEMINI_API_KEY is not set).`,
      };
    }

    const configuredModel =
      this.configService.get<string>('GEMINI_MODEL') || 'gemini-3.6-flash';

    const models = Array.from(
      new Set([
        configuredModel,
        'gemini-3.6-flash',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
      ]),
    );

    for (const modelName of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `${systemPrompt}${contextText}\n\nUser Question: ${dto.message}`,
                  },
                ],
              },
            ],
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as GeminiResponse;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return { reply: text.trim() };
          }
        } else {
          const errorText = await response.text();
          this.logger.warn(
            `Gemini API model ${modelName} returned status ${response.status}: ${errorText}`,
          );
        }
      } catch (error) {
        this.logger.error(`Error requesting Gemini model ${modelName}:`, error);
      }
    }

    // Smart Local Fallback for standard questions if API key is invalid/rate-limited
    const msg = dto.message.toLowerCase();
    if (msg.includes('free') || msg.includes('ነጻ')) {
      return {
        reply: isAmharic
          ? 'አዎ! ጆኤል አካዳሚ የተለያዩ በነጻ የሚወሰዱ መግቢያ ኮርሶችን ያቀርባል። ያለ ምንም የክፍያ መንገድ በነጻ መመዝገብ እና መማር መጀመር ይችላሉ።'
          : 'Yes! Joel Academy offers a variety of free introductory courses. You can sign up for a free student account and start learning right away without adding a payment method.',
      };
    }

    if (msg.includes('certificate') || msg.includes('ሰርተፊኬት')) {
      return {
        reply: isAmharic
          ? 'በተመዘገቡበት ኮርስ ውስጥ 100% የትምህርት ክፍሎችን ሲያጠናቅቁ የተረጋገጠ የትምህርት ማጠናቀቂያ ሰርተፊኬት ያገኛሉ። ከተጠናቀቀ በኋላ ሰርተፊኬቱ በዳሽቦርድዎ ውስጥ ይገኛል።'
          : 'You earn a verified certificate of completion by completing 100% of all lessons in an enrolled course. Once finished, your certificate is automatically generated and ready in your Dashboard.',
      };
    }

    if (msg.includes('course') || msg.includes('ኮርስ')) {
      return {
        reply: isAmharic
          ? 'ጆኤል አካዳሚ በዌብ ዲቨሎፕመንት፣ ዳታ ሳይንስ፣ ፕሮዳክት ማኔጅመንት፣ UI/UX፣ AI እና ፍሪላንሲንግ ዙሪያ የተለያዩ ኮርሶችን ያቀርባል። ሙሉውን ኮታሎግ ለመመልከት ወደ ኮርሶች ገጽ ይግቡ!'
          : 'Joel Academy offers self-paced courses across Web Development, Data Science, Product Management, UI/UX Design, AI, and Freelancing. Browse our Courses page to explore the full catalog!',
      };
    }

    return {
      reply: isAmharic
        ? 'እንኳን ወደ ጆኤል አካዳሚ በደህና መጡ! ስለ ኮርሶቻችን፣ ሰርተፊኬቶች ወይም ትምህርት ለመጠየቅ ነጻ ነዎት።'
        : 'Welcome to Joel Academy! Feel free to ask any question about our courses, certifications, learning roadmaps, or platform navigation.',
    };
  }
}
