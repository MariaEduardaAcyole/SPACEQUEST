let questions = [];

document.addEventListener("DOMContentLoaded", async () => {
  const minigameId = 15; // Troque pelo ID real do minigame

  try {
    const response = await fetch(`/quiz-perguntas/${minigameId}`);
    if (!response.ok) throw new Error("Erro ao buscar perguntas");

    questions = await response.json();
  } catch (error) {
    console.error("Erro ao carregar o quiz:", error.message);
    alert("Falha ao carregar o quiz. Tente novamente mais tarde.");
  }
});
