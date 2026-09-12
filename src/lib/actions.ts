"use server";

import { createServiceClient } from "@/lib/supabase/service";

interface QuizSubmission {
  answers: Record<string, string>;
  contact: { name: string; email: string; phone: string };
  consent?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitQuiz(data: QuizSubmission) {
  const supabase = createServiceClient();

  const name = data.contact.name?.trim() || "";
  const email = data.contact.email?.trim() || "";
  const phone = data.contact.phone?.trim() || "";
  if (!name || !EMAIL_RE.test(email)) {
    return { error: "Заполните имя и корректный email" };
  }
  if (!data.consent) {
    return { error: "Подтвердите согласие на обработку данных" };
  }

  const allowedBusiness = ["detailing", "wash", "polishing", "interior", "tinting", "other"];
  const allowedPosts = ["1", "2-3", "4-6", "7plus", "chain", "planning"];
  const allowedBudget = ["0-100", "100-300", "300-600", "600plus"];
  const allowedTimeline = ["asap", "month", "quarter", "exploring"];
  const business = allowedBusiness.includes(data.answers.business_type) ? data.answers.business_type : "other";
  const needs = allowedPosts.includes(data.answers.needs) ? data.answers.needs : "planning";
  const budgetKey = allowedBudget.includes(data.answers.budget) ? data.answers.budget : "0-100";
  const timeline = allowedTimeline.includes(data.answers.timeline) ? data.answers.timeline : "exploring";

  const budgetValue =
    budgetKey === "0-100" ? 50
    : budgetKey === "100-300" ? 200
    : budgetKey === "300-600" ? 450
    : 800;

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      name,
      email,
      phone,
      company: "",
      status: "lead",
      source: "quiz",
      description: `Тип бизнеса: ${business}\nПосты: ${needs}\nБюджет: ${budgetKey}\nСрок: ${timeline}`,
      budget: budgetValue,
      quiz_results: {
        business_type: business,
        needs: [needs],
        budget: budgetKey,
        timeline,
        contact: { name, email, phone },
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
    message: `${name} — ${needs}, бюджет ${budgetKey} ₼/мес`,
    type: "quiz",
    client_id: client.id,
  });

  if (notifError) {
    console.error("Notification insert error:", notifError);
  }

  return { success: true };
}

interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function submitContact(data: ContactSubmission) {
  const supabase = createServiceClient();
  const name = data.name?.trim() || "";
  const email = data.email?.trim() || "";
  const subject = data.subject?.trim() || "";
  const message = data.message?.trim() || "";
  if (!name || !EMAIL_RE.test(email) || !message) {
    return { error: "Заполните имя, корректный email и сообщение" };
  }
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      name,
      email,
      phone: "",
      company: "",
      status: "lead",
      source: "contact_form",
      description: subject ? `${subject}\n${message}` : message,
      budget: 0,
      quiz_results: { source: "contact_form", subject },
    })
    .select()
    .single();
  if (clientError) {
    console.error("Contact insert error:", clientError);
    return { error: "Не удалось отправить сообщение" };
  }
  await supabase.from("notifications").insert({
    title: "Сообщение с формы контактов",
    message: `${name} (${email}): ${subject || message.slice(0, 120)}`,
    type: "client",
    client_id: client.id,
  });
  return { success: true };
}
