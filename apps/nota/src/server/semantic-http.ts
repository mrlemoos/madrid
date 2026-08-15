import 'server-only';
import { notaServerExposeErrorDetails } from './nota-server-error-detail.server';

export function isSemanticConfigurationError(message: string): boolean {
  return (
    message.includes('SUPABASE_URL') ||
    message.includes('SUPABASE_SECRET_KEY') ||
    message.includes('SUPABASE_SERVICE_ROLE_KEY') ||
    message.includes('NOTA_SEMANTIC_EMBEDDINGS_API_KEY')
  );
}

/** JSON error, attaching `detail` only when debug details are enabled. */
export function semanticJsonError(
  base: Record<string, unknown>,
  detail: string | undefined,
  status: number,
): Response {
  if (detail && notaServerExposeErrorDetails()) {
    return Response.json({ ...base, detail }, { status });
  }
  return Response.json(base, { status });
}
