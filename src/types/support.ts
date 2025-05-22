
export interface SupportInquiry {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
  createdAt: string;
  status: "open" | "replied" | "closed";
  replies: SupportReply[];
}

export interface SupportReply {
  id: string;
  inquiryId: string;
  userId: string;
  userName: string;
  userRole: string;
  message: string;
  createdAt: string;
}
