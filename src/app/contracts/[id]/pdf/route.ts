import { generateSignedPdf, PdfGenerationError } from "@/lib/pdf";
import { getContractProof } from "@/lib/signed-document";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const proof = await getContractProof(id);
  if (!proof) {
    return Response.json({ error: "Contrat introuvable." }, { status: 404 });
  }

  try {
    const bytes = await generateSignedPdf(proof);
    const filename = `contrat-${id}-signe.pdf`;
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof PdfGenerationError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
