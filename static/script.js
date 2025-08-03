document.addEventListener("DOMContentLoaded", () => {
  const textDisplay = document.getElementById("text-display");
  const userInput = document.getElementById("user-input");
  const startButton = document.getElementById("start-button");
  const resetButton = document.getElementById("reset-button");
  const nextParagraphButton = document.getElementById("next-paragraph-button");
  const wpmSpan = document.getElementById("wpm");
  const accuracySpan = document.getElementById("accuracy");
  const timeLeftSpan = document.getElementById("time-left");

  let testText = "";
  let startTime;
  let timerInterval;
  const testDuration = 300; // 5 minutes in seconds (5 * 60)
  let timeLeft = testDuration;
  let charTypedCount = 0;
  let correctCharCount = 0;
  let testStarted = false;

  async function fetchNewText() {
    textDisplay.textContent = "Loading new paragraph...";
    userInput.disabled = true;
    startButton.disabled = true;
    nextParagraphButton.style.display = "none";
    try {
      const response = await fetch("/get_text");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      testText = data.text;
      displayTestText();
      resetTestState();
      userInput.disabled = false;
      startButton.disabled = false;
      userInput.focus();
      startButton.style.display = "inline-block";
      resetButton.style.display = "none";
      wpmSpan.textContent = "0";
      accuracySpan.textContent = "100%";
    } catch (error) {
      console.error("Error fetching text:", error);
      textDisplay.textContent =
        "Failed to load paragraph. Please ensure PDF is processed.";
      userInput.disabled = true;
      startButton.disabled = true;
    }
  }

  function displayTestText() {
    textDisplay.innerHTML = "";
    testText.split("").forEach((char) => {
      const span = document.createElement("span");
      span.textContent = char;
      textDisplay.appendChild(span);
    });
    updateTextHighlighting();
  }

  function updateTextHighlighting() {
    const inputChars = userInput.value;
    const textSpans = textDisplay.querySelectorAll("span");

    textSpans.forEach((span, index) => {
      span.classList.remove("correct-char", "incorrect-char", "current-char");

      if (index < inputChars.length) {
        if (inputChars[index] === testText[index]) {
          span.classList.add("correct-char");
        } else {
          span.classList.add("incorrect-char");
        }
      } else if (index === inputChars.length && testStarted) {
        span.classList.add("current-char");
      }
    });

    if (textSpans.length > 0 && inputChars.length < textSpans.length) {
      const currentCharSpan = textSpans[inputChars.length];
      const displayRect = textDisplay.getBoundingClientRect();
      const charRect = currentCharSpan.getBoundingClientRect();

      if (charRect.bottom > displayRect.bottom) {
        textDisplay.scrollTop += charRect.bottom - displayRect.bottom + 10;
      } else if (charRect.top < displayRect.top) {
        textDisplay.scrollTop -= displayRect.top - charRect.top + 10;
      }
    }
  }

  function calculateWPM() {
    const correctTypedSection = userInput.value.substring(0, correctCharCount);
    const words = correctTypedSection
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

    const elapsedTime = (new Date().getTime() - startTime) / 1000;
    if (elapsedTime > 0) {
      const minutes = elapsedTime / 60;
      return Math.round(words / minutes);
    }
    return 0;
  }

  function calculateAccuracy() {
    if (charTypedCount === 0) return 100;
    return Math.round((correctCharCount / charTypedCount) * 100);
  }

  function startTimer() {
    timeLeft = testDuration;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        endTest();
      }
      wpmSpan.textContent = calculateWPM();
      accuracySpan.textContent = `${calculateAccuracy()}%`;
    }, 1000);
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timeLeftSpan.textContent = `${minutes}m ${seconds
      .toString()
      .padStart(2, "0")}s`;
  }

  function startTest() {
    if (testStarted) return;
    testStarted = true;
    userInput.disabled = false;
    userInput.value = "";
    userInput.focus();
    startButton.style.display = "none";
    resetButton.style.display = "inline-block";
    nextParagraphButton.style.display = "none";

    startTime = new Date().getTime();
    charTypedCount = 0;
    correctCharCount = 0;
    wpmSpan.textContent = 0;
    accuracySpan.textContent = "100%";

    startTimer();
    updateTextHighlighting();
  }

  function endTest() {
    testStarted = false;
    clearInterval(timerInterval);
    userInput.disabled = true;

    wpmSpan.textContent = "Completed!";
    accuracySpan.textContent = `${calculateAccuracy()}%`;

    startButton.style.display = "none";
    resetButton.style.display = "none";
    nextParagraphButton.style.display = "inline-block";
    alert("Test ended!");

    // Add this line to apply the celebration style
    document.body.classList.add("test-completed");
  }

  function resetTestState() {
    clearInterval(timerInterval);
    testStarted = false;
    timeLeft = testDuration;
    updateTimerDisplay();
    userInput.value = "";
    userInput.disabled = true;
    wpmSpan.textContent = "0";
    accuracySpan.textContent = "100%";
    startButton.style.display = "inline-block";
    resetButton.style.display = "none";
    nextParagraphButton.style.display = "none";
    textDisplay.scrollTop = 0;

    // Add this line to remove the celebration style on reset
    document.body.classList.remove("test-completed");
  }

  userInput.addEventListener("input", () => {
    if (!testStarted) {
      startTest();
    }

    const typedText = userInput.value;
    charTypedCount = typedText.length;
    correctCharCount = 0;

    for (let i = 0; i < typedText.length; i++) {
      if (i < testText.length && typedText[i] === testText[i]) {
        correctCharCount++;
      }
    }
    updateTextHighlighting();

    if (typedText.length >= testText.length) {
      endTest();
      alert("Paragraph completed!");
    }
  });

  startButton.addEventListener("click", startTest);
  resetButton.addEventListener("click", () => {
    if (
      confirm(
        "Are you sure you want to reset the current test? This will load a new paragraph."
      )
    ) {
      resetTestState();
      fetchNewText();
    }
  });

  nextParagraphButton.addEventListener("click", () => {
    fetchNewText();
  });

  fetchNewText();
});
