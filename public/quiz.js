document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.querySelector('.start-quiz');
  const nextButton = document.querySelector('.next-question');
  const questionsContainer = document.querySelector('.questions-container');
  const questionsElement = document.querySelector('.questions');
  const answersElement = document.querySelector('.answers-container');
  const resultContainer = document.querySelector('.result-container');
  const resultMessage = document.querySelector('.result-message');
  const scoreMessage = document.querySelector('.score-message');
  
  let currentQuestionIndex = 0;
  let score = 0;
  let quizData = [];

  // Função para carregar o quiz do servidor
  async function loadQuiz() {
    const minigameId = window.location.pathname.split('/').pop(); // Pega o ID do minigame da URL
    try {
      const response = await fetch(`/quiz/${minigameId}`);
      const data = await response.json();

      // Armazena os dados do quiz
      quizData = data.quiz;
      
      // Esconde o botão de início e mostra o container de perguntas
      startButton.classList.add('hide');
      questionsContainer.classList.remove('hide');
      showQuestion();
    } catch (error) {
      console.error('Erro ao carregar quiz:', error);
    }
  }

  // Função para exibir a pergunta atual
  function showQuestion() {
    const currentQuestion = quizData[currentQuestionIndex];
    
    // Exibe a pergunta
    questionsElement.textContent = currentQuestion.texto;
    answersElement.innerHTML = ''; // Limpa as alternativas

    // Exibe as alternativas
    currentQuestion.alternativas.forEach(alternativa => {
      const answerButton = document.createElement('button');
      answerButton.textContent = alternativa.texto;
      answerButton.classList.add('answer-button');
      
      // Atribui a função para verificar se a resposta está correta
      answerButton.onclick = () => checkAnswer(alternativa);
      answersElement.appendChild(answerButton);
    });
  }

  // Função para verificar a resposta
  function checkAnswer(selectedAlternative) {
    const currentQuestion = quizData[currentQuestionIndex];
    const isCorrect = selectedAlternative.correta;

    // Desabilita os botões de resposta após a escolha
    const answerButtons = document.querySelectorAll('.answer-button');
    answerButtons.forEach(button => button.disabled = true);

    // Verifica se a resposta está correta ou não
    if (isCorrect) {
      score++;
      resultMessage.textContent = 'Resposta correta!';
    } else {
      resultMessage.textContent = 'Resposta errada!';
    }

    // Exibe a pontuação
    scoreMessage.textContent = `Pontuação: ${score}`;

    // Exibe o botão para próxima pergunta
    nextButton.classList.remove('hide');
  }

  // Função para avançar para a próxima pergunta
  function nextQuestion() {
    currentQuestionIndex++;

    if (currentQuestionIndex < quizData.length) {
      showQuestion();
      nextButton.classList.add('hide');
    } else {
      resultContainer.classList.remove('hide');
      resultMessage.textContent = `Fim do Quiz!`;
      scoreMessage.textContent = `Você acertou ${score} de ${quizData.length} perguntas.`;
    }
  }

  // Função para iniciar o quiz
  startButton.addEventListener('click', loadQuiz);

  // Função para avançar para a próxima pergunta
  nextButton.addEventListener('click', nextQuestion);
});
