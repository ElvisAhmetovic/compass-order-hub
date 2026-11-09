const esc = (v: unknown) => String(v ?? "N/A").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/** Admin notice that a client changed their password. Never contains the password. */
export function passwordChangeEmail(input: { userEmail?: string; userName?: string; companyName?: string }) {
  return {
    subject: `Client Password Changed - ${input.companyName || "Unknown Company"}`,
    html: `
      <h2>Client Password Changed</h2>
      <p><strong>User:</strong> ${esc(input.userName)}</p>
      <p><strong>Email:</strong> ${esc(input.userEmail)}</p>
      <p><strong>Company:</strong> ${esc(input.companyName)}</p>
      <p>The client changed their portal password. For security, the password itself is never sent by email.</p>
      <hr/>
      <p style="color:#888;font-size:12px;">This is an automated notification from the client portal.</p>
    `,
  };
}
