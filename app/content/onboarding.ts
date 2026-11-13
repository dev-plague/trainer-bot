export const onboardingText = {
  preferredName: {
    title: "¿Cómo quieres que te llame?",
    subtitle:
      "Lo usaré en cada saludo y mensaje. Puede ser tu nombre, un apodo o como te sientas cómodo.",
    nameLabel: "Nombre preferido",
    namePlaceholder: "Ana, Ani, A…",
    addressLabel: "Forma de trato",
    addressHelp: "Solo cambia cómo te hablo en los textos. Puedes cambiarlo cuando quieras.",
    submit: "Continuar",
    options: {
      neutral: "Neutra",
      feminine: "Femenina",
      masculine: "Masculina",
    },
  },
  profile: {
    title: "Cuéntame un poco de ti",
    subtitle: "Uso estos datos para calcular tu IMC y ajustar el plan. El peso es opcional.",
    birthDateLabel: "Fecha de nacimiento",
    birthDateHelp: "Solo la uso para saber tu edad y calcular tu IMC.",
    birthDatePlaceholder: "Elegir fecha",
    heightLabel: "Estatura (cm)",
    heightPlaceholder: "170",
    weightLabel: "Peso (kg, opcional)",
    weightPlaceholder: "70",
    submit: "Continuar",
    ageNote: "Trainerbot es solo para mayores de 18 años.",
  },
  errors: {
    missingName: "Escribe el nombre que quieres que use.",
    longName: "Usa 40 caracteres o menos.",
    birthDateInvalid: "Escribe una fecha de nacimiento válida.",
    underage:
      "Por ahora Trainerbot solo acompaña a personas mayores de 18. No puedo guardar tu perfil ni generar un plan seguro para ti.",
    heightInvalid: "Escribe una estatura entre 120 y 250 cm.",
    weightInvalid: "Escribe un peso entre 30 y 300 kg, o déjalo vacío.",
  },
};
