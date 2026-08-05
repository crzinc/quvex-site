"use server";

import { createServiceClient } from "@/lib/supabase/service";

interface QuizSubmission {
  answers: Record<string, string>;
  contact: { name: string; email: string; phone: string };
}

export async function submitQuiz(data: QuizSubmission) {
  const supabase = createServiceClient();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      name: data.contact.name,
      email: data.contact.email,
      phone: data.contact.phone,
      company: "",
      status: "lead",
      source: "Квиз",
      description: `Тип бизнеса: ${data.answers.business_type}\nПотребность: ${data.answers.needs}\nБюджет: ${data.answers.budget}\nСрок: ${data.answers.timeline}`,
      budget: data.answers.budget === "500-2000" ? 1000
        : data.answers.budget === "2000-5000" ? 3500
        : data.answers.budget === "5000-15000" ? 10000
        : 20000,
      quiz_results: {
        business_type: data.answers.business_type,
        needs: [data.answers.needs],
        budget: data.answers.budget,
        timeline: data.answers.timeline,
        has_website: true,
        contact: data.contact,
      },
    })
    .select()
    .single();

  if (clientError) {
    console.error("Quiz insert error:", clientError);
    return { error: "Не удалось отправить заявку" };
  }

  const { error: notifError } = await supabase.from("notifications").insert({
    title: "Новый лид с квиза",
    message: `${data.contact.name} — ${data.answers.needs}, бюджет ${data.answers.budget}`,
    type: "quiz",
    client_id: client.id,
  });

  if (notifError) {
    console.error("Notification insert error:", notifError);
  }

  return { success: true };
}
