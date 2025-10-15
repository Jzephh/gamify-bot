import { WhopServerSdk } from "@whop/api";

// Narrow interface to avoid exporting complex inferred types from @whop/api
export interface WhopSdk {
  messages: {
    getMessage(args: {
      id: string;
    }): Promise<Record<string, unknown>>;
    listMessagesFromChat(args: {
      chatExperienceId: string;
    }): Promise<Record<string, unknown>>;
    sendMessageToChat(args: {
      experienceId?: string;
      channelId?: string;
      message: string;
      attachments?: Array<{ directUploadId?: string; id?: string }>;
    }): Promise<Record<string, unknown>>;
  };
  experiences: {
    listExperiences(args: {
      companyId: string;
    }): Promise<Record<string, unknown>>;
  };
  companies: {
    listMemberships(args: {
      companyId: string;
    }): Promise<Record<string, unknown>>;
    listMembers(args: {
      companyId: string;
    }): Promise<Record<string, unknown>>;
  };
  attachments: {
    uploadAttachment(args: {
      file: File | Buffer;
      record: string;
    }): Promise<{ directUploadId: string }>;
  };
  users: {
    getUser(args: {
      userId: string;
    }): Promise<any>;
    getCurrentUser(): Promise<any>;
  };
  verifyUserToken: (headers: Headers) => Promise<{ userId: string } | Record<string, unknown>>;
}

export function getWhopSdk(): WhopSdk {
  const options: {
    appId: string;
    appApiKey: string;
    onBehalfOfUserId?: string;
    companyId?: string;
  } = {
    appId: process.env.NEXT_PUBLIC_WHOP_APP_ID!,
    appApiKey: process.env.WHOP_API_KEY!,
  };
  
  if (process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID) {
    options.onBehalfOfUserId = process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID;
  }
  if (process.env.NEXT_PUBLIC_WHOP_COMPANY_ID) {
    options.companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
  }
  
  const sdk = WhopServerSdk(options);
  return sdk as unknown as WhopSdk;
}
