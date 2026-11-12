import type { ParqQuestionId } from "~/features/onboarding/domain/parq";

export const healthText = {
  title: "Antes de entrenar, unas preguntas",
  subtitle:
    "Es el cuestionario PAR-Q. Si respondes «sí» a alguna, te pediré hablar con un médico antes de seguir.",
  yes: "Sí",
  no: "No",
  questions: {
    heart_condition:
      "¿Un médico te ha dicho que tienes un problema del corazón y que solo puedes hacer actividad física bajo supervisión?",
    chest_pain: "¿Sientes dolor en el pecho cuando haces actividad física?",
    dizziness:
      "¿Has perdido el equilibrio por mareos o has perdido el conocimiento en el último año?",
    bone_joint:
      "¿Tienes algún problema en huesos o articulaciones que pueda empeorar con el ejercicio?",
    blood_pressure_meds: "¿Tomas medicamentos para la tensión arterial o para el corazón?",
    pregnancy: "¿Tienes un embarazo en curso o has dado a luz en los últimos seis meses?",
    other_reason: "¿Hay otra razón por la que no deberías hacer actividad física?",
  } satisfies Record<ParqQuestionId, string>,
  submit: "Guardar respuestas",
  sourceNote: "Basado en el PAR-Q. No sustituye la valoración de un profesional de la salud.",
  errors: {
    incomplete: "Responde todas las preguntas antes de continuar.",
  },
  result: {
    title: "Habla con un médico antes de empezar",
    body: "Alguna de tus respuestas indica que conviene una valoración médica antes de entrenar. Trainerbot no es médico ni fisioterapeuta: pide una cita, cuéntale que quieres empezar un plan y vuelve cuando te dé el visto bueno.",
    saved: "Tus respuestas quedaron guardadas.",
    account: "Ir a mi cuenta",
  },
};
