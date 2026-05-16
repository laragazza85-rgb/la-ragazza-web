import { createServiceSupabaseClient } from "../lib/supabase.mjs";

const REQUEST_SELECT = `
  id,
  user_id,
  requested_role,
  justification,
  status,
  created_at,
  updated_at
`;

function mapRequest(row, requesterEmail = "") {
  if (!row) return null;

  return {
    ...row,
    requester_email: requesterEmail,
    is_active: row.status === "active" ? 1 : 0
  };
}

async function runQuery(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function enrichWithRequesterEmails(supabase, requests) {
  if (!requests.length) return [];

  const userIds = [...new Set(requests.map((request) => request.user_id))];
  const profiles = await runQuery(supabase.from("profiles").select("id,email").in("id", userIds));
  const emailByUserId = new Map(profiles.map((profile) => [profile.id, profile.email]));

  return requests.map((request) => mapRequest(request, emailByUserId.get(request.user_id) ?? ""));
}

export const roleRequestRepository = {
  async create(supabase, { userId, requestedRole, justification }) {
    const data = await runQuery(
      supabase
        .from("role_change_requests")
        .insert({ user_id: userId, requested_role: requestedRole, justification, status: "active" })
        .select(REQUEST_SELECT)
        .single()
    );

    const requesterEmail = await this.findRequesterEmail(supabase, data.user_id);
    return mapRequest(data, requesterEmail);
  },

  async listAll(supabase) {
    const data = await runQuery(supabase.from("role_change_requests").select(REQUEST_SELECT).order("created_at", {
      ascending: false
    }));

    return enrichWithRequesterEmails(supabase, data);
  },

  async listByUser(supabase, userId) {
    const data = await runQuery(
      supabase.from("role_change_requests").select(REQUEST_SELECT).eq("user_id", userId).order("created_at", {
        ascending: false
      })
    );

    return enrichWithRequesterEmails(supabase, data);
  },

  async findById(supabase, id) {
    const data = await runQuery(supabase.from("role_change_requests").select(REQUEST_SELECT).eq("id", id).maybeSingle());
    if (!data) return null;

    const requesterEmail = await this.findRequesterEmail(supabase, data.user_id);
    return mapRequest(data, requesterEmail);
  },

  async update(supabase, id, { requestedRole, justification }) {
    const data = await runQuery(
      supabase
        .from("role_change_requests")
        .update({ requested_role: requestedRole, justification })
        .eq("id", id)
        .select(REQUEST_SELECT)
        .single()
    );

    const requesterEmail = await this.findRequesterEmail(supabase, data.user_id);
    return mapRequest(data, requesterEmail);
  },

  async updateStatus(supabase, id, status) {
    const data = await runQuery(
      supabase
        .from("role_change_requests")
        .update({ status })
        .eq("id", id)
        .select(REQUEST_SELECT)
        .single()
    );

    const requesterEmail = await this.findRequesterEmail(supabase, data.user_id);
    return mapRequest(data, requesterEmail);
  },

  async applyApprovedRole(supabase, userId, role) {
    console.log(`[roleRequestRepository] applyApprovedRole -> user=${userId} role=${role}`);

    // First attempt: use the provided supabase client (admin user's token)
    try {
      const { data, error } = await supabase.from("profiles").update({ role }).eq("id", userId).select("id,role").maybeSingle();
      if (error) throw error;
      console.log("[roleRequestRepository] applyApprovedRole result (user token):", data);
      return data;
    } catch (err) {
      console.warn("[roleRequestRepository] applyApprovedRole failed with user token:", err?.message ?? err);

      try {
        const service = createServiceSupabaseClient();
        const { data: svcData, error: svcError } = await service
          .from("profiles")
          .update({ role })
          .eq("id", userId)
          .select("id,role")
          .maybeSingle();

        if (svcError) throw svcError;
        console.log("[roleRequestRepository] applyApprovedRole result (service key):", svcData);
        return svcData;
      } catch (svcErr) {
        console.error("[roleRequestRepository] applyApprovedRole failed with service key retry:", svcErr?.message ?? svcErr);
        // Re-throw the original error for upstream handling
        throw err;
      }
    }
  },

  async remove(supabase, id) {
    const { error } = await supabase.from("role_change_requests").delete().eq("id", id);
    if (error) throw error;
  },

  async findRequesterEmail(supabase, userId) {
    const { data, error } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle();
    if (error) throw error;
    return data?.email ?? "";
  }
};

