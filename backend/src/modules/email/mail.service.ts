import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private adminEmail: string;
  private frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.adminEmail = this.configService.get<string>('ADMIN_EMAIL') || 'ritikasthana092019@gmail.com';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const smtpUser = this.configService.get<string>('SMTP_USER') || this.configService.get<string>('GMAIL_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS') || this.configService.get<string>('GMAIL_PASS');
    const smtpHost = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const smtpPort = parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10);

    if (smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log(`Gmail SMTP transporter initialized for sender: ${smtpUser}. Admin: ${this.adminEmail}`);
    } else {
      this.logger.warn(`No SMTP credentials found in .env (GMAIL_USER/SMTP_USER). Falling back to console notification logger.`);
    }
  }

  getAdminEmail(): string {
    return this.adminEmail;
  }

  private async sendMail(options: { to: string; subject: string; html: string; text: string }) {
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: `"Project Hub System" <${this.configService.get<string>('SMTP_USER') || this.adminEmail}>`,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });
        this.logger.log(`Email dispatched successfully to ${options.to}. MessageId: ${info.messageId}`);
        return info;
      } catch (err: any) {
        this.logger.error(`Failed to send email via SMTP to ${options.to}: ${err.message}`, err.stack);
      }
    }

    // Console fallback logger for dev/testing when SMTP is not configured
    this.logger.log(`\n============== [GMAIL NOTIFICATION MOCK DISPATCH] ==============`);
    this.logger.log(`TO: ${options.to}`);
    this.logger.log(`SUBJECT: ${options.subject}`);
    this.logger.log(`BODY:\n${options.text}`);
    this.logger.log(`=================================================================\n`);
  }

  async sendRegistrationApprovalRequest(details: {
    registrantName: string;
    registrantEmail: string;
    role?: string;
    department?: string;
    approveUrl: string;
    rejectUrl: string;
  }) {
    const subject = `[ACTION REQUIRED] New Registration Request: ${details.registrantName}`;
    const text = `
Hello Admin,

A new user has requested registration for the Project Hub platform:

- Name: ${details.registrantName}
- Email: ${details.registrantEmail}
- Requested Role: ${details.role || 'DEVELOPER'}
- Department: ${details.department || 'N/A'}

Until you accept this request, the user cannot access the system.

Approve Registration:
${details.approveUrl}

Reject Registration:
${details.rejectUrl}
`;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
  <div style="background-color: #1e293b; color: #ffffff; padding: 20px; text-align: center;">
    <h2 style="margin: 0; font-size: 20px;">User Registration Approval Request</h2>
  </div>
  <div style="padding: 24px; color: #334155; line-height: 1.6;">
    <p>Hello Admin,</p>
    <p>A new member has requested to join your project hub:</p>
    <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #cbd5e1;">
      <p style="margin: 4px 0;"><strong>Name:</strong> ${details.registrantName}</p>
      <p style="margin: 4px 0;"><strong>Email:</strong> ${details.registrantEmail}</p>
      <p style="margin: 4px 0;"><strong>Requested Role:</strong> ${details.role || 'DEVELOPER'}</p>
      <p style="margin: 4px 0;"><strong>Department:</strong> ${details.department || 'N/A'}</p>
    </div>
    <p style="color: #dc2626; font-weight: bold;">Until you accept this request, this member cannot log in or register with your project.</p>
    <div style="margin-top: 24px; text-align: center;">
      <a href="${details.approveUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 12px; display: inline-block;">ACCEPT REGISTRATION</a>
      <a href="${details.rejectUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">REJECT</a>
    </div>
  </div>
</div>
`;

    return this.sendMail({ to: this.adminEmail, subject, text, html });
  }

  async sendProjectCreateApprovalRequest(details: {
    projectName: string;
    description: string;
    category?: string;
    requestedByName: string;
    requestedByEmail: string;
    approveUrl: string;
    rejectUrl: string;
  }) {
    const subject = `[ACTION REQUIRED] Project Addition Approval Request: ${details.projectName}`;
    const text = `
Hello Admin,

A request has been submitted to ADD a new project to your workspace:

- Project Name: ${details.projectName}
- Description: ${details.description}
- Category: ${details.category || 'WEB_APP'}
- Requested By: ${details.requestedByName} (${details.requestedByEmail})

Until you accept this request, the project will not be added or published.

Approve Project Creation:
${details.approveUrl}

Reject Request:
${details.rejectUrl}
`;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
  <div style="background-color: #0f172a; color: #ffffff; padding: 20px; text-align: center;">
    <h2 style="margin: 0; font-size: 20px;">Project Addition Approval Request</h2>
  </div>
  <div style="padding: 24px; color: #334155; line-height: 1.6;">
    <p>Hello Admin,</p>
    <p>A member has requested to <strong>ADD a new project</strong> to your workspace:</p>
    <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #cbd5e1;">
      <p style="margin: 4px 0;"><strong>Project Name:</strong> ${details.projectName}</p>
      <p style="margin: 4px 0;"><strong>Description:</strong> ${details.description}</p>
      <p style="margin: 4px 0;"><strong>Requested By:</strong> ${details.requestedByName} (${details.requestedByEmail})</p>
    </div>
    <p style="color: #2563eb; font-weight: bold;">This project will only be created after you accept this request from your email.</p>
    <div style="margin-top: 24px; text-align: center;">
      <a href="${details.approveUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 12px; display: inline-block;">ACCEPT & CREATE PROJECT</a>
      <a href="${details.rejectUrl}" style="background-color: #64748b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">REJECT</a>
    </div>
  </div>
</div>
`;

    return this.sendMail({ to: this.adminEmail, subject, text, html });
  }

  async sendProjectDeleteApprovalRequest(details: {
    projectName: string;
    projectId: string;
    requestedByName: string;
    requestedByEmail: string;
    approveUrl: string;
    rejectUrl: string;
  }) {
    const subject = `[URGENT ACTION REQUIRED] Project Deletion Approval Request: ${details.projectName}`;
    const text = `
Hello Admin,

A request has been submitted to DELETE a project from your workspace:

- Project Name: ${details.projectName} (ID: ${details.projectId})
- Requested By: ${details.requestedByName} (${details.requestedByEmail})

Until you accept this request, the project will NOT be deleted.

Approve Project Deletion:
${details.approveUrl}

Reject Deletion Request:
${details.rejectUrl}
`;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fecaca; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
  <div style="background-color: #991b1b; color: #ffffff; padding: 20px; text-align: center;">
    <h2 style="margin: 0; font-size: 20px;">⚠️ Project Deletion Request</h2>
  </div>
  <div style="padding: 24px; color: #334155; line-height: 1.6;">
    <p>Hello Admin,</p>
    <p>A member has requested to <strong>DELETE</strong> an existing project:</p>
    <div style="background-color: #fef2f2; padding: 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #fca5a5;">
      <p style="margin: 4px 0;"><strong>Project Name:</strong> ${details.projectName}</p>
      <p style="margin: 4px 0;"><strong>Project ID:</strong> ${details.projectId}</p>
      <p style="margin: 4px 0;"><strong>Requested By:</strong> ${details.requestedByName} (${details.requestedByEmail})</p>
    </div>
    <p style="color: #dc2626; font-weight: bold;">Until you accept this request, the project remains safe and will NOT be deleted.</p>
    <div style="margin-top: 24px; text-align: center;">
      <a href="${details.approveUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 12px; display: inline-block;">CONFIRM DELETION</a>
      <a href="${details.rejectUrl}" style="background-color: #475569; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">REJECT & KEEP PROJECT</a>
    </div>
  </div>
</div>
`;

    return this.sendMail({ to: this.adminEmail, subject, text, html });
  }

  async sendRegistrationApprovedNotification(details: { registrantEmail: string; registrantName: string }) {
    const subject = `Welcome to Project Hub - Registration Approved!`;
    const text = `Hello ${details.registrantName},\n\nYour registration request has been approved by the Admin! You can now log into your account at ${this.frontendUrl}.\n\nBest regards,\nProject Hub Team`;
    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
  <h2 style="color: #16a34a;">Registration Approved!</h2>
  <p>Hello ${details.registrantName},</p>
  <p>Your registration request has been approved by the Project Admin. You now have full access to log in and participate in projects.</p>
  <div style="margin-top: 20px;">
    <a href="${this.frontendUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log In Now</a>
  </div>
</div>
`;
    return this.sendMail({ to: details.registrantEmail, subject, text, html });
  }
}
