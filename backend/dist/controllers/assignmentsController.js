import { supabase } from "../lib/supabase.js";
export async function createAssignment(req, res) {
    const { assignedToEmail, documentId, documentTitle } = req.body;
    if (!assignedToEmail || !documentId || !documentTitle) {
        res.status(400).json({ error: "assignedToEmail, documentId et documentTitle requis" });
        return;
    }
    const { data: target, error: userErr } = await supabase
        .from("users")
        .select("id")
        .eq("email", assignedToEmail.trim().toLowerCase())
        .single();
    if (userErr || !target) {
        res.status(404).json({ error: "Utilisateur destinataire introuvable" });
        return;
    }
    const { data, error } = await supabase
        .from("document_assignments")
        .insert({
        user_id: target.id,
        document_id: documentId,
        document_title: documentTitle,
        assigned_by: req.user.userId,
    })
        .select()
        .single();
    if (error) {
        console.error("createAssignment error:", error);
        res.status(500).json({ error: "Erreur lors de l'attribution" });
        return;
    }
    res.status(201).json({ assignment: data });
}
export async function listAssignments(req, res) {
    const { data, error } = await supabase
        .from("document_assignments")
        .select(`
      id,
      document_id,
      document_title,
      assigned_at,
      users!document_assignments_user_id_fkey ( email, display_name )
    `)
        .eq("assigned_by", req.user.userId)
        .order("assigned_at", { ascending: false });
    if (error) {
        console.error("listAssignments error:", error);
        res.status(500).json({ error: "Erreur lors de la récupération des attributions" });
        return;
    }
    res.json({ assignments: data });
}
