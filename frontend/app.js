const API_BASE = '/api';

// ── State ──────────────────────────────────────────────────
let selectedFile = null;

// ── DOM refs ───────────────────────────────────────────────
const uploadArea     = document.getElementById('uploadArea');
const fileInput      = document.getElementById('fileInput');
const uploadBtn      = document.getElementById('uploadBtn');
const uploadStatus   = document.getElementById('uploadStatus');
const questionInput  = document.getElementById('questionInput');
const sendBtn        = document.getElementById('sendBtn');
const messagesContainer = document.getElementById('messagesContainer');
const totalVectors   = document.getElementById('totalVectors');
const embeddingDim   = document.getElementById('embeddingDim');
const refreshStats   = document.getElementById('refreshStats');

// ── Upload logic ───────────────────────────────────────────
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFileSelect(file);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFileSelect(fileInput.files[0]);
});

function handleFileSelect(file) {
  if (file.type !== 'application/pdf') {
    showStatus(uploadStatus, 'error', 'Only PDF files are allowed.');
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    showStatus(uploadStatus, 'error', 'File exceeds the 20 MB limit.');
    return;
  }
  selectedFile = file;
  uploadArea.classList.add('has-file');
  uploadArea.querySelector('.upload-text').textContent = file.name;
  uploadArea.querySelector('.upload-hint').textContent =
    `${(file.size / 1024).toFixed(1)} KB`;
  uploadBtn.disabled = false;
  showStatus(uploadStatus, 'info', `"${file.name}" ready to upload.`);
}

uploadBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  uploadBtn.disabled = true;
  uploadBtn.classList.add('loading');
  showStatus(uploadStatus, 'info', 'Uploading and processing...');

  const formData = new FormData();
  formData.append('file', selectedFile);

  try {
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();

    if (json.success) {
      showStatus(uploadStatus, 'success',
        `✓ ${json.data.chunksCreated} chunks created for "${json.data.fileName}"`);
      resetUpload();
      loadStats();
    } else {
      showStatus(uploadStatus, 'error', json.error ?? 'Upload failed.');
    }
  } catch (err) {
    showStatus(uploadStatus, 'error', 'Network error. Is the server running?');
  } finally {
    uploadBtn.classList.remove('loading');
    uploadBtn.disabled = !selectedFile;
  }
});

function resetUpload() {
  selectedFile = null;
  fileInput.value = '';
  uploadArea.classList.remove('has-file');
  uploadArea.querySelector('.upload-text').textContent = 'Click or drag a PDF here';
  uploadArea.querySelector('.upload-hint').textContent = 'Max 20 MB per file';
  uploadBtn.disabled = true;
}

// ── Stats ──────────────────────────────────────────────────
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/documents/stats`);
    const json = await res.json();
    if (json.success) {
      totalVectors.textContent = json.data.totalVectors.toLocaleString();
      embeddingDim.textContent = json.data.dimension;
    }
  } catch (_) {
    totalVectors.textContent = '—';
  }
}

refreshStats.addEventListener('click', loadStats);
loadStats();

// ── Chat logic ─────────────────────────────────────────────
function setQuestion(text) {
  questionInput.value = text;
  questionInput.focus();
  autoResizeTextarea();
}

sendBtn.addEventListener('click', sendMessage);

questionInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

questionInput.addEventListener('input', autoResizeTextarea);

function autoResizeTextarea() {
  questionInput.style.height = 'auto';
  questionInput.style.height = Math.min(questionInput.scrollHeight, 160) + 'px';
}

async function sendMessage() {
  const question = questionInput.value.trim();
  if (!question) return;

  // Clear welcome message if present
  const welcome = messagesContainer.querySelector('.welcome-message');
  if (welcome) welcome.remove();

  // Add user message
  appendMessage('user', question);
  questionInput.value = '';
  autoResizeTextarea();
  sendBtn.disabled = true;

  // Show typing indicator
  const typingId = showTypingIndicator();

  try {
    const res = await fetch(`${API_BASE}/chat/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    const json = await res.json();
    removeTypingIndicator(typingId);

    if (json.success) {
      appendAssistantMessage(json.data.answer, json.data.sources);
    } else {
      appendMessage('assistant', `Error: ${json.error ?? 'Unknown error'}`);
    }
  } catch (err) {
    removeTypingIndicator(typingId);
    appendMessage('assistant', 'Network error. Please check that the server is running.');
  } finally {
    sendBtn.disabled = false;
    questionInput.focus();
  }
}

function appendMessage(role, content) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.innerHTML = `
    <div class="message-avatar">${role === 'user' ? '👤' : '🤖'}</div>
    <div class="message-content">
      <div class="message-bubble">${escapeHtml(content)}</div>
    </div>`;
  messagesContainer.appendChild(div);
  scrollToBottom();
  return div;
}

function appendAssistantMessage(content, sources) {
  const div = document.createElement('div');
  div.className = 'message assistant';

  let sourcesHtml = '';
  if (sources && sources.length > 0) {
    const sourceItems = sources
      .slice(0, 3)
      .map((s) => `
        <div class="source-item">
          <div class="source-file">📄 ${escapeHtml(s.fileName)}</div>
          <div class="source-score">Relevance: ${(s.relevanceScore * 100).toFixed(1)}%</div>
          <div class="source-excerpt">"${escapeHtml(s.excerpt)}"</div>
        </div>`)
      .join('');
    sourcesHtml = `
      <div class="sources-container">
        <div class="sources-title">Sources consulted (${sources.length})</div>
        ${sourceItems}
      </div>`;
  }

  div.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-content">
      <div class="message-bubble">${escapeHtml(content)}</div>
      ${sourcesHtml}
    </div>`;

  messagesContainer.appendChild(div);
  scrollToBottom();
}

function showTypingIndicator() {
  const id = 'typing_' + Date.now();
  const div = document.createElement('div');
  div.id = id;
  div.className = 'message assistant typing-indicator';
  div.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-content">
      <div class="message-bubble">
        <div class="dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>`;
  messagesContainer.appendChild(div);
  scrollToBottom();
  return id;
}

function removeTypingIndicator(id) {
  document.getElementById(id)?.remove();
}

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showStatus(el, type, message) {
  el.textContent = message;
  el.className = `status-message ${type}`;
  el.classList.remove('hidden');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
