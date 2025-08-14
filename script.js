// Thay thế 'YOUR_API_KEY' bằng API key của bạn
const API_KEY = 'AIzaSyBQF_QNBE4MVghEHLhHtfuzxWAPB5zRvLU';
const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// Lấy các phần tử DOM chung
const passageContainer = document.getElementById('passage-container');
const nextButton = document.getElementById('next-button');

// Lấy các phần tử DOM cho từng câu hỏi
const questionSections = [
    {
        questionText: document.getElementById('question-1-text'),
        userAnswerTextarea: document.getElementById('user-answer-1'),
        submitButton: document.getElementById('submit-button-1'),
        feedbackSection: document.getElementById('feedback-1-section'),
        correctSentences: document.getElementById('correct-sentences-1')
    },
    {
        questionText: document.getElementById('question-2-text'),
        userAnswerTextarea: document.getElementById('user-answer-2'),
        submitButton: document.getElementById('submit-button-2'),
        feedbackSection: document.getElementById('feedback-2-section'),
        correctSentences: document.getElementById('correct-sentences-2')
    },
    {
        questionText: document.getElementById('question-3-text'),
        userAnswerTextarea: document.getElementById('user-answer-3'),
        submitButton: document.getElementById('submit-button-3'),
        feedbackSection: document.getElementById('feedback-3-section'),
        correctSentences: document.getElementById('correct-sentences-3')
    },
    {
        questionText: document.getElementById('question-4-text'),
        userAnswerTextarea: document.getElementById('user-answer-4'),
        submitButton: document.getElementById('submit-button-4'),
        feedbackSection: document.getElementById('feedback-4-section'),
        correctSentences: document.getElementById('correct-sentences-4')
    }
];

let currentExercise = null;

// Hàm hiển thị thông báo lỗi trên giao diện
function displayError(message) {
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.textContent = message;
        return;
    }
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = message;
    errorMessage.style.color = 'red';
    errorMessage.style.marginBottom = '20px';
    passageContainer.parentElement.insertBefore(errorMessage, passageContainer);
}

// Hàm gọi API để tạo bài tập IELTS
async function generateIELTSExercise() {
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    try {
        const prompt = `
            Hãy tạo một bài đọc IELTS dài 300-400 từ về một chủ đề ngẫu nhiên, không phải về social media hay công nghệ.
            Bài đọc này phải bao gồm 4 loại câu hỏi:
            1. Một câu hỏi True/False/Not Given.
            2. Một câu hỏi Multiple Choice.
            3. Một câu hỏi Gap Filling.
            4. Một câu hỏi Heading Matching.

            Với mỗi câu hỏi, hãy cung cấp 1-2 câu trích từ bài đọc có chứa thông tin trả lời.
            
            Dữ liệu trả về phải là một đối tượng JSON với cấu trúc sau:
            {
              "passage": "Nội dung bài đọc ở định dạng HTML với các thẻ <p>...",
              "questions": [
                {
                  "type": "true/false/not given",
                  "questionText": "Câu hỏi True/False/Not Given...",
                  "sourceSentences": "1-2 câu chứa đáp án..."
                },
                {
                  "type": "multiple choice",
                  "questionText": "Câu hỏi Multiple Choice...",
                  "sourceSentences": "1-2 câu chứa đáp án..."
                },
                {
                  "type": "gap filling",
                  "questionText": "Câu hỏi Gap Filling...",
                  "sourceSentences": "1-2 câu chứa đáp án..."
                },
                {
                  "type": "heading matching",
                  "questionText": "Câu hỏi Heading Matching...",
                  "sourceSentences": "1-2 câu chứa đáp án..."
                }
              ]
            }
            
            Đảm bảo bài đọc đủ dài và các câu hỏi có tính học thuật, phù hợp với trình độ IELTS.
        `;

        const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API response error: ${response.status} - ${errorData.error.message}`);
        }

        const data = await response.json();
        
        if (!data || !data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts[0]) {
            throw new Error('Cấu trúc dữ liệu từ API không hợp lệ.');
        }

        const content = data.candidates[0].content.parts[0].text;
        const jsonString = content.replace(/```json\n|\n```/g, '');
        const exerciseData = JSON.parse(jsonString);
        
        return exerciseData;

    } catch (error) {
        console.error('Lỗi khi tạo bài đọc:', error);
        displayError(`Đã xảy ra lỗi khi tạo bài đọc: ${error.message}`);
        return null;
    }
}

// Hàm render bài tập lên giao diện
function renderExercise(exercise) {
    if (!exercise) {
        passageContainer.innerHTML = '';
        questionSections.forEach(section => {
            section.questionText.textContent = '';
            section.userAnswerTextarea.value = '';
            section.feedbackSection.style.display = 'none';
        });
        return;
    }
    
    passageContainer.innerHTML = `<h2>Reading Passage</h2>` + exercise.passage;
    
    exercise.questions.forEach((q, index) => {
        const section = questionSections[index];
        if (section) {
            section.questionText.innerHTML = q.questionText;
            section.userAnswerTextarea.value = '';
            section.feedbackSection.style.display = 'none';
            section.correctSentences.textContent = q.sourceSentences;
        }
    });
}

// Gắn sự kiện cho các nút "Nộp"
questionSections.forEach((section) => {
    section.submitButton.addEventListener('click', () => {
        if (!currentExercise) return;
        section.feedbackSection.style.display = 'block';
    });
});

// Hàm xử lý sự kiện khi ấn nút "Bài Mới"
nextButton.addEventListener('click', async () => {
    nextButton.disabled = true;
    passageContainer.innerHTML = 'Đang tạo bài tập...';
    
    // Ẩn tất cả các phần câu hỏi khi tạo bài mới
    questionSections.forEach(section => {
        section.questionText.innerHTML = '';
        section.userAnswerTextarea.value = '';
        section.feedbackSection.style.display = 'none';
    });

    currentExercise = await generateIELTSExercise();
    renderExercise(currentExercise);
    
    nextButton.disabled = false;
});

// Khởi chạy lần đầu khi trang load
nextButton.click();