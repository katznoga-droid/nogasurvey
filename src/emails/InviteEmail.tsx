import { Button, Link, Text } from "@react-email/components";
import { brand, EmailLayout } from "./Layout";

export function InviteEmail({ name, surveyUrl }: { name: string; surveyUrl: string }) {
  return (
    <EmailLayout preview="We would love your opinion.">
      <Text style={{ fontSize: 16, color: brand.slate, margin: "0 0 8px" }}>Hi {name},</Text>
      <Text style={{ fontSize: 24, fontWeight: 600, color: brand.navy, margin: "0 0 12px" }}>
        We would love your opinion.
      </Text>
      <Text style={{ fontSize: 16, color: brand.navy, lineHeight: "24px", margin: "0 0 24px" }}>
        <Link href={surveyUrl} style={{ color: brand.orange, fontWeight: 600 }}>
          Click here
        </Link>{" "}
        to submit your feedback.
      </Text>
      <Button
        href={surveyUrl}
        style={{
          backgroundColor: brand.orange,
          color: "#ffffff",
          borderRadius: 6,
          padding: "12px 24px",
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        Submit your feedback
      </Button>
    </EmailLayout>
  );
}
