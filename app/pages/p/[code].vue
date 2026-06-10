<template>
  <div v-if="presentation" class="participant-page">
    <div class="header glass-panel">
      <div class="brand">
        <span class="logo">🪐</span>
        <span class="title">{{ presentation.title }}</span>
      </div>
      <div class="code-badge">รหัส: {{ presentation.join_code }}</div>
    </div>

    <!-- Active Slide Interface (Only after nickname and emoji registered) -->
    <main class="content-area">
      <!-- Welcome/Register Nickname Screen -->
      <div v-if="!isRegistered" class="welcome-card-wrapper">
        <div class="glass-panel welcome-card">
          <span class="welcome-logo">🪐</span>
          <h2 class="welcome-title text-gradient">เข้าร่วมการนำเสนอแบบสด</h2>
          <p class="welcome-subtitle">กรุณาใส่ชื่อเล่นและเลือกไอคอนประจำตัวของคุณเพื่อเริ่มต้น!</p>

          <div class="form-group">
            <label class="welcome-label">ชื่อเล่นของคุณ (Nickname)</label>
            <input
              v-model="nickname"
              type="text"
              placeholder="ชื่อเล่นของคุณ..."
              maxlength="20"
              class="premium-input welcome-input"
              required
              @keyup.enter="registerParticipant"
            />
          </div>

          <div class="form-group">
            <label class="welcome-label">เลือกสัญลักษณ์ประจำตัวของคุณ (Avatar Emoji)</label>
            <div class="emoji-selector">
              <button
                v-for="e in emojiOptions"
                :key="e"
                type="button"
                :class="['emoji-btn', { active: selectedEmoji === e }]"
                @click="selectedEmoji = e"
              >
                {{ e }}
              </button>
            </div>
          </div>

          <button
            @click="registerParticipant"
            :disabled="registering || !nickname.trim()"
            class="btn-primary welcome-btn"
          >
            <span v-if="registering">กำลังเข้าร่วม...</span>
            <span v-else>เข้าร่วมการนำเสนอ 🚀</span>
          </button>
        </div>
      </div>

      <!-- Main voting panel -->
      <div v-else-if="currentSlide && !isGameOver" class="slide-card glass-panel">
        <!-- Live Countdown Timer Banner -->
        <div v-if="timeLeft > 0" :class="['timer-banner', { 'timer-warn': timeLeft <= 5 }]">
          ⏱️ เหลือเวลาส่งคำตอบ: <strong>{{ timeLeft }}</strong> วินาที
        </div>

        <h2 class="question">{{ currentSlide.question }}</h2>

        <!-- Case 1a: Quiz voted + waiting for reveal -->
        <div v-if="hasVoted && currentSlide.type === 'quiz' && !quizRevealed" class="quiz-waiting-state">
          <div class="waiting-dots">
            <span></span><span></span><span></span>
          </div>
          <h3>ส่งคำตอบแล้ว!</h3>
          <p>⏳ รอผู้ควบคุมเฉลยคำตอบ...</p>
        </div>

        <!-- Case 1b: Quiz voted + answer revealed -->
        <div v-else-if="hasVoted && currentSlide.type === 'quiz' && quizRevealed" :class="['quiz-result-state', myAnswerWasCorrect ? 'correct' : 'wrong']">
          <span class="result-icon">{{ myAnswerWasCorrect ? '✅' : '❌' }}</span>
          <h3>{{ myAnswerWasCorrect ? 'ถูกต้อง! ยอดเยี่ยม! 🎉' : 'ผิด...' }}</h3>
          <p v-if="!myAnswerWasCorrect" class="correct-answer-hint">
            คำตอบที่ถูก: <strong>{{ correctAnswerText }}</strong>
          </p>
        </div>

        <!-- Case 1c: Already Voted on non-quiz slides (or word_cloud with single-submit mode) -->
        <div v-else-if="hasVoted && currentSlide.type !== 'q_and_a' && (currentSlide.type !== 'word_cloud' || !currentSlide.settings?.allow_multiple_submissions)" class="voted-state">
          <span class="voted-icon">🎉</span>
          <h3>ส่งคำตอบเรียบร้อยแล้ว!</h3>
          <p>กรุณารอสักครู่... ผู้ควบคุมการนำเสนอจะเปลี่ยนหน้าสไลด์ในอีกไม่ช้า</p>
        </div>

        <!-- Case 2: Time Expired -->
        <div v-else-if="timerExpired && currentSlide.type !== 'q_and_a'" class="voted-state expired-state">
          <span class="voted-icon">⏳</span>
          <h3>หมดเวลารับคำตอบสำหรับคำถามนี้แล้ว</h3>
          <p>ผู้ควบคุมล็อกการส่งคะแนนแล้ว รอเปลี่ยนสไลด์ถัดไปสักครู่...</p>
          <div v-if="quizRevealed && currentSlide.type === 'quiz'" class="reveal-hint glass-panel">
            <p>คำตอบที่ถูกต้อง: <strong>{{ correctAnswerText }}</strong></p>
          </div>
        </div>

        <!-- Case 3: Not Voted Yet & Not Expired -->
        <div v-else class="form-container">
          <!-- MULTIPLE CHOICE -->
          <div v-if="currentSlide.type === 'multiple_choice'" class="option-grid">
            <button
              v-for="opt in currentSlide.options"
              :key="opt.id"
              @click="submitMCVote(opt.id)"
              :disabled="submitting || timerExpired"
              class="btn-option glass-panel"
            >
              {{ opt.text }}
            </button>
          </div>

          <!-- QUIZ — Kahoot style -->
          <div v-else-if="currentSlide.type === 'quiz'" class="quiz-kahoot-grid">
            <button
              v-for="(opt, idx) in currentSlide.options"
              :key="opt.id"
              @click="submitQuizVote(opt.id)"
              :disabled="submitting || timerExpired"
              :class="['kahoot-btn', ['kahoot-red','kahoot-blue','kahoot-yellow','kahoot-green'][idx % 4]]"
            >
              <span class="kahoot-shape">{{ ['▲','◆','●','■'][idx % 4] }}</span>
              <span class="kahoot-text">{{ opt.text }}</span>
            </button>
          </div>

          <!-- WORD CLOUD -->
          <div v-else-if="currentSlide.type === 'word_cloud'" class="word-input-form">
            <input
              v-model="wordInput"
              type="text"
              placeholder="กรอกคำศัพท์ 1 คำ..."
              maxlength="25"
              class="premium-input word-input"
              @keyup.enter="submitWordCloud"
              :disabled="submitting || timerExpired"
              required
            />
            <button
              @click="submitWordCloud"
              :disabled="submitting || !wordInput.trim() || timerExpired"
              class="btn-primary submit-btn"
            >
              <span v-if="submitting">กำลังส่ง...</span>
              <span v-else-if="timerExpired">หมดเวลาแล้ว ⏳</span>
              <span v-else>ส่งคำศัพท์ 🚀</span>
            </button>

            <!-- Quick Tag Suggestions for Word Cloud -->
            <div v-if="currentSlide.options && currentSlide.options.length > 0" class="quick-tags-box">
              <p class="quick-tags-label">หรือเลือกคลิกเพื่อส่งทันที:</p>
              <div class="quick-tags-grid">
                <button
                  v-for="opt in currentSlide.options"
                  :key="opt.id"
                  @click="submitWordCloudDirect(opt.text)"
                  :disabled="submitting || timerExpired"
                  class="btn-quick-tag"
                >
                  {{ opt.text }}
                </button>
              </div>
            </div>
          </div>

          <!-- Q&A (Allowed to submit multiple questions) -->
          <div v-else-if="currentSlide.type === 'q_and_a'" class="qa-form">
            <textarea
              v-model="qaInput"
              placeholder="พิมพ์คำถามของคุณที่นี่..."
              maxlength="150"
              rows="3"
              class="premium-input qa-input"
              :disabled="submitting || timerExpired"
              required
            ></textarea>
            <button
              @click="submitQAQuestion"
              :disabled="submitting || !qaInput.trim() || timerExpired"
              class="btn-primary submit-btn"
            >
              <span v-if="submitting">กำลังส่ง...</span>
              <span v-else-if="timerExpired">หมดเวลาส่งคำถาม ⏳</span>
              <span v-else>ส่งคำถาม 💬</span>
            </button>

            <!-- Display previously sent questions in this session -->
            <div v-if="myQuestions.length > 0" class="my-questions-list">
              <h4>คำถามของคุณ:</h4>
              <div v-for="q in myQuestions" :key="q.id" class="my-q-item glass-panel">
                {{ q.text }}
              </div>
            </div>

            <!-- All submitted questions with upvote -->
            <div v-if="allQaQuestions.length > 0" class="all-qa-section">
              <h4 class="all-qa-heading">คำถามทั้งหมด ({{ allQaQuestions.length }})</h4>
              <div class="all-qa-list">
                <div
                  v-for="q in allQaQuestions"
                  :key="q.id"
                  :class="['qa-item-row', 'glass-panel', { 'is-mine': q.sessionId === sessionId }]"
                >
                  <p class="qa-item-text">{{ q.text }}</p>
                  <div class="qa-item-footer">
                    <span class="qa-item-upvotes">👍 {{ q.upvotes }}</span>
                    <span v-if="q.sessionId === sessionId" class="qa-item-mine-tag">คำถามของคุณ</span>
                    <button
                      v-else
                      @click="upvoteQuestion(q.id)"
                      :disabled="myUpvotes.has(q.id)"
                      :class="['btn-upvote', { voted: myUpvotes.has(q.id) }]"
                    >
                      {{ myUpvotes.has(q.id) ? '✓ โหวตแล้ว' : '👍 โหวต' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Game Over screen (host ended the session) -->
      <div v-else-if="isGameOver" class="no-slide-card glass-panel game-over-card">
        <span class="icon">🎉</span>
        <h3>การนำเสนอจบแล้ว!</h3>
        <p>ขอบคุณที่เข้าร่วม <strong>{{ selectedEmoji }} {{ nickname }}</strong></p>
        <button @click="goBackToCode" class="btn-primary back-btn">
          🏠 เข้าร่วมห้องถัดไป
        </button>
      </div>

      <div v-else class="no-slide-card glass-panel">
        <span class="icon">😴</span>
        <h3>กำลังรอผู้ควบคุมเริ่มต้น</h3>
        <p>ห้องนำเสนอยังไม่ได้เริ่มต้น หรือไม่มีสไลด์ในการนำเสนอในขณะนี้</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const client = useSupabaseClient()
const route = useRoute()
const router = useRouter()

const swalDark = Swal.mixin({
  customClass: {
    popup: 'glass-panel swal-dark-popup',
    title: 'swal-dark-title',
    htmlContainer: 'swal-dark-html',
    confirmButton: 'btn-primary swal-dark-btn',
    cancelButton: 'btn-secondary swal-dark-btn'
  },
  buttonsStyling: false,
  background: 'rgba(20, 20, 35, 0.95)',
  color: '#f8fafc'
})

const presentation = ref(null)
const slides = ref([])
const currentSlideIndex = ref(0)
const sessionId = ref('')
const hasVoted = ref(false)

// Welcome / Registration State
const isRegistered = ref(false)
const nickname = ref('')
const selectedEmoji = ref('🦁')
const registering = ref(false)
const emojiOptions = ['🦁', '🐯', '🐼', '🐨', '🦊', '🐰', '🐸', '🐙', '🦄', '🦖', '🐝', '🎨', '🚀', '⚽', '🍕', '🎮']

// Countdown Timer State
const timeLeft = ref(0)
const timerExpired = ref(false)
let timerInterval = null

// Forms Input
const wordInput = ref('')
const qaInput = ref('')
const submitting = ref(false)
const myQuestions = ref([])
const myQuizAnswerId = ref(null)

// Q&A realtime state
const allQaResponses = ref([])
const myUpvotes = ref(new Set())
let qaResponsesChannel = null

let realtimeChannel = null

const currentSlide = computed(() => {
  return slides.value[currentSlideIndex.value] || null
})

const isGameOver = computed(() => {
  return isRegistered.value && presentation.value && presentation.value.is_active === false
})

const quizRevealed = computed(() => {
  return !!(presentation.value?.quiz_reveal_slide_id && presentation.value.quiz_reveal_slide_id === currentSlide.value?.id)
})

const myAnswerWasCorrect = computed(() => {
  if (!quizRevealed.value || !myQuizAnswerId.value || !currentSlide.value?.options) return false
  const opt = currentSlide.value.options.find(o => o.id === myQuizAnswerId.value)
  return opt?.isCorrect || false
})

const correctAnswerText = computed(() => {
  if (!currentSlide.value?.options) return ''
  const opt = currentSlide.value.options.find(o => o.isCorrect)
  return opt?.text || ''
})

const allQaQuestions = computed(() => {
  const questions = allQaResponses.value
    .filter(r => r.response_value?.type === 'qa')
    .map(r => ({
      id: r.response_value.id,
      text: r.response_value.text,
      sessionId: r.session_id,
      upvotes: 0
    }))

  allQaResponses.value
    .filter(r => r.response_value?.type === 'qa_upvote')
    .forEach(r => {
      const q = questions.find(q => q.id === r.response_value.question_id)
      if (q) q.upvotes++
    })

  return questions.sort((a, b) => b.upvotes - a.upvotes)
})

// Initialize Session ID
const initSession = () => {
  let id = localStorage.getItem('participant_session_id')
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    localStorage.setItem('participant_session_id', id)
  }
  sessionId.value = id
}

// Fetch presentation and setup realtime subscription
onMounted(async () => {
  initSession()

  // Format code to search
  const rawCode = route.params.code
  if (!rawCode) return

  const formattedCode = rawCode.substring(0, 4) + ' ' + rawCode.substring(4, 8)

  // Fetch Presentation
  const { data: pres, error: presError } = await client
    .from('presentations')
    .select('*')
    .eq('join_code', formattedCode)
    .single()

  if (presError || !pres) {
    router.push('/')
    return
  }
  presentation.value = pres
  currentSlideIndex.value = pres.current_slide_index

  // Fetch Slides
  const { data: sldData } = await client
    .from('slides')
    .select('*')
    .eq('presentation_id', pres.id)
    .order('position', { ascending: true })

  if (sldData) {
    slides.value = sldData
    checkIfVoted()
    syncTimer(pres.slide_started_at)
    if (currentSlide.value?.type === 'q_and_a') {
      fetchAndSubscribeQa()
    }
  }

  // Check registration status
  await checkRegistration()

  // Subscribe to changes in active slide index
  realtimeChannel = client
    .channel(`participant-pres-${pres.id}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'presentations',
        filter: `id=eq.${pres.id}`
      },
      (payload) => {
        currentSlideIndex.value = payload.new.current_slide_index
        if (presentation.value) {
          presentation.value.slide_started_at = payload.new.slide_started_at
          presentation.value.quiz_reveal_slide_id = payload.new.quiz_reveal_slide_id ?? null
          presentation.value.is_active = payload.new.is_active
        }
        syncTimer(payload.new.slide_started_at)
        // Re-check vote state — if host reset the slide, stale localStorage vote gets cleared
        checkIfVoted()
      }
    )
    .subscribe()
})

onUnmounted(() => {
  if (realtimeChannel) client.removeChannel(realtimeChannel)
  if (qaResponsesChannel) client.removeChannel(qaResponsesChannel)
  if (timerInterval) clearInterval(timerInterval)
})

// Check registration status from Supabase
const checkRegistration = async () => {
  if (!presentation.value) return
  const { data, error } = await client
    .from('participants')
    .select('*')
    .eq('presentation_id', presentation.value.id)
    .eq('session_id', sessionId.value)
    .single()

  if (data) {
    isRegistered.value = true
    nickname.value = data.nickname
    selectedEmoji.value = data.emoji
  } else {
    // Check localstorage for auto fill
    const localNick = localStorage.getItem(`nick_${presentation.value.id}`)
    const localEmoji = localStorage.getItem(`emoji_${presentation.value.id}`)
    if (localNick) nickname.value = localNick
    if (localEmoji) selectedEmoji.value = localEmoji
  }
}

// Register Participant
const registerParticipant = async () => {
  if (!nickname.value.trim() || registering.value) return
  registering.value = true

  const { error } = await client
    .from('participants')
    .insert([
      {
        presentation_id: presentation.value.id,
        session_id: sessionId.value,
        nickname: nickname.value.trim(),
        emoji: selectedEmoji.value
      }
    ])

  if (!error || error.code === '23505') { // Already joined
    localStorage.setItem(`nick_${presentation.value.id}`, nickname.value.trim())
    localStorage.setItem(`emoji_${presentation.value.id}`, selectedEmoji.value)
    isRegistered.value = true

    swalDark.fire({
      title: 'ยินดีต้อนรับ! 🎉',
      text: `เข้าร่วมห้องนำเสนอในชื่อ "${selectedEmoji.value} ${nickname.value}" สำเร็จ`,
      icon: 'success',
      timer: 1800,
      showConfirmButton: false
    })
  } else {
    swalDark.fire({
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถลงชื่อเข้าร่วมได้ กรุณาลองใหม่อีกครั้ง',
      icon: 'error',
      confirmButtonText: 'ตกลง'
    })
  }
  registering.value = false
}

// Check if user has already voted on the current active slide.
// Compares stored vote timestamp against slide_started_at — if the slide
// was reset/restarted after the vote was cast, the stored vote is stale.
const checkIfVoted = () => {
  if (!currentSlide.value) return
  const raw = localStorage.getItem(`voted_${currentSlide.value.id}`)
  if (!raw) {
    hasVoted.value = false
    myQuizAnswerId.value = null
    return
  }
  let voted = false
  let voteAt = 0
  try {
    const parsed = JSON.parse(raw)
    voted = parsed.voted === true
    voteAt = parsed.at || 0
  } catch {
    // legacy format: plain 'true' string
    voted = raw === 'true'
  }
  const slideStartedAt = presentation.value?.slide_started_at
    ? new Date(presentation.value.slide_started_at).getTime()
    : 0
  if (voteAt > 0 && slideStartedAt > voteAt) {
    // Host reset the slide after this vote — clear stale state
    localStorage.removeItem(`voted_${currentSlide.value.id}`)
    localStorage.removeItem(`voted_option_${currentSlide.value.id}`)
    hasVoted.value = false
    myQuizAnswerId.value = null
    return
  }
  hasVoted.value = voted
  myQuizAnswerId.value = null
  const storedOption = localStorage.getItem(`voted_option_${currentSlide.value.id}`)
  if (storedOption) myQuizAnswerId.value = storedOption
}

const syncTimer = (startedAtStr) => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  const limit = currentSlide.value?.settings?.timer_limit || 0
  if (limit > 0 && startedAtStr) {
    const slideStartedAt = new Date(startedAtStr)
    const now = new Date()
    const elapsedSeconds = Math.floor((now - slideStartedAt) / 1000)
    timeLeft.value = Math.max(0, limit - elapsedSeconds)

    if (timeLeft.value > 0) {
      timerExpired.value = false
      timerInterval = setInterval(() => {
        timeLeft.value--
        if (timeLeft.value <= 0) {
          clearInterval(timerInterval)
          timerExpired.value = true
          if (!hasVoted.value && currentSlide.value?.type !== 'q_and_a') {
            swalDark.fire({
              title: 'หมดเวลาแล้ว! ⏳',
              text: 'หมดเวลาสำหรับการส่งคำตอบในข้อนี้แล้ว',
              icon: 'warning',
              timer: 2000,
              showConfirmButton: false
            })
          }
        }
      }, 1000)
    } else {
      timerExpired.value = true
    }
  } else {
    timeLeft.value = 0
    timerExpired.value = false
  }
}

watch(currentSlideIndex, () => {
  wordInput.value = ''
  qaInput.value = ''
  allQaResponses.value = []
  if (qaResponsesChannel) {
    client.removeChannel(qaResponsesChannel)
    qaResponsesChannel = null
  }
  checkIfVoted()  // handles hasVoted + myQuizAnswerId (must run after QA cleanup)
  if (currentSlide.value?.type === 'q_and_a') {
    fetchAndSubscribeQa()
  }
})

const markAsVoted = (optionId = null) => {
  if (!currentSlide.value) return
  localStorage.setItem(`voted_${currentSlide.value.id}`, JSON.stringify({ voted: true, at: Date.now() }))
  if (optionId) localStorage.setItem(`voted_option_${currentSlide.value.id}`, optionId)
  hasVoted.value = true
}

// Submit Handlers
const submitMCVote = async (optionId) => {
  if (submitting.value || hasVoted.value || timerExpired.value) return
  submitting.value = true

  // Verify no existing response (guards against double-submit if stale-check cleared localStorage)
  const { data: existing } = await client
    .from('responses')
    .select('id')
    .eq('slide_id', currentSlide.value.id)
    .eq('session_id', sessionId.value)
    .maybeSingle()

  if (existing) {
    markAsVoted(optionId)
    submitting.value = false
    return
  }

  const { error } = await client
    .from('responses')
    .insert([{
      slide_id: currentSlide.value.id,
      session_id: sessionId.value,
      response_value: { selected_option_id: optionId }
    }])

  if (!error) {
    markAsVoted(optionId)
  } else {
    swalDark.fire({
      title: 'ข้อผิดพลาด',
      text: 'ไม่สามารถส่งโหวตได้ กรุณาลองอีกครั้ง',
      icon: 'error',
      confirmButtonText: 'ตกลง'
    })
  }
  submitting.value = false
}

const submitQuizVote = async (optionId) => {
  myQuizAnswerId.value = optionId
  await submitMCVote(optionId)
}

const submitWordCloud = async () => {
  if (!wordInput.value.trim() || submitting.value || timerExpired.value) return
  submitting.value = true

  const { error } = await client
    .from('responses')
    .insert([
      {
        slide_id: currentSlide.value.id,
        session_id: sessionId.value,
        response_value: { text: wordInput.value.trim() }
      }
    ])

  if (!error) {
    wordInput.value = ''
    const singleMode = !currentSlide.value?.settings?.allow_multiple_submissions
    if (singleMode) {
      markAsVoted()
    }
    swalDark.fire({
      title: 'ส่งคำศัพท์แล้ว! 🚀',
      text: singleMode ? 'ส่งคำศัพท์สำเร็จแล้ว' : 'พิมพ์คำศัพท์เพิ่มเติมเพื่อส่งคำตอบอื่นได้อีกเรื่อย ๆ',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    })
  } else {
    swalDark.fire({
      title: 'ข้อผิดพลาด',
      text: 'ไม่สามารถส่งคำศัพท์ได้ กรุณาลองอีกครั้ง',
      icon: 'error',
      confirmButtonText: 'ตกลง'
    })
  }
  submitting.value = false
}

const submitWordCloudDirect = async (text) => {
  if (!text || submitting.value || timerExpired.value) return
  submitting.value = true

  const { error } = await client
    .from('responses')
    .insert([
      {
        slide_id: currentSlide.value.id,
        session_id: sessionId.value,
        response_value: { text: text.trim() }
      }
    ])

  if (!error) {
    const singleMode = !currentSlide.value?.settings?.allow_multiple_submissions
    if (singleMode) {
      markAsVoted()
    }
    swalDark.fire({
      title: 'ส่งคำศัพท์แล้ว! 🚀',
      text: `คุณได้ส่งคำว่า "${text}" เรียบร้อยแล้ว`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    })
  } else {
    swalDark.fire({
      title: 'ข้อผิดพลาด',
      text: 'ไม่สามารถส่งคำศัพท์ได้ กรุณาลองอีกครั้ง',
      icon: 'error',
      confirmButtonText: 'ตกลง'
    })
  }
  submitting.value = false
}

const fetchAndSubscribeQa = async () => {
  if (!currentSlide.value || currentSlide.value.type !== 'q_and_a') return

  const { data } = await client
    .from('responses')
    .select('*')
    .eq('slide_id', currentSlide.value.id)

  if (data) allQaResponses.value = data

  const stored = localStorage.getItem(`qa_upvotes_${currentSlide.value.id}`)
  myUpvotes.value = new Set(stored ? JSON.parse(stored) : [])

  if (qaResponsesChannel) client.removeChannel(qaResponsesChannel)
  qaResponsesChannel = client
    .channel(`qa-resp-${currentSlide.value.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'responses',
      filter: `slide_id=eq.${currentSlide.value.id}`
    }, (payload) => {
      allQaResponses.value.push(payload.new)
    })
    .subscribe()
}

const upvoteQuestion = async (questionId) => {
  if (myUpvotes.value.has(questionId) || !currentSlide.value) return

  const { error } = await client.from('responses').insert([{
    slide_id: currentSlide.value.id,
    session_id: sessionId.value,
    response_value: { type: 'qa_upvote', question_id: questionId }
  }])

  if (!error) {
    myUpvotes.value = new Set([...myUpvotes.value, questionId])
    localStorage.setItem(`qa_upvotes_${currentSlide.value.id}`, JSON.stringify([...myUpvotes.value]))
  }
}

const goBackToCode = () => {
  router.push('/')
}

const submitQAQuestion = async () => {
  if (!qaInput.value.trim() || submitting.value || timerExpired.value) return
  submitting.value = true

  const qId = 'q_' + Math.random().toString(36).substring(2, 9) + Date.now()
  const qText = qaInput.value.trim()

  const { error } = await client
    .from('responses')
    .insert([
      {
        slide_id: currentSlide.value.id,
        session_id: sessionId.value,
        response_value: {
          type: 'qa',
          id: qId,
          text: qText,
          isAnswered: false
        }
      }
    ])

  if (!error) {
    myQuestions.value.push({ id: qId, text: qText })
    qaInput.value = ''
    swalDark.fire({
      title: 'ส่งคำถามแล้ว! 💬',
      text: 'คำถามของคุณจะไปปรากฏบนจอหลักเพื่อรอตอบ',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    })
  } else {
    swalDark.fire({
      title: 'ข้อผิดพลาด',
      text: 'ไม่สามารถส่งคำถามได้',
      icon: 'error',
      confirmButtonText: 'ตกลง'
    })
  }
  submitting.value = false
}
</script>

<style scoped>
.participant-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  gap: 16px;
  justify-content: flex-start;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-radius: 14px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  font-size: 1.4rem;
}

.title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.code-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-secondary);
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.25);
  padding: 4px 10px;
  border-radius: 99px;
  letter-spacing: 0.05em;
}

