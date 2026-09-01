/**
 * Static, hand-authored demo content for `db:seed`'s development dataset.
 * No lorem ipsum - every course/section/lesson title is real and specific
 * to its subject so search/filter/sort have something meaningful to work
 * with. Kept separate from `demo-seed.ts` (the orchestration logic) so the
 * content can be reviewed/edited without touching insertion logic.
 */

export interface DemoLesson {
  title: string;
  lessonType: 'VIDEO' | 'TEXT' | 'DOCUMENT' | 'DOWNLOAD' | 'EXTERNAL_LINK';
  durationSeconds?: number;
  isPreview?: boolean;
  videoUrl?: string;
  externalUrl?: string;
  content?: string;
  resources?: { label: string; resourceType: string; externalUrl?: string }[];
}

export interface DemoSection {
  title: string;
  description?: string;
  lessons: DemoLesson[];
}

export interface DemoCourse {
  categorySlug: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
  accessType: 'FREE' | 'PAID';
  price: string;
  discountPrice?: string;
  status: 'DRAFT' | 'PUBLISHED';
  featured: boolean;
  certificateEnabled: boolean;
  estimatedDurationMinutes: number;
  presenterName?: string;
  thumbnailKey?: string;
  outcomes: string[];
  requirements: string[];
  sections: DemoSection[];
}

export const CATEGORY_CATALOG: { name: string; slug: string; description: string }[] = [
  {
    name: 'Artificial Intelligence',
    slug: 'artificial-intelligence',
    description:
      'Practical AI tools, machine learning, prompt engineering, and no-code automation.',
  },
  {
    name: 'Programming',
    slug: 'programming',
    description: 'Software engineering, web development, and backend systems.',
  },
  {
    name: 'UI/UX Design',
    slug: 'ui-ux-design',
    description: 'User research, interface design, prototyping, and design systems.',
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'Strategy, product management, and entrepreneurship.',
  },
  {
    name: 'Data Science',
    slug: 'data-science',
    description: 'Python, data analysis, and machine learning fundamentals.',
  },
  {
    name: 'Marketing',
    slug: 'marketing',
    description: 'Digital marketing, content strategy, and social media growth.',
  },
];

function lesson(
  title: string,
  lessonType: DemoLesson['lessonType'] = 'VIDEO',
  extra: Partial<DemoLesson> = {},
): DemoLesson {
  return { title, lessonType, durationSeconds: 480 + Math.floor(Math.random() * 900), ...extra };
}

