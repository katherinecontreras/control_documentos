/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

function corsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(status: number, body: unknown, origin = "*") {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

serve(async (req) => {
  const origin = req.headers.get("origin") || "*";

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" }, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
  const resendFrom = Deno.env.get("RESEND_FROM") || "";

  if (!supabaseUrl || !serviceKey) {
    return json(
      500,
      { error: "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno." },
      origin,
    );
  }
  if (!resendApiKey || !resendFrom) {
    return json(
      500,
      { error: "Faltan RESEND_API_KEY o RESEND_FROM en el entorno." },
      origin,
    );
  }

  const authHeader = req.headers.get("authorization") || "";
  const jwt = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7)
    : "";
  if (!jwt) return json(401, { error: "No autorizado." }, origin);

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Verificar caller (debe estar autenticado y ser Admin)
  const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(jwt);
  if (authErr || !authData?.user?.email) {
    return json(401, { error: "Token inválido." }, origin);
  }

  const callerEmail = authData.user.email;
  const { data: callerRow, error: callerErr } = await supabaseAdmin
    .from("usuarios")
    .select("id_usuario, roles(nombre_rol)")
    .eq("email_empresa", callerEmail)
    .maybeSingle();

  if (callerErr) return json(500, { error: callerErr.message }, origin);

  const roleName = String(callerRow?.roles?.nombre_rol || "").toLowerCase();
  const isAdmin = roleName.includes("admin"); // "Administrador"
  if (!isAdmin) return json(403, { error: "Permisos insuficientes." }, origin);

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Body inválido (JSON)." }, origin);
  }

  const to = String(body?.to || "").trim();
  const nombre = String(body?.nombre || "").trim();
  const apellido = String(body?.apellido || "").trim();
  const password = String(body?.password || "").trim();
  const siteUrl = String(body?.siteUrl || "").trim().replace(/\/+$/, "");

  if (!to) return json(400, { error: "Falta 'to'." }, origin);
  if (!siteUrl) return json(400, { error: "Falta 'siteUrl'." }, origin);
  if (!password) return json(400, { error: "Falta 'password'." }, origin);

  const safeNombre = escapeHtml(nombre);
  const safeApellido = escapeHtml(apellido);
  const safeEmail = escapeHtml(to);
  const safePassword = escapeHtml(password);
  const safeUrl = escapeHtml(siteUrl);

  const subject = "Cuenta creada - Control de Documentación";
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; line-height:1.5; color:#111;">
      <h2 style="margin:0 0 12px;">Tu cuenta fue creada</h2>
      <p style="margin:0 0 12px;">
        Hola ${safeNombre ? `<strong>${safeNombre}</strong>` : ""} ${
    safeApellido ? `<strong>${safeApellido}</strong>` : ""
  },
      </p>
      <p style="margin:0 0 12px;">
        Se creó una cuenta para vos en <strong>Control de Documentación</strong>.
      </p>
      <p style="margin:0 0 12px;">
        Podés ingresar en: <a href="${safeUrl}" target="_blank" rel="noreferrer">${safeUrl}</a>
      </p>
      <div style="padding:12px; border:1px solid #e5e7eb; border-radius:10px; background:#f9fafb; margin:0 0 12px;">
        <p style="margin:0 0 6px;"><strong>Email:</strong> ${safeEmail}</p>
        <p style="margin:0;"><strong>Contraseña:</strong> ${safePassword}</p>
      </div>
      <p style="margin:0 0 12px;">
        También podés usar el botón <strong>Ingresar con Google</strong> si tu email es Gmail.
      </p>
      <p style="margin:0; font-size:12px; color:#6b7280;">
        Si no solicitaste esta cuenta, podés ignorar este correo.
      </p>
    </div>
  `;

  const resendResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [to],
      subject,
      html,
    }),
  });

  if (!resendResp.ok) {
    const detail = await resendResp.text().catch(() => "");
    return json(
      502,
      { error: "No se pudo enviar el correo.", detail },
      origin,
    );
  }

  return json(200, { ok: true }, origin);
});

