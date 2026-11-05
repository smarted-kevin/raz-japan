import { Body, Container, Head, Html, Text } from "@react-email/components";

interface OrderNotificationEmailProps {
  orderNumber: string;
  totalAmount: number;
  customerEmail: string;
}

export function OrderNotificationEmail({
  orderNumber,
  totalAmount,
  customerEmail,
}: OrderNotificationEmailProps) {
  const amount = new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(totalAmount);

  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Text>Order#: {orderNumber}</Text>
          <Text>Amount of purchase: {amount}</Text>
          <Text>Customer email: {customerEmail}</Text>
        </Container>
      </Body>
    </Html>
  );
}