export const COURSE_CATALOG: DemoCourse[] = [
  // ---------------------------------------------------------------- Joel Talargie Flagship Courses
  {
    categorySlug: 'artificial-intelligence',
    title: 'AI & Modern Technology: Orientation & Roadmap',
    slug: 'ai-modern-tech-orientation',
    presenterName: 'Joel Talargie',
    shortDescription:
      'Get started with modern AI and emerging tech with a guided orientation from Joel Talargie.',
    description:
      'A comprehensive orientation and foundation designed to help beginners and ambitious creators navigate the fast-moving world of artificial intelligence and emerging technology. In this course, Joel Talargie introduces the core pillars of modern AI, demonstrates essential account setups across top AI platforms (ChatGPT, Claude, Dala AI, Google AI Studio), and outlines a structured roadmap to transition from passive consumer to empowered AI builder.',
    difficulty: 'BEGINNER',
    accessType: 'FREE',
    price: '0',
    status: 'PUBLISHED',
    featured: true,
    certificateEnabled: true,
    estimatedDurationMinutes: 45,
    outcomes: [
      'Understand the current generative AI landscape and upcoming technological shifts',
      'Set up and configure essential AI tool accounts safely and effectively',
      'Identify high-impact opportunities to leverage AI in your daily work, studies, and business',
      'Follow a personalized learning roadmap to build real-world AI and no-code skills',
    ],
    requirements: [
      'A computer or smartphone with an internet connection',
      'No prior coding or technical background required',
      'Curiosity to learn and experiment with modern AI tools',
    ],
    sections: [
      {
        title: 'Orientation & Modern AI Landscape',
        description: 'Orientation to the academy and the emerging AI technology ecosystem.',
        lessons: [
          lesson('Course Orientation, Account Setup & Modern AI Roadmap', 'VIDEO', {
            durationSeconds: 480,
            videoUrl: 'https://youtu.be/xTz_mlIin5c',
            isPreview: true,
            content:
              '<p>Welcome to the <strong>Joel Talargie Academy</strong>! In this opening orientation, lead instructor <strong>Joel Talargie</strong> welcomes you to the academy and provides a complete roadmap of modern generative AI and tech ecosystems.</p><h3>Key Takeaways</h3><ul><li>The shift from traditional computing to AI-accelerated workflows</li><li>Essential accounts to set up: Anthropic Claude, OpenAI ChatGPT, Dala AI Studio, Google AI</li><li>Best practices for data security, privacy, and effective continuous learning</li></ul>',
            resources: [
              {
                label: 'Academy Orientation & Tool Setup Guide',
                resourceType: 'PDF',
                externalUrl: 'https://preview.mailerlite.io/forms/2549291/194589885305193786/share',
              },
              {
                label: 'Joel Talargie Community Links & Socials',
                resourceType: 'EXTERNAL_LINK',
                externalUrl: 'https://bit.ly/m/Joel-Talargie-community',
              },
            ],
          }),
          lesson('How to Navigate & Get Certified in Joel Academy', 'TEXT', {
            durationSeconds: 300,
            content:
              '<p>Learn how to maximize your learning experience inside the Joel Talargie Academy. Track your progress across modules, save timestamped lesson notes, complete hands-on practical exercises, and claim your verified, shareable certificate upon course completion.</p>',
          }),
        ],
      },
    ],
  },
  {
    categorySlug: 'artificial-intelligence',
    title: 'AI from A to Z: 13-Minute Complete Free Crash Course',
    slug: 'ai-crash-course-a-to-z',
    presenterName: 'Joel Talargie',
    shortDescription:
      'Master AI foundations, understand how AI actually works, and explore the best free AI tools in minutes.',
    description:
      'Want to master Artificial Intelligence without spending money or wasting hours? In this intensive crash course by Joel Talargie, you will learn the exact foundations of AI from A to Z, discover the top free tools you can start using today, and learn practical ways to automate work and studies with zero technical background.\n\nየአርቲፊሻል ኢንተለጀንስ (AI) ቴክኖሎጂን ከ"ሀ" እስከ "ፐ" በቀላሉ እና በፍጥነት ለመማር የተዘጋጀ ሙሉ የቪዲዮ ኮርስ! የ AI ጽንሰ-ሀሳቦችን፣ ምርጥ ነጻ የ AI ቱሎችን እና በዕለት ተዕለት ስራ ላይ እንዴት ማዋል እንደምትችሉ ደረጃ በደረጃ ይማራሉ።',
    difficulty: 'BEGINNER',
    accessType: 'FREE',
    price: '0',
    status: 'PUBLISHED',
    featured: true,
    certificateEnabled: true,
    estimatedDurationMinutes: 60,
    outcomes: [
      'Explain what Artificial Intelligence, Neural Networks, and LLMs are in simple terms',
      'Discover and navigate the top 100% free AI productivity tools available today',
      'Automate repetitive tasks, writing, research, and study habits with smart prompts',
      'Apply prompt engineering basics to get exact, high-quality responses every time',
    ],
    requirements: [
      'No prior coding or technical experience needed',
      'A web browser on PC or mobile phone',
    ],
    sections: [
      {
        title: 'The 13-Minute AI Masterclass',
        description: 'Complete breakdown of AI foundations and essential free tools.',
        lessons: [
          lesson('Master AI in Just 13 Minutes! (Foundations & Best Free Tools)', 'VIDEO', {
            durationSeconds: 896,
            videoUrl: 'https://youtu.be/TQSUjYxJKwo',
            isPreview: true,
            content:
              '<p>In this masterclass, Joel Talargie breaks down artificial intelligence into simple, intuitive concepts that anyone can grasp in 13 minutes.</p><h3>What You Will Learn</h3><ul><li>What AI actually is (explained simply from A to Z)</li><li>The best free AI tools you can start using today for writing, research, and analysis</li><li>Practical ways to automate your daily work and academic studies</li><li>How to start learning AI with zero technical background</li></ul>',
            resources: [
              {
                label: 'Free AI Tools Directory & Beginner Prompt Cheatsheet',
                resourceType: 'PDF',
                externalUrl: 'https://preview.mailerlite.io/forms/2549291/194589885305193786/share',
              },
              { label: 'AI Productivity Starter Cheatsheet', resourceType: 'DOCUMENT' },
            ],
          }),
          lesson('Quick Self-Assessment & Action Plan', 'TEXT', {
            durationSeconds: 360,
            content:
              '<p>Test your understanding of the core AI tools covered in the lesson and formulate your 7-day automation plan.</p>',
          }),
        ],
      },
    ],
  },
  {
    categorySlug: 'artificial-intelligence',
    title: 'Build Anything with No-Code AI: Dala AI Studio Masterclass',
    slug: 'dala-ai-studio-no-code-mastery',
    presenterName: 'Joel Talargie',
    shortDescription:
      'Build full websites, mobile apps, digital art, and social media videos in minutes with Dala AI Studio.',
    description:
      'In this video masterclass, Joel Talargie dives deep into Dala AI Studio—the revolutionary all-in-one no-code AI platform that lets you build literally anything in minutes! Whether you want to create full websites, mobile apps, stunning digital art, or high-converting social media videos, this free AI tool does it all with simple text prompts.\n\nያለምንም የኮዲንግ እውቀት ድረ-ገጾችን (Websites)፣ ሞባይል አፕሊኬሽኖችን (Apps)፣ ዲጂታል ምስሎችን፣ ቪዲዮዎችን እና ሌሎችንም ዲጂታል ስራዎች በደቂቃዎች ውስጥ እንድትሰሩ የሚያስችል ልዩ የቪዲዮ ስልጠና!',
    difficulty: 'BEGINNER',
    accessType: 'FREE',
    price: '0',
    status: 'PUBLISHED',
    featured: true,
    certificateEnabled: true,
    estimatedDurationMinutes: 75,
    outcomes: [
      'Build and deploy full responsive websites using simple natural language prompts',
      'Generate mobile applications with interactive UI components without writing code',
      'Create stunning digital art, product mockups, and social media marketing videos',
      'Package no-code digital services to launch your own freelance or agency business',
    ],
    requirements: [
      'No coding or graphic design experience required',
      'Internet access and a free Dala AI account',
    ],
    sections: [
      {
        title: 'Dala AI Studio Deep Dive',
        description: 'Step-by-step masterclass on creating digital products with Dala AI.',
        lessons: [
          lesson('Building Websites, Apps & Digital Assets with Dala AI Studio', 'VIDEO', {
            durationSeconds: 1141,
            videoUrl: 'https://youtu.be/4x9jwFxcWMc',
            isPreview: true,
            content:
              "<p>Follow along with Joel Talargie as he demonstrates the power of Africa's groundbreaking all-in-one AI platform, <strong>Dala AI Studio</strong>.</p><h3>What is covered</h3><ul><li>Creating responsive landing pages and web apps in minutes</li><li>Generating mobile application prototypes</li><li>Creating high-resolution digital artwork and branding assets</li><li>Producing marketing videos from text descriptions</li><li>Monetizing no-code digital creations for clients worldwide</li></ul>",
            resources: [
              {
                label: 'Dala AI Studio Platform Link',
                resourceType: 'EXTERNAL_LINK',
                externalUrl: 'https://dala.gebeya.com/ref/eyoel-abrham',
              },
              { label: 'Dala AI Studio Prompt Formulas & Asset Templates', resourceType: 'PDF' },
            ],
          }),
          lesson('No-Code Project Workflow & Best Practices', 'TEXT', {
            durationSeconds: 420,
            content:
              '<p>A comprehensive step-by-step checklist on refining generated web code, optimizing asset exports, and connecting custom domain names.</p>',
          }),
        ],
      },
    ],
  },
  {
    categorySlug: 'artificial-intelligence',
    title: 'Claude AI Masterclass: Advanced Reasoning & Online Income',
    slug: 'claude-ai-mastery-online-income',
    presenterName: 'Joel Talargie',
    shortDescription:
      "Master Anthropic Claude AI's advanced reasoning, 200k context window, and monetize your AI skills online.",
    description:
      "Anthropic's Claude AI represents a massive paradigm shift in artificial intelligence. While everyone is still discussing traditional chatbots, Claude has quietly dropped updates that completely redefine what an AI assistant can achieve.\n\nIn this comprehensive guide, Joel Talargie breaks down why Claude is turning heads across the global tech industry, how its advanced reasoning and 200K+ context window outperform rivals, and how YOU can use its hidden features as a complete beginner with zero tech experience to automate knowledge work, analyze complex data, and earn income online.",
    difficulty: 'ALL_LEVELS',
    accessType: 'FREE',
    price: '0',
    status: 'PUBLISHED',
    featured: true,
    certificateEnabled: true,
    estimatedDurationMinutes: 90,
    outcomes: [
      "Master Claude 3.5 Sonnet's state-of-the-art reasoning and coding capabilities",
      'Utilize Claude Artifacts to generate live interactive web applications, charts, and documents',
      'Analyze massive books, financial reports, and datasets using the 200k context window',
      'Package and deliver high-value freelance services (copywriting, data analysis, automation) on Upwork and Fiverr',
    ],
    requirements: ['No prior technical experience required', 'Free Claude AI account (claude.ai)'],
    sections: [
      {
        title: 'Claude AI Comprehensive Guide',
        description: 'Master Anthropic Claude AI from prompt engineering to online monetization.',
        lessons: [
          lesson('Claude AI Deep Dive: Advanced Reasoning, Context & Income Generation', 'VIDEO', {
            durationSeconds: 881,
            videoUrl: 'https://youtu.be/nDW9G05lhlg',
            isPreview: true,
            content:
              "<p>Join Joel Talargie on <strong>Tech Kemsha</strong> as we dissect the groundbreaking features of Anthropic's Claude AI.</p><h3>Key Topics</h3><ul><li>Why Claude outperforms traditional AI models in deep reasoning and nuanced writing</li><li>How to take advantage of the massive 200K context window to analyze entire books and codebases</li><li>Building instant web apps and visualizations with Claude Artifacts</li><li>Real-world strategies to land freelance clients and generate income using Claude</li></ul>",
            resources: [
              { label: 'Claude Advanced Prompting Framework & Blueprint', resourceType: 'PDF' },
              { label: 'Online AI Freelancing & Client Outreach Kit', resourceType: 'DOCUMENT' },
            ],
          }),
          lesson('The Claude Artifacts Playbook', 'TEXT', {
            durationSeconds: 480,
            content:
              '<p>Learn how to prompt Claude to produce interactive React components, SVG illustrations, HTML prototypes, and comprehensive research reports inside the Artifacts window.</p>',
          }),
        ],
      },
    ],
  },
  {
    categorySlug: 'artificial-intelligence',
    title: 'ChatGPT & Systematic Prompt Engineering for Productivity',
    slug: 'chatgpt-prompt-engineering-mastery',
    presenterName: 'Joel Talargie',
    shortDescription:
      'Master ChatGPT prompt frameworks, custom GPTs, and advanced workflows for 10x productivity.',
    description:
      'Move far beyond basic questions. Learn the systematic prompt engineering frameworks used by top professionals to extract accurate, nuanced, and repeatable results from ChatGPT for business analysis, software development, research, and executive communication.',
    difficulty: 'INTERMEDIATE',
    accessType: 'PAID',
    price: '29.99',
    discountPrice: '19.99',
    status: 'PUBLISHED',
    featured: false,
    certificateEnabled: true,
    estimatedDurationMinutes: 90,
    outcomes: [
      'Apply the RTCF (Role, Task, Context, Format) and Chain-of-Thought prompting frameworks',
      'Build and deploy custom GPTs tailored to your exact business workflows',
      'Automate complex research, data synthesis, and email management',
      'Prevent hallucinations and verify AI generated outputs reliably',
    ],
    requirements: ['Familiarity with basic ChatGPT interface'],
    sections: [
      {
        title: 'Systematic Prompt Engineering',
        description: 'Advanced prompt frameworks and custom GPT architecture.',
        lessons: [
          lesson('Structured Prompt Frameworks & Custom GPT Architecture', 'VIDEO', {
            durationSeconds: 900,
            videoUrl: 'https://youtu.be/TQSUjYxJKwo',
            isPreview: true,
            content:
              '<p>Learn how to architect high-performance prompts and construct custom GPTs with knowledge files and instructions.</p>',
            resources: [
              {
                label: 'ChatGPT Master Prompt Library (100+ Production Prompts)',
                resourceType: 'PDF',
              },
            ],
          }),
          lesson('Custom GPTs in Practice', 'TEXT', {
            durationSeconds: 480,
            content:
              '<p>Hands-on guide to configuring custom instructions, actions, and persistent knowledge bases for your custom GPTs.</p>',
          }),
        ],
      },
    ],
  },
  {
    categorySlug: 'marketing',
    title: 'AI-Driven Digital Marketing & Content Creation Engine',
    slug: 'ai-digital-marketing-content-creation',
    presenterName: 'Joel Talargie',
    shortDescription:
      'Create high-converting social media content, viral short-form videos, and SEO copy using AI.',
    description:
      'Learn how to construct a scalable digital content machine. Use cutting-edge generative AI for video creation, voice synthesis, thumbnail ideation, copy generation, and SEO optimization to rapidly grow your brand and revenue.',
    difficulty: 'BEGINNER',
    accessType: 'PAID',
    price: '39.99',
    discountPrice: '24.99',
    status: 'PUBLISHED',
    featured: false,
    certificateEnabled: true,
    estimatedDurationMinutes: 105,
    outcomes: [
      'Design multi-channel content marketing calendars in minutes',
      'Generate viral short-form video scripts, voiceovers, and visual b-roll with AI',
      'Write high-converting ad copy and email marketing campaigns',
      'Optimize blog posts and landing pages to rank on search engines',
    ],
    requirements: [
      'Basic understanding of social media platforms (YouTube, TikTok, Instagram, LinkedIn)',
    ],
    sections: [
      {
        title: 'The AI Content Machine',
        description: 'Automated video generation, scripting, and social media distribution.',
        lessons: [
          lesson('Building an Automated Social Media & Video Content Engine', 'VIDEO', {
            durationSeconds: 1020,
            videoUrl: 'https://youtu.be/4x9jwFxcWMc',
            isPreview: true,
            content:
              '<p>Master the end-to-end process of generating viral video concepts, automated scripts, voiceovers, and high-CTR thumbnails using generative AI tools.</p>',
            resources: [
              {
                label: 'AI Content Marketing Calendar & Video Production Kit',
                resourceType: 'DOCUMENT',
              },
            ],
          }),
          lesson('Copywriting Formulas that Convert', 'TEXT', {
            durationSeconds: 420,
            content:
              '<p>Explore PAS, AIDA, and Story-Hook-Offer formulas fine-tuned for AI prompt workflows.</p>',
          }),
        ],
      },
    ],
  },
  {
    categorySlug: 'business',
    title: 'Online Freelancing & High-Income Remote Work with AI',
    slug: 'ai-freelancing-remote-work-mastery',
    presenterName: 'Joel Talargie',
    shortDescription:
      'Launch a high-income freelance career offering AI-powered writing, design, and automation services.',
    description:
      'A battle-tested blueprint for breaking into online freelancing on platforms like Upwork, Fiverr, and direct enterprise contracts. Learn how to package AI-accelerated services, write winning proposals that get accepted, set competitive pricing, and safely manage international payments.',
    difficulty: 'ALL_LEVELS',
    accessType: 'PAID',
    price: '49.99',
    discountPrice: '29.99',
    status: 'PUBLISHED',
    featured: true,
    certificateEnabled: true,
    estimatedDurationMinutes: 120,
    outcomes: [
      'Identify the most in-demand, high-margin freelance services you can deliver using AI',
      'Write high-converting proposals on Upwork and build a 5-star profile',
      'Set up global payment pathways to receive international funds from Ethiopia and worldwide',
      'Communicate professionally with international clients and secure repeat retainers',
    ],
    requirements: [
      'A computer or smartphone with internet connection',
      'Desire to build an independent remote income stream',
    ],
    sections: [
      {
        title: 'Freelancing Blueprint',
        description: 'Packaging AI services, landing clients, and managing international payments.',
        lessons: [
          lesson('The AI Freelancer Blueprint: Packaging Services, Proposals & Payments', 'VIDEO', {
            durationSeconds: 960,
            videoUrl: 'https://youtu.be/nDW9G05lhlg',
            isPreview: true,
            content:
              '<p>Learn the exact step-by-step strategy to create in-demand service offerings, submit proposals that stand out, and get paid globally.</p>',
            resources: [
              {
                label: 'Winning Upwork Proposal Templates & Client Contract Pack',
                resourceType: 'DOCUMENT',
              },
              {
                label: 'International Payment Solutions Guide for Ethiopian Freelancers',
                resourceType: 'PDF',
              },
            ],
          }),
          lesson('Setting Up Your Upwork & Fiverr Profiles', 'TEXT', {
            durationSeconds: 480,
            content:
              '<p>Comprehensive profile optimization guide with headline formulas, portfolio layout examples, and client testimonial strategies.</p>',
          }),
        ],
      },
    ],
  },
  {
    categorySlug: 'programming',
    title: 'AI-Powered Rapid Web Prototyping & Development',
    slug: 'ai-powered-web-prototyping',
    presenterName: 'Joel Talargie',
    shortDescription:
      'Turn ideas into fully functioning web prototypes in hours using modern AI coding tools.',
    description:
      'Discover how AI has transformed modern software engineering. Learn how to use next-generation AI coding tools (Cursor, v0.dev, Claude Artifacts) to generate clean React components, style responsive Tailwind UIs, and deploy live full-stack web prototypes at 10x speed.',
    difficulty: 'INTERMEDIATE',
    accessType: 'PAID',
    price: '59.99',
    discountPrice: '39.99',
    status: 'PUBLISHED',
    featured: false,
    certificateEnabled: true,
    estimatedDurationMinutes: 120,
    outcomes: [
      'Build responsive Next.js & Tailwind CSS web interfaces using AI prompts',
      'Use Cursor and AI pair programming tools to write, refactor, and debug production code',
      'Connect frontend UI prototypes to databases and REST APIs',
      'Deploy production applications to cloud hosting (Vercel, Netlify) with custom domains',
    ],
    requirements: [
      'Basic understanding of HTML, CSS, and JavaScript concepts',
      'A code editor installed on your computer (VS Code / Cursor)',
    ],
    sections: [
      {
        title: 'Rapid Prototyping Workflow',
        description: 'From concept to live deployed web application with AI coding tools.',
        lessons: [
          lesson('From Concept to Live Web App: Rapid Prototyping with AI', 'VIDEO', {
            durationSeconds: 1100,
            videoUrl: 'https://youtu.be/4x9jwFxcWMc',
            isPreview: true,
            content:
              '<p>Master modern AI-assisted web development workflows: generating wireframes, scaffolding React components with Tailwind, and shipping production builds in record time.</p>',
            resources: [
              { label: 'Modern AI Developer Starter Kit & Cheatsheet', resourceType: 'PDF' },
              {
                label: 'Next.js & Tailwind AI Starter Template Repo',
                resourceType: 'CODE',
                externalUrl: 'https://github.com',
              },
            ],
          }),
          lesson('Deploying & Scaling Your Web Applications', 'TEXT', {
            durationSeconds: 540,
            content:
              '<p>Step-by-step deployment guide for Vercel, Supabase backend integration, and setting up automated CI/CD pipelines.</p>',
          }),
        ],
      },
    ],
  },
  // ---------------------------------------------------------------- Programming
  {
    categorySlug: 'programming',
    title: 'Full-Stack Web Development',
    slug: 'full-stack-web-development',
    shortDescription:
      'Build and ship complete web applications with React, Node.js, and PostgreSQL.',
    description:
      'A project-driven path through modern full-stack development: responsive frontends with React, REST APIs with Express, and a real PostgreSQL-backed data layer, finishing with a deployed production build.',
    difficulty: 'INTERMEDIATE',
    accessType: 'PAID',
    price: '79.99',
    status: 'PUBLISHED',
    featured: true,
    certificateEnabled: true,
    estimatedDurationMinutes: 1320,
    outcomes: [
      'Build responsive web interfaces using HTML, CSS, and modern JavaScript',
      'Develop full-stack applications with React and Node.js',
      'Design and implement REST APIs with Express',
      'Connect and query a PostgreSQL database from a Node.js backend',
      'Deploy a production-ready full-stack application to the cloud',
    ],
    requirements: [
      'Comfortable using a computer and a code editor',
      'Basic understanding of HTML and CSS is helpful but not required',
    ],
    sections: [
      {
        title: 'Frontend Foundations',
        lessons: [
          lesson('HTML5 Semantics and Accessibility'),
          lesson('Modern CSS with Flexbox and Grid'),
          lesson('Responsive Design Principles'),
          lesson('JavaScript ES6+ Essentials', 'VIDEO', {
            resources: [{ label: 'ES6+ Cheatsheet', resourceType: 'PDF' }],
          }),
        ],
      },
      {
        title: 'Building with React',
        lessons: [
          lesson('Components and Props'),
          lesson('Hooks and State'),
          lesson('Routing with React Router'),
          lesson('Connecting to APIs', 'VIDEO', {
            resources: [{ label: 'Sample API Client Code', resourceType: 'CODE' }],
          }),
        ],
      },
      {
        title: 'Backend with Node.js and Express',
        lessons: [
          lesson('Setting Up an Express Server'),
          lesson('REST API Design'),
          lesson('Middleware and Error Handling', 'VIDEO', {
            resources: [{ label: 'Express Middleware Cheat Sheet', resourceType: 'PDF' }],
          }),
          lesson('Connecting to PostgreSQL'),
        ],
      },
      {
        title: 'Deployment and Production',
        lessons: [
          lesson('Environment Configuration'),
          lesson('Authentication Basics'),
          lesson('Deploying to the Cloud'),
          lesson('Full-Stack Project Review', 'TEXT'),
        ],
      },
    ],
  },
  {
    categorySlug: 'programming',
    title: 'JavaScript Mastery',
    slug: 'javascript-mastery',
    shortDescription: 'Go from JavaScript fundamentals to confident, modern, asynchronous code.',
    description:
      'A ground-up JavaScript course covering syntax, data structures, the DOM, and asynchronous programming patterns used in every modern JavaScript codebase.',
    difficulty: 'BEGINNER',
    accessType: 'FREE',
    price: '0',
    status: 'PUBLISHED',
    featured: false,
    certificateEnabled: true,
    estimatedDurationMinutes: 960,
    outcomes: [
      'Write clean, idiomatic JavaScript using modern syntax',
      'Work confidently with arrays, objects, and JSON data',
      'Understand and use promises and async/await',
      'Manipulate the DOM and respond to browser events',
    ],
    requirements: ['No prior programming experience required'],
    sections: [
      {
        title: 'JavaScript Fundamentals',
        lessons: [
          lesson('Variables and Data Types'),
          lesson('Operators and Expressions'),
          lesson('Control Flow'),
          lesson('Functions'),
        ],
      },
      {
        title: 'Working with Data',
        lessons: [
          lesson('Arrays and Array Methods'),
          lesson('Objects and Object Methods'),
          lesson('Destructuring and Spread'),
          lesson('JSON and Data Parsing'),
        ],
      },
      {
        title: 'Asynchronous JavaScript',
        lessons: [
          lesson('Callbacks'),
          lesson('Promises'),
          lesson('Async/Await'),
          lesson('Fetching Data from APIs'),
        ],
      },
      {
        title: 'Modern JavaScript Patterns',
        lessons: [
          lesson('ES Modules'),
          lesson('Closures and Scope'),
          lesson('The DOM and Events'),
          lesson('Debugging with DevTools', 'TEXT'),
        ],
      },
    ],
  },
  {
    categorySlug: 'programming',
    title: 'Advanced React Development',
    slug: 'advanced-react-development',
    shortDescription: 'Architecture, state management, and performance for production React apps.',
    description:
      'For developers who already know React basics and want to build production-grade applications: advanced patterns, robust state management, performance profiling, and testing.',
    difficulty: 'ADVANCED',
    accessType: 'PAID',
    price: '99.99',
    discountPrice: '79.99',
    status: 'PUBLISHED',
    featured: true,
    certificateEnabled: true,
    estimatedDurationMinutes: 1140,
    outcomes: [
      'Design scalable component architectures with composition patterns',
      'Manage complex client and server state confidently',
      'Profile and optimize React application performance',
      'Write meaningful tests for React components',
    ],
    requirements: [
      'Working knowledge of React fundamentals (components, props, hooks)',
      'Comfortable with modern JavaScript (ES6+)',
    ],
    sections: [
      {
        title: 'React Architecture',
        lessons: [
          lesson('Component Composition Patterns'),
          lesson('Custom Hooks'),
          lesson('Context API Deep Dive'),
          lesson('Folder Structure at Scale', 'TEXT'),
        ],
      },
      {
        title: 'State Management',
        lessons: [
          lesson('useReducer for Complex State'),
          lesson('Zustand for Global State'),
          lesson('Server State with TanStack Query'),
          lesson('Optimistic Updates'),
        ],
      },
      {
        title: 'Performance Optimization',
        lessons: [
          lesson('Memoization with useMemo and useCallback'),
          lesson('Code Splitting and Lazy Loading'),
          lesson('Virtualizing Long Lists'),
          lesson('Profiling with React DevTools'),
        ],
      },
      {
        title: 'Testing and Production',
        lessons: [
          lesson('Testing Components with React Testing Library'),
          lesson('Error Boundaries'),
          lesson('Accessibility in React'),
          lesson('Production Build Optimization', 'TEXT'),
        ],
      },
    ],
  },
  {
    categorySlug: 'programming',
    title: 'NestJS Backend Development',
    slug: 'nestjs-backend-development',
    shortDescription: 'Build secure, well-structured APIs with NestJS, PostgreSQL, and JWT auth.',
    description:
      'Learn to build production-grade backend APIs with NestJS: modular architecture, database persistence, authentication and authorization, and the testing/documentation practices that keep large APIs maintainable.',
    difficulty: 'INTERMEDIATE',
    accessType: 'PAID',
    price: '89.99',
    status: 'DRAFT',
    featured: false,
    certificateEnabled: true,
    estimatedDurationMinutes: 1080,
    outcomes: [
      'Structure a NestJS application using modules, controllers, and providers',
      'Persist and query data with a repository-based data layer',
      'Implement JWT authentication and role-based access control',
      'Write tests and document a production NestJS API',
    ],
    requirements: ['Solid TypeScript fundamentals', 'Basic familiarity with REST API concepts'],
    sections: [
      {
        title: 'NestJS Fundamentals',
        lessons: [
          lesson('Modules, Controllers, and Providers'),
          lesson('Dependency Injection'),
          lesson('DTOs and Validation Pipes'),
          lesson('Configuration Management'),
        ],
      },
      {
        title: 'Data Persistence',
        lessons: [
          lesson('Connecting to PostgreSQL'),
          lesson('Repository Pattern'),
          lesson('Migrations'),
          lesson('Transactions'),
        ],
      },
      {
        title: 'Authentication and Authorization',
        lessons: [
          lesson('JWT Authentication'),
          lesson('Guards and Decorators'),
          lesson('Role-Based Access Control'),
          lesson('Refresh Token Strategy'),
        ],
      },
      {
        title: 'Building Production APIs',
        lessons: [
          lesson('Exception Filters'),
          lesson('Interceptors and Logging'),
          lesson('Testing NestJS Applications'),
          lesson('API Documentation with Swagger', 'TEXT'),
        ],
      },
    ],
  },
  // ---------------------------------------------------------------- UI/UX Design
  {
    categorySlug: 'ui-ux-design',
    title: 'UI/UX Design Fundamentals',
    slug: 'ui-ux-design-fundamentals',
    shortDescription: 'Learn user-centered design, wireframing, and core visual design principles.',
    description:
      'An introduction to the full UI/UX process - from user research and wireframing through visual design principles - for anyone starting a career in product design.',
    difficulty: 'BEGINNER',
    accessType: 'FREE',
    price: '0',
    status: 'PUBLISHED',
    featured: true,
    certificateEnabled: true,
    estimatedDurationMinutes: 900,
    outcomes: [
      'Apply user-centered design thinking to real problems',
      'Create low-fidelity wireframes and interactive prototypes',
      'Apply typography, color, and layout principles to interfaces',
      'Prepare and present a basic design portfolio piece',
    ],
    requirements: ['No prior design experience required'],
    sections: [
      {
        title: 'Design Thinking Basics',
        lessons: [
          lesson('Understanding User-Centered Design'),
          lesson('The Design Thinking Process'),
          lesson('User Research Methods'),
          lesson('Creating User Personas'),
        ],
      },
      {
        title: 'Wireframing and Prototyping',
        lessons: [
          lesson('Low-Fidelity Wireframing'),
          lesson('Information Architecture'),
          lesson('Interactive Prototypes'),
          lesson('Usability Testing Basics'),
        ],
      },
      {
        title: 'Visual Design Principles',
        lessons: [
          lesson('Typography Fundamentals'),
          lesson('Color Theory for Interfaces'),
          lesson('Layout and Grid Systems'),
          lesson('Visual Hierarchy'),
        ],
      },
      {
        title: 'Design Handoff',
        lessons: [
          lesson('Design Systems Basics'),
          lesson('Preparing Files for Developers'),
          lesson('Design Critique and Feedback'),
          lesson('Building a Design Portfolio', 'TEXT', {
            resources: [{ label: 'Portfolio Checklist', resourceType: 'DOCUMENT' }],
          }),
        ],
      },
    ],
  },
  {
    categorySlug: 'ui-ux-design',
    title: 'Advanced Figma Design',
    slug: 'advanced-figma-design',
    shortDescription:
      'Master auto layout, variables, interactive prototyping, and design systems in Figma.',
    description:
      'Take your Figma skills from competent to expert: advanced auto layout, component variants, interactive prototyping, and building a real, governed design system.',
    difficulty: 'INTERMEDIATE',
    accessType: 'PAID',
    price: '59.99',
    status: 'PUBLISHED',
    featured: false,
    certificateEnabled: true,
    estimatedDurationMinutes: 840,
    outcomes: [
      'Build responsive components with auto layout and variants',
      'Create advanced interactive prototypes with conditional logic',
      'Build and govern a token-based design system in Figma',
      'Hand off production-ready files to developers with Dev Mode',
    ],
    requirements: ['Comfortable with core Figma tools (frames, shapes, basic components)'],
    sections: [
      {
        title: 'Figma Essentials Recap',
        lessons: [
          lesson('Frames and Auto Layout'),
          lesson('Components and Variants'),
          lesson('Constraints and Responsive Frames'),
          lesson('Styles and Shared Libraries'),
        ],
      },
      {
        title: 'Advanced Prototyping',
        lessons: [
          lesson('Interactive Components'),
          lesson('Conditional Logic in Prototypes'),
          lesson('Micro-interactions and Animation'),
          lesson('Prototyping for Mobile'),
        ],
      },
      {
        title: 'Design Systems in Figma',
        lessons: [
          lesson('Building a Token-Based Design System'),
          lesson('Component Documentation'),
          lesson('Design System Governance'),
          lesson('Versioning Shared Libraries'),
        ],
      },
      {
        title: 'Collaboration and Handoff',
        lessons: [
          lesson('Real-Time Collaboration Workflows'),
          lesson('Developer Handoff with Dev Mode'),
          lesson('Plugins that Speed Up Your Workflow'),
          lesson('Design QA', 'TEXT'),
        ],
      },
    ],
  },
  {
    categorySlug: 'ui-ux-design',
    title: 'Product Design Masterclass',
    slug: 'product-design-masterclass',
    shortDescription: 'End-to-end product design practice for senior and lead designers.',
    description:
      'A senior-level course on designing complete products: aligning design with business strategy, running the full design process, leading design conversations, and building a compelling case study.',
    difficulty: 'ADVANCED',
    accessType: 'PAID',
    price: '129.99',
    status: 'PUBLISHED',
    featured: true,
    certificateEnabled: true,
    estimatedDurationMinutes: 1200,
    outcomes: [
      'Align design decisions with business strategy and success metrics',
      'Run a complete product design process from discovery to validation',
      'Facilitate design critiques and cross-functional collaboration',
      'Build a portfolio case study that communicates real impact',
    ],
    requirements: ['1+ years of product design experience recommended'],
    sections: [
      {
        title: 'Product Strategy for Designers',
        lessons: [
          lesson('Aligning Design with Business Goals'),
          lesson('Competitive Analysis'),
          lesson('Defining Success Metrics'),
          lesson('Roadmapping as a Designer'),
        ],
      },
      {
        title: 'End-to-End Product Design',
        lessons: [
          lesson('Discovery and Problem Framing'),
          lesson('Concept Exploration'),
          lesson('High-Fidelity Design'),
          lesson('Design Validation'),
        ],
      },
      {
        title: 'Design Leadership',
        lessons: [
          lesson('Facilitating Design Critiques'),
          lesson('Working with Cross-Functional Teams'),
          lesson('Presenting Design Decisions'),
          lesson('Mentoring Junior Designers'),
        ],
      },
      {
        title: 'Case Study Development',
        lessons: [
          lesson('Structuring a Case Study'),
          lesson('Documenting Your Process'),
          lesson('Showcasing Impact'),
          lesson('Portfolio Review', 'TEXT'),
        ],
      },
    ],
  },
  // ---------------------------------------------------------------- Business
  {
    categorySlug: 'business',
    title: 'Business Strategy Fundamentals',
    slug: 'business-strategy-fundamentals',
    shortDescription: 'Core strategic frameworks used by successful companies to compete and grow.',
    description:
      'An introduction to business strategy: how companies define competitive advantage, apply strategic frameworks, and execute and measure strategy over time.',
    difficulty: 'BEGINNER',
    accessType: 'PAID',
    price: '69.99',
    status: 'PUBLISHED',
    featured: false,
    certificateEnabled: true,
    estimatedDurationMinutes: 780,
    outcomes: [
      'Explain the core concepts of competitive advantage',
      'Apply SWOT analysis, Porter’s Five Forces, and the Business Model Canvas',
      'Translate strategy into measurable objectives',
      'Analyze real strategic decisions made by market leaders',
    ],
    requirements: ['No prior business background required'],
    sections: [
      {
        title: 'Foundations of Strategy',
        lessons: [
          lesson('What is Business Strategy'),
          lesson('Vision, Mission, and Values'),
          lesson('Understanding Competitive Advantage'),
          lesson('Industry Analysis'),
        ],
      },
      {
        title: 'Strategic Frameworks',
        lessons: [
          lesson('SWOT Analysis'),
          lesson('Porter’s Five Forces'),
          lesson('The Business Model Canvas', 'VIDEO', {
            resources: [{ label: 'Business Model Canvas Template', resourceType: 'DOCUMENT' }],
          }),
          lesson('Value Chain Analysis'),
        ],
      },
      {
        title: 'Executing Strategy',
        lessons: [
          lesson('Setting Strategic Objectives'),
          lesson('Resource Allocation'),
          lesson('Measuring Strategic Performance'),
          lesson('Adapting Strategy Over Time'),
        ],
      },
      {
        title: 'Case Studies in Strategy',
        lessons: [
          lesson('Analyzing Market Leaders'),
          lesson('Strategic Pivots'),
          lesson('Lessons from Business Failures'),
          lesson('Building Your Strategic Plan', 'TEXT'),
        ],
      },
    ],
  },
  {
    categorySlug: 'business',
    title: 'Product Management Essentials',
    slug: 'product-management-essentials',
    shortDescription: 'Everything you need to start and succeed in a product management role.',
    description:
      'A practical introduction to product management: discovery, prioritization, working with engineering and design, and the metrics that define successful products.',
    difficulty: 'INTERMEDIATE',
    accessType: 'PAID',
    price: '79.99',
    status: 'PUBLISHED',
    featured: true,
    certificateEnabled: true,
    estimatedDurationMinutes: 900,
    outcomes: [
      'Understand the day-to-day responsibilities of a product manager',
      'Run effective customer discovery and define product vision',
      'Prioritize a backlog and manage delivery with agile teams',
      'Define and analyze the metrics that matter for product growth',
    ],
    requirements: ['Interest in product, technology, or business roles'],
    sections: [
      {
        title: 'The Product Manager Role',
        lessons: [
          lesson('What Product Managers Actually Do'),
          lesson('Working with Engineering and Design'),
          lesson('Stakeholder Management'),
          lesson('Product Manager Toolkit'),
        ],
      },
      {
        title: 'Discovery and Strategy',
        lessons: [
          lesson('Customer Discovery Interviews'),
          lesson('Defining Product Vision'),
          lesson('Prioritization Frameworks'),
          lesson('Writing Product Requirements', 'VIDEO', {
            resources: [
              { label: 'PRD Template', resourceType: 'DOCUMENT' },
              { label: 'Sample PRD Example', resourceType: 'DOCUMENT' },
            ],
          }),
        ],
      },
      {
        title: 'Execution and Delivery',
        lessons: [
          lesson('Agile and Scrum for Product Managers'),
          lesson('Managing the Product Backlog'),
          lesson('Working with Sprints'),
          lesson('Launch Planning'),
        ],
      },
      {
        title: 'Metrics and Growth',
        lessons: [
          lesson('Defining Product Metrics'),
          lesson('Analyzing User Behavior'),
          lesson('A/B Testing Fundamentals'),
          lesson('Driving Product Growth', 'TEXT'),
        ],
      },
    ],
  },
  {
    categorySlug: 'business',
    title: 'Entrepreneurship Masterclass',
    slug: 'entrepreneurship-masterclass',
    shortDescription: 'From idea validation to raising capital, hiring, and scaling a startup.',
    description:
      'A comprehensive founder’s course: validating an idea, raising capital, building an early team, and navigating the realities of growing a startup sustainably.',
    difficulty: 'ADVANCED',
    accessType: 'PAID',
    price: '99.99',
    status: 'DRAFT',
    featured: false,
    certificateEnabled: true,
    estimatedDurationMinutes: 960,
    outcomes: [
      'Validate a business idea before committing significant resources',
      'Understand funding options and how to pitch to investors',
      'Build an early team and company culture',
      'Apply sustainable growth strategies to a young company',
    ],
    requirements: ['A business idea or early-stage venture is helpful but not required'],
    sections: [
      {
        title: 'From Idea to Venture',
        lessons: [
          lesson('Validating a Business Idea'),
          lesson('Identifying Your Target Market'),
          lesson('Building a Minimum Viable Product'),
          lesson('Early Customer Feedback'),
        ],
      },
      {
        title: 'Funding Your Business',
        lessons: [
          lesson('Bootstrapping vs Raising Capital'),
          lesson('Understanding Investor Expectations'),
          lesson('Pitching Your Business'),
          lesson('Term Sheets Explained'),
        ],
      },
      {
        title: 'Building and Scaling a Team',
        lessons: [
          lesson('Hiring Your First Employees'),
          lesson('Building Company Culture'),
          lesson('Delegation and Leadership'),
          lesson('Scaling Operations'),
        ],
      },
      {
        title: 'Growth and Sustainability',
        lessons: [
          lesson('Growth Strategies for Startups'),
          lesson('Managing Cash Flow'),
          lesson('Navigating Setbacks'),
          lesson('Long-Term Sustainability', 'TEXT'),
        ],
      },
    ],
  },
  // ---------------------------------------------------------------- Data Science
  {
    categorySlug: 'data-science',
    title: 'Python for Data Science',
    slug: 'python-for-data-science',
    shortDescription: 'Learn Python, Pandas, and data visualization from the ground up.',
    description:
      'A hands-on introduction to using Python for data work: core Python syntax, data manipulation with Pandas, visualization, and numerical computing with NumPy.',
    difficulty: 'BEGINNER',
    accessType: 'FREE',
    price: '0',
    status: 'PUBLISHED',
    featured: true,
    certificateEnabled: true,
    estimatedDurationMinutes: 900,
    outcomes: [
      'Write Python programs to process and analyze data',
      'Clean, transform, and aggregate data with Pandas',
      'Create clear visualizations with Matplotlib and Seaborn',
      'Perform numerical computing tasks with NumPy',
    ],
    requirements: ['No prior programming experience required'],
    sections: [
      {
        title: 'Python Programming Basics',
        lessons: [
          lesson('Variables and Data Types in Python'),
          lesson('Control Flow and Loops'),
          lesson('Functions and Modules'),
          lesson('Working with Files'),
        ],
      },
      {
        title: 'Data Manipulation with Pandas',
        lessons: [
          lesson('Introduction to Pandas DataFrames'),
          lesson('Cleaning and Transforming Data', 'VIDEO', {
            resources: [{ label: 'Pandas Cheat Sheet', resourceType: 'PDF' }],
          }),
          lesson('Grouping and Aggregating Data'),
          lesson('Merging Datasets'),
        ],
      },
      {
        title: 'Data Visualization',
        lessons: [
          lesson('Plotting with Matplotlib'),
          lesson('Statistical Visualization with Seaborn'),
          lesson('Building Interactive Charts'),
          lesson('Communicating Insights Visually'),
        ],
      },
      {
        title: 'Numerical Computing with NumPy',
        lessons: [
          lesson('NumPy Arrays and Operations'),
          lesson('Broadcasting and Vectorization'),
          lesson('Linear Algebra Basics'),
          lesson('Working with Real Datasets', 'TEXT'),
        ],
      },
    ],
  },
  {
    categorySlug: 'data-science',
    title: 'Machine Learning Fundamentals',
    slug: 'machine-learning-fundamentals',
    shortDescription: 'Understand and build core supervised and unsupervised learning models.',
    description:
      'A practical foundation in machine learning: the ML workflow, core supervised and unsupervised algorithms, model evaluation, and the ethical considerations behind deploying ML systems.',
    difficulty: 'INTERMEDIATE',
    accessType: 'PAID',
    price: '109.99',
    status: 'PUBLISHED',
    featured: false,
    certificateEnabled: true,
    estimatedDurationMinutes: 1080,
    outcomes: [
      'Explain the difference between supervised and unsupervised learning',
      'Build and evaluate regression and classification models',
      'Apply clustering and dimensionality reduction techniques',
      'Build a basic end-to-end machine learning pipeline',
    ],
    requirements: ['Basic Python knowledge', 'Familiarity with basic statistics is helpful'],
    sections: [
      {
        title: 'Introduction to Machine Learning',
        lessons: [
          lesson('What is Machine Learning'),
          lesson('Supervised vs Unsupervised Learning'),
          lesson('The Machine Learning Workflow'),
          lesson('Setting Up Your Environment'),
        ],
      },
      {
        title: 'Supervised Learning',
        lessons: [
          lesson('Linear Regression'),
          lesson('Logistic Regression'),
          lesson('Decision Trees'),
          lesson('Model Evaluation Metrics', 'VIDEO', {
            resources: [{ label: 'Metrics Comparison Guide', resourceType: 'PDF' }],
          }),
        ],
      },
      {
        title: 'Unsupervised Learning and Beyond',
        lessons: [
          lesson('K-Means Clustering'),
          lesson('Dimensionality Reduction'),
          lesson('Introduction to Neural Networks'),
          lesson('Overfitting and Regularization'),
        ],
      },
      {
        title: 'Applying Machine Learning',
        lessons: [
          lesson('Feature Engineering'),
          lesson('Building an End-to-End ML Pipeline'),
          lesson('Model Deployment Basics'),
          lesson('Ethical Considerations in ML', 'TEXT'),
        ],
      },
    ],
  },
  {
    categorySlug: 'data-science',
    title: 'Data Analytics with Python',
    slug: 'data-analytics-with-python',
    shortDescription:
      'Turn raw data into business insight using Python, SQL, and real-world projects.',
    description:
      'A project-based analytics course: the full analytics process from raw, messy data to a polished report, using Python, SQL, and real business scenarios.',
    difficulty: 'INTERMEDIATE',
    accessType: 'PAID',
    price: '79.99',
    status: 'PUBLISHED',
    featured: false,
    certificateEnabled: true,
    estimatedDurationMinutes: 900,
    outcomes: [
      'Apply the full data analytics process to a real dataset',
      'Clean and combine data from multiple sources',
      'Test hypotheses and build simple dashboards',
      'Present analytics findings clearly to non-technical stakeholders',
    ],
    requirements: ['Basic Python knowledge', 'Basic SQL knowledge is helpful'],
    sections: [
      {
        title: 'Analytics Foundations',
        lessons: [
          lesson('The Data Analytics Process'),
          lesson('Descriptive Statistics'),
          lesson('Exploratory Data Analysis'),
          lesson('Working with SQL and Python Together'),
        ],
      },
      {
        title: 'Data Wrangling',
        lessons: [
          lesson('Handling Missing Data'),
          lesson('Data Cleaning Techniques'),
          lesson('Combining Multiple Data Sources'),
          lesson('Feature Transformation'),
        ],
      },
      {
        title: 'Analysis and Reporting',
        lessons: [
          lesson('Hypothesis Testing Basics'),
          lesson('Building Dashboards with Python', 'VIDEO', {
            resources: [{ label: 'Dashboard Starter Notebook', resourceType: 'DOWNLOAD' }],
          }),
          lesson('Storytelling with Data'),
          lesson('Automating Reports'),
        ],
      },
      {
        title: 'Real-World Analytics Projects',
        lessons: [
          lesson('Analyzing Business Metrics'),
          lesson('Cohort Analysis'),
          lesson('Building an Analytics Case Study'),
          lesson('Presenting Findings to Stakeholders', 'TEXT'),
        ],
      },
    ],
  },
  // ---------------------------------------------------------------- Marketing
  {
    categorySlug: 'marketing',
    title: 'Digital Marketing Fundamentals',
    slug: 'digital-marketing-fundamentals',
    shortDescription: 'The essentials of SEO, content, paid, and email marketing in one course.',
    description:
      'A broad introduction to digital marketing: the marketing funnel, content and SEO fundamentals, paid and social channels, and how to measure what’s working.',
    difficulty: 'BEGINNER',
    accessType: 'FREE',
    price: '0',
    status: 'PUBLISHED',
    featured: false,
    certificateEnabled: true,
    estimatedDurationMinutes: 780,
    outcomes: [
      'Explain the marketing funnel and how channels fit within it',
      'Apply basic SEO and content marketing techniques',
      'Understand paid, social, and email marketing fundamentals',
      'Set up basic marketing analytics and reporting',
    ],
    requirements: ['No prior marketing experience required'],
    sections: [
      {
        title: 'Marketing Foundations',
        lessons: [
          lesson('Understanding the Marketing Funnel'),
          lesson('Defining Your Target Audience'),
          lesson('Brand Positioning Basics'),
          lesson('Marketing Channels Overview'),
        ],
      },
      {
        title: 'Content and SEO',
        lessons: [
          lesson('Content Marketing Strategy'),
          lesson('Search Engine Optimization Basics'),
          lesson('Keyword Research', 'VIDEO', {
            resources: [{ label: 'Keyword Research Worksheet', resourceType: 'DOCUMENT' }],
          }),
          lesson('Creating a Content Calendar'),
        ],
      },
      {
        title: 'Paid and Social Marketing',
        lessons: [
          lesson('Introduction to Paid Advertising'),
          lesson('Social Media Marketing Basics'),
          lesson('Email Marketing Fundamentals'),
          lesson('Measuring Campaign Performance'),
        ],
      },
      {
        title: 'Marketing Analytics',
        lessons: [
          lesson('Setting Up Analytics Tracking'),
          lesson('Understanding Marketing KPIs'),
          lesson('A/B Testing Campaigns'),
          lesson('Building a Marketing Report', 'TEXT'),
        ],
      },
    ],
  },
  {
    categorySlug: 'marketing',
    title: 'Social Media Marketing',
    slug: 'social-media-marketing',
    shortDescription: 'Grow an audience and run paid social campaigns that convert.',
    description:
      'A focused course on building and growing a social media presence: content strategy, paid social advertising, community management, and measuring return on investment.',
    difficulty: 'BEGINNER',
    accessType: 'PAID',
    price: '49.99',
    status: 'PUBLISHED',
    featured: false,
    certificateEnabled: true,
    estimatedDurationMinutes: 720,
    outcomes: [
      'Build a social media content strategy for a brand',
      'Create engaging visual and short-form video content',
      'Run and optimize basic paid social ad campaigns',
      'Report on social media performance and ROI',
    ],
    requirements: ['A social media account to practice with is helpful'],
    sections: [
      {
        title: 'Social Media Strategy',
        lessons: [
          lesson('Choosing the Right Platforms'),
          lesson('Building a Content Strategy'),
          lesson('Audience Growth Tactics'),
          lesson('Competitor Analysis'),
        ],
      },
      {
        title: 'Content Creation',
        lessons: [
          lesson('Creating Engaging Visual Content'),
          lesson('Short-Form Video Content'),
          lesson('Writing Captions That Convert'),
          lesson('Content Scheduling Tools'),
        ],
      },
      {
        title: 'Paid Social Advertising',
        lessons: [
          lesson('Introduction to Social Ad Platforms'),
          lesson('Targeting and Audience Segmentation'),
          lesson('Budgeting for Social Campaigns'),
          lesson('Creative Testing'),
        ],
      },
      {
        title: 'Community and Analytics',
        lessons: [
          lesson('Community Management Basics'),
          lesson('Handling Negative Feedback'),
          lesson('Social Media Analytics'),
          lesson('Reporting on Social ROI', 'TEXT'),
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------- People

export interface DemoPerson {
  email: string;
  firstName: string;
  lastName: string;
  bio: string;
  phone: string;
}

export const ADMIN_PERSON: DemoPerson = {
  email: 'admin@academy.test',
  firstName: 'Meron',
  lastName: 'Alemu',
  bio: 'Platform administrator overseeing academy operations, content quality, and system configuration.',
  phone: '+251911234501',
};

export const CONTENT_MANAGER_PERSON: DemoPerson = {
  email: 'content@academy.test',
  firstName: 'Priya',
  lastName: 'Sharma',
  bio: 'Content operations manager responsible for the course catalog, categories, and promo codes.',
  phone: '+251911234502',
};

export const INSTRUCTOR_PERSON: DemoPerson = {
  email: 'instructor@academy.test',
  firstName: 'Daniel',
  lastName: 'Osei',
  bio: 'Software engineer and design practitioner teaching full-stack development, UI/UX, and product courses.',
  phone: '+251911234503',
};

export const STUDENT_PEOPLE: DemoPerson[] = [
  {
    email: 'student1@academy.test',
    firstName: 'Abebe',
    lastName: 'Kebede',
    bio: 'Learning full-stack development to transition into a software engineering career.',
    phone: '+251911234511',
  },
  {
    email: 'student2@academy.test',
    firstName: 'Sara',
    lastName: 'Tesfaye',
    bio: 'Product-minded marketer building data analysis and growth marketing skills.',
    phone: '+251911234512',
  },
  {
    email: 'student3@academy.test',
    firstName: 'Yonas',
    lastName: 'Girma',
    bio: 'Aspiring data analyst exploring Python, statistics, and machine learning fundamentals.',
    phone: '+251911234513',
  },
  {
    email: 'student4@academy.test',
    firstName: 'Grace',
    lastName: 'Liu',
    bio: 'UX designer sharpening advanced Figma, prototyping, and design systems skills.',
    phone: '+251911234514',
  },
];

export const DEMO_PASSWORD = {
  ADMINISTRATOR: 'Admin@12345',
  CONTENT_MANAGER: 'Content@12345',
  INSTRUCTOR: 'Instructor@12345',
  STUDENT: 'Student@12345',
} as const;

// ---------------------------------------------------------------- Promotions

export interface DemoPromoCode {
  code: string;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'REVOKED';
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: string;
  maxUsers?: number;
  validFromInDays: number;
  validUntilInDays: number | null;
}

export const PROMO_CODE_CATALOG: DemoPromoCode[] = [
  {
    code: 'WELCOME10',
    status: 'ACTIVE',
    discountType: 'PERCENTAGE',
    discountValue: '10',
    validFromInDays: -60,
    validUntilInDays: null,
  },
  {
    code: 'EARLYBIRD20',
    status: 'ACTIVE',
    discountType: 'PERCENTAGE',
    discountValue: '20',
    validFromInDays: -14,
    validUntilInDays: 30,
  },
  {
    code: 'STUDENT15',
    status: 'ACTIVE',
    discountType: 'PERCENTAGE',
    discountValue: '15',
    maxUsers: 50,
    validFromInDays: -14,
    validUntilInDays: 30,
  },
  {
    code: 'DEV25',
    status: 'EXPIRED',
    discountType: 'PERCENTAGE',
    discountValue: '25',
    validFromInDays: -45,
    validUntilInDays: -38,
  },
  {
    code: 'SUMMER20',
    status: 'PAUSED',
    discountType: 'FIXED',
    discountValue: '20',
    validFromInDays: 20,
    validUntilInDays: 80,
  },
];

// ---------------------------------------------------------------- Activity

/** Real activity-log action codes, matching the lowercase dot-notation convention already used by `packages/database/src/{users,rbac}.ts`. */
export const ACTIVITY_ACTIONS = {
  login: 'user.login',
  logout: 'user.logout',
  passwordChanged: 'user.password_changed',
  profileUpdated: 'user.profile_updated',
  courseCreated: 'course.created',
  courseUpdated: 'course.updated',
  coursePublished: 'course.published',
  categoryCreated: 'category.created',
  enrollmentCreated: 'enrollment.created',
  enrollmentCompleted: 'enrollment.completed',
  paymentSubmitted: 'payment.submitted',
  paymentApproved: 'payment.approved',
  paymentDeclined: 'payment.declined',
  certificateIssued: 'certificate.issued',
  promotionCreated: 'promotion.created',
  roleAssigned: 'user.role.assigned',
} as const;
