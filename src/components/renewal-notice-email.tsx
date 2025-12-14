import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Row,
  Column,
} from '@react-email/components';

interface RenewalNoticeEmailProps {
  firstName: string;
  expiringStudents: Array<{
    username: string;
    expiryDate: number;
    courseName?: string;
    coursePrice?: number;
  }>;
}

export function RenewalNoticeEmail({
  firstName,
  expiringStudents,
}: RenewalNoticeEmailProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={heading}>Renewal Notice</Heading>
          </Section>
          
          <Section style={content}>
            <Text style={paragraph}>
              Dear {firstName},
            </Text>
            
            <Text style={paragraph}>
              This is a friendly reminder that {expiringStudents.length === 1 ? 'your student account is' : `${expiringStudents.length} of your student accounts are`} set to expire in approximately 1 month.
            </Text>

            <Section style={studentDetails}>
              <Text style={label}>Expiring Students:</Text>
              {expiringStudents.map((student, index) => (
                <Section key={index} style={studentItem}>
                  <Row>
                    <Column>
                      <Text style={detailLabel}>Username:</Text>
                    </Column>
                    <Column>
                      <Text style={detailValue}>{student.username}</Text>
                    </Column>
                  </Row>
                  <Row>
                    <Column>
                      <Text style={detailLabel}>Expiry Date:</Text>
                    </Column>
                    <Column>
                      <Text style={detailValue}>{formatDate(student.expiryDate)}</Text>
                    </Column>
                  </Row>
                  {student.courseName && (
                    <Row>
                      <Column>
                        <Text style={detailLabel}>Course:</Text>
                      </Column>
                      <Column>
                        <Text style={detailValue}>{student.courseName}</Text>
                      </Column>
                    </Row>
                  )}
                  {student.coursePrice && (
                    <Row>
                      <Column>
                        <Text style={detailLabel}>Renewal Price:</Text>
                      </Column>
                      <Column>
                        <Text style={detailValue}>{formatCurrency(student.coursePrice)}</Text>
                      </Column>
                    </Row>
                  )}
                  {index < expiringStudents.length - 1 && <Hr style={itemHr} />}
                </Section>
              ))}
            </Section>

            <Text style={paragraph}>
              To ensure uninterrupted access to your student accounts, please renew before the expiry date. You can renew your students through your dashboard.
            </Text>

            <Text style={paragraph}>
              If you have any questions or need assistance with the renewal process, please don&apos;t hesitate to contact our support team.
            </Text>

            <Text style={paragraph}>
              Best regards,<br />
              Raz-Japan Team
            </Text>
          </Section>

          <Hr style={hr} />
          
          <Section style={footer}>
            <Text style={footerText}>
              This is an automated renewal notice. Please do not reply to this message.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 24px',
  backgroundColor: '#1a1a1a',
  borderRadius: '8px 8px 0 0',
};

const heading = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0',
  textAlign: 'center' as const,
};

const content = {
  padding: '24px',
};

const paragraph = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const studentDetails = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const label = {
  color: '#333333',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const studentItem = {
  margin: '16px 0',
};

const detailLabel = {
  color: '#666666',
  fontSize: '14px',
  margin: '8px 0',
  fontWeight: '500',
};

const detailValue = {
  color: '#333333',
  fontSize: '14px',
  margin: '8px 0',
  fontWeight: '600',
};

const itemHr = {
  borderColor: '#e6ebf1',
  margin: '16px 0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
};

const footer = {
  padding: '0 24px',
};

const footerText = {
  color: '#999999',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0',
  textAlign: 'center' as const,
};
