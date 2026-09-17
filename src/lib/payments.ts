const PROOF_BUCKET = "bukti-pembayaran";

/** Public URL untuk object bukti; null jika belum ada bukti. */
export function getProofUrl(proofObject: string | null | undefined): string | null {
  if (!proofObject) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${PROOF_BUCKET}/${proofObject}`;
}

/**
 * Cicilan = pembayaran parsial terhadap nominal tagihan.
 * Dipakai untuk menandai pembayaran yang belum melunasi tagihan penuh.
 */
export function isInstallment(amount: number, billAmount: number): boolean {
  return billAmount > 0 && amount > 0 && amount < billAmount;
}