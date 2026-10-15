import { Img, Text } from "@react-email/components";
import { brand, EmailLayout } from "./Layout";

export function FollowUpEmail({
  name,
  positive,
  siteUrl,
}: {
  name: string;
  positive: boolean;
  siteUrl: string;
}) {
  const headline = positive ? "We love that you love us!" : "We are sad to hear that.";
  const gift = positive ? "Here are cookies!" : "Here is a cake!";
  const image = positive ? `${siteUrl}/email/cookies.jpg` : `${siteUrl}/email/cake.jpg`;

  return (
    <EmailLayout preview={headline}>
      <Text style={{ fontSize: 16, color: brand.slate, margin: "0 0 8px" }}>Hi {name},</Text>
      <Text style={{ fontSize: 24, fontWeight: 600, color: brand.navy, margin: "0 0 8px" }}>{headline}</Text>
      <Text style={{ fontSize: 18, color: brand.navy, margin: "0 0 24px" }}>{gift}</Text>
      <Img
        src={image}
        alt={positive ? "A plate of cookies" : "A slice of cake"}
        width="496"
        style={{ width: "100%", maxWidth: 496, height: "auto", borderRadius: 8 }}
      />
    </EmailLayout>
  );
}
