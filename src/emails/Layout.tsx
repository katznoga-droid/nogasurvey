import { Body, Container, Head, Html, Preview, Section, Text } from "@react-email/components";

export const brand = {
  orange: "#FF5C35",
  navy: "#213343",
  slate: "#516F90",
  canvas: "#F5F8FA",
  line: "#CBD6E2",
};

const font = "'Lexend Deca', 'Helvetica Neue', Helvetica, Arial, sans-serif";

export function EmailLayout({ preview, children }: { preview: string; children: React.ReactNode }) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: brand.canvas, fontFamily: font, margin: 0, padding: "32px 0" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto" }}>
          <Text style={{ fontSize: 20, fontWeight: 600, color: brand.navy, margin: "0 0 16px 8px" }}>
            <span style={{ color: brand.orange }}>●</span> NogaSurvey
          </Text>
          <Section
            style={{
              backgroundColor: "#ffffff",
              border: `1px solid ${brand.line}`,
              borderRadius: 8,
              padding: 32,
            }}
          >
            {children}
          </Section>
          <Text style={{ fontSize: 12, color: brand.slate, textAlign: "center", marginTop: 16 }}>
            Sent with care by NogaSurvey
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
