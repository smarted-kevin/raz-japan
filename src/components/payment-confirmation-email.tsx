import * as React from "react";
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
  Link,
} from "@react-email/components";

interface PaymentConfirmationEmailProps {
  firstName: string;
  orderId: string;
  totalAmount: number;
  currency?: string;
  orderDate?: string;
  students: Array<{
    classroomName?: string;
    username: string;
    password: string;
    expiryDate?: number;
  }>;
}

export function PaymentConfirmationEmail({
  firstName,
  orderId,
  totalAmount,
  currency = "JPY",
  orderDate,
  students,
}: PaymentConfirmationEmailProps) {
  const formattedAmount = new Intl.NumberFormat("ja-JP", {
    style: "currency",
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
            <Text style={paragraph}>Dear {firstName},</Text>

            <Text style={paragraph}>
              Thank you for your payment! We have successfully processed your
              order.
            </Text>

            <Section style={orderDetails}>
              <Text style={label}>Order Details:</Text>
              <Row style={orderRow}>
                <Column width="40%">
                  <Text style={detailLabel}>Order ID:</Text>
                </Column>
                <Column width="60%" align="left">
                  <Text style={detailValue}>{orderId}</Text>
                </Column>
              </Row>
              <Row style={orderRow}>
                <Column width="40%">
                  <Text style={detailLabel}>Total Amount:</Text>
                </Column>
                <Column width="60%" align="left">
                  <Text style={detailValue}>{formattedAmount}</Text>
                </Column>
              </Row>
              {orderDate && (
                <Row style={orderRow}>
                  <Column width="40%">
                    <Text style={detailLabel}>Order Date:</Text>
                  </Column>
                  <Column width="60%" align="left">
                    <Text style={detailValue}>{orderDate}</Text>
                  </Column>
                </Row>
              )}
            </Section>

            <Text style={paragraph}>
              Your students have been activated and are ready to use. If you
              have any questions or need assistance, please don&apos;t hesitate
              to contact our support team.
            </Text>

            <Heading as="h2" style={sectionHeading}>
              生徒アカウント情報 / Student Account Details
            </Heading>
            {students.map((student, index) => (
              <Section key={index} style={orderDetails}>
                {[
                  [
                    "クラス名 / Classroom name",
                    student.classroomName ?? "未設定 / Not available",
                  ],
                  ["ユーザー名 / Student Username", student.username],
                  ["パスワード / Student Password", student.password],
                  [
                    "有効期限 / Expiry Date",
                    student.expiryDate === undefined
                      ? "未設定 / Not available"
                      : new Intl.DateTimeFormat("ja-JP", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          timeZone: "Asia/Tokyo",
                        }).format(student.expiryDate),
                  ],
                ].map(([label, value]) => (
                  <Text key={label} style={paragraph}>
                    <span style={detailLabel}>{label}</span>
                    <br />
                    <span style={credentialValue}>{value}</span>
                  </Text>
                ))}
              </Section>
            ))}

            <Section lang="ja">
              <Heading as="h2" style={sectionHeading}>
                ご利用開始の手順
              </Heading>
              <ol style={steps}>
                <li style={step}>
                  {" "}
                  <Link href="https://kidsa-z.com">
                    https://kidsa-z.com
                  </Link>{" "}
                  にアクセスするか、Apple（iPhone・iPad）またはAndroid端末にKids
                  A-Zアプリをダウンロードします。
                </li>
                <li style={step}>
                  「Enter your teacher&apos;s
                  username」の欄に、上記のクラス名を入力します。
                </li>
                <li style={step}>
                  お子さまのユーザー名が表示されているアイコンを選択します。
                </li>
                <li style={step}>上記の生徒用パスワードを入力します。</li>
                <li style={step}>さあ、楽しく学習を始めましょう！</li>
              </ol>
            </Section>

            <Section lang="en">
              <Heading as="h2" style={sectionHeading}>
                How to Get Started
              </Heading>
              <ol style={steps}>
                <li style={step}>
                  Visit{" "}
                  <Link href="https://kidsa-z.com">https://kidsa-z.com</Link> or
                  download the Kids A-Z app for Apple and Android devices.
                </li>
                <li style={step}>
                  Enter your classroom name in the &quot;Enter your
                  teacher&apos;s username&quot; field.
                </li>
                <li style={step}>
                  Click the icon with your student&apos;s username.
                </li>
                <li style={step}>Enter the student password.</li>
                <li style={step}>Enjoy!</li>
              </ol>
            </Section>

            <Text style={paragraph}>
              Best regards,
              <br />
              Raz-Plus Japan Team
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              This is an automated confirmation email. Please do not reply to
              this message.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "32px 24px",
  backgroundColor: "#1a1a1a",
  borderRadius: "8px 8px 0 0",
};

const heading = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "600",
  margin: "0",
  textAlign: "center" as const,
};

const content = {
  padding: "24px",
};

const paragraph = {
  color: "#333333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const orderDetails = {
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const orderRow = {
  tableLayout: "fixed" as const,
};

const label = {
  color: "#333333",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 16px",
};

const detailLabel = {
  color: "#666666",
  fontSize: "14px",
  margin: "8px 0",
  fontWeight: "500",
};

const detailValue = {
  color: "#333333",
  fontSize: "14px",
  margin: "8px 0",
  fontWeight: "600",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "32px 0",
};

const footer = {
  padding: "0 24px",
};

const footerText = {
  color: "#999999",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "0",
  textAlign: "center" as const,
};

const sectionHeading = {
  color: "#333333",
  fontSize: "20px",
  lineHeight: "28px",
  margin: "24px 0 16px",
};

const credentialValue = {
  ...detailValue,
  overflowWrap: "anywhere" as const,
};

const steps = {
  ...paragraph,
  paddingLeft: "24px",
};

const step = {
  marginBottom: "12px",
};
