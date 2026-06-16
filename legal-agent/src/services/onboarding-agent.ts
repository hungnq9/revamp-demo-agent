import onboardingPhasesData from '../data/onboarding-phases.json';
import agentsActionsData from '../data/agents-actions.json';
import * as formatters from './formatters';
import {
  OnboardingPhase,
  OnboardingPhasesData,
  UseCase,
  AgentsActionsData,
  ValidateRequest,
  ValidateResponse,
  EmailRequest,
  EmailResponse,
  TicketRequest,
  TicketResponse,
  SendEmailRequest,
  SendEmailResponse,
} from '../types';

const phasesData = onboardingPhasesData as OnboardingPhasesData;
const actionsData = agentsActionsData as AgentsActionsData;

// Use Case 1: Giải đáp quy trình Onboarding cho BD
export function getProcessOverview(): {
  phases: OnboardingPhase[];
  useCases: UseCase[];
  formattedPhases: string;
  formattedUseCases: string;
} {
  return {
    phases: phasesData.phases,
    useCases: actionsData.useCases,
    formattedPhases: formatters.formatAllPhasesWithDetails(phasesData.phases),
    formattedUseCases: formatters.formatUseCases(actionsData.useCases),
  };
}

// Get single phase by number
export function getPhaseByNumber(phaseNumber: number): OnboardingPhase | undefined {
  return phasesData.phases.find((p) => p.phaseNumber === phaseNumber);
}

// Use Case 2: Validate tài liệu
export function validateDocuments(request: ValidateRequest): ValidateResponse {
  const phase = getPhaseByNumber(request.phaseNumber);

  if (!phase) {
    return {
      phase: {} as OnboardingPhase,
      status: 'Thiếu',
      missingDocuments: ['Phase không tồn tại'],
    };
  }

  // Simple contains check - case insensitive
  const containsIgnoreCase = (source: string, target: string): boolean => {
    return source.toLowerCase().includes(target.toLowerCase());
  };

  const missingDocs: string[] = [];
  for (const required of phase.requiredDocuments) {
    const found = request.documents.some(
      (doc) => containsIgnoreCase(doc, required) || containsIgnoreCase(required, doc)
    );
    if (!found) {
      missingDocs.push(required);
    }
  }

  return {
    phase,
    status: missingDocs.length === 0 ? 'Đủ' : 'Thiếu',
    missingDocuments: missingDocs,
  };
}

// Email template
const EMAIL_TEMPLATE = `Hi [PIC],

Biz đang onboarding MC [Tên MC] mới cho giải pháp cổng thanh toán Zalopay.

Nhờ anh/chị [PIC] hỗ trợ review các tài liệu đính kèm!

Nếu cần bổ sung thông tin gì, nhờ anh/chị share lại cho Biz với ạ!

Best regards,
[Biz Team]`;

// Use Case 3: Tạo email
export function generateEmail(request: EmailRequest): EmailResponse {
  const phase = getPhaseByNumber(request.phaseNumber);

  if (!phase) {
    throw new Error('Phase không tồn tại');
  }

  // Bước 1, 2, 4 mới tạo email được
  if (![1, 2, 4].includes(request.phaseNumber)) {
    throw new Error('Bước 3 (Tích hợp kỹ thuật) không tạo email, vui lòng tạo ticket');
  }

  const emailBody = EMAIL_TEMPLATE
    .replace('[PIC]', phase.pic)
    .replace(/\[Tên MC\]/g, request.merchantInfo.merchantName)
    .replace('[PIC]', phase.pic);

  const subjects: Record<number, string> = {
    1: `[Onboarding] Thẩm định Merchant - ${request.merchantInfo.merchantName}`,
    2: `[Onboarding] Review Hợp đồng - ${request.merchantInfo.merchantName}`,
    4: `[Onboarding] Tạo FA Code - ${request.merchantInfo.merchantName}`,
  };

  return {
    to: phase.picEmail,
    subject: subjects[request.phaseNumber] || `[Onboarding] ${request.merchantInfo.merchantName}`,
    body: emailBody,
  };
}

// Use Case 4: Tạo ticket
export function generateTicket(request: TicketRequest): TicketResponse {
  const phase = getPhaseByNumber(3); // Phase 3 = Tích hợp kỹ thuật

  const paymentMethodsText = [
    `- Zalopay: ${request.paymentMethods.zalopay ? 'Có' : 'Không'}`,
    `- VQR: ${request.paymentMethods.vqr ? 'Có' : 'Không'}`,
    `- Credit Card: ${request.paymentMethods.creditCard ? 'Có' : 'Không'}`,
  ].join('\n');

  return {
    title: `[Onboarding] Tích hợp thanh toán - ${request.merchantName}`,
    description: `Merchant: ${request.merchantName}
Phương thức thanh toán:
${paymentMethodsText}

Yêu cầu: ${phase?.picTasks || 'Tạo App ID và hỗ trợ tích hợp'}`,
    labels: ['onboarding', 'payment-integration'],
  };
}

// Use Case 5: Simulate gửi email
export function simulateSendEmail(request: SendEmailRequest): SendEmailResponse {
  const email = request.email;

  // Simulate successful send
  return {
    success: true,
    message: `Email đã được simulate gửi thành công đến ${email.to}`,
    simulatedAt: new Date().toISOString(),
  };
}