/* Content Area */
.content-area {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.welcome-card-wrapper {
  display: flex;
  flex-grow: 1;
  align-items: center;
  justify-content: center;
}

.welcome-card {
  width: 100%;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 20px;
}

.welcome-logo {
  font-size: 3rem;
  animation: float-slow 4s infinite alternate;
}

.welcome-title {
  font-size: 1.5rem;
  font-weight: 800;
}

.welcome-subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.form-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.welcome-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.welcome-input {
  text-align: center;
}

.emoji-selector {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  width: 100%;
  max-height: 120px;
  overflow-y: auto;
  padding: 4px;
}

.emoji-btn {
  font-size: 1.5rem;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.emoji-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--color-primary);
}

.emoji-btn.active {
  background: rgba(147, 51, 234, 0.2);
  border-color: var(--color-primary);
  transform: scale(1.1);
  box-shadow: 0 0 10px var(--color-primary-glow);
}

.welcome-btn {
  width: 100%;
  padding: 14px;
  font-size: 1.05rem;
  margin-top: 10px;
}

/* Slide Card */
.slide-card {
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex-grow: 1;
}

.timer-banner {
  background: rgba(147, 51, 234, 0.12);
  border: 1px solid rgba(147, 51, 234, 0.25);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: center;
  color: var(--text-primary);
  margin-bottom: 8px;
  animation: pulse-slow 2s infinite alternate;
}

