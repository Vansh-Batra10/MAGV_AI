import type { TemplateModule } from "@invites/renderer";

export type TemplateId = "sheesh-mahal" | "rang-kahani" | "mohar";
export const TEMPLATE_IDS: TemplateId[] = ["sheesh-mahal", "rang-kahani", "mohar"];

/** Each template is its own chunk: a guest only ever downloads the template they were sent. */
export async function loadTemplate(id: string): Promise<TemplateModule> {
  switch (id) {
    case "sheesh-mahal":
      return (await import("@invites/template-sheesh-mahal")).default;
    case "rang-kahani":
      return (await import("@invites/template-rang-kahani")).default;
    case "mohar":
      return (await import("@invites/template-mohar")).default;
    default:
      throw new Error(`Unknown template ${id}`);
  }
}
