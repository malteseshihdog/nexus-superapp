import type { CodeContext } from './contextBuilder';

export interface PromptTemplate {
  system: string;
  userPrefix: string;
  userSuffix: string;
  maxTokens: number;
}

export type PromptType = 'completion' | 'function_generation' | 'documentation' | 'bug_fix' | 'refactor' | 'security_review' | 'performance';

const TEMPLATES: Record<PromptType, PromptTemplate> = {
  completion: {
    system: 'You are an expert code completion assistant. Complete the code naturally and concisely.',
    userPrefix: 'Complete the following code:\n```\n',
    userSuffix: '\n```\nProvide only the completion, no explanation.',
    maxTokens: 256,
  },
  function_generation: {
    system: 'You are an expert software engineer. Generate complete, working function implementations.',
    userPrefix: 'Implement the following function:\n```\n',
    userSuffix: '\n```\nProvide only the implementation.',
    maxTokens: 512,
  },
  documentation: {
    system: 'You are a technical writer. Generate clear and concise documentation.',
    userPrefix: 'Generate documentation for:\n```\n',
    userSuffix: '\n```',
    maxTokens: 256,
  },
  bug_fix: {
    system: 'You are a debugging expert. Identify and fix bugs in the code.',
    userPrefix: 'Find and fix bugs in:\n```\n',
    userSuffix: '\n```\nProvide the corrected code and explanation.',
    maxTokens: 512,
  },
  refactor: {
    system: 'You are a senior engineer. Refactor code for clarity, performance, and maintainability.',
    userPrefix: 'Refactor the following code:\n```\n',
    userSuffix: '\n```\nProvide refactored version with explanation.',
    maxTokens: 512,
  },
  security_review: {
    system: 'You are a security expert. Identify security vulnerabilities and provide fixes.',
    userPrefix: 'Review for security issues:\n```\n',
    userSuffix: '\n```\nList vulnerabilities and fixes.',
    maxTokens: 512,
  },
  performance: {
    system: 'You are a performance engineer. Identify bottlenecks and suggest optimizations.',
    userPrefix: 'Analyze performance of:\n```\n',
    userSuffix: '\n```\nProvide optimization suggestions.',
    maxTokens: 512,
  },
};

export class PromptEngineer {
  buildPrompt(context: CodeContext, type: PromptType = 'completion'): { system: string; user: string; maxTokens: number } {
    const template = TEMPLATES[type];
    const user = `${template.userPrefix}${context.prefix}${template.userSuffix}`;
    return {
      system: template.system,
      user,
      maxTokens: template.maxTokens,
    };
  }

  buildFunctionPrompt(signature: string, description: string, language: string): { system: string; user: string } {
    return {
      system: TEMPLATES.function_generation.system,
      user: `Language: ${language}\nSignature: ${signature}\nDescription: ${description}\n\nImplement the function:`,
    };
  }

  buildDocumentationPrompt(code: string, style: 'jsdoc' | 'tsdoc' | 'google' | 'numpy' = 'jsdoc'): { system: string; user: string } {
    return {
      system: TEMPLATES.documentation.system,
      user: `Style: ${style}\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    };
  }

  getTemplate(type: PromptType): PromptTemplate {
    return TEMPLATES[type];
  }
}