.timer-banner.timer-warn {
  background: rgba(239, 68, 68, 0.18);
  border-color: rgba(239, 68, 68, 0.35);
  color: var(--color-danger);
  font-weight: 700;
  animation: shake-pulse 0.4s infinite alternate;
}

@keyframes pulse-slow {
  from { opacity: 0.8; }
  to { opacity: 1; }
}

@keyframes shake-pulse {
  0% { transform: scale(1); }
  100% { transform: scale(1.02); }
}

.question {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 800;
  text-align: center;
  line-height: 1.3;
}

.form-container {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: center;
}

.option-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.btn-option {
  padding: 16px 20px;
  font-size: 1.05rem;
  font-weight: 600;
  text-align: left;
  border-radius: 12px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  width: 100%;
  transition: all 0.2s ease;
}

.btn-option:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--color-secondary);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(6, 182, 212, 0.15);
}

.btn-option:active:not(:disabled) {
  transform: translateY(1px);
}

.btn-option:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quiz-btn:hover:not(:disabled) {
  border-color: var(--color-accent) !important;
  box-shadow: 0 4px 15px rgba(236, 72, 153, 0.15) !important;
}

/* Word Cloud Form */
.word-input-form, .qa-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.word-input {
  text-align: center;
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.submit-btn {
  padding: 16px;
  font-size: 1.05rem;
}

.qa-input {
  font-size: 1rem;
  resize: none;
}

/* Question List style */
.my-questions-list {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.my-questions-list h4 {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.my-q-item {
  padding: 12px 16px;
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.02);
}

/* Voted Screen */
.voted-state, .no-slide-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  flex-grow: 1;
  padding: 40px 20px;
}

.voted-icon, .no-slide-card .icon {
  font-size: 4rem;
  animation: float-slow 4s infinite alternate;
}

.voted-state h3, .no-slide-card h3 {
  font-size: 1.4rem;
}

.voted-state p, .no-slide-card p {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

@keyframes float-slow {
  0% { transform: translateY(0); }
  100% { transform: translateY(-8px); }
}

.quick-tags-box {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.quick-tags-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.quick-tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn-quick-tag {
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 99px;
  background: rgba(147, 51, 234, 0.08);
  border: 1px solid rgba(147, 51, 234, 0.2);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-quick-tag:hover:not(:disabled) {
  background: rgba(147, 51, 234, 0.2);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.btn-quick-tag:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .emoji-selector {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* ─── Quiz Kahoot-style buttons ─── */
.quiz-kahoot-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}

.kahoot-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  text-align: left;
  transition: transform 0.15s ease, filter 0.15s ease;
  min-height: 72px;
}

.kahoot-btn:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.03);
  filter: brightness(1.12);
}

.kahoot-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.kahoot-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.kahoot-red    { background: linear-gradient(135deg, #e03131, #c92a2a); box-shadow: 0 4px 18px rgba(224,49,49,0.35); }
.kahoot-blue   { background: linear-gradient(135deg, #1971c2, #1864ab); box-shadow: 0 4px 18px rgba(25,113,194,0.35); }
.kahoot-yellow { background: linear-gradient(135deg, #f59f00, #e67700); box-shadow: 0 4px 18px rgba(245,159,0,0.35); }
.kahoot-green  { background: linear-gradient(135deg, #2f9e44, #2b8a3e); box-shadow: 0 4px 18px rgba(47,158,68,0.35); }

.kahoot-shape {
  font-size: 1.3rem;
  flex-shrink: 0;
  opacity: 0.9;
}

.kahoot-text {
  flex: 1;
  line-height: 1.3;
}

/* ─── Quiz waiting state ─── */
.quiz-waiting-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 20px;
  text-align: center;
}

.quiz-waiting-state h3 {
  font-size: 1.3rem;
  font-weight: 700;
}

.quiz-waiting-state p {
  color: var(--text-secondary);
}

.waiting-dots {
  display: flex;
  gap: 8px;
}

.waiting-dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: dot-bounce 1.2s infinite ease-in-out;
}

.waiting-dots span:nth-child(2) { animation-delay: 0.2s; }
.waiting-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
  40% { transform: scale(1.3); opacity: 1; }
}

/* ─── Quiz result feedback ─── */
.quiz-result-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 20px;
  text-align: center;
  border-radius: 20px;
  animation: result-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes result-pop {
  from { transform: scale(0.7); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.quiz-result-state.correct {
  background: rgba(16, 185, 129, 0.1);
  border: 1.5px solid rgba(16, 185, 129, 0.35);
  box-shadow: 0 0 30px rgba(16, 185, 129, 0.15);
}

.quiz-result-state.wrong {
  background: rgba(239, 68, 68, 0.08);
  border: 1.5px solid rgba(239, 68, 68, 0.3);
}

.result-icon {
  font-size: 4rem;
  animation: result-icon-bounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s both;
}

@keyframes result-icon-bounce {
  from { transform: scale(0) rotate(-20deg); opacity: 0; }
  to { transform: scale(1) rotate(0deg); opacity: 1; }
}

.quiz-result-state h3 {
  font-size: 1.5rem;
  font-weight: 800;
}

.correct-answer-hint {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.correct-answer-hint strong {
  color: var(--text-primary);
}

.reveal-hint {
  margin-top: 12px;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 0.95rem;
  color: var(--text-secondary);
}

/* ─── Q&A all-questions with upvotes ─── */
.all-qa-section {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.all-qa-heading {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.all-qa-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
}

.qa-item-row {
  padding: 12px 16px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid rgba(147, 51, 234, 0.15);
}

.qa-item-row.is-mine {
  border-color: rgba(6, 182, 212, 0.25);
  background: rgba(6, 182, 212, 0.04);
}

.qa-item-text {
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--text-primary);
}

.qa-item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qa-item-upvotes {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
}

.qa-item-mine-tag {
  font-size: 0.75rem;
  color: var(--color-secondary);
  background: rgba(6, 182, 212, 0.1);
  padding: 2px 8px;
  border-radius: 99px;
  border: 1px solid rgba(6, 182, 212, 0.2);
}

.btn-upvote {
  padding: 4px 12px;
  border-radius: 99px;
  border: 1px solid rgba(147, 51, 234, 0.3);
  background: rgba(147, 51, 234, 0.08);
  color: var(--text-primary);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-upvote:hover:not(:disabled) {
  background: rgba(147, 51, 234, 0.2);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.btn-upvote.voted {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
  color: var(--color-success);
  cursor: default;
}

.btn-upvote:disabled {
  cursor: not-allowed;
}

.game-over-card {
  border: 1.5px solid rgba(147, 51, 234, 0.35);
  background: rgba(147, 51, 234, 0.06);
  box-shadow: 0 0 40px rgba(147, 51, 234, 0.12);
}

.back-btn {
  margin-top: 8px;
  padding: 14px 32px;
  font-size: 1.05rem;
  width: 100%;
  max-width: 320px;
}
</style>
