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

interface PaymentConfirmationEmailProps {
  firstName: string;
  orderId: string;
  totalAmount: number;
  currency?: string;
  orderDate?: string;
}

export function PaymentConfirmationEmail({
  firstName,
  orderId,
  totalAmount,
  currency = 'JPY',
  orderDate,
}: PaymentConfirmationEmailProps) {
  const formattedAmount = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currency,
  }).format(totalAmount);

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={heading}>Payment Confirmed</Heading>
          </Section>
          
          <Section style={content}>
            <Text style={paragraph}>
              Dear {firstName},
            </Text>
            
            <Text style={paragraph}>
              Thank you for your payment! We have successfully processed your order.
            </Text>

            <Section style={orderDetails}>
              <Text style={label}>Order Details:</Text>
              <Row>
                <Column>
                  <Text style={detailLabel}>Order ID:</Text>
                </Column>
                <Column>
                  <Text style={detailValue}>{orderId}</Text>
                </Column>
              </Row>
              <Row>
                <Column>
                  <Text style={detailLabel}>Total Amount:</Text>
                </Column>
                <Column>
                  <Text style={detailValue}>{formattedAmount}</Text>
                </Column>
              </Row>
              {orderDate && (
                <Row>
                  <Column>
                    <Text style={detailLabel}>Order Date:</Text>
                  </Column>
                  <Column>
                    <Text style={detailValue}>{orderDate}</Text>
                  </Column>
                </Row>
              )}
            </Section>

            <Text style={paragraph}>
              Your students have been activated and are ready to use. If you have any questions or need assistance, please don&apos;t hesitate to contact our support team.
            </Text>

            <Text style={paragraph}>
              Best regards,<br />
              Raz-Japan Team
            </Text>
          </Section>

          <Hr style={hr} />
          
          <Section style={footer}>
            <Text style={footerText}>
              This is an automated confirmation email. Please do not reply to this message.
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

const orderDetails = {
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

